# Environment Variables Setup

## Quick Setup

You need to create a `.env` file in the `backend` directory with your Supabase credentials.

## Step 1: Get Your Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** (SUPABASE_URL)
   - **anon/public key** (SUPABASE_KEY)

## Step 2: Create .env File

In the `backend` directory, create a file named `.env` (no extension) with:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Supabase Configuration (REQUIRED)
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_KEY=your_anon_key_here

# Gemini API (Optional for now)
GEMINI_API_KEY=your_gemini_key_here
```

## Step 3: Replace Values

Replace:
- `https://your-project-ref.supabase.co` with your actual Supabase URL
- `your_anon_key_here` with your actual Supabase anon key

## Example .env File

```env
NODE_ENV=development
PORT=5000
SUPABASE_URL=https://abcdefghijklmnop.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzODk2NzI5MCwiZXhwIjoxOTU0NTQzMjkwfQ.example
GEMINI_API_KEY=AIzaSyExample123
```

## Step 4: Restart Server

After creating the `.env` file:

1. **Stop the server** (Ctrl+C in the terminal where it's running)
2. **Start it again:**
   ```powershell
   npm start
   ```

## Verify It Works

After restarting, test the health endpoint:

```powershell
Invoke-RestMethod -Uri http://localhost:5000/health
```

Then try seeding again:

```powershell
Invoke-RestMethod -Uri http://localhost:5000/api/seed -Method POST
```

## Important Notes

- **Never commit `.env` to Git** - it's already in `.gitignore`
- **Keep your keys secret** - don't share them publicly
- **Use anon key** for client-side operations (what we need here)
- **Service role key** is for admin operations (not needed for seeding)

