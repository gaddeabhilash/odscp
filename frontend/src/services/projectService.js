import api from '../api/axios';

export const getProjects = async (clientId) => {
  // Pass clientId to get specific, otherwise assuming admin hits generic or client
  const url = clientId ? `/projects/client/${clientId}` : `/projects`;
  const res = await api.get(url);
  return res.data;
};

export const getAggregateData = async (clientId) => {
  const res = await api.get(`/projects/client/${clientId}/aggregate`);
  return res.data;
};

export const getUpdates = async (projectId, page = 1, limit = 20) => {
  const res = await api.get(`/updates/project/${projectId}?page=${page}&limit=${limit}`);
  return res.data;
};

export const getFiles = async (projectId, page = 1, limit = 20) => {
  const res = await api.get(`/files/project/${projectId}?page=${page}&limit=${limit}`);
  return res.data;
};
