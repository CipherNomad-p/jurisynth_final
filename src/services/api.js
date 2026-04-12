const API_BASE = 'https://api.jurisynth.in';

export const apiFetch = async (url, options = {}) => {
    const response = await fetch(`${API_BASE}${url}`, {
        ...options,
        credentials: "include", // ✅ CRITICAL (cookies)
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'API Error');
    }

    return data;
};