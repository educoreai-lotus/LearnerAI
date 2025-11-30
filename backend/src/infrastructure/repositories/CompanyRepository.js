import { createClient } from '@supabase/supabase-js';
import { Company } from '../../domain/entities/Company.js';

/**
 * CompanyRepository
 * Handles all database operations for companies table
 * Stores company data received from Directory microservice
 */
export class CompanyRepository {
  constructor(supabaseUrl, supabaseKey) {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and key are required');
    }
    this.client = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Create or update a company (upsert)
   * @param {Object} companyData
   * @returns {Promise<Object>}
   */
  async upsertCompany(companyData) {
    const { data, error } = await this.client
      .from('companies')
      .upsert({
        company_id: companyData.company_id,
        company_name: companyData.company_name,
        decision_maker_policy: companyData.decision_maker_policy || companyData.approval_policy, // Support both
        decision_maker: companyData.decision_maker || null
      }, {
        onConflict: 'company_id'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to upsert company: ${error.message}`);
    }

    return this._mapToCompany(data);
  }

  /**
   * Get company by company_id
   * @param {string} companyId
   * @returns {Promise<Object|null>}
   */
  async getCompanyById(companyId) {
    if (!companyId) {
      throw new Error('Company ID is required');
    }

    try {
      const { data, error } = await this.client
        .from('companies')
        .select('*')
        .eq('company_id', companyId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found - this is expected for new companies
        }
        // Log full error details for debugging
        console.error(`[CompanyRepository] Error getting company ${companyId}:`, {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw new Error(`Failed to get company: ${error.message || 'Internal server error'}`);
      }

      return this._mapToCompany(data);
    } catch (err) {
      // If it's already our formatted error, re-throw it
      if (err.message && err.message.startsWith('Failed to get company:')) {
        throw err;
      }
      // Otherwise, wrap it
      throw new Error(`Failed to get company: ${err.message || 'Internal server error'}`);
    }
  }

  /**
   * Get all companies
   * @returns {Promise<Array<Object>>}
   */
  async getAllCompanies() {
    const { data, error } = await this.client
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get companies: ${error.message}`);
    }

    return data.map(item => this._mapToCompany(item));
  }

  /**
   * Update company
   * @param {string} companyId
   * @param {Object} updates
   * @returns {Promise<Object>}
   */
  async updateCompany(companyId, updates) {
    const updateData = {};
    if (updates.company_name !== undefined) updateData.company_name = updates.company_name;
    if (updates.approval_policy !== undefined) updateData.approval_policy = updates.approval_policy;
    if (updates.decision_maker !== undefined) updateData.decision_maker = updates.decision_maker;

    const { data, error } = await this.client
      .from('companies')
      .update(updateData)
      .eq('company_id', companyId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update company: ${error.message}`);
    }

    return this._mapToCompany(data);
  }

  /**
   * Delete company
   * @param {string} companyId
   * @returns {Promise<boolean>}
   */
  async deleteCompany(companyId) {
    const { error } = await this.client
      .from('companies')
      .delete()
      .eq('company_id', companyId);

    if (error) {
      throw new Error(`Failed to delete company: ${error.message}`);
    }

    return true;
  }

  /**
   * Map database record to Company entity
   */
  _mapToCompany(record) {
    // Map database column names to Company entity properties
    // Database: decision_maker_policy -> Entity: approvalPolicy
    return new Company({
      companyId: record.company_id,
      companyName: record.company_name,
      approvalPolicy: record.decision_maker_policy || record.approval_policy || 'auto',
      decisionMaker: record.decision_maker,
      createdAt: record.created_at,
      updatedAt: record.last_modified_at
    });
  }
}

