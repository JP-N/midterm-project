import React from 'react';
import { FaCheck, FaEye, FaEyeSlash, FaTrash } from 'react-icons/fa';
import { updateMovieStatus, deleteMovie } from '../microservices/api';
import { toast } from 'react-toastify';

const MovieCard = ({ movie, onStatusChange, onDelete }) => {

    // Toggles the movie status, this for some reason or another half works? I hate React.
    const handleStatusToggle = async () => {
        try {

            const updatedMovie = await updateMovieStatus(movie.id, !movie.watched);
            onStatusChange(updatedMovie);
            toast.info(`"${movie.title}" marked as ${movie.watched ? 'unwatched' : 'watched'}`);
        } catch (error) {
            console.error('Failed to update movie status:', error);
            toast.error('Failed to update movie status. Please try again.');
        }
    };

    // React handler for deleting the movie from the FastAPI 'database'
    const handleDelete = async () => {
        try {
            await deleteMovie(movie.id);
            onDelete(movie.id);
            toast.info(`"${movie.title}" removed from your watchlist`);
        } catch (error) {
            console.error('Failed to delete movie:', error);
            toast.error('Failed to remove movie. Please try again.');
        }
    };

    return (
        <div
            className={`movie-card bg-white rounded-lg overflow-hidden shadow-md ${
                movie.watched ? 'watched' : ''
            }`}
        >
            <div className="relative h-64">
                {movie.image_url ? (
                    <img
                        src={movie.image_url}
                        alt={movie.title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400">No Image</span>
                    </div>
                )}
                {movie.watched && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
                        <FaCheck />
                    </div>
                )}
            </div>
            <div className="p-4">
                <h3 className="font-bold text-lg mb-1 truncate">{movie.title}</h3>
                <p className="text-gray-600 text-sm h-16 overflow-hidden line-clamp-3">{movie.description || 'No description available'}</p>
                <div className="mt-4 flex justify-between">
                    <button
                        onClick={handleStatusToggle}
                        className={`p-2 rounded-full ${
                            movie.watched
                                ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                : 'bg-primary-100 text-primary-600 hover:bg-primary-200'
                        }`}
                        title={movie.watched ? 'Mark as unwatched' : 'Mark as watched'}
                    >
                        {movie.watched ? <FaEyeSlash /> : <FaEye />}
                    </button>
                    <button
                        onClick={handleDelete}
                        className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                        title="Remove from watchlist"
                    >
                        <FaTrash />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MovieCard;