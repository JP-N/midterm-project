from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import requests
import os
from typing import List, Optional
from uuid import uuid4

app = FastAPI(title="Movie Watchlist API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# TMDB Api integration, environment variables are likely better but a lot of work
TMDB_API_KEY = "YOURKEYHERE"
TMDB_API_URL = "https://api.themoviedb.org/3"
TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500"
TMDB_HEADERS = {
    "Authorization": f"Bearer {TMDB_API_KEY}",
    "Content-Type": "application/json;charset=utf-8"
}

class MovieBase(BaseModel):
    title: str

class MovieCreate(MovieBase):
    pass

class Movie(MovieBase):
    id: str
    imdb_id: str
    image_url: str
    description: str
    watched: bool = False

# The heart of it all, the in memory database
movies_db = []

@app.get("/")
def read_root():
    return {"message": "Movie Watchlist API"}

@app.get("/api/movies", response_model=List[Movie])
def get_movies():
    return movies_db

@app.post("/api/movies", response_model=Movie)
def add_movie(movie: MovieCreate):

    try:

        # Search the API for the movie that was entered
        search_params = {
            "query": movie.title
        }

        response = requests.get(
            f"{TMDB_API_URL}/search/movie",
            params=search_params,
            headers=TMDB_HEADERS
        )

        response.raise_for_status()
        data = response.json()
        # Everything below is just putting movie data into the local database

        if "results" not in data or not data["results"]:
            raise HTTPException(status_code=404, detail="Movie not found")

        movie_data = data["results"][0]
        movie_id = movie_data["id"]

        detail_response = requests.get(
            f"{TMDB_API_URL}/movie/{movie_id}",
            headers=TMDB_HEADERS
        )

        detail_response.raise_for_status()
        detail_data = detail_response.json()

        poster_path = detail_data.get("poster_path")
        image_url = f"{TMDB_IMAGE_BASE_URL}{poster_path}" if poster_path else ""

        new_movie = Movie(
            id=str(uuid4()),
            title=detail_data.get("title", movie.title),
            imdb_id=str(detail_data.get("id", "")),
            image_url=image_url,
            description=detail_data.get("overview", ""),
            watched=False
        )

        movies_db.append(new_movie)
        return new_movie

    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"API request failed: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add movie: {str(e)}")

# CRUD operation to modify the movie as watched or not watched
@app.put("/api/movies/{movie_id}", response_model=Movie)
def update_movie(movie_id: str, watched: bool):
    for movie in movies_db:
        if movie.id == movie_id:
            movie.watched = watched
            return movie

    raise HTTPException(status_code=404, detail="Movie not found")

# CRUD operation to delete the movie from database
@app.delete("/api/movies/{movie_id}")
def delete_movie(movie_id: str):
    global movies_db

    for index, movie in enumerate(movies_db):
        if movie.id == movie_id:
            movies_db.pop(index)
            return {"message": "Movie deleted successfully"}

    raise HTTPException(status_code=404, detail="Movie not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)