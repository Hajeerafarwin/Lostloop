export const API = "https://lostloop-4yv1.onrender.com/api";

export async function apiFetch(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}

export function getLoggedInUser() {
  try {
    return JSON.parse(localStorage.getItem("loggedInUser") || "null");
  } catch {
    return null;
  }
}