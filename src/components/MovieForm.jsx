import React, { useState } from 'react';
import { FaSearch, FaSpinner } from 'react-icons/fa';
import { addMovie } from '../microservices/api';
import { toast } from 'react-toastify';

const MovieForm = ({ onMovieAdded }) => {
    const [title, setTitle] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) return;

        setLoading(true);
        try {
            const newMovie = await addMovie(title);
            setTitle('');
            onMovieAdded(newMovie);
            toast.success(`"${newMovie.title}" added to your watchlist!`);
        } catch (error) {
            console.error('Failed to add movie:', error);
            if (error.response && error.response.status === 404) {
                toast.error('Movie not found. Please check the title and try again.');
            } else {
                toast.error('Failed to add movie. Please try again later.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="mb-8 flex items-center mx-auto space-x-2 w-2/3 bg-white p-2 rounded-lg shadow-md"
        >
            <div className="relative flex-grow">
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter a Movie (like Inception)"
                    className="w-full px-4 py-2 pr-10 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    disabled={loading}
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          <FaSearch />
        </span>
            </div>
            <button
                type="submit"
                disabled={loading || !title.trim()}
                className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
                {loading ? (
                    <FaSpinner className="animate-spin" />
                ) : (
                    'Add Movie'
                )}
            </button>
        </form>
    );
};

export default MovieForm;