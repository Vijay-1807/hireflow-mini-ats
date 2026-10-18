import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.error || err.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  },
);

export const candidatesApi = {
  list: (params) => api.get('/candidates', { params }).then((r) => r.data),
  get: (id) => api.get(`/candidates/${id}`).then((r) => r.data),
  create: (payload) => api.post('/candidates', payload).then((r) => r.data),
  update: (id, payload) => api.patch(`/candidates/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/candidates/${id}`).then((r) => r.data),
  bulkStage: (ids, stage) => api.post('/candidates/bulk-stage', { ids, stage }).then((r) => r.data),
  addActivity: (id, payload) => api.post(`/candidates/${id}/activities`, payload).then((r) => r.data),
  filterOptions: () => api.get('/candidates/filters/options').then((r) => r.data),
};

export const metricsApi = {
  get: () => api.get('/metrics').then((r) => r.data),
};

export default api;
