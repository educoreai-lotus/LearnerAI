/**
 * SkillsGap Domain Entity
 * Represents a skills gap identified for a learner
 * 
 * Note: Skills are stored as an array of skill names (strings) at the lowest layer.
 * The actual gap data structure in the database may be a competency map:
 * { "Competency_Name": ["Skill Name 1", "Skill Name 2", ...] }
 */
export class SkillsGap {
  constructor({
    userId,
    companyId,
    competencyTargetName,
    skills = [], // Array of skill names (strings) at the lowest layer
    receivedAt
  }) {
    this.userId = userId;
    this.companyId = companyId;
    this.competencyTargetName = competencyTargetName;
    this.skills = skills; // Array of skill names (strings) - no IDs, no micro/nano separation
    this.receivedAt = receivedAt || new Date().toISOString();
  }

  /**
   * Check if gap has any skills
   */
  hasSkills() {
    return Array.isArray(this.skills) && this.skills.length > 0;
  }

  /**
   * Get all skill names
   */
  getAllSkillNames() {
    return Array.isArray(this.skills) ? [...this.skills] : [];
  }

  /**
   * Convert to plain object
   */
  toJSON() {
    return {
      userId: this.userId,
      companyId: this.companyId,
      competencyTargetName: this.competencyTargetName,
      skills: this.skills,
      receivedAt: this.receivedAt
    };
  }
}

