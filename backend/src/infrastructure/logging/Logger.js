/**
 * Simple Logger Utility
 * Wraps console methods for consistent logging
 */
export const logger = {
  info: (message, meta = {}) => {
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    console.log(`ℹ️  ${message}${metaStr}`);
  },

  warn: (message, meta = {}) => {
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    console.warn(`⚠️  ${message}${metaStr}`);
  },

  error: (message, meta = {}) => {
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    console.error(`❌ ${message}${metaStr}`);
  },

  debug: (message, meta = {}) => {
    if (process.env.NODE_ENV === 'development') {
      const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
      console.debug(`🔍 ${message}${metaStr}`);
    }
  }
};

