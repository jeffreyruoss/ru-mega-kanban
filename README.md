# RU Mega Kanban

A Vue 3 kanban board application with Supabase integration for data persistence.

## Features

- Drag and drop columns for reorganization
- Create and edit kanban board items
- Cloud synchronization with Supabase
- Offline capability with localStorage

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
pnpm install
```

### Environment Variables

Copy `.env.example` to `.env` and update with your Supabase credentials:

```sh
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

See `SUPABASE_SETUP.md` for detailed setup instructions.

### Compile and Hot-Reload for Development

```sh
pnpm dev
```

### Compile and Minify for Production

```sh
pnpm build
```

### Lint with [ESLint](https://eslint.org/)

```sh
pnpm lint
```
