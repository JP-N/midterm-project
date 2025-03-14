const API_URL = 'http://localhost:8000/api';

export const getMovies = async () => {
    try {
        const response = await fetch(`${API_URL}/movies`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching movies:', error);
        throw error;
    }
};

export const addMovie = async (title) => {
    try {
        const response = await fetch(`${API_URL}/movies`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title })
        });
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error adding movie:', error);
        throw error;
    }
};

export const updateMovieStatus = async (id, watched) => {
    try {
        const response = await fetch(`${API_URL}/movies/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ watched })
        });
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error updating movie status:', error);
        throw error;
    }
};

export const deleteMovie = async (id) => {
    try {
        const response = await fetch(`${API_URL}/movies/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error deleting movie:', error);
        throw error;
    }
};