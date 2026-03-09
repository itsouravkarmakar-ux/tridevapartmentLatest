import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

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
