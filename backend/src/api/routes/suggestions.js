import express from 'express';

const router = express.Router();

/**
 * Initialize routes with dependencies
 */
export function createSuggestionsRouter(dependencies) {
  const { suggestionsRepository } = dependencies;

  if (!suggestionsRepository) {
    console.warn('⚠️  CourseSuggestionsRepository not available - suggestions routes disabled');
    return router;
  }

  /**
   * GET /api/v1/suggestions/:userId
   * Get all course suggestions for a user
   */
  router.get('/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const { status } = req.query; // Optional status filter

      const suggestions = await suggestionsRepository.getSuggestionsByUser(
        userId,
        status || null
      );

      res.json({
        userId,
        suggestions,
        count: suggestions.length
      });
    } catch (error) {
      console.error('Error getting suggestions:', error);
      res.status(500).json({
        error: 'Failed to get suggestions',
        message: error.message
      });
    }
  });

  /**
   * GET /api/v1/suggestions/:userId/:competencyTargetName
   * Get suggestions for a specific completed course
   * Note: competencyTargetName parameter (legacy: courseId)
   */
  router.get('/:userId/:competencyTargetName', async (req, res) => {
    try {
      const { userId, competencyTargetName } = req.params;

      const suggestions = await suggestionsRepository.getSuggestionsByUser(userId);
      const courseSuggestions = suggestions.filter(
        s => s.competencyTargetName === competencyTargetName || s.completedCourseId === competencyTargetName
      );

      res.json({
        userId,
        competencyTargetName,
        suggestions: courseSuggestions,
        count: courseSuggestions.length
      });
    } catch (error) {
      console.error('Error getting course suggestions:', error);
      res.status(500).json({
        error: 'Failed to get course suggestions',
        message: error.message
      });
    }
  });

  /**
   * GET /api/v1/suggestions/id/:suggestionId
   * Get a specific suggestion by ID
   */
  router.get('/id/:suggestionId', async (req, res) => {
    try {
      const { suggestionId } = req.params;

      const suggestion = await suggestionsRepository.getSuggestionById(suggestionId);

      if (!suggestion) {
        return res.status(404).json({
          error: 'Suggestion not found',
          message: `No suggestion found with ID: ${suggestionId}`
        });
      }

      res.json(suggestion);
    } catch (error) {
      console.error('Error getting suggestion:', error);
      res.status(500).json({
        error: 'Failed to get suggestion',
        message: error.message
      });
    }
  });

  /**
   * PATCH /api/v1/suggestions/:suggestionId/status
   * Update suggestion status (viewed, accepted, dismissed)
   */
  router.patch('/:suggestionId/status', async (req, res) => {
    try {
      const { suggestionId } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          error: 'Missing required field',
          message: 'status is required'
        });
      }

      const validStatuses = ['pending', 'viewed', 'accepted', 'dismissed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          error: 'Invalid status',
          message: `Status must be one of: ${validStatuses.join(', ')}`
        });
      }

      const updated = await suggestionsRepository.updateSuggestionStatus(
        suggestionId,
        status
      );

      res.json({
        message: 'Suggestion status updated',
        suggestion: updated
      });
    } catch (error) {
      console.error('Error updating suggestion status:', error);
      res.status(500).json({
        error: 'Failed to update suggestion status',
        message: error.message
      });
    }
  });

  return router;
}

