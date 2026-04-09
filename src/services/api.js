export const updateUserSettings = async (payload) => {
    const token = localStorage.getItem('token');

    const response = await fetch('http://65.0.240.171:5000/api/users/settings', {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }) // only attach if exists
        },
        credentials: 'include', // supports cookie if used
        body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to update settings');
    }

    return data;
};