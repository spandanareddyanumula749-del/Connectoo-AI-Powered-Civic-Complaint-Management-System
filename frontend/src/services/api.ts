import axios from 'axios';
import {
  User, Department, Category, Ward, Complaint,
  Notification, Feedback, Comment, Attachment,
  AIClassifyResult, AISeverityResult, AIDuplicateResult, AISummaryResult,
  DashboardSummary, ChartsData, PredictiveAnalytics, MapMarkerItem,
  ComplaintStatus, ComplaintPriority
} from '../types';

const API_BASE_URL = '/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('connectoo_token') || localStorage.getItem('civicai_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      // Clear token on 401
      localStorage.removeItem('connectoo_token');
      localStorage.removeItem('connectoo_user');
      localStorage.removeItem('civicai_token');
      localStorage.removeItem('civicai_user');
    }
    return Promise.reject(error);
  }
);

export const api = {
  // Auth
  auth: {
    login: async (credentials: { email: string; password: string; remember_me?: boolean }) => {
      const res = await apiClient.post<{ access_token: string; user: User }>('/auth/login', credentials);
      return res.data;
    },
    register: async (userData: any) => {
      const res = await apiClient.post<any>('/auth/register', userData);
      return res.data;
    },
    verifyEmail: async (data: { token: string; email: string }) => {
      const res = await apiClient.post<{ message: string; access_token?: string; user?: User }>('/auth/verify-email', data);
      return res.data;
    },
    resendVerification: async (email: string) => {
      const res = await apiClient.post<{ message: string }>('/auth/resend-verification', { email });
      return res.data;
    },
    forgotPassword: async (email: string) => {
      const res = await apiClient.post<{ message: string }>('/auth/forgot-password', { email });
      return res.data;
    },
    resetPassword: async (data: { token: string; email: string; new_password: string }) => {
      const res = await apiClient.post<{ message: string }>('/auth/reset-password', data);
      return res.data;
    },
    getMe: async () => {
      const res = await apiClient.get<User>('/auth/me');
      return res.data;
    },
    listUsers: async (role?: string, department_id?: number) => {
      const params: any = {};
      if (role) params.role = role;
      if (department_id) params.department_id = department_id;
      const res = await apiClient.get<User[]>('/auth/users', { params });
      return res.data;
    },
  },

  // Complaints
  complaints: {
    list: async (params?: {
      status?: string;
      category_id?: number;
      department_id?: number;
      priority?: string;
      ward_id?: number;
      search?: string;
      skip?: number;
      limit?: number;
      sort_by?: string;
      sort_order?: string;
    }) => {
      const res = await apiClient.get<Complaint[]>('/complaints/', { params });
      return res.data;
    },
    getMyComplaints: async () => {
      const res = await apiClient.get<Complaint[]>('/complaints/my');
      return res.data;
    },
    getById: async (idOrCode: string | number) => {
      const res = await apiClient.get<Complaint>(`/complaints/${idOrCode}`);
      return res.data;
    },
    track: async (complaintId: string) => {
      const res = await apiClient.get<Complaint>(`/complaints/track/${complaintId}`);
      return res.data;
    },
    create: async (data: {
      title: string;
      description: string;
      category_id: number;
      ward_id?: number;
      latitude: number;
      longitude: number;
      address: string;
      landmark?: string;
      override_priority?: string;
    }) => {
      const res = await apiClient.post<Complaint>('/complaints/', data);
      return res.data;
    },
    reopen: async (id: number, remarks: string) => {
      const formData = new FormData();
      formData.append('remarks', remarks);
      const res = await apiClient.post<Complaint>(`/complaints/${id}/reopen`, formData);
      return res.data;
    },
    addComment: async (id: number, content: string, is_internal: boolean = false) => {
      const res = await apiClient.post<Comment>(`/complaints/${id}/comments`, { content, is_internal });
      return res.data;
    },
    uploadAttachment: async (id: number, file: File, attachment_type: string = 'evidence') => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('attachment_type', attachment_type);
      const res = await apiClient.post<Attachment>(`/complaints/${id}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    update: async (id: number, data: { title?: string; description?: string; landmark?: string; address?: string }) => {
      const res = await apiClient.put<Complaint>(`/complaints/${id}`, data);
      return res.data;
    },
    withdraw: async (id: number, reason?: string) => {
      const res = await apiClient.post<Complaint>(`/complaints/${id}/withdraw`, { reason });
      return res.data;
    },
  },

  // Municipal Admin
  admin: {
    createWorker: async (data: { email: string; full_name: string; department_id: number; phone?: string; password?: string }) => {
      const res = await apiClient.post<{ message: string; worker: User; temporary_password?: string; email_dispatched: boolean }>('/admin/workers', data);
      return res.data;
    },
    toggleWorkerStatus: async (workerId: number) => {
      const res = await apiClient.patch<{ message: string; worker: User }>(`/admin/workers/${workerId}/toggle-status`);
      return res.data;
    },
    summarizeComplaint: async (id: number) => {
      const res = await apiClient.post<{ summary: string; reported_issue: string; location_clues: string; impact_assessment: string; missing_information: string[] }>(`/admin/complaints/${id}/summarize`);
      return res.data;
    },
    assign: async (id: number, data: { worker_id: number; department_id?: number; notes?: string; priority?: string }) => {
      const res = await apiClient.post<Complaint>(`/admin/complaints/${id}/assign`, data);
      return res.data;
    },
    updateStatus: async (id: number, data: { status: ComplaintStatus; remarks?: string }) => {
      const res = await apiClient.patch<Complaint>(`/admin/complaints/${id}/status`, data);
      return res.data;
    },
    overridePriority: async (id: number, data: { priority: ComplaintPriority; remarks?: string }) => {
      const res = await apiClient.patch<Complaint>(`/admin/complaints/${id}/priority`, data);
      return res.data;
    },
    dismissDuplicate: async (id: number) => {
      const res = await apiClient.post<Complaint>(`/admin/complaints/${id}/duplicate/dismiss`);
      return res.data;
    },
    getDepartments: async () => {
      const res = await apiClient.get<Department[]>('/admin/departments');
      return res.data;
    },
    createDepartment: async (data: Partial<Department>) => {
      const res = await apiClient.post<Department>('/admin/departments', data);
      return res.data;
    },
    getCategories: async () => {
      const res = await apiClient.get<Category[]>('/admin/categories');
      return res.data;
    },
    getAuditLogs: async (skip: number = 0, limit: number = 50) => {
      const res = await apiClient.get<any[]>('/admin/audit-logs', { params: { skip, limit } });
      return res.data;
    },
    triggerEscalation: async () => {
      const res = await apiClient.post<{ message: string }>('/admin/escalation/trigger');
      return res.data;
    },
  },

  // Field Worker
  worker: {
    getTasks: async (statusFilter?: string) => {
      const params = statusFilter ? { status_filter: statusFilter } : {};
      const res = await apiClient.get<Complaint[]>('/worker/tasks', { params });
      return res.data;
    },
    startTask: async (id: number) => {
      const res = await apiClient.patch<Complaint>(`/worker/tasks/${id}/start`);
      return res.data;
    },
    completeTask: async (id: number, resolution_notes: string, after_photo?: File) => {
      const formData = new FormData();
      formData.append('resolution_notes', resolution_notes);
      if (after_photo) {
        formData.append('after_photo', after_photo);
      }
      const res = await apiClient.post<Complaint>(`/worker/tasks/${id}/complete`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
  },

  // AI Services
  ai: {
    classify: async (text: string) => {
      const res = await apiClient.post<AIClassifyResult>('/ai/classify', { text });
      return res.data;
    },
    predictSeverity: async (title: string, description: string, category_id?: number) => {
      const res = await apiClient.post<AISeverityResult>('/ai/severity', { title, description, category_id });
      return res.data;
    },
    checkDuplicates: async (data: {
      title: string;
      description: string;
      category_id: number;
      latitude: number;
      longitude: number;
    }) => {
      const res = await apiClient.post<AIDuplicateResult>('/ai/duplicate-check', data);
      return res.data;
    },
    summarize: async (description: string) => {
      const res = await apiClient.post<AISummaryResult>('/ai/summarize', { description });
      return res.data;
    },
    analyzeVision: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiClient.post<any>('/ai/vision', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
  },

  // Chatbot
  chat: {
    send: async (message: string, language: string = 'en') => {
      const res = await apiClient.post<{
        reply: string;
        suggested_actions?: string[];
        related_complaint_id?: string;
      }>('/chat/', { message, language });
      return res.data;
    },
  },

  // Map
  map: {
    getMarkers: async (params?: {
      category_id?: number;
      status?: string;
      priority?: string;
      ward_id?: number;
    }) => {
      const res = await apiClient.get<MapMarkerItem[]>('/map/markers', { params });
      return res.data;
    },
    getNearby: async (lat: number, lon: number, radiusMeters: number = 1000) => {
      const res = await apiClient.get<any[]>('/map/nearby', {
        params: { latitude: lat, longitude: lon, radius_meters: radiusMeters },
      });
      return res.data;
    },
  },

  // Analytics
  analytics: {
    getSummary: async () => {
      const res = await apiClient.get<DashboardSummary>('/analytics/summary');
      return res.data;
    },
    getCharts: async () => {
      const res = await apiClient.get<ChartsData>('/analytics/charts');
      return res.data;
    },
    getForecasting: async () => {
      const res = await apiClient.get<PredictiveAnalytics>('/analytics/forecasting');
      return res.data;
    },
    exportCsvUrl: () => `${API_BASE_URL}/analytics/export-csv`,
  },

  // Feedback
  feedback: {
    submit: async (complaintId: number, data: { rating: number; review_text?: string }) => {
      const res = await apiClient.post<Feedback>(`/feedback/${complaintId}`, data);
      return res.data;
    },
    getRecent: async () => {
      const res = await apiClient.get<Feedback[]>('/feedback/recent');
      return res.data;
    },
  },

  // Notifications
  notifications: {
    list: async () => {
      const res = await apiClient.get<Notification[]>('/notifications/');
      return res.data;
    },
    markRead: async (id: number) => {
      const res = await apiClient.patch<Notification>(`/notifications/${id}/read`);
      return res.data;
    },
    markAllRead: async () => {
      const res = await apiClient.patch<{ message: string }>('/notifications/read-all');
      return res.data;
    },
  },
};

export default api;
