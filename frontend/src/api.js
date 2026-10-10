export const API_BASE_URL = 'https://onrender.com/app';

export const apiUrl = (path) => `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
