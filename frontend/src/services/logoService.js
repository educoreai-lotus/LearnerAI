/**
 * Logo Service
 * Fetches logo from backend API
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class LogoService {
  /**
   * Get logo URL based on theme
   * @param {string} theme - 'light' or 'dark'
   * @returns {Promise<string|null>} Logo URL or null if not available
   */
  async getLogoUrl(theme = 'light') {
    try {
      // Try to fetch from backend API
      // The backend should have an endpoint like /api/assets/logo?theme=light|dark
      const response = await fetch(`${API_URL}/api/assets/logo?theme=${theme}`, {
        method: 'GET',
        headers: {
          'Accept': 'image/*',
        },
      });

      if (response.ok) {
        // If backend returns a URL, use it
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      }

      // Fallback: Try direct asset path if backend serves static files
      return null;
    } catch (error) {
      console.warn('Failed to fetch logo from API:', error);
      return null;
    }
  }

  /**
   * Get logo URL with fallback to local assets
   * @param {string} theme - 'light' or 'dark'
   * @returns {string|null} Logo URL
   */
  getLocalLogoUrl(theme = 'light') {
    // Try to load from public/assets folder
    try {
      // In Vite, public assets are served from root
      const logoPath = `/assets/logo-${theme}.svg`;
      // Return null if not found, component will handle fallback
      return logoPath;
    } catch (error) {
      return null;
    }
  }
}

export default new LogoService();

