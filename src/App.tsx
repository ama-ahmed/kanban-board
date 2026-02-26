import { useRef, useCallback } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Container, 
  Box, 
  TextField,
  InputAdornment,
  Fab
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import { Task, COLUMNS } from './types';
import { useUIStore } from './store/uiStore';
import { useKanbanQueries } from './hooks/useKanbanQueries';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import KanbanColumn from './components/KanbanColumn';
import TaskModal from './components/TaskModal';

function App() {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceTimeoutRef = useRef<number | null>(null);
  const { searchQuery, setSearchQuery, openCreateModal, openEditModal } = useUIStore();
  const { setDraggedTaskId } = useUIStore();

  const debouncedSetSearchQuery = useCallback(
    (value: string) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      
      debounceTimeoutRef.current = window.setTimeout(() => {
        setSearchQuery(value);
      }, 300);
    },
    [setSearchQuery]
  );

  // Data fetching and mutations
  const {
    columnQueries,
    allTasks,
    updateTaskMutation,
    createTaskMutation,
    deleteTaskMutation,
    setAffectedColumns,
  } = useKanbanQueries(searchQuery);

  // Drag and drop handlers
  const { onDragEnd, onDragStart } = useDragAndDrop({
    allTasks,
    updateTaskMutation,
    setAffectedColumns,
    setDraggedTaskId,
  });

  // Handlers
  const handleEditTask = (task: Task) => {
    openEditModal(task);
  };

  const handleDeleteTask = (id: string) => {
    deleteTaskMutation.mutate(id);
  };

  const handleTaskSubmit = (task: Partial<Task>) => {
    if (task.id && task.title && task.description && task.column && task.order !== undefined) {
      // Update existing task
      updateTaskMutation.mutate({
        id: task.id,
        updates: {
          title: task.title,
          description: task.description,
          column: task.column,
          order: task.order,
        },
      });
    } else if (task.title && task.description && task.column) {
      // Create new task
      const columnTasks = allTasks.filter(t => t.column === task.column);
      const maxOrder = columnTasks.length > 0 
        ? Math.max(...columnTasks.map(t => t.order)) 
        : -1;
      
      createTaskMutation.mutate({
        title: task.title,
        description: task.description,
        column: task.column,
        order: maxOrder + 1,
      });
    }
  };

  return (
    <Box sx={{ flexGrow: 1, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'white', color: 'text.primary' }}>
        <Toolbar>
          <Typography variant="h5" component="div" sx={{ flexGrow: 1, fontWeight: 600, color: 'primary.main' }}>
            Kanban Board
          </Typography>
          <TextField
            inputRef={searchInputRef}
            placeholder="Search tasks..."
            size="small"
            onChange={(e) => debouncedSetSearchQuery(e.target.value)}
            sx={{ width: 300, mr: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Toolbar>
      </AppBar>

      {/* Kanban Columns */}
      <Container maxWidth={false} sx={{ flexGrow: 1, py: 3, overflowX: 'auto' }}>
        <DragDropContext onDragEnd={onDragEnd} onDragStart={onDragStart}>
          <Box sx={{ display: 'flex', gap: 3, minWidth: '1200px', height: '100%' }}>
            {COLUMNS.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                query={columnQueries[column.id]}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
              />
            ))}
          </Box>
        </DragDropContext>
      </Container>

      {/* Add Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        onClick={openCreateModal}
      >
        <AddIcon />
      </Fab>

      {/* Task Modal */}
      <TaskModal onSubmit={handleTaskSubmit} />
    </Box>
  );
}

export default App;
