import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { CompanyRepository } from '../CompanyRepository.js';

// Mock Supabase client
const createMockSupabaseClient = () => {
  const mockClient = {
    from: jest.fn(function(table) {
      this._table = table;
      return this;
    }),
    upsert: jest.fn(function(data, options) {
      this._upsertData = data;
      this._upsertOptions = options;
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

describe('CompanyRepository', () => {
  let repository;
  let mockClient;

  beforeEach(() => {
    mockClient = createMockSupabaseClient();
    
    repository = new CompanyRepository('https://test.supabase.co', 'test-key');
    // Replace the actual Supabase client with our mock
    repository.client = mockClient;
  });

  describe('upsertCompany', () => {
    it('should create a new company', async () => {
      const companyData = {
        company_id: 'company-123',
        company_name: 'Test Company',
        decision_maker_policy: 'auto',
        decision_maker: null
      };

      const mockRecord = {
        company_id: 'company-123',
        company_name: 'Test Company',
        approval_policy: 'auto',
        decision_maker: null,
        created_at: '2025-01-01T00:00:00Z',
        last_modified_at: '2025-01-01T00:00:00Z'
      };

      mockClient.single.mockResolvedValue({ data: mockRecord, error: null });

      const result = await repository.upsertCompany(companyData);

      expect(mockClient.from).toHaveBeenCalledWith('companies');
      expect(mockClient.upsert).toHaveBeenCalledWith(
        {
          company_id: 'company-123',
          company_name: 'Test Company',
          decision_maker_policy: 'auto',
          decision_maker: null
        },
        { onConflict: 'company_id' }
      );
      expect(result.company_id).toBe('company-123');
    });

    it('should support approval_policy as alternative to decision_maker_policy', async () => {
      const companyData = {
        company_id: 'company-123',
        company_name: 'Test Company',
        approval_policy: 'manual',
        decision_maker: {
          employee_id: 'emp-123',
          employee_name: 'John Doe',
          employee_email: 'john@example.com'
        }
      };

      const mockRecord = {
        company_id: 'company-123',
        company_name: 'Test Company',
        approval_policy: 'manual',
        decision_maker: companyData.decision_maker,
        created_at: '2025-01-01T00:00:00Z',
        last_modified_at: '2025-01-01T00:00:00Z'
      };

      mockClient.single.mockResolvedValue({ data: mockRecord, error: null });

      await repository.upsertCompany(companyData);

      expect(mockClient.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          decision_maker_policy: 'manual'
        }),
        { onConflict: 'company_id' }
      );
    });

    it('should update existing company on conflict', async () => {
      const companyData = {
        company_id: 'company-123',
        company_name: 'Updated Company Name',
        decision_maker_policy: 'auto'
      };

      const mockRecord = {
        company_id: 'company-123',
        company_name: 'Updated Company Name',
        approval_policy: 'auto',
        decision_maker: null,
        created_at: '2025-01-01T00:00:00Z',
        last_modified_at: '2025-01-02T00:00:00Z'
      };

      mockClient.single.mockResolvedValue({ data: mockRecord, error: null });

      const result = await repository.upsertCompany(companyData);

      expect(result.company_name).toBe('Updated Company Name');
    });
  });

  describe('getCompanyById', () => {
    it('should get company by company_id', async () => {
      const mockRecord = {
        company_id: 'company-123',
        company_name: 'Test Company',
        approval_policy: 'auto',
        decision_maker: null,
        created_at: '2025-01-01T00:00:00Z',
        last_modified_at: '2025-01-01T00:00:00Z'
      };

      mockClient.single.mockResolvedValue({ data: mockRecord, error: null });

      const result = await repository.getCompanyById('company-123');

      expect(mockClient.from).toHaveBeenCalledWith('companies');
      expect(mockClient.eq).toHaveBeenCalledWith('company_id', 'company-123');
      expect(result.company_id).toBe('company-123');
    });

    it('should return null if company not found', async () => {
      mockClient.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' }
      });

      const result = await repository.getCompanyById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getAllCompanies', () => {
    it('should get all companies', async () => {
      const mockRecords = [
        {
          company_id: 'company-1',
          company_name: 'Company 1',
          approval_policy: 'auto',
          decision_maker: null
        },
        {
          company_id: 'company-2',
          company_name: 'Company 2',
          approval_policy: 'manual',
          decision_maker: { employee_id: 'emp-1', employee_name: 'John', employee_email: 'john@example.com' }
        }
      ];

      mockClient.order.mockResolvedValue({ data: mockRecords, error: null });

      const result = await repository.getAllCompanies();

      expect(result).toHaveLength(2);
      expect(mockClient.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });
  });

  describe('updateCompany', () => {
    it('should update company fields', async () => {
      const updates = {
        company_name: 'Updated Name',
        approval_policy: 'manual'
      };

      const mockRecord = {
        company_id: 'company-123',
        company_name: 'Updated Name',
        approval_policy: 'manual',
        decision_maker: null,
        created_at: '2025-01-01T00:00:00Z',
        last_modified_at: '2025-01-02T00:00:00Z'
      };

      mockClient.single.mockResolvedValue({ data: mockRecord, error: null });

      const result = await repository.updateCompany('company-123', updates);

      expect(mockClient.update).toHaveBeenCalledWith({
        company_name: 'Updated Name',
        approval_policy: 'manual'
      });
      expect(result.company_name).toBe('Updated Name');
    });

    it('should update decision_maker', async () => {
      const updates = {
        decision_maker: {
          employee_id: 'emp-123',
          employee_name: 'Jane Doe',
          employee_email: 'jane@example.com'
        }
      };

      const mockRecord = {
        company_id: 'company-123',
        company_name: 'Test Company',
        approval_policy: 'auto',
        decision_maker: updates.decision_maker,
        created_at: '2025-01-01T00:00:00Z',
        last_modified_at: '2025-01-02T00:00:00Z'
      };

      mockClient.single.mockResolvedValue({ data: mockRecord, error: null });

      const result = await repository.updateCompany('company-123', updates);

      expect(result.decision_maker).toEqual(updates.decision_maker);
    });
  });

  describe('deleteCompany', () => {
    it('should delete company successfully', async () => {
      mockClient.eq.mockResolvedValue({ error: null });

      const result = await repository.deleteCompany('company-123');

      expect(mockClient.from).toHaveBeenCalledWith('companies');
      expect(mockClient.delete).toHaveBeenCalled();
      expect(mockClient.eq).toHaveBeenCalledWith('company_id', 'company-123');
      expect(result).toBe(true);
    });

    it('should handle deletion errors', async () => {
      mockClient.eq.mockResolvedValue({
        error: { message: 'Foreign key constraint violation' }
      });

      await expect(repository.deleteCompany('company-123')).rejects.toThrow('Failed to delete company: Foreign key constraint violation');
    });
  });
});

