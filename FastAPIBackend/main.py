from datetime import datetime, timedelta
from typing import List, Optional, Any

import jwt
import requests
from bson import ObjectId
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, Field

app = FastAPI(title="Movie Watchlist API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB Connection
MONGO_URI = "mongodb+srv://jpnoga:LcwSrziNj5s3ewQr@mumundo.ecyyd6x.mongodb.net/?retryWrites=true&w=majority&appName=mumundo"
client = AsyncIOMotorClient(MONGO_URI)
db = client.movie_watchlist_db

# TMDB Api integration, environment variables are likely better but a lot of work
# Sure, take my private API key tied to me and my account, why not, right?
TMDB_API_KEY = "7c52995b8f8f423997388c372f2e47d0"
TMDB_API_URL = "https://api.themoviedb.org/3"
TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500"
TMDB_HEADERS = {
    "Authorization": f"Bearer {TMDB_API_KEY}",
    "Content-Type": "application/json;charset=utf-8"
}

# Password and JWT settings
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = "supersecretkey"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7

# OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

# Data validation, serialization, and deserialization. It was this or really long if statements
class PyObjectId(str):
    @classmethod
    def __get_pydantic_json_schema__(cls, _schema_generator) -> dict[str, Any]:
        return {'type': 'string'}

    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            if not isinstance(v, ObjectId):
                raise ValueError("Invalid ObjectId")
        return str(v)

# User + Movie Models
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class User(BaseModel):
    id: str
    username: str
    email: str

class UserInDB(BaseModel):
    id: str
    username: str
    email: str
    hashed_password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class TokenData(BaseModel):
    username: Optional[str] = None

class MovieBase(BaseModel):
    title: str

class MovieCreate(MovieBase):
    pass

class Movie(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    title: str
    imdb_id: str
    image_url: str
    description: str
    watched: bool = False
    user_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Config:
    allow_population_by_field_name = True
    arbitrary_types_allowed = True
    json_encoders = {ObjectId: str}

class MovieOut(BaseModel):
    id: str
    title: str
    imdb_id: str
    image_url: str
    description: str
    watched: bool
    user_id: str

# Password hashing and JWT token creation for security reasons
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_user_by_username(username: str):
    user = await db.users.find_one({"username": username})
    if user:
        return user
    return None

async def authenticate_user(username: str, password: str):
    user = await get_user_by_username(username)
    if not user:
        return False
    if not verify_password(password, user["hashed_password"]):
        return False
    return user

async def get_current_user(token: str = Depends(oauth2_scheme)):

    # Token validation
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except:
        raise credentials_exception

    user = await get_user_by_username(username=token_data.username)
    if user is None:
        raise credentials_exception

    return User(id=str(user["_id"]), username=user["username"], email=user["email"])

@app.post("/api/auth/signup", response_model=dict)
async def signup(user_data: UserCreate):
    # Check if username exists, probably don't want duplicate users
    existing_user = await db.users.find_one({"username": user_data.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")

    # Check if email exists, probably don't want duplicate emails
    existing_email = await db.users.find_one({"email": user_data.email})
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    # If everything is good, make a new user
    hashed_password = get_password_hash(user_data.password)
    user_dict = {
        "username": user_data.username,
        "email": user_data.email,
        "hashed_password": hashed_password,
        "created_at": datetime.utcnow()
    }

    # Insert new user into MongoDB
    await db.users.insert_one(user_dict)

    return {"message": "User created successfully"}

# Auth routes section
@app.post("/api/auth/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):

    # Check the database for the user, throw generic error if not found/incorrect
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user["_id"]),
            "username": user["username"],
            "email": user["email"]
        }
    }

@app.get("/")
def read_root():
    return {"message": "Movie Watchlist API"}

# Movie routes
@app.get("/api/movies", response_model=List[MovieOut])
async def get_movies(current_user: User = Depends(get_current_user)):
    # Return only movies associated with the current user
    movies = []
    cursor = db.movies.find({"user_id": current_user.id})
    async for movie in cursor:
        movies.append(MovieOut(
            id=str(movie["_id"]),
            title=movie["title"],
            imdb_id=movie["imdb_id"],
            image_url=movie["image_url"],
            description=movie["description"],
            watched=movie["watched"],
            user_id=movie["user_id"]
        ))
    return movies

@app.post("/api/movies", response_model=MovieOut)
async def add_movie(movie: MovieCreate, current_user: User = Depends(get_current_user)):
    try:
        # Use api_key as a query parameter
        search_params = {
            "query": movie.title,
            "api_key": TMDB_API_KEY
        }

        response = requests.get(
            f"{TMDB_API_URL}/search/movie",
            params=search_params
        )

        response.raise_for_status()
        data = response.json()

        if "results" not in data or not data["results"]:
            raise HTTPException(status_code=404, detail="Movie not found in TMDB database")

        movie_data = data["results"][0]
        movie_id = movie_data["id"]

        # Also use api_key as a query parameter here
        detail_response = requests.get(
            f"{TMDB_API_URL}/movie/{movie_id}",
            params={"api_key": TMDB_API_KEY}
        )

        detail_response.raise_for_status()
        detail_data = detail_response.json()

        # Rest of the function remains the same
        poster_path = detail_data.get("poster_path")
        image_url = f"{TMDB_IMAGE_BASE_URL}{poster_path}" if poster_path else ""

        new_movie = {
            "title": detail_data.get("title", movie.title),
            "imdb_id": str(detail_data.get("id", "")),
            "image_url": image_url,
            "description": detail_data.get("overview", ""),
            "watched": False,
            "user_id": current_user.id,
            "created_at": datetime.utcnow()
        }

        result = await db.movies.insert_one(new_movie)
        created_movie = await db.movies.find_one({"_id": result.inserted_id})

        return MovieOut(
            id=str(created_movie["_id"]),
            title=created_movie["title"],
            imdb_id=created_movie["imdb_id"],
            image_url=created_movie["image_url"],
            description=created_movie["description"],
            watched=created_movie["watched"],
            user_id=created_movie["user_id"]
        )

    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"TMDB API request failed: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add movie: {str(e)}")
@app.put("/api/movies/{movie_id}", response_model=MovieOut)
async def update_movie(movie_id: str, watched: bool, current_user: User = Depends(get_current_user)):
    try:
        # Find the movie and verify ownership
        movie = await db.movies.find_one({"_id": ObjectId(movie_id)})
        if not movie:
            raise HTTPException(status_code=404, detail="Movie not found")

        if movie["user_id"] != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to update this movie")

        # Update the movie's watched status
        await db.movies.update_one(
            {"_id": ObjectId(movie_id)},
            {"$set": {"watched": watched}}
        )

        # Get the updated movie
        updated_movie = await db.movies.find_one({"_id": ObjectId(movie_id)})

        return MovieOut(
            id=str(updated_movie["_id"]),
            title=updated_movie["title"],
            imdb_id=updated_movie["imdb_id"],
            image_url=updated_movie["image_url"],
            description=updated_movie["description"],
            watched=updated_movie["watched"],
            user_id=updated_movie["user_id"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update movie: {str(e)}")

@app.delete("/api/movies/{movie_id}")
async def delete_movie(movie_id: str):
    try:
        await db.movies.delete_one({"_id": ObjectId(movie_id)})
        return {"message": "Movie deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete movie: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)