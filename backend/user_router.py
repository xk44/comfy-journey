from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime
import uuid
from auth import get_current_active_user, UserInDB, UserPublic

# MongoDB connection is imported from auth module
from auth import db
from .utils import api_response

# Models
class SavedImageBase(BaseModel):
    url: str
    prompt: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None
    workflow_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class SavedImage(SavedImageBase):
    id: str
    user_id: str
    created_at: datetime = datetime.utcnow()

class SavedImageCreate(SavedImageBase):
    pass

class UserPreferences(BaseModel):
    default_workflow: Optional[str] = None
    default_parameters: Optional[Dict[str, Any]] = None
    custom_actions: Optional[List[Dict[str, Any]]] = []

# Create router
user_router = APIRouter(prefix="/api/users", tags=["users"])

@user_router.get("/images", response_model=List[SavedImage])
async def get_user_images(current_user: UserInDB = Depends(get_current_active_user)):
    """Get all images saved by the current user"""
    images = await db.saved_images.find({"user_id": current_user.id}).sort("created_at", -1).to_list(1000)
    return api_response(images)

@user_router.post("/images", response_model=SavedImage)
async def save_image(
    image: SavedImageCreate,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Save an image to the user's gallery"""
    image_id = str(uuid.uuid4())
    saved_image = SavedImage(
        id=image_id,
        user_id=current_user.id,
        url=image.url,
        prompt=image.prompt,
        parameters=image.parameters,
        workflow_id=image.workflow_id,
        metadata=image.metadata,
        created_at=datetime.utcnow()
    )
    
    await db.saved_images.insert_one(saved_image.dict())
    return api_response(saved_image)

@user_router.delete("/images/{image_id}")
async def delete_image(
    image_id: str,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Delete an image from the user's gallery"""
    # Ensure the image belongs to the current user
    image = await db.saved_images.find_one({"id": image_id})
    if not image or image["user_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found or you don't have permission to delete it"
        )
    
    await db.saved_images.delete_one({"id": image_id})
    return api_response({"message": "Image deleted successfully"})

@user_router.get("/preferences", response_model=UserPreferences)
async def get_preferences(current_user: UserInDB = Depends(get_current_active_user)):
    """Get the user's preferences"""
    user = await db.users.find_one({"id": current_user.id})
    preferences = user.get("preferences", {})
    return api_response(UserPreferences(**preferences))

@user_router.put("/preferences", response_model=UserPreferences)
async def update_preferences(
    preferences: UserPreferences,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Update the user's preferences"""
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {"preferences": preferences.dict()}}
    )
    return api_response(preferences)

@user_router.post("/share/{image_id}")
async def share_image(
    image_id: str,
    platforms: List[str],
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Share an image to specified platforms"""
    # Ensure the image belongs to the current user
    image = await db.saved_images.find_one({"id": image_id})
    if not image or image["user_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found or you don't have permission to share it"
        )
    
    # In a real implementation, you would integrate with each platform's API
    # For now, we'll just return a success message
    return api_response({
        "message": f"Image shared to {', '.join(platforms)}",
        "image_id": image_id,
        "platforms": platforms
    })
