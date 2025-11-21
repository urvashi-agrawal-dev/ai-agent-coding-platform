import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

export const executeAgent = async (request: any) => {
  const { data } = await api.post('/agents/execute', request);
  return data;
};

export const uploadFiles = async (formData: FormData) => {
  const { data } = await api.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
};

export const executeSandbox = async (code: string, language: string) => {
  const { data } = await api.post('/sandbox/execute', { code, language });
  return data;
};

export const runTests = async (code: string, testCode: string) => {
  const { data } = await api.post('/tests/run', { code, testCode });
  return data;
};

export const generateDocs = async (projectFiles: any[], projectName: string) => {
  const { data } = await api.post('/docs/generate', { projectFiles, projectName });
  return data;
};

export default api;
