# DataBase Directory (AI-Specific Data)

This directory contains AI-specific data storage for the LearnerAI microservice.

## Purpose

This directory is separate from `database/` and is specifically for:
- AI model embeddings
- Training datasets
- AI-generated content cache
- Model artifacts and weights (if stored locally)
- AI-specific data files

## Contents

- Embeddings (JSON/CSV files)
- Training datasets
- AI model cache files
- Generated content samples

## Git Configuration

This directory is configured in `.gitignore` to exclude sensitive data files:
- `*.json` files (except `.gitkeep`)
- `*.csv` files (except `.gitkeep`)

The `.gitkeep` file ensures the directory is tracked by Git even when empty.

## Usage

This directory is used by the AI service layer for:
1. Storing embeddings for RAG (Retrieval-Augmented Generation)
2. Caching AI-generated learning path templates
3. Storing training data for fine-tuning (if applicable)
4. Temporary storage for AI processing artifacts

## Security Note

⚠️ **Important**: Do not commit sensitive AI training data or model weights to this directory. Use environment variables or secure storage for production AI models.

## Related Directories

- `database/` - Application database schemas and SQL files
- `ai/prompts/` - AI prompt templates
- `ai/models/` - AI model configurations
