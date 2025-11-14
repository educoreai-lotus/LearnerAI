/**
 * SkillsGap Domain Entity
 * Represents a skills gap identified for a learner
 */
export class SkillsGap {
  constructor({
    userId,
    companyId,
    competencyTargetName,
    courseId, // Legacy support
    microSkills = [],
    nanoSkills = [],
    receivedAt
  }) {
    this.userId = userId;
    this.companyId = companyId;
    this.competencyTargetName = competencyTargetName || courseId;
    this.courseId = competencyTargetName || courseId; // Legacy support
    this.microSkills = microSkills; // Array of micro skill objects
    this.nanoSkills = nanoSkills; // Array of nano skill objects
    this.receivedAt = receivedAt || new Date().toISOString();
  }

  /**
   * Check if gap has any skills
   */
  hasSkills() {
    return this.microSkills.length > 0 || this.nanoSkills.length > 0;
  }

  /**
   * Get all skill IDs
   */
  getAllSkillIds() {
    const microIds = this.microSkills.map(s => s.id).filter(Boolean);
    const nanoIds = this.nanoSkills.map(s => s.id).filter(Boolean);
    return [...microIds, ...nanoIds];
  }

  /**
   * Convert to plain object
   */
  toJSON() {
    return {
      userId: this.userId,
      companyId: this.companyId,
      competencyTargetName: this.competencyTargetName,
      courseId: this.courseId, // Legacy support
      microSkills: this.microSkills,
      nanoSkills: this.nanoSkills,
      receivedAt: this.receivedAt
    };
  }
}

