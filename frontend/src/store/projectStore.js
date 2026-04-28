import { create } from 'zustand';
import { getProjects } from '../services/projectService';

export const useProjectStore = create((set, get) => ({
  projects: [],
  isFetched: false,
  
  fetchProjects: async (userId, force = false) => {
    // Return cached projects immediately if already fetched and not forced
    if (get().isFetched && !force) {
      return get().projects;
    }
    
    try {
      const res = await getProjects(userId);
      const userProjects = res.data || [];
      set({ projects: userProjects, isFetched: true });
      return userProjects;
    } catch (err) {
      console.error('Failed to fetch projects', err);
      return [];
    }
  },

  clearProjects: () => set({ projects: [], isFetched: false })
}));
