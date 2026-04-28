import { create } from 'zustand';
import { getAggregateData } from '../services/projectService';

export const useProjectStore = create((set, get) => ({
  projects: [],
  updates: [],
  files: [],
  isFetched: false,
  
  fetchProjects: async (userId, force = false) => {
    // Return cached projects immediately if already fetched and not forced
    if (get().isFetched && !force) {
      return get().projects;
    }
    
    try {
      const res = await getAggregateData(userId);
      const data = res.data || { projects: [], updates: [], files: [] };
      set({ 
        projects: data.projects || [], 
        updates: data.updates || [],
        files: data.files || [],
        isFetched: true 
      });
      return data.projects || [];
    } catch (err) {
      console.error('Failed to fetch aggregate data', err);
      return [];
    }
  },

  clearProjects: () => set({ projects: [], updates: [], files: [], isFetched: false })
}));
