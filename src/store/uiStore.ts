import { create } from 'zustand';
import { Task } from '../types';

interface UIState {
  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // Modal
  isModalOpen: boolean;
  editingTask: Task | null;
  openCreateModal: () => void;
  openEditModal: (task: Task) => void;
  closeModal: () => void;
  
  // Drag state
  draggedTaskId: string | null;
  setDraggedTaskId: (id: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Search
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  // Modal
  isModalOpen: false,
  editingTask: null,
  openCreateModal: () => set({ isModalOpen: true, editingTask: null }),
  openEditModal: (task) => set({ isModalOpen: true, editingTask: task }),
  closeModal: () => set({ isModalOpen: false, editingTask: null }),
  
  // Drag state
  draggedTaskId: null,
  setDraggedTaskId: (id) => set({ draggedTaskId: id }),
}));
