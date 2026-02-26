import { DropResult } from '@hello-pangea/dnd';
import { Task, ColumnType } from '../types';
import { UseMutationResult } from '@tanstack/react-query';

interface UseDragAndDropProps {
  allTasks: Task[];
  updateTaskMutation: UseMutationResult<Task, Error, { id: string; updates: Partial<Task> }, unknown>;
  setAffectedColumns: (columns: ColumnType[]) => void;
  setDraggedTaskId: (id: string | null) => void;
}

export function useDragAndDrop({
  allTasks,
  updateTaskMutation,
  setAffectedColumns,
  setDraggedTaskId,
}: UseDragAndDropProps) {
  // Handle reordering within same column
  const handleSameColumnReorder = (
    columnId: ColumnType,
    sourceIndex: number,
    destinationIndex: number
  ) => {
    // Set only this column as affected
    setAffectedColumns([columnId]);
    
    const columnTasks = allTasks
      .filter(t => t.column === columnId)
      .sort((a, b) => a.order - b.order);

    // Get all tasks in the column from infinite query
    const columnTaskIds = columnTasks.map(t => t.id);
    
    // Remove from source
    const [movedTaskId] = columnTaskIds.splice(sourceIndex, 1);
    // Insert at destination
    columnTaskIds.splice(destinationIndex, 0, movedTaskId);

    // Calculate new orders
    const updates: { id: string; order: number }[] = [];
    columnTaskIds.forEach((id, index) => {
      const task = columnTasks.find(t => t.id === id);
      if (task && task.order !== index) {
        updates.push({ id, order: index });
      }
    });

    // Batch update
    updates.forEach(({ id, order }) => {
      updateTaskMutation.mutate({ id, updates: { order } });
    });
  };

  // Handle drag end
  const onDragEnd = (result: DropResult) => {
    setDraggedTaskId(null);
    
    if (!result.destination) return;
    
    const { draggableId, source, destination } = result;
    const sourceColumn = source.droppableId as ColumnType;
    const destColumn = destination.droppableId as ColumnType;
    const sourceIndex = source.index;
    const destIndex = destination.index;
    
    // Same column reorder
    if (sourceColumn === destColumn && sourceIndex !== destIndex) {
      handleSameColumnReorder(sourceColumn, sourceIndex, destIndex);
      return;
    }
    
    // Different column move
    if (sourceColumn !== destColumn) {
      // Set both source and dest as affected columns
      setAffectedColumns([sourceColumn, destColumn]);
      
      // Get destination column tasks to calculate new order
      const destColumnTasks = allTasks
        .filter(t => t.column === destColumn)
        .sort((a, b) => a.order - b.order);
      
      // Calculate new order (place at destination index)
      let newOrder: number;
      if (destIndex === 0) {
        newOrder = destColumnTasks.length > 0 ? destColumnTasks[0].order - 1 : 0;
      } else if (destIndex >= destColumnTasks.length) {
        newOrder = destColumnTasks.length > 0 
          ? destColumnTasks[destColumnTasks.length - 1].order + 1 
          : 0;
      } else {
        newOrder = destColumnTasks[destIndex].order;
      }
      
      updateTaskMutation.mutate({
        id: draggableId,
        updates: { column: destColumn, order: newOrder },
      });
    }
  };

  const onDragStart = (start: { draggableId: string }) => {
    setDraggedTaskId(start.draggableId);
  };

  return {
    onDragEnd,
    onDragStart,
    handleSameColumnReorder,
  };
}
