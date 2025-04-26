import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { login, signup } from '../microservices/api';

const AuthModal = ({ isOpen, onClose, onLogin }) => {
    const [mode, setMode] = useState('login');
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (mode === 'login') {
                const { username, password } = formData;
                const data = await login(username, password);
                localStorage.setItem('token', data.access_token);
                localStorage.setItem('user', JSON.stringify(data.user));
                toast.success('Successfully logged in!');
                onLogin(data.user);
            } else {
                const { username, password, email } = formData;
                await signup(username, email, password);
                toast.success('Account created! Please log in.');
                setMode('login');
            }
        } catch (error) {
            console.error('Auth error:', error);
            toast.error(error.response?.data?.detail || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">
                        {mode === 'login' ? 'Log In' : 'Sign Up'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2" htmlFor="username">
                            Username
                        </label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    {mode === 'signup' && (
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2" htmlFor="email">
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                    )}

                    <div className="mb-6">
                        <label className="block text-gray-700 mb-2" htmlFor="password">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                        disabled={loading}
                    >
                        {loading
                            ? 'Processing...'
                            : mode === 'login'
                                ? 'Log In'
                                : 'Sign Up'}
                    </button>
                </form>

                <div className="mt-4 text-center">
                    {mode === 'login' ? (
                        <p>
                            Don't have an account?{' '}
                            <button
                                onClick={() => setMode('signup')}
                                className="text-blue-600 hover:underline"
                            >
                                Sign Up
                            </button>
                        </p>
                    ) : (
                        <p>
                            Have an account?{' '}
                            <button
                                onClick={() => setMode('login')}
                                className="text-blue-600 hover:underline"
                            >
                                Log In
                            </button>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuthModal;