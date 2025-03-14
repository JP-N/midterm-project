import React from 'react';
import MovieCard from './MovieCard';
import { FaFilm } from 'react-icons/fa';

const MovieList = ({ movies, onStatusChange, onDelete }) => {
    if (!movies.length) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                <FaFilm className="text-5xl mb-4" />
                <h3 className="text-xl font-medium">Your watchlist is empty</h3>
                <p className="mt-2">Start by adding some movies you want to watch!</p>
            </div>
        );
    }

    return (

        // Brunt of the program here, puts all the movies in a grid that scales with browser size
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {movies.map((movie) => (
                <MovieCard
                    key={movie.id}
                    movie={movie}
                    onStatusChange={onStatusChange}
                    onDelete={onDelete}
                />
            ))}
        </div>
    );
};

export default MovieList;