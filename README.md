# Todo App with React and Supabase

A feature-rich to-do list application built with React and Supabase, featuring user authentication, categories, drag-and-drop reordering, and account management.

## Features

- User authentication (login, registration)
- Task categories with customizable colors
- Drag-and-drop functionality for reordering tasks and categories
- Mark tasks as complete
- User account management and settings
- Mobile-responsive design

## Tech Stack

- React 19
- Vite
- Supabase (authentication and database)
- React Router (for navigation)
- Tailwind CSS (for styling)
- @dnd-kit (for drag-and-drop functionality)

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn
- A Supabase account and project

### Setup

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root of the project with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   (You can get these values from your Supabase project settings)

4. Set up the following tables in your Supabase project:

   ```sql
   -- Categories table
   CREATE TABLE categories (
     id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     name TEXT NOT NULL,
     color TEXT DEFAULT '#3B82F6',
     order INT DEFAULT 0,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Todos table
   CREATE TABLE todos (
     id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
     title TEXT NOT NULL,
     completed BOOLEAN DEFAULT FALSE,
     order INT DEFAULT 0,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   
   -- Create RLS policies for secure access
   ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
   ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
   
   CREATE POLICY "Users can only access their own categories" 
   ON categories FOR ALL USING (auth.uid() = user_id);
   
   CREATE POLICY "Users can only access their own todos" 
   ON todos FOR ALL USING (auth.uid() = user_id);
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Deployment

To build the app for production:

```bash
npm run build
```

The build output will be in the `dist` folder.

## Project Structure

- `src/components`: UI components
- `src/contexts`: Context providers
- `src/hooks`: Custom hooks
- `src/lib`: Utility functions
- `src/pages`: Page components
