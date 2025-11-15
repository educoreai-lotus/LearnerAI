import express from 'express';

const router = express.Router();

/**
 * Initialize routes with dependencies
 */
export function createCoursesRouter(dependencies) {
  const { courseRepository } = dependencies;

  /**
   * GET /api/v1/courses
   * Get all courses
   */
  router.get('/', async (req, res) => {
    try {
      const courses = await courseRepository.getAllCourses();
      res.json({
        count: courses.length,
        courses
      });
    } catch (error) {
      console.error('Error fetching courses:', error);
      res.status(500).json({
        error: 'Failed to fetch courses',
        message: error.message
      });
    }
  });

  /**
   * POST /api/v1/courses
   * Create a new course
   */
  router.post('/', async (req, res) => {
    try {
      const { competency_target_name, user_id, learning_path, approved } = req.body;

      // Validate required fields
      if (!user_id || !learning_path || !competency_target_name) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'user_id, learning_path, and competency_target_name are required'
        });
      }

      const course = await courseRepository.createCourse({
        competency_target_name,
        user_id,
        learning_path,
        approved: approved !== undefined ? approved : false
      });

      res.status(201).json({
        message: 'Course created successfully',
        course
      });
    } catch (error) {
      console.error('Error creating course:', error);
      res.status(500).json({
        error: 'Failed to create course',
        message: error.message
      });
    }
  });

  /**
   * GET /api/v1/courses/:competencyTargetName
   * Get course by competency_target_name
   */
  router.get('/:competencyTargetName', async (req, res) => {
    try {
      const { competencyTargetName } = req.params;
      const course = await courseRepository.getCourseById(competencyTargetName);

      if (!course) {
        return res.status(404).json({
          error: 'Course not found',
          message: `No course found with competency_target_name: ${competencyTargetName}`
        });
      }

      res.json({ course });
    } catch (error) {
      console.error('Error fetching course:', error);
      res.status(500).json({
        error: 'Failed to fetch course',
        message: error.message
      });
    }
  });

  /**
   * GET /api/v1/courses/user/:userId
   * Get all courses by user_id
   */
  router.get('/user/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const courses = await courseRepository.getCoursesByUser(userId);

      res.json({
        user_id: userId,
        count: courses.length,
        courses
      });
    } catch (error) {
      console.error('Error fetching courses:', error);
      res.status(500).json({
        error: 'Failed to fetch courses',
        message: error.message
      });
    }
  });

  /**
   * GET /api/v1/courses/approved/:status
   * Get courses by approval status (true/false)
   */
  router.get('/approved/:status', async (req, res) => {
    try {
      const { status } = req.params;
      const approved = status === 'true';

      const courses = await courseRepository.getCoursesByApprovalStatus(approved);

      res.json({
        approved,
        count: courses.length,
        courses
      });
    } catch (error) {
      console.error('Error fetching courses:', error);
      res.status(500).json({
        error: 'Failed to fetch courses',
        message: error.message
      });
    }
  });

  /**
   * PUT /api/v1/courses/:competencyTargetName
   * Update course
   */
  router.put('/:competencyTargetName', async (req, res) => {
    try {
      const { competencyTargetName } = req.params;
      const updates = req.body;

      const course = await courseRepository.updateCourse(competencyTargetName, updates);

      res.json({
        message: 'Course updated successfully',
        course
      });
    } catch (error) {
      console.error('Error updating course:', error);
      res.status(500).json({
        error: 'Failed to update course',
        message: error.message
      });
    }
  });

  /**
   * DELETE /api/v1/courses/:competencyTargetName
   * Delete course
   */
  router.delete('/:competencyTargetName', async (req, res) => {
    try {
      const { competencyTargetName } = req.params;
      await courseRepository.deleteCourse(competencyTargetName);

      res.json({
        message: 'Course deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting course:', error);
      res.status(500).json({
        error: 'Failed to delete course',
        message: error.message
      });
    }
  });

  return router;
}

