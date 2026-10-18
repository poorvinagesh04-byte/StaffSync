import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token to every outgoing request if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('staffsync_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors and unauthorized states
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized and not on login or home, clear token
      if (
        window.location.pathname !== '/login' &&
        window.location.pathname !== '/'
      ) {
        localStorage.removeItem('staffsync_token');
        localStorage.removeItem('staffsync_user');
      }
    }
    return Promise.reject(error);
  }
);

// API modules
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updatePassword: (passwords) => api.put('/auth/update-password', passwords),
  updateProfile: (profileData) => api.put('/auth/update-profile', profileData),
};

export const employeeAPI = {
  getEmployees: (params) => api.get('/employees', { params }),
  getManagers: () => api.get('/employees/managers'),
  getManagersOverview: () => api.get('/employees/managers/overview'),
  reassignManager: (data) => api.put('/employees/reassign-manager', data),
  getEmployeeById: (id) => api.get(`/employees/${id}`),
  createEmployee: (data) => api.post('/employees', data),
  updateEmployee: (id, data) => api.put(`/employees/${id}`, data),
  updateEmployeeStatus: (id, status) => api.patch(`/employees/${id}/status`, { status }),
};

export const leaveAPI = {
  getMyBalances: (year) => api.get('/leaves/balances', { params: { year } }),
  getBalancesByUser: (userId, year) => api.get(`/leaves/balances/${userId}`, { params: { year } }),
  applyLeave: (leaveData) => api.post('/leaves/apply', leaveData),
  getMyLeaves: (params) => api.get('/leaves/my-leaves', { params }),
  cancelLeave: (id) => api.patch(`/leaves/${id}/cancel`),
  getLeaveRequests: (params) => api.get('/leaves', { params }),
  reviewLeaveRequest: (id, reviewData) => api.patch(`/leaves/${id}/review`, reviewData),
};

export const attendanceAPI = {
  getToday: () => api.get('/attendance/today'),
  checkIn: () => api.post('/attendance/check-in'),
  checkOut: () => api.post('/attendance/check-out'),
  getMyHistory: (params) => api.get('/attendance/my-history', { params }),
  getAllAttendance: (params) => api.get('/attendance', { params }),
  getSummary: (date) => api.get('/attendance/summary', { params: { date } }),
};

export const announcementAPI = {
  getAnnouncements: () => api.get('/announcements'),
  createAnnouncement: (data) => api.post('/announcements', data),
  updateAnnouncement: (id, data) => api.put(`/announcements/${id}`, data),
  deleteAnnouncement: (id) => api.delete(`/announcements/${id}`),
};

export const trainingAPI = {
  getTrainingPrograms: (params) => api.get('/training', { params }),
  getTrainingById: (id) => api.get(`/training/${id}`),
  createTrainingProgram: (data) => api.post('/training', data),
  assignTraining: (id, data) => api.post(`/training/${id}/assign`, data),
  updateMyProgress: (id, progressData) => api.patch(`/training/${id}/progress`, progressData),
  deleteTrainingProgram: (id) => api.delete(`/training/${id}`),
};

export const performanceAPI = {
  getMyPerformance: () => api.get('/performance/my-summary'),
  getTeamPerformance: () => api.get('/performance/team'),
  getEmployeePerformance: (id) => api.get(`/performance/employee/${id}`),
  createPerformanceReview: (data) => api.post('/performance', data),
};

export const notificationAPI = {
  getNotifications: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/mark-all-read'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
};

export const reportAPI = {
  getDashboardStats: () => api.get('/reports/dashboard-stats'),
  exportEmployeesCSV: () =>
    api.get('/reports/export/employees', { responseType: 'blob' }),
  exportAttendanceCSV: (params) =>
    api.get('/reports/export/attendance', { params, responseType: 'blob' }),
  exportLeavesCSV: (params) =>
    api.get('/reports/export/leaves', { params, responseType: 'blob' }),
};

export default api;

