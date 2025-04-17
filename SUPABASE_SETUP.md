# Supabase Setup Guide for RU Mega Kanban

This guide will help you set up Supabase to store your kanban board data.

## 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com/) and sign in or create an account
2. Create a new project
3. Give your project a name (e.g., "RU Mega Kanban")
4. Set a secure database password
5. Choose a region close to you
6. Wait for your project to be set up

## 2. Run the SQL Migration

1. In your Supabase project, go to the "SQL Editor" section
2. Create a new query
3. Copy the contents of the `supabase/migrations/20240701000000_ru_mega_kanban_schema.sql` file
4. Paste it into the SQL Editor
5. Run the query to create the necessary tables

## 3. Set Up Environment Variables

1. In your Supabase project, go to the "Settings" section, then "API"
2. Find your project URL and anon/public key
3. Copy these values to your `.env` file:

```
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## 4. Restart Your Development Server

After setting up your .env file, restart your development server:

```
npm run dev
```

## 5. Clean Up Duplicate Data (If Needed)

If you encounter duplicate data issues:

1. In your Supabase project, go to the "SQL Editor" section
2. Create a new query
3. Copy the contents of the `supabase/scripts/cleanup_duplicates.sql` file
4. Paste it into the SQL Editor and run the query
5. This will remove any duplicate rows and keep only the most recent data

## Optional: Set Up Row-Level Security (RLS)

If you want to secure your data with authentication:

1. Go to the "Authentication" section of your Supabase project
2. Set up authentication methods (email, social logins, etc.)
3. Modify the SQL schema to include user_id columns and RLS policies
4. Update the application code to handle authentication

## Troubleshooting

If you encounter any issues:

- Make sure your environment variables are correctly set
- Check the browser console for error messages
- Verify that your Supabase project is active
- Ensure the SQL migration ran successfully by checking the tables in the "Table Editor"
- Use the connection indicator in the app to verify database connectivity
- Run the cleanup script if you see duplicate data issues

For more help, refer to the [Supabase documentation](https://supabase.com/docs).
