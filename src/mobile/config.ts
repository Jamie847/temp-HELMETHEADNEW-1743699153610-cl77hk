export const API_CONFIG = {
  baseUrl: process.env.NODE_ENV === 'production' 
    ? 'https://your-render-app.onrender.com'
    : 'http://localhost:8080'
};