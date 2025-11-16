import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { CourseRepository } from '../CourseRepository.js';

// Mock Supabase client
const createMockSupabaseClient = () => {
  const mockClient = {
    from: jest.fn(function(table) {
      this._table = table;
      return this;
    }),
    insert: jest.fn(function(data) {
      this._insertData = data;
      return this;
    }),
    select: jest.fn(function(columns) {
      return this;
    }),
    single: jest.fn(function() {
      return Promise.resolve({ data: null, error: null });
    }),
    eq: jest.fn(function(column, value) {
      // For delete operations, eq() is the final call and should return a promise
      if (this._isDelete) {
        return Promise.resolve({ error: null });
      }
      return this;
    }),
    update: jest.fn(function(data) {
      this._updateData = data;
      return this;
    }),
    delete: jest.fn(function() {
      this._isDelete = true;
      return this;
    }),
    order: jest.fn(function(column, options) {
      return Promise.resolve({ data: [], error: null });
    })
  };
  return mockClient;
};

describe('CourseRepository', () => {
  let repository;
  let mockClient;

  beforeEach(() => {
    mockClient = createMockSupabaseClient();
    
    repository = new CourseRepository('https://test.supabase.co', 'test-key');
    // Replace the actual Supabase client with our mock
    repository.client = mockClient;
  });

  describe('createCourse', () => {
    it('should create a course with competency_target_name', async () => {
      const courseData = {
        competency_target_name: 'JavaScript ES6+ Syntax',
        user_id: 'user-123',
        gap_id: 'gap-123',
        learning_path: {
          steps: [
            { step: 1, title: 'Introduction', duration: '1 week' }
          ],
          totalSteps: 1
        },
        approved: false
      };

      const mockRecord = {
        competency_target_name: 'JavaScript ES6+ Syntax',
        user_id: 'user-123',
        gap_id: 'gap-123',
        learning_path: courseData.learning_path,
        approved: false,
        created_at: '2025-01-01T00:00:00Z',
        last_modified_at: '2025-01-01T00:00:00Z'
      };

      mockClient.single.mockResolvedValue({ data: mockRecord, error: null });

      const result = await repository.createCourse(courseData);

      expect(mockClient.from).toHaveBeenCalledWith('courses');
      expect(mockClient.insert).toHaveBeenCalledWith({
        competency_target_name: 'JavaScript ES6+ Syntax',
        user_id: 'user-123',
        gap_id: 'gap-123',
        learning_path: courseData.learning_path,
        approved: false
      });
      expect(result.competency_target_name).toBe('JavaScript ES6+ Syntax');
    });
  });

  describe('getCourseById', () => {
    it('should get course by competency_target_name', async () => {
      const mockRecord = {
        competency_target_name: 'JavaScript ES6+ Syntax',
        user_id: 'user-123',
        gap_id: 'gap-123',
        learning_path: { steps: [] },
        approved: false,
        created_at: '2025-01-01T00:00:00Z',
        last_modified_at: '2025-01-01T00:00:00Z'
      };

      mockClient.single.mockResolvedValue({ data: mockRecord, error: null });

      const result = await repository.getCourseById('JavaScript ES6+ Syntax');

      expect(mockClient.from).toHaveBeenCalledWith('courses');
      expect(mockClient.eq).toHaveBeenCalledWith('competency_target_name', 'JavaScript ES6+ Syntax');
      expect(result.competency_target_name).toBe('JavaScript ES6+ Syntax');
    });

    it('should return null if course not found', async () => {
      mockClient.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' }
      });

      const result = await repository.getCourseById('NonExistent');

      expect(result).toBeNull();
    });
  });

  describe('getAllCourses', () => {
    it('should get all courses', async () => {
      const mockRecords = [
        {
          competency_target_name: 'JavaScript ES6+ Syntax',
          user_id: 'user-1',
          gap_id: 'gap-1',
          learning_path: { steps: [] },
          approved: false
        },
        {
          competency_target_name: 'React Hooks',
          user_id: 'user-2',
          gap_id: 'gap-2',
          learning_path: { steps: [] },
          approved: true
        }
      ];

      mockClient.order.mockResolvedValue({ data: mockRecords, error: null });

      const result = await repository.getAllCourses();

      expect(result).toHaveLength(2);
      expect(mockClient.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });
  });

  describe('getCoursesByUser', () => {
    it('should get all courses for a user', async () => {
      const mockRecords = [
        {
          competency_target_name: 'JavaScript ES6+ Syntax',
          user_id: 'user-123',
          gap_id: 'gap-123',
          learning_path: { steps: [] },
          approved: false
        },
        {
          competency_target_name: 'React Hooks',
          user_id: 'user-123',
          gap_id: 'gap-124',
          learning_path: { steps: [] },
          approved: true
        }
      ];

      mockClient.order.mockResolvedValue({ data: mockRecords, error: null });

      const result = await repository.getCoursesByUser('user-123');

      expect(mockClient.eq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(result).toHaveLength(2);
      expect(result.every(course => course.user_id === 'user-123')).toBe(true);
    });
  });

  describe('updateCourse', () => {
    it('should update course learning_path', async () => {
      const updates = {
        learning_path: {
          steps: [
            { step: 1, title: 'Updated Step', duration: '2 weeks' }
          ],
          totalSteps: 1
        }
      };

      const mockRecord = {
        competency_target_name: 'JavaScript ES6+ Syntax',
        user_id: 'user-123',
        gap_id: 'gap-123',
        learning_path: updates.learning_path,
        approved: false,
        created_at: '2025-01-01T00:00:00Z',
        last_modified_at: '2025-01-02T00:00:00Z'
      };

      mockClient.single.mockResolvedValue({ data: mockRecord, error: null });

      const result = await repository.updateCourse('JavaScript ES6+ Syntax', updates);

      expect(mockClient.update).toHaveBeenCalledWith({
        learning_path: updates.learning_path
      });
      expect(result.learning_path).toEqual(updates.learning_path);
    });

    it('should update approved status', async () => {
      const updates = {
        approved: true
      };

      const mockRecord = {
        competency_target_name: 'JavaScript ES6+ Syntax',
        user_id: 'user-123',
        learning_path: {},
        approved: true,
        created_at: '2025-01-01T00:00:00Z',
        last_modified_at: '2025-01-02T00:00:00Z'
      };

      mockClient.single.mockResolvedValue({ data: mockRecord, error: null });

      const result = await repository.updateCourse('JavaScript ES6+ Syntax', updates);

      expect(result.approved).toBe(true);
    });
  });

  describe('deleteCourse', () => {
    it('should delete course successfully', async () => {
      mockClient.eq.mockResolvedValue({ error: null });

      const result = await repository.deleteCourse('JavaScript ES6+ Syntax');

      expect(mockClient.from).toHaveBeenCalledWith('courses');
      expect(mockClient.delete).toHaveBeenCalled();
      expect(mockClient.eq).toHaveBeenCalledWith('competency_target_name', 'JavaScript ES6+ Syntax');
      expect(result).toBe(true);
    });
  });
});

