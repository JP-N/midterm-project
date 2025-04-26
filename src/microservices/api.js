import axios from 'axios';

const API_URL = '/api';
const authAxios = axios.create({
    baseURL: API_URL
});

const getAuthToken = () => {
    return localStorage.getItem('token');
};

authAxios.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const getAuthHeaders = () => {
    const token = getAuthToken();
    return token ? {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    } : {
        'Content-Type': 'application/json'
    };
};

export const login = async (username, password) => {
    // FastAPI expects form data for OAuth2 password flow
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Login failed');
    }

    const data = await response.json();
    return data;
};

export const signup = async (username, email, password) => {
    const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username,
            email,
            password
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Signup failed');
    }

    return await response.json();
};

export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};

export const getMovies = async () => {
    const response = await fetch(`${API_URL}/movies`, {
        method: 'GET',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        if (response.status === 401) {
            // Handle unauthorized error - could redirect to login
            throw new Error('Authentication required');
        }
        throw new Error(`Error fetching movies: ${response.status}`);
    }

    return await response.json();
};

export const addMovie = async (title) => {
    const response = await fetch(`${API_URL}/movies`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ title })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || `Failed to add movie: ${response.status}`);
    }

    return await response.json();
};

export const updateMovieStatus = async (movieId, watched) => {
    const response = await fetch(`${API_URL}/movies/${movieId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ watched })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || `Failed to update movie: ${response.status}`);
    }

    return await response.json();
};

export const deleteMovie = async (movieId) => {
    const response = await fetch(`${API_URL}/movies/${movieId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || `Failed to delete movie: ${response.status}`);
    }

    return await response.json();
};