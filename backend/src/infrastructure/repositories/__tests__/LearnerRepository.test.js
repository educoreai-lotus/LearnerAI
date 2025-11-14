import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { LearnerRepository } from '../LearnerRepository.js';

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

describe('LearnerRepository', () => {
  let repository;
  let mockClient;

  beforeEach(() => {
    mockClient = createMockSupabaseClient();
    
    repository = new LearnerRepository('https://test.supabase.co', 'test-key');
    // Replace the actual Supabase client with our mock
    repository.client = mockClient;
  });

  describe('constructor', () => {
    it('should throw error if supabaseUrl is missing', () => {
      expect(() => new LearnerRepository(null, 'key')).toThrow('Supabase URL and key are required');
    });

    it('should throw error if supabaseKey is missing', () => {
      expect(() => new LearnerRepository('url', null)).toThrow('Supabase URL and key are required');
    });

    it('should create repository with valid credentials', () => {
      expect(repository).toBeDefined();
      expect(repository.client).toBe(mockClient);
    });
  });

  describe('createLearner', () => {
    it('should create a learner successfully', async () => {
      const learnerData = {
        user_id: 'user-123',
        company_id: 'company-456',
        company_name: 'Test Company',
        user_name: 'John Doe'
      };

      const mockRecord = {
        user_id: 'user-123',
        company_id: 'company-456',
        company_name: 'Test Company',
        user_name: 'John Doe',
        created_at: '2025-01-01T00:00:00Z',
        last_modified_at: '2025-01-01T00:00:00Z'
      };

      mockClient.single.mockResolvedValue({ data: mockRecord, error: null });

      const result = await repository.createLearner(learnerData);

      expect(mockClient.from).toHaveBeenCalledWith('learners');
      expect(mockClient.insert).toHaveBeenCalledWith({
        user_id: 'user-123',
        company_id: 'company-456',
        company_name: 'Test Company',
        user_name: 'John Doe'
      });
      expect(result).toEqual({
        user_id: 'user-123',
        company_id: 'company-456',
        company_name: 'Test Company',
        user_name: 'John Doe',
        created_at: '2025-01-01T00:00:00Z',
        last_modified_at: '2025-01-01T00:00:00Z'
      });
    });

    it('should handle database errors', async () => {
      const learnerData = {
        user_id: 'user-123',
        company_id: 'company-456',
        company_name: 'Test Company',
        user_name: 'John Doe'
      };

      mockClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Duplicate key violation' }
      });

      await expect(repository.createLearner(learnerData)).rejects.toThrow('Failed to create learner: Duplicate key violation');
    });

    it('should allow optional user_id (auto-generated)', async () => {
      const learnerData = {
        company_id: 'company-456',
        company_name: 'Test Company',
        user_name: 'John Doe'
      };

      const mockRecord = {
        user_id: 'auto-generated-id',
        company_id: 'company-456',
        company_name: 'Test Company',
        user_name: 'John Doe',
        created_at: '2025-01-01T00:00:00Z',
        last_modified_at: '2025-01-01T00:00:00Z'
      };

      mockClient.single.mockResolvedValue({ data: mockRecord, error: null });

      await repository.createLearner(learnerData);

      expect(mockClient.insert).toHaveBeenCalledWith({
        user_id: undefined,
        company_id: 'company-456',
        company_name: 'Test Company',
        user_name: 'John Doe'
      });
    });
  });

  describe('getAllLearners', () => {
    it('should get all learners', async () => {
      const mockRecords = [
        {
          user_id: 'user-1',
          company_id: 'company-1',
          company_name: 'Company 1',
          user_name: 'User 1',
          created_at: '2025-01-01T00:00:00Z',
          last_modified_at: '2025-01-01T00:00:00Z'
        },
        {
          user_id: 'user-2',
          company_id: 'company-2',
          company_name: 'Company 2',
          user_name: 'User 2',
          created_at: '2025-01-02T00:00:00Z',
          last_modified_at: '2025-01-02T00:00:00Z'
        }
      ];

      mockClient.order.mockResolvedValue({ data: mockRecords, error: null });

      const result = await repository.getAllLearners();

      expect(mockClient.from).toHaveBeenCalledWith('learners');
      expect(mockClient.select).toHaveBeenCalledWith('*');
      expect(mockClient.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toHaveLength(2);
      expect(result[0].user_id).toBe('user-1');
    });

    it('should handle empty results', async () => {
      mockClient.order.mockResolvedValue({ data: [], error: null });

      const result = await repository.getAllLearners();

      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      mockClient.order.mockResolvedValue({
        data: null,
        error: { message: 'Connection failed' }
      });

      await expect(repository.getAllLearners()).rejects.toThrow('Failed to get learners: Connection failed');
    });
  });

  describe('getLearnerById', () => {
    it('should get learner by user_id', async () => {
      const mockRecord = {
        user_id: 'user-123',
        company_id: 'company-456',
        company_name: 'Test Company',
        user_name: 'John Doe',
        created_at: '2025-01-01T00:00:00Z',
        last_modified_at: '2025-01-01T00:00:00Z'
      };

      mockClient.single.mockResolvedValue({ data: mockRecord, error: null });

      const result = await repository.getLearnerById('user-123');

      expect(mockClient.from).toHaveBeenCalledWith('learners');
      expect(mockClient.eq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(result).toEqual({
        user_id: 'user-123',
        company_id: 'company-456',
        company_name: 'Test Company',
        user_name: 'John Doe',
        created_at: '2025-01-01T00:00:00Z',
        last_modified_at: '2025-01-01T00:00:00Z'
      });
    });

    it('should return null if learner not found', async () => {
      mockClient.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' }
      });

      const result = await repository.getLearnerById('non-existent');

      expect(result).toBeNull();
    });

    it('should handle other database errors', async () => {
      mockClient.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST500', message: 'Internal error' }
      });

      await expect(repository.getLearnerById('user-123')).rejects.toThrow('Failed to get learner: Internal error');
    });
  });

  describe('getLearnersByCompany', () => {
    it('should get all learners for a company', async () => {
      const mockRecords = [
        {
          user_id: 'user-1',
          company_id: 'company-456',
          company_name: 'Test Company',
          user_name: 'User 1',
          created_at: '2025-01-01T00:00:00Z',
          last_modified_at: '2025-01-01T00:00:00Z'
        }
      ];

      mockClient.order.mockResolvedValue({ data: mockRecords, error: null });

      const result = await repository.getLearnersByCompany('company-456');

      expect(mockClient.from).toHaveBeenCalledWith('learners');
      expect(mockClient.eq).toHaveBeenCalledWith('company_id', 'company-456');
      expect(result).toHaveLength(1);
      expect(result[0].company_id).toBe('company-456');
    });
  });

  describe('updateLearner', () => {
    it('should update learner successfully', async () => {
      const updates = {
        user_name: 'Updated Name',
        company_name: 'Updated Company'
      };

      const mockRecord = {
        user_id: 'user-123',
        company_id: 'company-456',
        company_name: 'Updated Company',
        user_name: 'Updated Name',
        created_at: '2025-01-01T00:00:00Z',
        last_modified_at: '2025-01-02T00:00:00Z'
      };

      mockClient.single.mockResolvedValue({ data: mockRecord, error: null });

      const result = await repository.updateLearner('user-123', updates);

      expect(mockClient.from).toHaveBeenCalledWith('learners');
      expect(mockClient.update).toHaveBeenCalledWith({
        company_name: 'Updated Company',
        user_name: 'Updated Name'
      });
      expect(mockClient.eq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(result.user_name).toBe('Updated Name');
    });

    it('should only update provided fields', async () => {
      const updates = {
        user_name: 'Updated Name'
      };

      const mockRecord = {
        user_id: 'user-123',
        company_id: 'company-456',
        company_name: 'Original Company',
        user_name: 'Updated Name',
        created_at: '2025-01-01T00:00:00Z',
        last_modified_at: '2025-01-02T00:00:00Z'
      };

      mockClient.single.mockResolvedValue({ data: mockRecord, error: null });

      await repository.updateLearner('user-123', updates);

      expect(mockClient.update).toHaveBeenCalledWith({
        user_name: 'Updated Name'
      });
    });
  });

  describe('deleteLearner', () => {
    it('should delete learner successfully', async () => {
      mockClient.eq.mockResolvedValue({ error: null });

      const result = await repository.deleteLearner('user-123');

      expect(mockClient.from).toHaveBeenCalledWith('learners');
      expect(mockClient.delete).toHaveBeenCalled();
      expect(mockClient.eq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(result).toBe(true);
    });

    it('should handle deletion errors', async () => {
      mockClient.eq.mockResolvedValue({
        error: { message: 'Foreign key constraint violation' }
      });

      await expect(repository.deleteLearner('user-123')).rejects.toThrow('Failed to delete learner: Foreign key constraint violation');
    });
  });
});

