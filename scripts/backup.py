import asyncio
import json
import os
import tarfile
from datetime import datetime
from typing import Any, Dict
import io

from backend.models import SessionLocal, Workflow, Action, Prompt, ImageOutput


async def export_state(db) -> Dict[str, Any]:
    data: Dict[str, Any] = {}
    # Fetch async collections
    data["parameter_mappings"] = await db.parameter_mappings.find().to_list(1000)
    data["workflow_mappings"] = await db.workflow_mappings.find().to_list(1000)
    data["action_mappings"] = await db.action_mappings.find().to_list(1000)
    key_record = await db.civitai_key.find_one({"_id": "global"})
    if key_record:
        data["civitai_key"] = key_record.get("key")
    else:
        data["civitai_key"] = None

    with SessionLocal() as session:
        data["workflows"] = [
            {
                "id": w.id,
                "name": w.name,
                "description": w.description,
                "data": json.loads(w.data) if w.data else None,
            }
            for w in session.query(Workflow).all()
        ]
        data["actions"] = [
            {
                "id": a.id,
                "button": a.button,
                "name": a.name,
                "workflow_id": a.workflow_id,
                "parameters": json.loads(a.parameters) if a.parameters else None,
            }
            for a in session.query(Action).all()
        ]
        data["prompts"] = [
            {
                "id": p.id,
                "text": p.text,
                "workflow_id": p.workflow_id,
                "created_at": p.created_at,
            }
            for p in session.query(Prompt).all()
        ]
        data["image_outputs"] = [
            {
                "id": o.id,
                "prompt_id": o.prompt_id,
                "file_path": o.file_path,
                "created_at": o.created_at,
            }
            for o in session.query(ImageOutput).all()
        ]
    return data


async def import_state(data: Dict[str, Any], db) -> None:
    # Restore async collections
    for coll_name in ["parameter_mappings", "workflow_mappings", "action_mappings"]:
        coll = getattr(db, coll_name)
        existing = await coll.find().to_list(1000)
        for doc in existing:
            await coll.delete_one({"_id": doc.get("_id")})
        for doc in data.get(coll_name, []):
            await coll.insert_one(doc)
    if data.get("civitai_key"):
        await db.civitai_key.update_one(
            {"_id": "global"}, {"$set": {"key": data["civitai_key"]}}, upsert=True
        )
    else:
        await db.civitai_key.delete_one({"_id": "global"})

    with SessionLocal() as session:
        session.query(ImageOutput).delete()
        session.query(Prompt).delete()
        session.query(Action).delete()
        session.query(Workflow).delete()
        session.commit()
        for w in data.get("workflows", []):
            session.add(
                Workflow(
                    id=w["id"],
                    name=w["name"],
                    description=w.get("description", ""),
                    data=json.dumps(w.get("data") or {}),
                )
            )
        for a in data.get("actions", []):
            session.add(
                Action(
                    id=a["id"],
                    button=a["button"],
                    name=a["name"],
                    workflow_id=a["workflow_id"],
                    parameters=json.dumps(a.get("parameters") or {}),
                )
            )
        for p in data.get("prompts", []):
            session.add(
                Prompt(
                    id=p["id"],
                    text=p["text"],
                    workflow_id=p.get("workflow_id"),
                    created_at=p.get("created_at"),
                )
            )
        for o in data.get("image_outputs", []):
            session.add(
                ImageOutput(
                    id=o["id"],
                    prompt_id=o["prompt_id"],
                    file_path=o["file_path"],
                    created_at=o.get("created_at"),
                )
            )
        session.commit()


async def async_backup_file(path: str = "backups", db=None) -> str:
    os.makedirs(path, exist_ok=True)
    timestamp = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
    filename = os.path.join(path, f"backup-{timestamp}.tar.gz")
    if db is None:
        raise ValueError("db required")
    data = await export_state(db)
    with tarfile.open(filename, "w:gz") as tar:
        payload = json.dumps(data).encode("utf-8")
        info = tarfile.TarInfo(name="data.json")
        info.size = len(payload)
        tar.addfile(info, io.BytesIO(payload))
    return filename


def backup_file(path: str = "backups", db=None) -> str:
    return asyncio.run(async_backup_file(path, db=db))


async def async_restore_file(file_path: str, db=None) -> None:
    with tarfile.open(file_path, "r:gz") as tar:
        f = tar.extractfile("data.json")
        if not f:
            raise ValueError("Invalid backup file")
        data = json.loads(f.read().decode("utf-8"))
    if db is None:
        raise ValueError("db required")
    await import_state(data, db)


def restore_file(file_path: str, db=None) -> None:
    asyncio.run(async_restore_file(file_path, db=db))


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Backup or restore Comfy Journey data")
    sub = parser.add_subparsers(dest="cmd", required=True)
    sub.add_parser("backup")
    restore_p = sub.add_parser("restore")
    restore_p.add_argument("file")
    args = parser.parse_args()
    from backend.server import db  # Lazy import to create DB as in server
    if args.cmd == "backup":
        print(backup_file(db=db))
    else:
        restore_file(args.file, db=db)
