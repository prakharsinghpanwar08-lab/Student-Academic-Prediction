export const API_BASE_URL = 'https://onrender.com';
export const API_V1_PREFIX = '/api/v1';

export const apiUrl = (path) => {
  const normalizedPath = `/${path}`.replace(/\/+/g, '/');
  const versionedPath = normalizedPath.startsWith(`${API_V1_PREFIX}/`) || normalizedPath === API_V1_PREFIX
    ? normalizedPath
    : `${API_V1_PREFIX}${normalizedPath}`;
  return `${API_BASE_URL.replace(/\/+$/, '')}${versionedPath}`;
};
