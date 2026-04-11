const API_BASE = "https://api.jurisynth.in/api/notifications";
const AUTH_BASE = "https://api.jurisynth.in/api/auth";

let notificationsEndpointUnavailable = false;

const parseApiResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return {};
  }
  return response.json();
};

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

//  FIXED
export const fetchNotifications = async () => {
  if (notificationsEndpointUnavailable) return [];

  const response = await fetch(API_BASE, {
    method: "GET",
    headers: {
      ...getAuthHeaders()
    }
  });

  if (response.status === 404) {
    notificationsEndpointUnavailable = true;
    return [];
  }

  const data = await parseApiResponse(response);

  if (!response.ok) {
    throw new Error(data.message || "Failed to load notifications");
  }

  return Array.isArray(data) ? data : [];
};

//  FIXED
export const markNotificationRead = async (id) => {
  const response = await fetch(`${API_BASE}/${id}/read`, {
    method: "PATCH",
    headers: {
      ...getAuthHeaders()
    }
  });

  const data = await parseApiResponse(response);

  if (!response.ok) {
    throw new Error(data.message || "Failed to update notification");
  }

  return data;
};

// client list fixed
export const fetchMyClients = async () => {
  const response = await fetch(`${AUTH_BASE}/clients`, {
    method: "GET",
    headers: {
      ...getAuthHeaders()
    }
  });

  const data = await parseApiResponse(response);

  if (!response.ok) {
    throw new Error(data.message || "Failed to load clients");
  }

  return Array.isArray(data) ? data : [];
};

// FIXED
export const sendClientNotification = async (payload) => {
  const response = await fetch(`${API_BASE}/client-request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders()
    },
    body: JSON.stringify(payload || {})
  });

  const data = await parseApiResponse(response);

  if (!response.ok) {
    throw new Error(data.message || "Failed to send notification");
  }

  return data;
};