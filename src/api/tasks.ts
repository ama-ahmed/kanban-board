import { Task, ColumnType } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' && window.location.hostname === 'localhost' 
    ? 'http://localhost:4000' 
    : ''); // Empty for relative paths on Vercel

export interface FetchTasksParams {
  column: ColumnType;
  page: number;
  limit: number;
  search?: string;
}

export interface FetchTasksResponse {
  tasks: Task[];
  hasMore: boolean;
  total: number;
}

export const fetchTasksByColumn = async (params: FetchTasksParams): Promise<FetchTasksResponse> => {
  const { column, page, limit, search } = params;
  
  // Build query params for json-server v0.17.4
  const queryParams = new URLSearchParams();
  queryParams.append('column', column);
  queryParams.append('_sort', 'order');
  queryParams.append('_order', 'asc');
  queryParams.append('_start', String((page - 1) * limit));
  queryParams.append('_limit', String(limit));
  
  if (search) {
    queryParams.append('q', search);
  }
  
  const response = await fetch(`${API_URL}/tasks?${queryParams.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch tasks');
  }
  
  // json-server v0.17.4 returns array directly with X-Total-Count header
  const tasks: Task[] = await response.json();
  const totalCount = response.headers.get('X-Total-Count');
  const total = totalCount ? parseInt(totalCount, 10) : tasks.length;
  const hasMore = tasks.length === limit;
  
  return {
    tasks,
    hasMore,
    total,
  };
};

export const fetchAllTasks = async (): Promise<Task[]> => {
  const response = await fetch(`${API_URL}/tasks?_sort=order&_order=asc`);
  if (!response.ok) {
    throw new Error('Failed to fetch tasks');
  }
  return response.json();
};

export const createTask = async (task: Omit<Task, 'id'>): Promise<Task> => {
  const response = await fetch(`${API_URL}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...task,
      id: Date.now().toString(),
    }),
  });
  if (!response.ok) {
    throw new Error('Failed to create task');
  }
  return response.json();
};

export const updateTask = async (id: string, updates: Partial<Task>): Promise<Task> => {
  const response = await fetch(`${API_URL}/tasks/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    throw new Error('Failed to update task');
  }
  return response.json();
};

export const deleteTask = async (id: string): Promise<void> => {
  const response = await fetch(`${API_URL}/tasks/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete task');
  }
};

// Reorder tasks within the same column
export const reorderTasks = async (
  column: ColumnType,
  sourceIndex: number,
  destinationIndex: number,
  allColumnTasks: Task[]
): Promise<void> => {
  // Create a copy of tasks in this column, sorted by order
  const columnTasks = [...allColumnTasks]
    .filter(t => t.column === column)
    .sort((a, b) => a.order - b.order);
  
  // Remove task from its source position
  const [movedTask] = columnTasks.splice(sourceIndex, 1);
  
  // Insert at destination position
  columnTasks.splice(destinationIndex, 0, movedTask);
  
  // Update order for all tasks in the column
  const updates = columnTasks.map((task, index) => ({
    ...task,
    order: index,
  }));
  
  // Batch update all tasks
  const promises = updates.map(task => 
    updateTask(task.id, { order: task.order })
  );
  
  await Promise.all(promises);
};
