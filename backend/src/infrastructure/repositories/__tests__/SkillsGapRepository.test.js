import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { SkillsGapRepository } from '../SkillsGapRepository.js';

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
      return this;
    }),
    update: jest.fn(function(data) {
      this._updateData = data;
      return this;
    }),
    delete: jest.fn(function() {
      return this;
    }),
    order: jest.fn(function(column, options) {
      return this;
    }),
    limit: jest.fn(function(count) {
      return this;
    })
  };
  return mockClient;
};

describe('SkillsGapRepository', () => {
  let repository;
  let mockClient;

  beforeEach(() => {
    mockClient = createMockSupabaseClient();
    
    repository = new SkillsGapRepository('https://test.supabase.co', 'test-key');
    // Replace the actual Supabase client with our mock
    repository.client = mockClient;
  });

  describe('constructor', () => {
    it('should throw error if credentials are missing', () => {
      expect(() => new SkillsGapRepository(null, 'key')).toThrow('Supabase URL and key are required');
      expect(() => new SkillsGapRepository('url', null)).toThrow('Supabase URL and key are required');
    });
  });

  describe('createSkillsGap', () => {
    it('should create a skills gap successfully', async () => {
      const gapData = {
        user_id: 'user-123',
        company_id: 'company-456',
        company_name: 'Test Company',
        user_name: 'John Doe',
        skills_raw_data: {
          'Competency_JavaScript': ['MGS_Skill_1', 'MGS_Skill_2']
        },
        exam_status: 'FAIL',
        competency_target_name: 'JavaScript ES6+ Syntax'
      };

      const mockRecord = {
        gap_id: 'gap-123',
        user_id: 'user-123',
        company_id: 'company-456',
        company_name: 'Test Company',
        user_name: 'John Doe',
        skills_raw_data: gapData.skills_raw_data,
        exam_status: 'FAIL',
        competency_target_name: 'JavaScript ES6+ Syntax',
        created_at: '2025-01-01T00:00:00Z',
        last_modified_at: '2025-01-01T00:00:00Z'
      };

      mockClient.single.mockResolvedValue({ data: mockRecord, error: null });

      const result = await repository.createSkillsGap(gapData);

      expect(mockClient.from).toHaveBeenCalledWith('skills_gap');
      expect(mockClient.insert).toHaveBeenCalledWith({
        gap_id: undefined,
        user_id: 'user-123',
        company_id: 'company-456',
        company_name: 'Test Company',
        user_name: 'John Doe',
        skills_raw_data: gapData.skills_raw_data,
        exam_status: 'FAIL',
        competency_target_name: 'JavaScript ES6+ Syntax'
      });
      expect(result.gap_id).toBe('gap-123');
      expect(result.exam_status).toBe('FAIL');
    });

    it('should handle missing_skills_map structure', async () => {
      const gapData = {
        user_id: 'user-123',
        company_id: 'company-456',
        company_name: 'Test Company',
        user_name: 'John Doe',
        skills_raw_data: {
          'Competency_Front_End_Development': [
            'MGS_React_Hooks_Advanced',
            'MGS_Flexbox_Grid_System',
            'MGS_Async_Await_Handling'
          ]
        },
        exam_status: 'FAIL',
        competency_target_name: 'Frontend Development'
      };

      const mockRecord = {
        gap_id: 'gap-123',
        ...gapData,
        created_at: '2025-01-01T00:00:00Z',
        last_modified_at: '2025-01-01T00:00:00Z'
      };

      mockClient.single.mockResolvedValue({ data: mockRecord, error: null });

      const result = await repository.createSkillsGap(gapData);

      expect(result.skills_raw_data).toEqual(gapData.skills_raw_data);
      expect(result.skills_raw_data['Competency_Front_End_Development']).toHaveLength(3);
    });

    it('should handle optional fields', async () => {
      const gapData = {
        user_id: 'user-123',
        company_id: 'company-456',
        company_name: 'Test Company',
        user_name: 'John Doe',
        skills_raw_data: {}
      };

      const mockRecord = {
        gap_id: 'gap-123',
        user_id: 'user-123',
        company_id: 'company-456',
        company_name: 'Test Company',
        user_name: 'John Doe',
        skills_raw_data: {},
        exam_status: null,
        competency_target_name: null,
        created_at: '2025-01-01T00:00:00Z',
        last_modified_at: '2025-01-01T00:00:00Z'
      };

      mockClient.single.mockResolvedValue({ data: mockRecord, error: null });

      const result = await repository.createSkillsGap(gapData);

      // The mapping returns null if exam_status doesn't exist
      // So we check for null or undefined
      expect(result.exam_status === null || result.exam_status === undefined).toBe(true);
      expect(result.competency_target_name === null || result.competency_target_name === undefined).toBe(true);
    });
  });

  describe('getSkillsGapByUserAndCompetency', () => {
    it('should get skills gap by user_id and competency_target_name', async () => {
      const mockRecord = {
        gap_id: 'gap-123',
        user_id: 'user-123',
        company_id: 'company-456',
        company_name: 'Test Company',
        user_name: 'John Doe',
        skills_raw_data: {
          'Competency_JavaScript': ['MGS_Skill_1']
        },
        exam_status: 'FAIL',
        competency_target_name: 'JavaScript ES6+ Syntax',
        created_at: '2025-01-01T00:00:00Z',
        last_modified_at: '2025-01-01T00:00:00Z'
      };

      // Mock the chain: from -> select -> eq -> eq -> order -> limit -> single
      mockClient.limit.mockReturnValue(mockClient);
      mockClient.single.mockResolvedValue({ data: mockRecord, error: null });

      const result = await repository.getSkillsGapByUserAndCompetency('user-123', 'JavaScript ES6+ Syntax');

      expect(mockClient.from).toHaveBeenCalledWith('skills_gap');
      expect(mockClient.eq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(mockClient.eq).toHaveBeenCalledWith('competency_target_name', 'JavaScript ES6+ Syntax');
      expect(mockClient.limit).toHaveBeenCalledWith(1);
      expect(result).toBeDefined();
      expect(result.competency_target_name).toBe('JavaScript ES6+ Syntax');
    });

    it('should return null if not found', async () => {
      // Mock the chain: from -> select -> eq -> eq -> order -> limit -> single
      mockClient.limit.mockReturnValue(mockClient);
      mockClient.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' }
      });

      const result = await repository.getSkillsGapByUserAndCompetency('user-123', 'NonExistent');

      expect(result).toBeNull();
    });
  });

  describe('updateSkillsGap', () => {
    it('should update skills_raw_data and delete missing skills', async () => {
      const existingGap = {
        gap_id: 'gap-123',
        user_id: 'user-123',
        skills_raw_data: {
          'Competency_JavaScript': ['MGS_Skill_1', 'MGS_Skill_2', 'MGS_Skill_3'],
          'Competency_React': ['MGS_React_1']
        }
      };

      const newSkillsData = {
        'Competency_JavaScript': ['MGS_Skill_1', 'MGS_Skill_4'], // Skill_2 and Skill_3 removed, Skill_4 added
        'Competency_React': ['MGS_React_1'] // Unchanged
      };

      const updatedRecord = {
        ...existingGap,
        skills_raw_data: newSkillsData,
        last_modified_at: '2025-01-02T00:00:00Z'
      };

      mockClient.single.mockResolvedValue({ data: updatedRecord, error: null });

      const result = await repository.updateSkillsGap('gap-123', {
        skills_raw_data: newSkillsData
      });

      expect(mockClient.from).toHaveBeenCalledWith('skills_gap');
      expect(mockClient.update).toHaveBeenCalledWith({
        skills_raw_data: newSkillsData
      });
      expect(result.skills_raw_data).toEqual(newSkillsData);
      expect(result.skills_raw_data['Competency_JavaScript']).not.toContain('MGS_Skill_2');
      expect(result.skills_raw_data['Competency_JavaScript']).toContain('MGS_Skill_4');
    });

    it('should update exam_status', async () => {
      const updatedRecord = {
        gap_id: 'gap-123',
        user_id: 'user-123',
        exam_status: 'PASS',
        last_modified_at: '2025-01-02T00:00:00Z'
      };

      mockClient.single.mockResolvedValue({ data: updatedRecord, error: null });

      const result = await repository.updateSkillsGap('gap-123', {
        exam_status: 'PASS'
      });

      expect(result.exam_status).toBe('PASS');
    });
  });

  describe('getAllSkillsGaps', () => {
    it('should get all skills gaps', async () => {
      const mockRecords = [
        {
          gap_id: 'gap-1',
          user_id: 'user-1',
          exam_status: 'FAIL',
          skills_raw_data: {}
        },
        {
          gap_id: 'gap-2',
          user_id: 'user-2',
          exam_status: 'PASS',
          skills_raw_data: {}
        }
      ];

      mockClient.order.mockResolvedValue({ data: mockRecords, error: null });

      const result = await repository.getAllSkillsGaps();

      expect(result).toHaveLength(2);
      expect(mockClient.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });
  });

  describe('getSkillsGapsByUser', () => {
    it('should get all skills gaps for a user', async () => {
      const mockRecords = [
        {
          gap_id: 'gap-1',
          user_id: 'user-123',
          competency_target_name: 'JavaScript',
          exam_status: 'FAIL'
        },
        {
          gap_id: 'gap-2',
          user_id: 'user-123',
          competency_target_name: 'React',
          exam_status: 'PASS'
        }
      ];

      mockClient.order.mockResolvedValue({ data: mockRecords, error: null });

      const result = await repository.getSkillsGapsByUser('user-123');

      expect(mockClient.eq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(result).toHaveLength(2);
      expect(result.every(gap => gap.user_id === 'user-123')).toBe(true);
    });
  });
});

