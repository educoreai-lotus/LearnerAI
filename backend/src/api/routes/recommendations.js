import express from 'express';

const router = express.Router();

/**
 * Initialize routes with dependencies
 */
export function createRecommendationsRouter(dependencies) {
  const { recommendationRepository } = dependencies;

  /**
   * GET /api/v1/recommendations
   * Get all recommendations
   */
  router.get('/', async (req, res) => {
    try {
      const recommendations = await recommendationRepository.getAllRecommendations();
      res.json({
        count: recommendations.length,
        recommendations
      });
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      res.status(500).json({
        error: 'Failed to fetch recommendations',
        message: error.message
      });
    }
  });

  /**
   * POST /api/v1/recommendations
   * Create a new recommendation
   */
  router.post('/', async (req, res) => {
    try {
      const { recommendation_id, user_id, base_course_name, base_course_id, suggested_courses, sent_to_rag } = req.body;

      // Validate required fields
      if (!user_id || !suggested_courses) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'user_id and suggested_courses are required'
        });
      }

      const recommendation = await recommendationRepository.createRecommendation({
        recommendation_id,
        user_id,
        base_course_name: base_course_name || base_course_id, // Support both
        suggested_courses,
        sent_to_rag: sent_to_rag !== undefined ? sent_to_rag : false
      });

      res.status(201).json({
        message: 'Recommendation created successfully',
        recommendation
      });
    } catch (error) {
      console.error('Error creating recommendation:', error);
      res.status(500).json({
        error: 'Failed to create recommendation',
        message: error.message
      });
    }
  });

  /**
   * GET /api/v1/recommendations/:recommendationId
   * Get recommendation by recommendation_id
   */
  router.get('/:recommendationId', async (req, res) => {
    try {
      const { recommendationId } = req.params;
      const recommendation = await recommendationRepository.getRecommendationById(recommendationId);

      if (!recommendation) {
        return res.status(404).json({
          error: 'Recommendation not found',
          message: `No recommendation found with recommendation_id: ${recommendationId}`
        });
      }

      res.json({ recommendation });
    } catch (error) {
      console.error('Error fetching recommendation:', error);
      res.status(500).json({
        error: 'Failed to fetch recommendation',
        message: error.message
      });
    }
  });

  /**
   * GET /api/v1/recommendations/user/:userId
   * Get all recommendations by user_id
   */
  router.get('/user/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const recommendations = await recommendationRepository.getRecommendationsByUser(userId);

      res.json({
        user_id: userId,
        count: recommendations.length,
        recommendations
      });
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      res.status(500).json({
        error: 'Failed to fetch recommendations',
        message: error.message
      });
    }
  });

  /**
   * GET /api/v1/recommendations/course/:baseCourseName
   * Get recommendations by base_course_name
   */
  router.get('/course/:baseCourseName', async (req, res) => {
    try {
      const { baseCourseName } = req.params;
      const recommendations = await recommendationRepository.getRecommendationsByBaseCourse(baseCourseName);

      res.json({
        base_course_name: baseCourseName,
        count: recommendations.length,
        recommendations
      });
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      res.status(500).json({
        error: 'Failed to fetch recommendations',
        message: error.message
      });
    }
  });

  /**
   * GET /api/v1/recommendations/rag/:status
   * Get recommendations by sent_to_rag status (true/false)
   */
  router.get('/rag/:status', async (req, res) => {
    try {
      const { status } = req.params;
      const sentToRag = status === 'true';

      const recommendations = await recommendationRepository.getRecommendationsByRagStatus(sentToRag);

      res.json({
        sent_to_rag: sentToRag,
        count: recommendations.length,
        recommendations
      });
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      res.status(500).json({
        error: 'Failed to fetch recommendations',
        message: error.message
      });
    }
  });

  /**
   * PUT /api/v1/recommendations/:recommendationId
   * Update recommendation
   */
  router.put('/:recommendationId', async (req, res) => {
    try {
      const { recommendationId } = req.params;
      const updates = req.body;

      const recommendation = await recommendationRepository.updateRecommendation(recommendationId, updates);

      res.json({
        message: 'Recommendation updated successfully',
        recommendation
      });
    } catch (error) {
      console.error('Error updating recommendation:', error);
      res.status(500).json({
        error: 'Failed to update recommendation',
        message: error.message
      });
    }
  });

  /**
   * DELETE /api/v1/recommendations/:recommendationId
   * Delete recommendation
   */
  router.delete('/:recommendationId', async (req, res) => {
    try {
      const { recommendationId } = req.params;
      await recommendationRepository.deleteRecommendation(recommendationId);

      res.json({
        message: 'Recommendation deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting recommendation:', error);
      res.status(500).json({
        error: 'Failed to delete recommendation',
        message: error.message
      });
    }
  });

  return router;
}

