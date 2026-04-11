const API_BASE = 'https://api.jurisynth.in';

export const apiFetch = async (url, options = {}) => {
    const token = localStorage.getItem('token');

    const response = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'API Error');
    }

    return data;
};