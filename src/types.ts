export interface Task {
  id: string;
  title: string;
  description: string;
  column: ColumnType;
  order: number;
}

export type ColumnType = 'backlog' | 'in_progress' | 'review' | 'done';

export interface Column {
  id: ColumnType;
  title: string;
  color: string;
}

export const COLUMNS: Column[] = [
  { id: 'backlog', title: 'Backlog', color: '#e3f2fd' },
  { id: 'in_progress', title: 'In Progress', color: '#fff3e0' },
  { id: 'review', title: 'Review', color: '#fce4ec' },
  { id: 'done', title: 'Done', color: '#e8f5e9' },
];
