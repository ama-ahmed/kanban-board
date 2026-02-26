import { useRef, useEffect, useCallback } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { 
  Paper, 
  Typography, 
  Box, 
  Chip,
  CircularProgress,
  Button
} from '@mui/material';
import { Task, Column } from '../types';
import { FetchTasksResponse } from '../api/tasks';
import TaskCard from './TaskCard';
import { UseInfiniteQueryResult, InfiniteData } from '@tanstack/react-query';

interface KanbanColumnProps {
  column: Column;
  query: UseInfiniteQueryResult<InfiniteData<FetchTasksResponse>, Error>;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

export default function KanbanColumn({ column, query, onEdit, onDelete }: KanbanColumnProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = query;
  const columnRef = useRef<HTMLDivElement>(null);

  // Flatten all pages into a single array
  const tasks = data?.pages.flatMap(page => page.tasks) || [];
  const totalCount = data?.pages[0]?.total || 0;

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    if (!columnRef.current || isFetchingNextPage || !hasNextPage) return;

    const { scrollTop, scrollHeight, clientHeight } = columnRef.current;
    
    if (scrollTop + clientHeight >= scrollHeight - 50) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    const columnEl = columnRef.current;
    if (!columnEl) return;

    columnEl.addEventListener('scroll', handleScroll);
    return () => columnEl.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <Paper
      elevation={1}
      sx={{
        width: 280,
        minWidth: 280,
        maxHeight: 'calc(100vh - 140px)',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: column.color,
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <Box sx={{ p: 2, borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
            {column.title}
          </Typography>
          <Chip 
            label={totalCount} 
            size="small" 
            sx={{ bgcolor: 'rgba(255,255,255,0.7)' }}
          />
        </Box>
      </Box>

      <Box
        ref={columnRef}
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          p: 2,
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            bgcolor: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: 'rgba(0,0,0,0.2)',
            borderRadius: '3px',
          },
        }}
      >
        <Droppable droppableId={column.id}>
          {(provided, snapshot) => (
            <Box
              ref={provided.innerRef}
              {...provided.droppableProps}
              sx={{
                minHeight: 100,
                transition: 'background-color 0.2s ease',
                bgcolor: snapshot.isDraggingOver ? 'rgba(0,0,0,0.05)' : 'transparent',
                borderRadius: 1,
              }}
            >
              {isLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={28} />
                </Box>
              )}

              {!isLoading && tasks.map((task, index) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={index}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
              {provided.placeholder}
              
              {isFetchingNextPage && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              )}
              
              {!hasNextPage && tasks.length > 0 && (
                <Typography 
                  variant="caption" 
                  color="text.secondary" 
                  sx={{ textAlign: 'center', display: 'block', py: 2 }}
                >
                  No more tasks
                </Typography>
              )}
              
              {hasNextPage && !isFetchingNextPage && (
                <Button
                  onClick={() => fetchNextPage()}
                  fullWidth
                  size="small"
                  sx={{ mt: 1 }}
                >
                  Load more
                </Button>
              )}
              
              {!isLoading && tasks.length === 0 && (
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ textAlign: 'center', py: 4 }}
                >
                  No tasks in this column
                </Typography>
              )}
            </Box>
          )}
        </Droppable>
      </Box>
    </Paper>
  );
}
