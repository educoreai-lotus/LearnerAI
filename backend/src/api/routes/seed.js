/**
 * Seed Database Routes
 * Endpoints for seeding and clearing test data
 */

import express from 'express';
import { seedDatabase, clearSeededData } from '../../utils/seedDatabase.js';
import { getAllMockData } from '../../utils/mockData.js';

export function createSeedRouter(dependencies) {
  const router = express.Router();
  const { supabaseUrl, supabaseKey } = dependencies;

  /**
   * GET /api/seed
   * Get all mock data (without seeding)
   */
  router.get('/', (req, res) => {
    try {
      const mockData = getAllMockData();
      res.json({
        success: true,
        message: 'Mock data retrieved',
        data: mockData,
        counts: {
          learners: mockData.learners.length,
          skillsGaps: mockData.skillsGaps.length,
          courses: mockData.courses.length,
          skillsExpansions: mockData.skillsExpansions.length,
          recommendations: mockData.recommendations.length,
          jobs: mockData.jobs.length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve mock data',
        error: error.message
      });
    }
  });

  /**
   * POST /api/seed
   * Seed database with mock data
   */
  router.post('/', async (req, res) => {
    try {
      if (!supabaseUrl || !supabaseKey) {
        return res.status(500).json({
          success: false,
          message: 'Supabase credentials not configured'
        });
      }

      const result = await seedDatabase(supabaseUrl, supabaseKey);

      res.json({
        success: true,
        message: 'Database seeded successfully',
        data: result,
        counts: {
          learners: result.learners.length,
          skillsGaps: result.skillsGaps.length,
          courses: result.courses.length,
          skillsExpansions: result.skillsExpansions.length,
          recommendations: result.recommendations.length,
          jobs: result.jobs.length
        }
      });
    } catch (error) {
      console.error('Seeding error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to seed database',
        error: error.message
      });
    }
  });

  /**
   * DELETE /api/seed
   * Clear seeded data from database
   */
  router.delete('/', async (req, res) => {
    try {
      if (!supabaseUrl || !supabaseKey) {
        return res.status(500).json({
          success: false,
          message: 'Supabase credentials not configured'
        });
      }

      await clearSeededData(supabaseUrl, supabaseKey);

      res.json({
        success: true,
        message: 'Seeded data cleared successfully'
      });
    } catch (error) {
      console.error('Clearing error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to clear seeded data',
        error: error.message
      });
    }
  });

  return router;
}

