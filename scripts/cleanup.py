import os
import time
import logging
import argparse
from typing import List

logging.basicConfig(level=logging.INFO, format="%(levelname)s:%(message)s")


def cleanup_directory(path: str, days: int) -> List[str]:
    """Delete files older than `days` days within `path`."""
    removed: List[str] = []
    cutoff = time.time() - days * 86400
    if not os.path.isdir(path):
        return removed
    for root, _, files in os.walk(path):
        for name in files:
            fp = os.path.join(root, name)
            try:
                if os.path.getmtime(fp) < cutoff:
                    os.remove(fp)
                    removed.append(fp)
            except OSError:
                logging.exception("Failed to remove %s", fp)
    return removed


def cleanup(paths: List[str], days: int = 7) -> None:
    for p in paths:
        if not p:
            continue
        removed = cleanup_directory(p, days)
        if removed:
            logging.info("Removed %d files from %s", len(removed), p)
    logging.info("Cleanup complete")


def main() -> None:
    parser = argparse.ArgumentParser(description="Cleanup old temporary files")
    parser.add_argument("paths", nargs="*", help="Directories to clean")
    parser.add_argument("--days", type=int, default=int(os.environ.get("CJ_CLEAN_DAYS", 7)))
    args = parser.parse_args()
    paths = args.paths or os.environ.get("CJ_CLEAN_PATHS", "").split(":")
    cleanup(paths, args.days)


if __name__ == "__main__":
    main()
