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

export const getUpdates = async (projectId) => {
  const res = await api.get(`/updates/project/${projectId}`);
  return res.data;
};

export const getFiles = async (projectId) => {
  const res = await api.get(`/files/project/${projectId}`);
  return res.data;
};
