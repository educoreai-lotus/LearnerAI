/**
 * Competency Domain Entity
 * Represents a competency identified through AI expansion
 */
export class Competency {
  constructor({
    id,
    name,
    description,
    category,
    microSkills = [],
    nanoSkills = [],
    source = 'ai-expansion'
  }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.category = category;
    this.microSkills = microSkills;
    this.nanoSkills = nanoSkills;
    this.source = source; // 'ai-expansion', 'initial-gap', etc.
  }

  /**
   * Check if competency has skill breakdown
   */
  hasSkillBreakdown() {
    return this.microSkills.length > 0 || this.nanoSkills.length > 0;
  }

  /**
   * Convert to plain object
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      category: this.category,
      microSkills: this.microSkills,
      nanoSkills: this.nanoSkills,
      source: this.source
    };
  }
}

