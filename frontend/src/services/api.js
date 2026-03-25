/**
 * MediAI — API Service Layer
 * All HTTP calls go through this file.
 */
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ── Auth token injection ──────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response error handler ────────────────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// ═══════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════
export const login = async (email, password) => {
  const form = new URLSearchParams();
  form.append('username', email);
  form.append('password', password);
  const res = await api.post('/auth/login', form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return res.data;
};

export const getMe = async () => {
  const res = await api.get('/auth/me');
  return res.data;
};

// ═══════════════════════════════════════════════════════════
// PATIENT
// ═══════════════════════════════════════════════════════════
export const getPatientDashboard = async () => {
  const res = await api.get('/patient/dashboard');
  return res.data;
};

export const getPatientProfile = async () => {
  const res = await api.get('/patient/profile');
  return res.data;
};

export const updatePatientProfile = async (data) => {
  const res = await api.put('/patient/profile', data);
  return res.data;
};

export const updateProfilePicture = async (formData) => {
  const res = await api.post('/patient/profile/picture', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const getMedicalRecords = async () => {
  const res = await api.get('/patient/records');
  return res.data;
};

export const uploadMedicalRecord = async (formData) => {
  const res = await api.post('/patient/records/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const deleteMedicalRecord = async (id) => {
  const res = await api.delete(`/patient/records/${id}`);
  return res.data;
};

export const getPrescriptions = async () => {
  const res = await api.get('/patient/prescriptions');
  return res.data;
};

export const getNotifications = async () => {
  const res = await api.get('/patient/notifications');
  return res.data;
};

export const markNotificationsRead = async () => {
  const res = await api.post('/patient/notifications/mark-read');
  return res.data;
};

export const changePatientPassword = async (currentPassword, newPassword) => {
  const res = await api.post('/patient/change-password', {
    current_password: currentPassword,
    new_password: newPassword,
  });
  return res.data;
};

export const getDoctorNotifications = async () => {
  const res = await api.get('/doctor/notifications');
  return res.data;
};

export const markDoctorNotificationsRead = async () => {
  const res = await api.post('/doctor/notifications/mark-read');
  return res.data;
};

export const changeDoctorPassword = async (currentPassword, newPassword) => {
  const res = await api.post('/doctor/change-password', {
    current_password: currentPassword,
    new_password: newPassword,
  });
  return res.data;
};

export const getSubscription = async () => {
  const res = await api.get('/patient/subscription');
  return res.data;
};

export const upgradePlan = async (plan) => {
  const res = await api.post('/patient/upgrade-plan', { plan });
  return res.data;
};

export const getPredictions = async () => {
  const res = await api.get('/patient/predictions');
  return res.data;
};

export const runPrediction = async (data) => {
  const res = await api.post('/patient/predict', data);
  return res.data;
};

// ── Patient feedback ──────────────────────────────────────────────────────────
export const submitPatientFeedback = async (message, rating) => {
  const res = await api.post('/patient/feedback', { message, rating });
  return res.data;
};

// ═══════════════════════════════════════════════════════════
// DOCTOR
// ═══════════════════════════════════════════════════════════
export const getDoctorDashboard = async () => {
  const res = await api.get('/doctor/dashboard');
  return res.data;
};

export const getDoctorPendingPredictions = async () => {
  const res = await api.get('/doctor/pending-predictions');
  return res.data;
};

export const getDoctorAllPredictions = async () => {
  const res = await api.get('/doctor/all-predictions');
  return res.data;
};

// ── Doctor feedback ───────────────────────────────────────────────────────────
export const submitDoctorFeedback = async (message, rating) => {
  const res = await api.post('/doctor/feedback', { message, rating });
  return res.data;
};

// ═══════════════════════════════════════════════════════════
// PUBLIC
// ═══════════════════════════════════════════════════════════
export const getPublicTestimonials = async () => {
  const res = await axios.get(`${BASE_URL}/public/testimonials`);
  return res.data;
};