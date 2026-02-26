# Kanban Board

A React Kanban board with drag-and-drop, infinite scroll, and real-time updates using React Query and Zustand.

## Features

- **4 Columns**: Backlog, In Progress, Review, Done
- **Drag & Drop**: Reorder tasks within columns or move between columns
- **Infinite Scroll**: Server-side pagination with `useInfiniteQuery`
- **Search**: Filter tasks by title or description
- **CRUD Operations**: Create, read, update, delete tasks
- **Optimistic Caching**: React Query caches data and only refetches affected columns

## Tech Stack

- React 18 + TypeScript
- Vite (build tool)
- Material UI v7 (components & styling)
- TanStack Query (React Query) v5 (data fetching & caching)
- Zustand (UI state management)
- @hello-pangea/dnd (drag-and-drop)
- json-server (mock API)

## Project Structure

```
kanban-board/
├── src/
│   ├── App.tsx              # Main app - JSX markup only, uses hooks for logic
│   ├── main.tsx             # Entry point with QueryClientProvider
│   ├── types.ts             # TypeScript interfaces (Task, ColumnType)
│   ├── api/
│   │   └── tasks.ts         # API functions (fetch, create, update, delete)
│   ├── hooks/
│   │   ├── useKanbanQueries.ts  # React Query logic (queries, mutations, caching)
│   │   └── useDragAndDrop.ts    # Drag-drop handlers
│   ├── components/
│   │   ├── KanbanColumn.tsx # Column component with infinite scroll
│   │   ├── TaskCard.tsx     # Draggable task card
│   │   └── TaskModal.tsx    # Create/edit task modal
│   └── store/
│       └── uiStore.ts       # Zustand store for UI state (modal, search, drag)
├── db.json                  # Mock database for json-server
├── package.json
└── README.md
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Mock API Server

```bash
npm run server
```

Runs json-server on http://localhost:4000

### 3. Start the Dev Server

```bash
npm run dev
```

Runs Vite dev server on http://localhost:3000

### 4. Open Browser

Navigate to http://localhost:3000

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run server` | Start json-server mock API |

## How React Query Caching Works

### Location: `src/App.tsx`

The caching is implemented in the mutations with **selective invalidation**:

```typescript
// Track which columns were affected by mutations
const [affectedColumns, setAffectedColumns] = useState<ColumnType[]>([]);

const updateTaskMutation = useMutation({
  mutationFn: ({ id, updates }) => updateTask(id, updates),
  onSuccess: () => {
    // ONLY invalidate affected columns, not all columns
    affectedColumns.forEach(col => {
      queryClient.invalidateQueries({ queryKey: ['tasks', col] });
    });
  },
});
```

### Cache Behavior

| Action | Columns Refetched |
|--------|-------------------|
| Reorder within same column | Only that column |
| Move task between columns | Source + Destination columns |
| Delete task | Only the column that had the task |
| Create task | Only the target column |
| Search query change | All columns (new search filter) |

### Query Keys

Each column has its own query key for granular caching:
```typescript
['tasks', 'backlog', searchQuery]
['tasks', 'in_progress', searchQuery]
['tasks', 'review', searchQuery]
['tasks', 'done', searchQuery]
```

This allows React Query to cache each column independently and only refetch when necessary.

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /tasks?_page=N&_per_page=5&column=X&_sort=order` | Get paginated tasks for column |
| `POST /tasks` | Create new task |
| `PATCH /tasks/:id` | Update task |
| `DELETE /tasks/:id` | Delete task |

## Drag & Drop Behavior

- **Same column reorder**: Updates order values, only that column refetches
- **Cross-column move**: Updates column + order, both columns refetch
- **Optimistic UI**: Drag appears instant, server syncs in background
