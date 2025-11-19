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
      // Serve logo from assets folder - try JPG first (with space in filename)
      const logoPathJpg = path.join(__dirname, '../../../assets', `${theme} logo.jpg`);
      const fs = await import('fs/promises');
      
      try {
        // Check if JPG file exists and serve it
        await fs.access(logoPathJpg);
        const fileContent = await fs.readFile(logoPathJpg);
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.send(fileContent);
      } catch (jpgError) {
        // If JPG doesn't exist, try SVG fallback
        try {
          const logoPathSvg = path.join(__dirname, '../../../assets', `logo-${theme}.svg`);
          await fs.access(logoPathSvg);
          const fileContent = await fs.readFile(logoPathSvg, 'utf8');
          res.setHeader('Content-Type', 'image/svg+xml');
          res.setHeader('Cache-Control', 'public, max-age=3600');
          res.send(fileContent);
        } catch (svgError) {
          // File doesn't exist, return 404
          res.status(404).json({ 
            message: 'Logo not found',
            theme,
            hint: `Add "${theme} logo.jpg" or "logo-${theme}.svg" to backend/assets/`
          });
        }
      }
    } catch (error) {
      console.error('Error serving logo:', error);
      res.status(500).json({ error: 'Failed to serve logo' });
    }
  });

  /**
   * GET /:theme (when mounted at /api/logo)
   * Serves the logo image based on theme (for header component)
   * Path param: theme (light|dark)
   */
  router.get('/:theme', async (req, res) => {
    const theme = req.params.theme || 'light';
    const fs = await import('fs/promises');

    try {
      // Serve logo from assets folder - try JPG first (with space in filename)
      const logoPathJpg = path.join(__dirname, '../../../assets', `${theme} logo.jpg`);
      
      try {
        // Check if JPG file exists and serve it
        await fs.access(logoPathJpg);
        const fileContent = await fs.readFile(logoPathJpg);
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.send(fileContent);
      } catch (jpgError) {
        // If JPG doesn't exist, try SVG fallback
        try {
          const logoPathSvg = path.join(__dirname, '../../../assets', `logo-${theme}.svg`);
          await fs.access(logoPathSvg);
          const fileContent = await fs.readFile(logoPathSvg, 'utf8');
          res.setHeader('Content-Type', 'image/svg+xml');
          res.setHeader('Cache-Control', 'public, max-age=3600');
          res.send(fileContent);
        } catch (svgError) {
          // File doesn't exist, return 404
          res.status(404).json({ 
            message: 'Logo not found',
            theme,
            hint: `Add "${theme} logo.jpg" or "logo-${theme}.svg" to backend/assets/`
          });
        }
      }
    } catch (error) {
      console.error('Error serving logo:', error);
      res.status(500).json({ error: 'Failed to serve logo' });
    }
  });

  return router;
}

