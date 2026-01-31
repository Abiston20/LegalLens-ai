
const API_BASE_URL = 'http://localhost:8000';

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const sessionStr = localStorage.getItem('legallens_session');
  const token = sessionStr ? JSON.parse(sessionStr).token : null;

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Server returned ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new Error("Cannot connect to LegalLens Backend. Please ensure the server is running at " + API_BASE_URL);
    }
    throw error;
  }
}
