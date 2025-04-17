# RU Mega Kanban

This is they way I want my Kanban too be. Instead of having a bunch of data tucked away in modals, it's all always visible in the bottom level.

A Vue 3 kanban board application with Supabase integration for data persistence. The app features a modern UI with Tailwind CSS and DaisyUI.

## Features

- Drag and drop kanban columns for reorganization
- Create, edit, and manage kanban board items
- Dark theme support with DaisyUI
- Cloud synchronization with Supabase
- Offline capability with localStorage

## Tech Stack

- Vue 3 with Composition API
- Pinia for state management
- Supabase for backend services
- Tailwind CSS with DaisyUI for styling
- Vite for build tooling

## Project Setup

```sh
pnpm install
```

### Environment Variables

Copy `.env.example` to `.env.local` and update with your Supabase credentials:

```sh
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

See `SUPABASE_SETUP.md` for detailed Supabase setup instructions.

### Compile and Hot-Reload for Development

```sh
pnpm dev
```

### Compile and Minify for Production

```sh
pnpm build
```

### Lint with ESLint

```sh
pnpm lint
```

### Format with Prettier

```sh
pnpm format
```

## Usage

1. Create columns to represent different stages of your workflow
2. Add cards to each column to track tasks or items
3. Drag and drop cards between columns to update their status
4. Drag and drop columns to reorganize your board layout
5. All changes are automatically synchronized with Supabase when online

## Project Structure

- `src/components/` - Vue components for the kanban board
- `src/stores/` - Pinia stores for state management
- `src/lib/` - Utility functions and Supabase client
- `src/assets/` - Static assets and global styles
