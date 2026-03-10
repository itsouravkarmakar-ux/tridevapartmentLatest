import axios from 'axios';

const API_URL = 'https://backend-pi-seven-39.vercel.app/api';

// Intercept requests and add authorization header
axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export const login = async (password) => {
    const res = await axios.post(`${API_URL}/auth/login`, { password });
    return res.data;
};

export const getDashboardSummary = async (month) => {
    const res = await axios.get(`${API_URL}/dashboard`, { params: { month } });
    return res.data;
};

export const getSettings = async (key) => {
    const res = await axios.get(`${API_URL}/settings/${key}`);
    return res.data;
};

export const updateSettings = async (key, value) => {
    const res = await axios.put(`${API_URL}/settings/${key}`, { value });
    return res.data;
};

export const getOwners = async (month) => {
    const res = await axios.get(`${API_URL}/owners`, { params: { month } });
    return res.data;
};

export const updateOwner = async (id, data) => {
    const res = await axios.put(`${API_URL}/owners/${id}`, data);
    return res.data;
};

export const setOwnerPremium = async (data) => {
    const res = await axios.post(`${API_URL}/owners/premium`, data);
    return res.data;
};

export const seedOwners = async () => {
    const res = await axios.post(`${API_URL}/owners/seed`);
    return res.data;
};

export const getPayments = async (month) => {
    const res = await axios.get(`${API_URL}/payments`, { params: { month } });
    return res.data;
};

export const addPayment = async (data) => {
    const res = await axios.post(`${API_URL}/payments`, data);
    return res.data;
};

export const getExpenses = async (month) => {
    const res = await axios.get(`${API_URL}/expenses`, { params: { month } });
    return res.data;
};

export const addExpense = async (formData) => {
    const res = await axios.post(`${API_URL}/expenses`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
};

// Action Items APIs
export const getActionItems = async () => {
    const res = await axios.get(`${API_URL}/actions`);
    return res.data;
};

export const addActionItem = async (title) => {
    const res = await axios.post(`${API_URL}/actions`, { title });
    return res.data;
};

export const updateActionItem = async (id, updates) => {
    const res = await axios.put(`${API_URL}/actions/${id}`, updates);
    return res.data;
};
