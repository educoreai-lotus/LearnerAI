import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * PromptLoader
 * Loads prompt templates from backend/src/infrastructure/prompts/prompts/ directory
 */
export class PromptLoader {
  constructor(promptsDirectory = null) {
    if (promptsDirectory) {
      this.promptsDirectory = promptsDirectory;
    } else {
      // Prompts are stored in backend/src/infrastructure/prompts/prompts/
      // This works for both local development and Railway deployment
      const localPromptsDir = join(__dirname, 'prompts');
      
      // Use environment variable if set, otherwise use local directory
      if (process.env.PROMPTS_DIRECTORY) {
        this.promptsDirectory = process.env.PROMPTS_DIRECTORY;
      } else {
        this.promptsDirectory = localPromptsDir;
      }
    }
  }

  /**
   * Load a prompt by name
   * @param {string} promptName - Name of the prompt (e.g., 'prompt1-skill-expansion')
   * @returns {Promise<string>} The prompt content
   */
  async loadPrompt(promptName) {
    // Try different file extensions
    const extensions = ['.txt', '.md', ''];
    
    // Try primary directory first
    for (const ext of extensions) {
      try {
        const filePath = join(this.promptsDirectory, `${promptName}${ext}`);
        const content = await readFile(filePath, 'utf-8');
        return content.trim();
      } catch (error) {
        // Try next extension
        continue;
      }
    }

    throw new Error(`Prompt file not found: ${promptName} (searched in: ${this.promptsDirectory})`);
  }

  /**
   * Load prompt with version
   * @param {string} promptName - Name of the prompt
   * @param {string} version - Version number
   * @returns {Promise<string>} The prompt content
   */
  async loadPromptVersion(promptName, version) {
    const versionedName = `${promptName}-v${version}`;
    return this.loadPrompt(versionedName);
  }
}

