// API configuration
export const API_CONFIG = {
  // Use relative path for production, localhost for development
  BASE_URL: process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5001',
  ENDPOINTS: {
    POSTS: '/api/posts',
    UPLOADS: '/uploads'
  }
};

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to get image URL
export const getImageUrl = (imagePath: string): string => {
  return `${API_CONFIG.BASE_URL}${imagePath}`;
};