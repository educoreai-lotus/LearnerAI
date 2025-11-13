import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Assets Router
 * Serves static assets like logos
 */
export function createAssetsRouter() {
  const router = express.Router();

  /**
   * GET /api/assets/logo
   * Serves the logo image based on theme
   * Query params: theme (light|dark)
   */
  router.get('/logo', async (req, res) => {
    const theme = req.query.theme || 'light';
    const assetKey = req.headers['x-railway-asset-key'] || req.query.key;

    // TODO: Validate asset key if needed
    // if (assetKey !== process.env.RAILWAY_ASSET_KEY) {
    //   return res.status(401).json({ error: 'Unauthorized' });
    // }

    try {
      // Serve logo from assets folder
      const logoPath = path.join(__dirname, '../../../assets', `logo-${theme}.svg`);
      const fs = await import('fs/promises');
      
      try {
        // Check if file exists and serve it
        await fs.access(logoPath);
        const fileContent = await fs.readFile(logoPath, 'utf8');
        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.send(fileContent);
      } catch (fileError) {
        // File doesn't exist, return 404
        res.status(404).json({ 
          message: 'Logo not found',
          expectedPath: logoPath,
          theme,
          hint: 'Add logo-light.svg and logo-dark.svg to backend/assets/'
        });
      }
    } catch (error) {
      console.error('Error serving logo:', error);
      res.status(500).json({ error: 'Failed to serve logo' });
    }
  });

  return router;
}

