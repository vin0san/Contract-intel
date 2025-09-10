// frontend/src/api.js
import axios from "axios";

const API_BASE = "/api"; // Nginx proxy to backend

export const uploadContract = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return axios.post(`${API_BASE}/contracts/upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const getContracts = (status) => {
  return axios.get(`${API_BASE}/contracts`, { params: { status } });
};

export const getContractStatus = (id) => {
  return axios.get(`${API_BASE}/contracts/${id}/status`);
};

export const getContractDetails = (id) => {
  return axios.get(`${API_BASE}/contracts/${id}`);
};

export const downloadContract = (id) => {
  return axios.get(`${API_BASE}/contracts/${id}/download`, {
    responseType: "blob",
  });
};
