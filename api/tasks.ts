import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readFileSync } from 'fs';
import { join } from 'path';

const dbPath = join(process.cwd(), 'db.json');
const db = JSON.parse(readFileSync(dbPath, 'utf8'));

export default function handler(req: VercelRequest, res: VercelResponse) {
  const { method, query } = req;
  
  try {
    switch (method) {
      case 'GET':
        return handleGet(query, res);
      case 'POST':
        return handlePost(req.body, res);
      case 'PATCH':
        return handlePatch(query.id, req.body, res);
      case 'DELETE':
        return handleDelete(query.id, res);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PATCH', 'DELETE']);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

function handleGet(query: any, res: VercelResponse) {
  let tasks = [...db.tasks];
  
  // Filter by column
  if (query.column) {
    tasks = tasks.filter(task => task.column === query.column);
  }
  
  // Search functionality
  if (query.q) {
    const searchTerm = query.q.toLowerCase();
    tasks = tasks.filter(task => 
      task.title.toLowerCase().includes(searchTerm) ||
      task.description.toLowerCase().includes(searchTerm)
    );
  }
  
  // Sort
  const sortBy = query._sort || 'order';
  const sortOrder = query._order || 'asc';
  tasks.sort((a, b) => {
    const aVal = a[sortBy as keyof typeof a];
    const bVal = b[sortBy as keyof typeof b];
    return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
  });
  
  // Pagination
  const start = parseInt(query._start || '0');
  const limit = parseInt(query._limit || '10');
  const total = tasks.length;
  const paginatedTasks = tasks.slice(start, start + limit);
  
  res.setHeader('X-Total-Count', total.toString());
  return res.status(200).json(paginatedTasks);
}

function handlePost(body: any, res: VercelResponse) {
  const newTask = {
    id: Date.now().toString(),
    ...body
  };
  
  db.tasks.push(newTask);
  
  // In production, you'd save to a database
  // For now, just return the new task
  return res.status(201).json(newTask);
}

function handlePatch(id: string, body: any, res: VercelResponse) {
  const taskIndex = db.tasks.findIndex(task => task.id === id);
  
  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  db.tasks[taskIndex] = { ...db.tasks[taskIndex], ...body };
  return res.status(200).json(db.tasks[taskIndex]);
}

function handleDelete(id: string, res: VercelResponse) {
  const taskIndex = db.tasks.findIndex(task => task.id === id);
  
  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  db.tasks.splice(taskIndex, 1);
  return res.status(200).json({ message: 'Task deleted' });
}
