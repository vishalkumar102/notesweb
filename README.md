# SyncNote

SyncNote is a React, TypeScript, and Vite application for sharing and accessing
student notes and study materials.

## Run locally

```bash
npm install
npm run dev
```

Without Supabase credentials, uploads and notes are stored in the current
browser's local storage and are not shared across devices.

## Configure the Supabase backend

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local` and set the project URL and public anon
   (or publishable) key from **Project Settings → API**:

   ```dotenv
   VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
   VITE_SUPABASE_ANON_KEY=your_public_anon_or_publishable_key
   ```

3. In the SQL Editor of that exact same project, run
   `supabase/migrations/001_initial_schema.sql`, followed by
   `supabase/migrations/002_notes_storage.sql`. Alternatively, run
   `supabase/COMPLETE_SUPABASE_SETUP.sql`, which includes the schema, seed data,
   and notes Storage configuration. The SQL files do not create or select a
   Supabase project; running them in another project's SQL Editor creates the
   tables in that other project.
4. Restart the Vite dev server. Sign up or sign in with Supabase Auth to upload
   notes.

The app uploads each PDF to the `notes` Storage bucket and stores its metadata
in the `resources` table. Approved notes are publicly readable; uploads and
deletions require an authenticated user and are restricted to that user's
Storage folder and resource rows by Row Level Security.

Never put a Supabase `service_role` key in a `VITE_` variable or browser code.
The public anon/publishable key is intended for client-side use and relies on
the database and Storage policies for authorization.

## Other commands

```bash
npm run build
npm run lint
npm run preview
```
