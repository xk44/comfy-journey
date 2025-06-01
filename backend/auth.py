from fastapi import Depends, HTTPException, status, APIRouter
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from motor.motor_asyncio import AsyncIOMotorClient
from .utils import api_response
from .security import generate_csrf_token
import os
import uuid
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
SECRET_KEY = os.environ.get("SECRET_KEY", "your-secret-key-here-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Token URL
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', "mongodb://localhost:27017")
client = AsyncIOMotorClient(mongo_url)
db = client.get_database(os.environ.get('DB_NAME', 'comfyui_frontend'))

# Models
class Token(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]

class TokenData(BaseModel):
    username: Optional[str] = None
    scopes: List[str] = []

class UserCreate(BaseModel):
    username: str
    password: str
    name: str

class UserInDB(BaseModel):
    id: str
    username: str
    name: str
    hashed_password: str
    created_at: datetime = datetime.utcnow()
    preferences: Optional[Dict[str, Any]] = {}

class UserPublic(BaseModel):
    id: str
    username: str
    name: str
    created_at: datetime

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

async def get_user(username: str):
    user = await db.users.find_one({"username": username})
    if user:
        return UserInDB(**user)
    return None

async def authenticate_user(username: str, password: str):
    user = await get_user(username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = await get_user(username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: UserInDB = Depends(get_current_user)):
    return current_user

# Create router
auth_router = APIRouter(prefix="/api/auth", tags=["auth"])

@auth_router.post("/register", response_model=UserPublic)
async def register_user(user_create: UserCreate):
    # Check if username already exists
    existing_user = await get_user(user_create.username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Create new user
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(user_create.password)
    
    user_in_db = UserInDB(
        id=user_id,
        username=user_create.username,
        name=user_create.name,
        hashed_password=hashed_password,
        created_at=datetime.utcnow(),
        preferences={}
    )
    
    await db.users.insert_one(user_in_db.dict())
    
    return api_response(UserPublic(
        id=user_id,
        username=user_create.username,
        name=user_create.name,
        created_at=user_in_db.created_at
    ))

@auth_router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )

    csrf_token = generate_csrf_token(user.id)

    return api_response({
        "access_token": access_token,
        "token_type": "bearer",
        "csrf_token": csrf_token,
        "user": {
            "id": user.id,
            "username": user.username,
            "name": user.name
        }
    })

@auth_router.get("/me", response_model=UserPublic)
async def read_users_me(current_user: UserInDB = Depends(get_current_active_user)):
    return api_response(UserPublic(
        id=current_user.id,
        username=current_user.username,
        name=current_user.name,
        created_at=current_user.created_at
    ))

@auth_router.put("/preferences")
async def update_user_preferences(
    preferences: Dict[str, Any],
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Update user preferences like default workflows and parameters"""
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {"preferences": preferences}}
    )
    return api_response({"message": "Preferences updated successfully"})

@auth_router.get("/preferences")
async def get_user_preferences(
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Get user preferences"""
    user = await db.users.find_one({"id": current_user.id})
    return api_response({"preferences": user.get("preferences", {})})
