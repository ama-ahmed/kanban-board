import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
} from '@mui/material';
import { Task, ColumnType, COLUMNS } from '../types';
import { useUIStore } from '../store/uiStore';

interface TaskModalProps {
  onSubmit: (task: Partial<Task>) => void;
}

export default function TaskModal({ onSubmit }: TaskModalProps) {
  const { isModalOpen, editingTask, closeModal } = useUIStore();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [column, setColumn] = useState<ColumnType>('backlog');
  const [errors, setErrors] = useState<{ title?: string }>({});

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description);
      setColumn(editingTask.column);
    } else {
      setTitle('');
      setDescription('');
      setColumn('backlog');
    }
    setErrors({});
  }, [editingTask, isModalOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setErrors({ title: 'Title is required' });
      return;
    }

    onSubmit({
      id: editingTask?.id,
      title: title.trim(),
      description: description.trim(),
      column,
      order: editingTask?.order,
    });
    
    closeModal();
  };

  const handleClose = () => {
    closeModal();
  };

  return (
    <Dialog 
      open={isModalOpen} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ pb: 1 }}>
          {editingTask ? 'Edit Task' : 'Create New Task'}
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors({});
              }}
              error={!!errors.title}
              helperText={errors.title}
              fullWidth
              required
              autoFocus
            />
            
            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              rows={4}
              fullWidth
              placeholder="Enter task description..."
            />
            
            <FormControl fullWidth>
              <InputLabel>Column</InputLabel>
              <Select
                value={column}
                label="Column"
                onChange={(e) => setColumn(e.target.value as ColumnType)}
              >
                {COLUMNS.map((col) => (
                  <MenuItem key={col.id} value={col.id}>
                    {col.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} color="inherit">
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
          >
            {editingTask ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
