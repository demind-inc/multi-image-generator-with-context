<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1_OMZ0ZGdgsH2MdvJO7Z08fxJztPjrbSx

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

2. Create a `.env` file in the root directory and add your Gemini API key:

   ```bash
   GEMINI_API_KEY=your_api_key_here
   ```

   Get your API key from: https://ai.google.dev/

3. Add your Supabase project keys for authentication and the `profiles` table:

   ```bash
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

   Ensure you have a `profiles` table with `id uuid primary key`, `email text`, `full_name text`, and `last_sign_in_at timestamptz`.

4. Run the app:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

The app will be available at `http://localhost:3300`
