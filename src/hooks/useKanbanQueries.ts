import { useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient, InfiniteData } from '@tanstack/react-query';
import { Task, COLUMNS, ColumnType } from '../types';
import { fetchTasksByColumn, updateTask, createTask, deleteTask, FetchTasksResponse } from '../api/tasks';

const ITEMS_PER_PAGE = 5;

const flattenInfiniteData = (data: InfiniteData<FetchTasksResponse> | undefined): Task[] => {
  if (!data) return [];
  return data.pages.flatMap(page => page.tasks);
};

export function useKanbanQueries(searchQuery: string) {
  const queryClient = useQueryClient();
  const [affectedColumns, setAffectedColumns] = useState<ColumnType[]>([]);

  // Create infinite query for each column individually
  const backlogQuery = useInfiniteQuery({
    queryKey: ['tasks', 'backlog', searchQuery],
    queryFn: ({ pageParam = 1 }) => fetchTasksByColumn({
      column: 'backlog',
      page: pageParam,
      limit: ITEMS_PER_PAGE,
      search: searchQuery || undefined,
    }),
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined;
      return allPages.length + 1;
    },
    initialPageParam: 1,
  });

  const inProgressQuery = useInfiniteQuery({
    queryKey: ['tasks', 'in_progress', searchQuery],
    queryFn: ({ pageParam = 1 }) => fetchTasksByColumn({
      column: 'in_progress',
      page: pageParam,
      limit: ITEMS_PER_PAGE,
      search: searchQuery || undefined,
    }),
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined;
      return allPages.length + 1;
    },
    initialPageParam: 1,
  });

  const reviewQuery = useInfiniteQuery({
    queryKey: ['tasks', 'review', searchQuery],
    queryFn: ({ pageParam = 1 }) => fetchTasksByColumn({
      column: 'review',
      page: pageParam,
      limit: ITEMS_PER_PAGE,
      search: searchQuery || undefined,
    }),
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined;
      return allPages.length + 1;
    },
    initialPageParam: 1,
  });

  const doneQuery = useInfiniteQuery({
    queryKey: ['tasks', 'done', searchQuery],
    queryFn: ({ pageParam = 1 }) => fetchTasksByColumn({
      column: 'done',
      page: pageParam,
      limit: ITEMS_PER_PAGE,
      search: searchQuery || undefined,
    }),
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined;
      return allPages.length + 1;
    },
    initialPageParam: 1,
  });

  const columnQueries = {
    backlog: backlogQuery,
    in_progress: inProgressQuery,
    review: reviewQuery,
    done: doneQuery,
  };

  // Get all tasks for reordering logic
  const allTasks = COLUMNS.flatMap(col => flattenInfiniteData(columnQueries[col.id].data));

  // Mutations
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Task> }) => 
      updateTask(id, updates),
    onSuccess: () => {
      // Invalidate only affected columns
      affectedColumns.forEach(col => {
        queryClient.invalidateQueries({ queryKey: ['tasks', col] });
      });
      setAffectedColumns([]);
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: (task: Omit<Task, 'id'>) => createTask(task),
    onSuccess: (newTask) => {
      // Invalidate the column where task was created
      queryClient.invalidateQueries({ queryKey: ['tasks', newTask.column] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: (_, deletedId) => {
      // Find which column had this task and invalidate only that one
      const task = allTasks.find(t => t.id === deletedId);
      if (task) {
        queryClient.invalidateQueries({ queryKey: ['tasks', task.column] });
      }
    },
  });

  const isLoading = Object.values(columnQueries).some(q => q.isLoading);
  const hasError = Object.values(columnQueries).some(q => q.error);

  return {
    columnQueries,
    allTasks,
    updateTaskMutation,
    createTaskMutation,
    deleteTaskMutation,
    isLoading,
    hasError,
    setAffectedColumns,
  };
}
