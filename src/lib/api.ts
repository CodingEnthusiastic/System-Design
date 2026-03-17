import axios, { AxiosInstance } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  console.error('Request interceptor error:', error);
  return Promise.reject(error);
});

// Handle responses with better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login on unauthorized
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    } else if (error.response?.status === 500) {
      console.error('Server error:', error.response.data?.error || 'Internal server error');
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (username: string, email: string, password: string) =>
    api.post('/api/auth/register', { username, email, password }),
  
  verify: (email: string, code: string) =>
    api.post('/api/auth/verify', { email, code }),
  
  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }),
};

// Articles APIs
export const articlesAPI = {
  getAll: () => api.get('/api/articles'),
  getById: (id: string) => api.get(`/api/articles/${id}`),
  create: (data: any) => api.post('/api/articles', data),
  update: (id: string, data: any) => api.put(`/api/articles/${id}`, data),
  delete: (id: string) => api.delete(`/api/articles/${id}`),
  cleanupBrokenImages: () => api.post('/api/articles/cleanup/broken-images', {}),
};

// Courses APIs
export const coursesAPI = {
  getAll: () => api.get('/api/courses'),
  getById: (id: string) => api.get(`/api/courses/${id}`),
  create: (data: any) => api.post('/api/courses', data),
  update: (id: string, data: any) => api.put(`/api/courses/${id}`, data),
  delete: (id: string) => api.delete(`/api/courses/${id}`),
};

// Quizzes APIs
export const quizzesAPI = {
  getAll: () => api.get('/api/quizzes'),
  getById: (id: string) => api.get(`/api/quizzes/${id}`),
  create: (data: any) => api.post('/api/quizzes', data),
  update: (id: string, data: any) => api.put(`/api/quizzes/${id}`, data),
  delete: (id: string) => api.delete(`/api/quizzes/${id}`),
  submitAnswer: (quizId: string, score: number, timeSpent: number, answers: Record<string, number>) =>
    api.post(`/api/quizzes/${quizId}/submit`, { score, timeSpent, answers }),
  getLeaderboard: (quizId: string) =>
    api.get(`/api/quizzes/${quizId}/leaderboard`),
  checkAttempt: (quizId: string) =>
    api.get(`/api/quizzes/${quizId}/check-attempt`),
  getAttempt: (quizId: string) =>
    api.get(`/api/quizzes/${quizId}/attempt`),
};

// Users APIs
export const usersAPI = {
  getAll: () => api.get('/api/users'),
  getById: (id: string) => api.get(`/api/users/${id}`),
  delete: (id: string) => api.delete(`/api/users/${id}`),
};

// Upload APIs
export const uploadAPI = {
  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default api;
