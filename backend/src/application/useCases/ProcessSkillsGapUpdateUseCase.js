/**
 * ProcessSkillsGapUpdateUseCase
 * Handles skills gap updates from Skills Engine microservice
 * 
 * Flow:
 * 1. Check if skills_gap exists (user_id + competency_target_name)
 * 2. If exists: Update skills_raw_data (filter out skills not in new gap)
 * 3. If not exists: Create new skills_gap record
 * 4. Check if learner exists
 * 5. If not exists: Create learner (company details from companies table)
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
   * @param {string} gapData.competency_name - Maps to competency_target_name in database
   * @param {string} gapData.status
   * @param {Object} gapData.gap - JSONB with micro/nano skills (lowest layer of skills gap hierarchy)
   * @returns {Promise<Object>} Updated skills gap
   */
  async execute(gapData) {
    const {
      user_id,
      user_name,
      company_id,
      company_name,
      competency_name, // Maps to competency_target_name in skills_gap table
      status,
      gap // JSONB with micro/nano skills (lowest layer - saved directly to skills_raw_data)
    } = gapData;

    // Validate required fields
    if (!user_id || !user_name || !company_id || !company_name || !competency_name || !gap) {
      throw new Error('Missing required fields: user_id, user_name, company_id, company_name, competency_name, gap');
    }

    // Step 1: Check if skills_gap exists (user_id + competency_target_name)
    const existingGap = await this.skillsGapRepository.getSkillsGapByUserAndCompetency(user_id, competency_name);

    let skillsGap;

    if (existingGap) {
      // Step 2: Update existing skills_gap
      // Filter skills_raw_data: keep only skills that are in the new gap
      const filteredSkills = this._filterSkillsByNewGap(existingGap.skills_raw_data, gap);

      skillsGap = await this.skillsGapRepository.updateSkillsGap(existingGap.gap_id, {
        skills_raw_data: filteredSkills,
        exam_status: status === 'pass' ? 'pass' : status === 'fail' ? 'fail' : null,
        company_name, // Update in case it changed
        user_name // Update in case it changed
      });

      console.log(`✅ Updated existing skills gap for user ${user_id}, competency ${competency_name}`);
    } else {
      // Step 3: Create new skills_gap
      skillsGap = await this.skillsGapRepository.createSkillsGap({
        user_id,
        company_id,
        company_name,
        user_name,
        competency_target_name: competency_name, // Map competency_name to competency_target_name
        skills_raw_data: gap,
        exam_status: status === 'pass' ? 'pass' : status === 'fail' ? 'fail' : null
      });

      console.log(`✅ Created new skills gap for user ${user_id}, competency ${competency_name}`);
    }

    // Step 4: Check if learner exists
    const existingLearner = await this.learnerRepository.getLearnerById(user_id);

    if (!existingLearner) {
      // Step 5: Create new learner
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

    return skillsGap;
  }

  /**
   * Filter skills_raw_data to keep only skills that are in the new gap
   * Removes micro/nano skills that are NOT in the new gap
   * @private
   */
  _filterSkillsByNewGap(existingSkillsRawData, newGap) {
    if (!existingSkillsRawData || !newGap) {
      return newGap; // If no existing data, use new gap as-is
    }

    // Extract skill IDs from new gap
    const newSkillIds = this._extractSkillIds(newGap);

    // If no skill IDs in new gap, return new gap as-is (replace everything)
    if (newSkillIds.length === 0) {
      return newGap;
    }

    // Filter existing skills_raw_data structure
    if (!existingSkillsRawData.identifiedGaps) {
      return newGap; // If existing data has no identifiedGaps, use new gap
    }

    // Filter each gap in existing identifiedGaps - keep only skills that ARE in new gap
    const filteredGaps = existingSkillsRawData.identifiedGaps.map(gap => {
      const filteredMicro = gap.microSkills?.filter(skill => {
        const skillId = skill.id || skill.skill_id;
        return skillId && newSkillIds.includes(skillId);
      }) || [];

      const filteredNano = gap.nanoSkills?.filter(skill => {
        const skillId = skill.id || skill.skill_id;
        return skillId && newSkillIds.includes(skillId);
      }) || [];

      // Only keep gap if it has skills after filtering
      if (filteredMicro.length > 0 || filteredNano.length > 0) {
        return {
          ...gap,
          microSkills: filteredMicro,
          nanoSkills: filteredNano
        };
      }
      return null;
    }).filter(gap => gap !== null); // Remove null gaps

    // Return filtered existing gaps + new gap data
    // The new gap will have the latest structure, filtered existing keeps only matching skills
    return {
      ...newGap,
      identifiedGaps: [
        ...filteredGaps, // Existing gaps with only skills that match new gap
        ...(newGap.identifiedGaps || []) // New gap data
      ]
    };
  }

  /**
   * Extract skill IDs from gap data structure
   * @private
   */
  _extractSkillIds(gapData) {
    const skillIds = [];
    if (!gapData || typeof gapData !== 'object') return skillIds;

    if (gapData.identifiedGaps && Array.isArray(gapData.identifiedGaps)) {
      gapData.identifiedGaps.forEach(gap => {
        if (gap.microSkills && Array.isArray(gap.microSkills)) {
          gap.microSkills.forEach(skill => {
            if (skill && (skill.id || skill.skill_id)) {
              skillIds.push(skill.id || skill.skill_id);
            }
          });
        }
        if (gap.nanoSkills && Array.isArray(gap.nanoSkills)) {
          gap.nanoSkills.forEach(skill => {
            if (skill && (skill.id || skill.skill_id)) {
              skillIds.push(skill.id || skill.skill_id);
            }
          });
        }
      });
    }

    return skillIds;
  }
}

