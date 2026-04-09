const API_BASE = "http://65.0.240.171:5000/api/notifications"; // added by cipherNomad
const AUTH_BASE = "http://65.0.240.171:5000/api/auth";
let notificationsEndpointUnavailable = false; // added by cipherNomad

const parseApiResponse = async (response) => { // added by cipherNomad
  const contentType = response.headers.get("content-type") || ""; // added by cipherNomad
  if (!contentType.includes("application/json")) { // added by cipherNomad
    return {}; // added by cipherNomad
  } // added by cipherNomad
  return response.json(); // added by cipherNomad
}; // added by cipherNomad

export const fetchNotifications = async () => { // added by cipherNomad
  if (notificationsEndpointUnavailable) { // added by cipherNomad
    return []; // added by cipherNomad
  } // added by cipherNomad
  const token = localStorage.getItem("token"); // added by cipherNomad
  const response = await fetch(API_BASE, { // added by cipherNomad
    headers: { // added by cipherNomad
      ...(token && { Authorization: `Bearer ${token}` }) // added by cipherNomad
    }, // added by cipherNomad
    credentials: "include" // added by cipherNomad
  }); // added by cipherNomad
  if (response.status === 404) { // added by cipherNomad
    notificationsEndpointUnavailable = true; // added by cipherNomad
    return []; // added by cipherNomad
  } // added by cipherNomad
  const data = await parseApiResponse(response); // added by cipherNomad
  if (!response.ok) { // added by cipherNomad
    throw new Error(data.message || "Failed to load notifications"); // added by cipherNomad
  } // added by cipherNomad
  return Array.isArray(data) ? data : []; // added by cipherNomad
}; // added by cipherNomad

export const markNotificationRead = async (id) => { // added by cipherNomad
  const token = localStorage.getItem("token"); // added by cipherNomad
  const response = await fetch(`${API_BASE}/${id}/read`, { // added by cipherNomad
    method: "PATCH", // added by cipherNomad
    headers: { // added by cipherNomad
      ...(token && { Authorization: `Bearer ${token}` }) // added by cipherNomad
    }, // added by cipherNomad
    credentials: "include" // added by cipherNomad
  }); // added by cipherNomad
  const data = await parseApiResponse(response); // added by cipherNomad
  if (!response.ok) { // added by cipherNomad
    throw new Error(data.message || "Failed to update notification"); // added by cipherNomad
  } // added by cipherNomad
  return data; // added by cipherNomad
}; // added by cipherNomad

export const fetchMyClients = async () => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${AUTH_BASE}/clients`, {
    headers: {
      ...(token && { Authorization: `Bearer ${token}` })
    },
    credentials: "include"
  });
  const data = await parseApiResponse(response);
  if (!response.ok) {
    throw new Error(data.message || "Failed to load clients");
  }
  return Array.isArray(data) ? data : [];
};

export const sendClientNotification = async (payload) => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_BASE}/client-request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` })
    },
    body: JSON.stringify(payload || {}),
    credentials: "include"
  });
  const data = await parseApiResponse(response);
  if (!response.ok) {
    throw new Error(data.message || "Failed to send notification");
  }
  return data;
};
