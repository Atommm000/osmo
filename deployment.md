# Deployment Guide: Cosmo AI Video Analysis

Follow these steps to deploy Cosmo to the cloud so you can share it with others.

## 1. Supabase Setup (Prerequisite)

Before deploying, ensure your Supabase project is ready:
1.  **Storage Buckets**: 
    - Go to **Storage** in your Supabase dashboard.
    - Create two new buckets: `videos` and `snapshots`.
    - Set them to **Public** (or configure RLS if you need private storage).
2.  **API Keys**:
    - Note your `SUPABASE_SERVICE_ROLE_KEY` from **Project Settings > API**. This is required for the backend to upload files.

## 2. Environment Variables

You will need to set the following variables on your hosting platform:
- `GEMINI_API_KEY`: Your Google AI Studio API key.
- `VITE_SUPABASE_URL`: Your Supabase project URL.
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key (for frontend).
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (for backend).
- `NODE_ENV`: Set to `production`.

## 3. Deploy to Google Cloud Run (Recommended)

This is the easiest way to host if you are using Google services:
1.  **Install Google Cloud SDK** on your machine.
2.  Run the following command in your project folder:
    ```bash
    gcloud run deploy cosmo-app --source .
    ```
3.  Follow the prompts to select a region and allow unauthenticated invocations (for public access).

## 4. Deploy to Railway or Render

If you prefer a simpler dashboard-based hosting:
1.  **Connect your GitHub repo** to [Railway.app](https://railway.app) or [Render.com](https://render.com).
2.  They will automatically detect the `Dockerfile`.
3.  **Add your Environment Variables** in their dashboard.
4.  Deploy!

## 5. Share with Users

Once deployed, you will get a public URL (e.g., `https://cosmo-app-xyz.a.run.app`). 
- Share this URL with your team.
- Because we used **Supabase Auth**, they can log in and see their own personal history of analyses!
