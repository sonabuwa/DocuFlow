import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const code   = error.response?.data?.code;
    if (status === 401 || code === "TOKEN_EXPIRED") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setTimeout(() => window.location.replace("/login"), 100);
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login:       (data) => api.post("/auth/login", data),
  signup:      (data) => api.post("/auth/signup", data),
  logout:      ()     => api.post("/auth/logout"),
  getMe:       ()     => api.get("/auth/me"),
  getUsers:    ()     => api.get("/auth/users"),
  deleteUser:  (id)   => api.delete(`/auth/users/${id}`),
  searchUsers: (q)    => api.get("/auth/search", { params: { q } }),
};

export const documentService = {
  getAll:  (params) => api.get("/documents", { params }),
  getOne:  (id)     => api.get(`/documents/${id}`),
  upload:  (formData)     => api.post("/documents/upload",  formData, { headers: { "Content-Type": "multipart/form-data" } }),
  update:  (id, formData, config = {}) => api.patch(`/documents/${id}`,  formData, { headers: { "Content-Type": "multipart/form-data" }, ...config }),
  delete:  (id)           => api.delete(`/documents/${id}`),
  getDownloadUrl: (id) => `${API_BASE}/documents/${id}/download`,
  getPreviewUrl:  (id) => `${API_BASE}/documents/${id}/preview`,
  getVersionDownloadUrl: (id, versionNum) => `${API_BASE}/documents/${id}/versions/${versionNum}/download`,
  getVersionPreviewUrl:  (id, versionNum) => `${API_BASE}/documents/${id}/versions/${versionNum}/preview`,
  restoreVersion:        (id, versionNum) => api.post(`/documents/${id}/versions/${versionNum}/restore`),
  deleteVersion:        (id, versionNum) => api.delete(`/documents/${id}/versions/${versionNum}`),
  getStats:       ()   => api.get("/documents/stats"),
  restoreDeleted: (id) => api.post(`/documents/${id}/restore`),
  getTrash:       ()   => api.get("/documents/trash"),
  share:       (id, data)   => api.post(`/documents/${id}/share`, data),
  revokeShare: (id, userId) => api.delete(`/documents/${id}/share/${userId}`),
  move:        (id, folderId) => api.patch(`/documents/${id}/move`, { folderId }),
};

export const folderService = {
  getAll:        (parentFolder = null) => api.get("/folders", { params: { parentFolder } }),
  create:        (data)                => api.post("/folders", data),
  rename:        (id, name)            => api.patch(`/folders/${id}`, { name }),
  delete:        (id)                  => api.delete(`/folders/${id}`),
  getBreadcrumb: (folderId)            => api.get(`/folders/${folderId}/breadcrumb`),
};

export const logService = {
  getAll: (params) => api.get("/logs",    { params }),
  getMy:  (params) => api.get("/logs/me", { params }),
};

export default api;
