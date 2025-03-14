import React, { useState, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaFilm, FaGithub } from 'react-icons/fa';
import MovieForm from './components/MovieForm';
import MovieList from './components/MovieList';
import { getMovies } from './microservices/api';

function App() {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchMovies();
    }, []);

    const fetchMovies = async () => {
        try {
            setLoading(true);
            const data = await getMovies();
            setMovies(data);
            setError(null);
        } catch (error) {
            console.error('Error fetching movies:', error);
            setError('Failed to load watchlist. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleMovieAdded = (newMovie) => {
        setMovies((prevMovies) => [...prevMovies, newMovie]);
    };

    const handleStatusChange = (updatedMovie) => {
        console.log("Movie status updated:", updatedMovie);
        setMovies((prevMovies) =>
            prevMovies.map((movie) =>
                movie.id === updatedMovie.id ? updatedMovie : movie
            )
        );
    };

    const handleDelete = (movieId) => {
        setMovies((prevMovies) => prevMovies.filter((movie) => movie.id !== movieId));
    };

    return (
        <div className="min-h-screen bg-gray-200">
            <header className="bg-gray-800 text-white shadow-md">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <FaFilm className="text-2xl" />
                            <h1 className="text-2xl font-bold">Movie Watchlist</h1>
                        </div>
                        <a
                            href="https://github.com/JP-N"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white hover:text-gray-200 transition-colors"
                            aria-label="GitHub"
                        >My Github :)<FaGithub className="mx-auto text-2xl" />
                        </a>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <MovieForm onMovieAdded={handleMovieAdded} />

                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full text-primary-500" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : error ? (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
                        <p>{error}</p>
                    </div>
                ) : (
                    <MovieList
                        movies={movies}
                        onStatusChange={handleStatusChange}
                        onDelete={handleDelete}
                    />
                )}
            </main>

            <footer className="bg-gray-800 text-gray-300 py-6">
                <div className="container mx-auto px-4 text-center">
                    <p>JP Noga {new Date().getFullYear()}</p>
                    <p className="text-sm mt-2">FastAPI, React, and Tailwind</p>
                </div>
            </footer>

            <ToastContainer
                position="top-center"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />
        </div>
    );
}

export default App;