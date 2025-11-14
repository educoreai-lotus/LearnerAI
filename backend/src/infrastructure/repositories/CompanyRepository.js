import { createClient } from '@supabase/supabase-js';

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
    const { data, error } = await this.client
      .from('companies')
      .select('*')
      .eq('company_id', companyId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to get company: ${error.message}`);
    }

    return this._mapToCompany(data);
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
   * Map database record to company object
   */
  _mapToCompany(record) {
    return {
      company_id: record.company_id,
      company_name: record.company_name,
      approval_policy: record.approval_policy,
      decision_maker: record.decision_maker,
      created_at: record.created_at,
      last_modified_at: record.last_modified_at
    };
  }
}

