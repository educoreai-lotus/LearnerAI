# LearnerAI

An intelligent learning companion application built with React, Vite, Express, and Supabase.

## Project Structure

```
learnerAI/
├── frontend/        # React + Vite frontend (deployed on Vercel)
├── backend/         # Express REST API (deployed on Railway)
├── ai/              # AI models, prompts, and utilities
│   ├── models/      # AI model configurations
│   └── prompts/     # Prompt templates with version control
├── database/        # Database schemas, migrations, SQL files
├── dataBase/        # AI-specific data storage (embeddings, training datasets)
├── docs/            # Project documentation
└── .github/         # GitHub Actions workflows
```

## Technology Stack

- **Frontend**: React, JavaScript, JSX, Vite
- **Backend**: Node.js, Express, REST API
- **Database**: Supabase
- **Deployment**: Vercel (frontend), Railway (backend)
- **CI/CD**: GitHub Actions

## Getting Started

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

### Backend Development

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm start
```

## License

ISC

