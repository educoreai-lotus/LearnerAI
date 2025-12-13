/**
 * ProcessSkillsGapUpdateUseCase
 * Handles skills gap updates from Skills Engine microservice
 * 
 * Flow:
 * 1. Check if company exists (MUST be done FIRST - learners FK to companies)
 * 2. If not exists: Create company with default policy
 * 3. Check if learner exists (MUST be done BEFORE skills gap - skills_gap FK to learners)
 * 4. If not exists: Create learner (company details from companies table)
 * 5. Check if skills_gap exists (user_id + competency_target_name)
 * 6. If exists: Update skills_raw_data (filter out skills not in new gap)
 * 7. If not exists: Create new skills_gap record
 */
export class ProcessSkillsGapUpdateUseCase {
  constructor({
    skillsGapRepository,
    learnerRepository,
    companyRepository // Use company repository instead of Directory client
  }) {
    this.skillsGapRepository = skillsGapRepository;
    this.learnerRepository = learnerRepository;
    this.companyRepository = companyRepository;
  }

  /**
   * Process skills gap update from Skills Engine
   * @param {Object} gapData - Data from Skills Engine
   * @param {string} gapData.user_id
   * @param {string} gapData.user_name
   * @param {string} gapData.company_id
   * @param {string} gapData.company_name
   * @param {string} gapData.competency_target_name - Primary field (competency_name also accepted for backward compatibility)
   * @param {string} gapData.status
   * @param {Object} gapData.gap - JSONB with list of skills at the lowest level in Skills Engine hierarchy
   * @returns {Promise<Object>} Updated skills gap
   */
  async execute(gapData) {
    const {
      user_id,
      user_name,
      company_id,
      company_name,
      competency_target_name, // Primary field
      competency_name, // Accepted for backward compatibility
      status,
      gap // JSONB with list of skills at the lowest level in Skills Engine hierarchy (saved directly to skills_raw_data)
    } = gapData;

    // Validate required fields
    const competencyTargetName = competency_target_name || competency_name;
    if (!user_id || !user_name || !company_id || !company_name || !competencyTargetName || !gap) {
      throw new Error('Missing required fields: user_id, user_name, company_id, company_name, competency_target_name, gap');
    }

    // Step 1: Check if company exists (MUST be done FIRST due to foreign key constraint)
    // Learners table has FK to companies, so company must exist before learner
    let existingCompany;
    try {
      existingCompany = await this.companyRepository.getCompanyById(company_id);
    } catch (error) {
      // If company lookup fails, log the error but try to create the company anyway
      console.error(`⚠️  Error checking company ${company_id}: ${error.message}`);
      // Continue - we'll try to create it if it doesn't exist
      existingCompany = null;
    }

    if (!existingCompany) {
      // Step 2: Create company if it doesn't exist
      // Use default decision_maker_policy if not provided
      // Use upsertCompany which will create if not exists, update if exists
      try {
        await this.companyRepository.upsertCompany({
          company_id,
          company_name,
          decision_maker_policy: 'auto', // Default policy
          decision_maker: null
        });

        console.log(`✅ Created new company: ${company_name} (${company_id})`);
      } catch (upsertError) {
        console.error(`❌ Failed to create company ${company_id}: ${upsertError.message}`);
        throw new Error(`Failed to create company: ${upsertError.message}`);
      }
    }

    // Step 3: Check if learner exists (MUST be done BEFORE skills gap due to FK constraint)
    const existingLearner = await this.learnerRepository.getLearnerById(user_id);

    if (!existingLearner) {
      // Step 4: Create new learner BEFORE creating skills gap
      // Company details (decision_maker_policy, decision_maker_id) are in companies table
      // We don't need to fetch them here - they're accessed via company_id when needed
      
      // Create learner (company details are in companies table, not learners table)
      await this.learnerRepository.createLearner({
        user_id,
        company_id,
        company_name,
        user_name
      });

      console.log(`✅ Created new learner: ${user_name} (${user_id})`);
    } else {
      // Learner exists - update if company_name or user_name changed
      if (existingLearner.company_name !== company_name || existingLearner.user_name !== user_name) {
        await this.learnerRepository.updateLearner(user_id, {
          company_name,
          user_name
        });
        console.log(`✅ Updated learner: ${user_name} (${user_id})`);
      }
    }

    // Step 5: Check if skills_gap exists (user_id + competency_target_name)
    // Now that learner exists, we can safely create/update skills gap
    const existingGap = await this.skillsGapRepository.getSkillsGapByUserAndCompetency(user_id, competencyTargetName);

    // Normalize gap format to ensure consistency (always use direct competency map format)
    console.log('🔄 Normalizing gap format...');
    console.log('   Input gap type:', typeof gap, Array.isArray(gap) ? 'array' : 'object');
    console.log('   Input gap keys:', Object.keys(gap || {}));
    const normalizedGap = this._normalizeGapFormat(gap);
    console.log('✅ Gap normalized');
    console.log('   Normalized gap type:', typeof normalizedGap, Array.isArray(normalizedGap) ? 'array' : 'object');
    console.log('   Normalized gap keys:', Object.keys(normalizedGap || {}));
    console.log('   Normalized gap sample:', JSON.stringify(normalizedGap).substring(0, 200));

    let skillsGap;

    if (existingGap) {
      // Step 6: Update existing skills_gap
      // Normalize existing gap format first, then filter to keep only skills that are in the new gap
      const normalizedExistingGap = this._normalizeGapFormat(existingGap.skills_raw_data);
      const filteredSkills = this._filterSkillsByNewGap(normalizedExistingGap, normalizedGap);

      skillsGap = await this.skillsGapRepository.updateSkillsGap(existingGap.gap_id, {
        skills_raw_data: filteredSkills,
        exam_status: status === 'pass' ? 'pass' : status === 'fail' ? 'fail' : null,
        company_name, // Update in case it changed
        user_name // Update in case it changed
      });

      console.log(`✅ Updated existing skills gap for user ${user_id}, competency ${competencyTargetName}`);
    } else {
      // Step 7: Create new skills_gap (learner now exists, so FK constraint will pass)
      skillsGap = await this.skillsGapRepository.createSkillsGap({
        user_id,
        company_id,
        company_name,
        user_name,
        competency_target_name: competencyTargetName,
        skills_raw_data: normalizedGap, // Use normalized format
        exam_status: status === 'pass' ? 'pass' : status === 'fail' ? 'fail' : null
      });

      console.log(`✅ Created new skills gap for user ${user_id}, competency ${competencyTargetName}`);
    }

    return skillsGap;
  }

  /**
   * Filter skills_raw_data to keep only skills that are in the new gap
   * Both existingSkillsRawData and newGap should be in normalized format (direct competency map)
   * @private
   */
  _filterSkillsByNewGap(existingSkillsRawData, newGap) {
    if (!existingSkillsRawData || !newGap) {
      return newGap; // If no existing data, use new gap as-is
    }

    // Both should be normalized (direct competency map format)
    // Extract all skill names from new gap (for comparison)
    const newSkillNames = new Set();
    for (const [competencyName, skills] of Object.entries(newGap)) {
      if (Array.isArray(skills)) {
        skills.forEach(skill => {
          const skillName = typeof skill === 'string' ? skill : (skill?.name || skill?.id || String(skill));
          if (skillName) newSkillNames.add(skillName);
        });
      }
    }

    // If no skills in new gap, return new gap as-is (replace everything)
    if (newSkillNames.size === 0) {
      return newGap;
    }

    // Filter existing skills to only keep those in new gap
    const filteredGap = {};
    for (const [competencyName, skills] of Object.entries(existingSkillsRawData)) {
      if (Array.isArray(skills)) {
        const filtered = skills.filter(skill => {
          const skillName = typeof skill === 'string' ? skill : (skill?.name || skill?.id || String(skill));
          return skillName && newSkillNames.has(skillName);
        });
        if (filtered.length > 0) {
          filteredGap[competencyName] = filtered;
        }
      }
    }

    // Merge with new gap (new gap takes precedence, but keep existing competencies that have matching skills)
    const mergedGap = { ...filteredGap, ...newGap };
    
    return mergedGap;
  }

  /**
   * Normalize gap format to ensure consistency
   * Converts all formats to the new direct competency map format
   * @param {Object} gap - Gap data in any format
   * @returns {Object} - Normalized gap in direct competency map format
   * @private
   */
  _normalizeGapFormat(gap) {
    if (!gap || typeof gap !== 'object') {
      return {};
    }

    // If already in new format (direct competency map), return as-is
    const isDirectCompetencyMap = !gap.missing_skills_map && 
                                  !gap.identifiedGaps && 
                                  !Array.isArray(gap) &&
                                  !gap.skills &&
                                  Object.values(gap).every(value => Array.isArray(value) || typeof value === 'string');
    
    if (isDirectCompetencyMap) {
      console.log('✅ Gap is already in normalized format (direct competency map)');
      return gap;
    }
    
    console.log('🔄 Gap needs normalization. Format check:', {
      hasMissingSkillsMap: !!gap.missing_skills_map,
      hasIdentifiedGaps: !!gap.identifiedGaps,
      isArray: Array.isArray(gap),
      hasSkills: !!gap.skills,
      allValuesAreArraysOrStrings: Object.values(gap).every(value => Array.isArray(value) || typeof value === 'string')
    });

    // Extract from missing_skills_map format
    if (gap.missing_skills_map && typeof gap.missing_skills_map === 'object') {
      return gap.missing_skills_map;
    }

    // Extract from identifiedGaps format (legacy)
    if (gap.identifiedGaps && Array.isArray(gap.identifiedGaps)) {
      const normalized = {};
      gap.identifiedGaps.forEach(gapItem => {
        // Try to extract competency name from gap item
        const competencyName = gapItem.competency_name || gapItem.name || 'Unknown_Competency';
        const skills = [];
        
        // Collect skills from legacy arrays
        if (gapItem.microSkills && Array.isArray(gapItem.microSkills)) {
          gapItem.microSkills.forEach(skill => {
            const skillName = typeof skill === 'string' ? skill : (skill?.name || skill?.id || String(skill));
            if (skillName) skills.push(skillName);
          });
        }
        if (gapItem.nanoSkills && Array.isArray(gapItem.nanoSkills)) {
          gapItem.nanoSkills.forEach(skill => {
            const skillName = typeof skill === 'string' ? skill : (skill?.name || skill?.id || String(skill));
            if (skillName) skills.push(skillName);
          });
        }
        
        if (skills.length > 0) {
          normalized[competencyName] = skills;
        }
      });
      return normalized;
    }

    // Handle flat skills array (very old format)
    if (Array.isArray(gap.skills)) {
      return {
        'Default_Competency': gap.skills
      };
    }

    // If we can't normalize, return empty object
    console.warn('⚠️ Could not normalize gap format, returning empty object');
    return {};
  }

  /**
   * Extract skill IDs from gap data structure
   * Handles both new format (competency map) and legacy format (skill arrays)
   * @private
   */
  _extractSkillIds(gapData) {
    const skillIds = [];
    if (!gapData || typeof gapData !== 'object') return skillIds;

    // NEW FORMAT: Extract from competency map (e.g., {"Competency_X": [skills]})
    const isDirectCompetencyMap = !gapData.missing_skills_map && 
                                  !gapData.identifiedGaps && 
                                  !Array.isArray(gapData) &&
                                  Object.values(gapData).every(value => Array.isArray(value) || typeof value === 'string');
    
    if (isDirectCompetencyMap) {
      for (const [competencyName, skills] of Object.entries(gapData)) {
        if (Array.isArray(skills)) {
          skills.forEach(skill => {
            const skillId = typeof skill === 'string' ? skill : (skill?.id || skill?.skill_id);
            if (skillId) skillIds.push(skillId);
          });
        }
      }
    }

    // NESTED FORMAT: Extract from missing_skills_map
    if (gapData.missing_skills_map) {
      for (const [competencyName, skills] of Object.entries(gapData.missing_skills_map)) {
        if (Array.isArray(skills)) {
          skills.forEach(skill => {
            const skillId = typeof skill === 'string' ? skill : (skill?.id || skill?.skill_id);
            if (skillId) skillIds.push(skillId);
          });
        }
      }
    }

    // LEGACY FORMAT: Extract from identifiedGaps with skill arrays (deprecated)
    if (gapData.identifiedGaps && Array.isArray(gapData.identifiedGaps)) {
      gapData.identifiedGaps.forEach(gap => {
        // Handle legacy skill arrays (deprecated)
        const legacySkillArrays = gap.microSkills || gap.nanoSkills || [];
        legacySkillArrays.forEach(skill => {
          if (skill && (skill.id || skill.skill_id)) {
            skillIds.push(skill.id || skill.skill_id);
          }
        });
      });
    }

    return skillIds;
  }
}

