import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach token
api.interceptors.request.use(
  (config) => {
    const auth = JSON.parse(localStorage.getItem('mulundstays-auth') || '{}');
    const token = auth?.state?.token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401, refresh token
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const auth = JSON.parse(localStorage.getItem('mulundstays-auth') || '{}');
        const refreshToken = auth?.state?.refreshToken;
        if (refreshToken) {
          const res = await axios.post('/api/auth/refresh-token', { refreshToken });
          const newToken = res.data.token;
          const stored = JSON.parse(localStorage.getItem('mulundstays-auth'));
          stored.state.token = newToken;
          localStorage.setItem('mulundstays-auth', JSON.stringify(stored));
          original.headers.Authorization = `Bearer ${newToken}`;
          return api(original);
        }
      } catch {
        localStorage.removeItem('mulundstays-auth');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error.response?.data || error);
  }
);

// ── Auth ──────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  verifyOTP: (data) => api.post('/auth/verify-otp', data),
  resendOTP: () => api.post('/auth/resend-otp'),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (token, data) => api.put(`/auth/reset-password/${token}`, data),
  getMe: () => api.get('/auth/me'),
};

// ── Users ─────────────────────────────────────────────
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  changePassword: (data) => api.put('/users/change-password', data),
  uploadProfilePhoto: (formData) => api.post('/users/profile-photo', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  submitKYC: (formData) => api.post('/users/kyc', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updatePayoutDetails: (data) => api.put('/users/payout-details', data),
  becomeHost: () => api.post('/users/become-host'),
  getPublicProfile: (id) => api.get(`/users/${id}/public`),
  toggleWishlist: (listingId) => api.post(`/users/wishlist/${listingId}`),
  getWishlist: () => api.get('/users/wishlist'),
};

// ── Listings ──────────────────────────────────────────
export const listingAPI = {
  search: (params) => api.get('/listings/search', { params }),
  getById: (id) => api.get(`/listings/${id}`),
  create: (data) => api.post('/listings', data),
  update: (id, data) => api.put(`/listings/${id}`, data),
  delete: (id) => api.delete(`/listings/${id}`),
  uploadPhotos: (id, formData) => api.post(`/listings/${id}/photos`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deletePhoto: (id, photoId) => api.delete(`/listings/${id}/photos/${photoId}`),
  submitForApproval: (id) => api.put(`/listings/${id}/submit`),
  getMyListings: (params) => api.get('/listings/host/my-listings', { params }),
  blockDates: (id, dates) => api.put(`/listings/${id}/block-dates`, { dates }),
};

// ── Bookings ──────────────────────────────────────────
export const bookingAPI = {
  create: (data) => api.post('/bookings', data),
  getGuestBookings: (params) => api.get('/bookings/guest', { params }),
  getHostBookings: (params) => api.get('/bookings/host', { params }),
  getById: (id) => api.get(`/bookings/${id}`),
  respond: (id, data) => api.put(`/bookings/${id}/respond`, data),
  cancel: (id, data) => api.put(`/bookings/${id}/cancel`, data),
  checkAvailability: (params) => api.get('/bookings/check-availability', { params }),
};

// ── Payments ──────────────────────────────────────────
export const paymentAPI = {
  createOrder: (bookingId) => api.post('/payments/create-order', { bookingId }),
  verify: (data) => api.post('/payments/verify', data),
  getByBooking: (bookingId) => api.get(`/payments/booking/${bookingId}`),
  getEarnings: (period) => api.get('/payments/host/earnings', { params: { period } }),
};

// ── Reviews ───────────────────────────────────────────
export const reviewAPI = {
  submit: (data) => api.post('/reviews', data),
  getForListing: (listingId, params) => api.get(`/reviews/listing/${listingId}`, { params }),
  addHostResponse: (id, text) => api.put(`/reviews/${id}/host-response`, { text }),
};

// ── Notifications ─────────────────────────────────────
export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markAllRead: () => api.put('/notifications/read-all'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
};

// ── Admin ─────────────────────────────────────────────
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  reviewKYC: (userId, data) => api.put(`/admin/users/${userId}/kyc`, data),
  banUser: (userId, data) => api.put(`/admin/users/${userId}/ban`, data),
  getPendingListings: () => api.get('/admin/listings/pending'),
  reviewListing: (id, data) => api.put(`/admin/listings/${id}/review`, data),
  getBookings: (params) => api.get('/admin/bookings', { params }),
  getRevenue: () => api.get('/admin/revenue'),
};

export default api;
