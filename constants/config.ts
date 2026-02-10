export const API_URL = "http://172.17.1.47:3006/api";

// Derive web URL from API URL (remove '/api' suffix)
export const WEB_URL = API_URL.replace('/api', '');
