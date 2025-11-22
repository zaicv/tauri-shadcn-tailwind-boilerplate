// API Configuration
// Change this URL to point to your backend server

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://100.83.147.76:8003';

// Helper function to build API URLs
export const apiUrl = (path: string) => {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_BASE_URL}/${cleanPath}`;
};

// Export for backward compatibility
export const BACKEND_URL = API_BASE_URL;

