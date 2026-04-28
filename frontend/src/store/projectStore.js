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

  appendUpdates: (newUpdates) => set((state) => {
    // Prevent duplicates by checking _id
    const existingIds = new Set(state.updates.map(u => u._id));
    const filteredNew = newUpdates.filter(u => !existingIds.has(u._id));
    return { updates: [...state.updates, ...filteredNew] };
  }),

  appendFiles: (newFiles) => set((state) => {
    const existingIds = new Set(state.files.map(f => f._id));
    const filteredNew = newFiles.filter(f => !existingIds.has(f._id));
    return { files: [...state.files, ...filteredNew] };
  }),

  clearProjects: () => set({ projects: [], updates: [], files: [], isFetched: false })
}));
