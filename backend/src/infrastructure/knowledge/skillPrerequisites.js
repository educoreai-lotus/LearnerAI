/**
 * Skill Difficulty Inference (Pattern-Based)
 * 
 * ⚠️ IMPORTANT: This file does NOT contain hardcoded skills.
 * Skills come dynamically from Skills Engine and can be for ANY domain
 * (C++, Python, JavaScript, React, GraphQL, TypeScript, etc.).
 * 
 * This file provides:
 * 1. Pattern-based difficulty inference (works for any skill name)
 * 2. General difficulty scoring heuristics
 * 
 * NOTE: Prerequisite validation is NOT done here because:
 * - Skills come dynamically from Skills Engine
 * - We don't know prerequisites without Skills Engine data
 * - Prerequisite validation should come from Skills Engine or Prompt 3 instructions
 * 
 * USAGE:
 * - Provides difficulty scoring for module progression validation
 * - Works for any skill name using pattern matching
 * - No domain-specific hardcoding
 */

// Empty - no hardcoded skills. All inference is pattern-based.
export const SKILL_PREREQUISITES = {};

/**
 * Get difficulty score for a skill (pattern-based only)
 * @param {string} skill - Skill name
 * @returns {number} - Difficulty score (1=foundational, 2=intermediate, 3=advanced)
 */
export function getDifficultyScore(skill) {
  // No hardcoded skills - use pattern matching
  return inferDifficultyFromName(skill);
}

/**
 * Get prerequisites for a skill
 * NOTE: Returns empty array - prerequisites should come from Skills Engine
 * @param {string} skill - Skill name
 * @returns {string[]} - Always returns empty array (no hardcoded prerequisites)
 */
export function getPrerequisites(skill) {
  // No hardcoded prerequisites - should come from Skills Engine
  return [];
}

/**
 * Check if skill order violates prerequisites
 * NOTE: This function does NOT validate prerequisites because:
 * - Skills come dynamically from Skills Engine
 * - We don't have prerequisite data without Skills Engine
 * - Prerequisite validation should be done by Prompt 3 instructions
 * 
 * @param {string[]} skills - Array of skills in order
 * @returns {string[]} - Always returns empty array (no validation without Skills Engine data)
 */
export function validatePrerequisiteOrder(skills) {
  // No prerequisite validation - should come from Skills Engine or Prompt 3
  // This function exists for API compatibility but doesn't validate
  return [];
}

/**
 * Infer difficulty from skill name (pattern matching)
 * Works for ANY domain/language using general patterns
 * 
 * @param {string} skill - Skill name
 * @returns {number} - Difficulty score (1=foundational, 2=intermediate, 3=advanced)
 */
export function inferDifficultyFromName(skill) {
  const skillLower = skill.toLowerCase();
  
  // Foundational patterns (works for any language/domain)
  if (skillLower.includes('basic') || 
      skillLower.includes('introduction') || 
      skillLower.includes('intro') ||
      skillLower.includes('fundamentals') ||
      skillLower.includes('getting started') ||
      skillLower.includes('variables') ||
      skillLower.includes('data types') ||
      skillLower.includes('syntax') ||
      skillLower.includes('hello world') ||
      skillLower.includes('first steps')) {
    return 1;
  }
  
  // Advanced patterns (works for any language/domain)
  if (skillLower.includes('advanced') ||
      skillLower.includes('expert') ||
      skillLower.includes('master') ||
      skillLower.includes('optimization') ||
      skillLower.includes('performance') ||
      skillLower.includes('memory management') ||
      skillLower.includes('concurrency') ||
      skillLower.includes('multithreading') ||
      skillLower.includes('design patterns') ||
      skillLower.includes('architecture') ||
      skillLower.includes('enterprise') ||
      skillLower.includes('scalability') ||
      skillLower.includes('polymorphism') ||
      skillLower.includes('inheritance') ||
      skillLower.includes('templates') ||
      skillLower.includes('generics') ||
      skillLower.includes('metaprogramming')) {
    return 3;
  }
  
  // Default to intermediate
  return 2;
}

/**
 * Get difficulty score for a skill (with fallback)
 * @param {string} skill - Skill name
 * @returns {number} - Difficulty score (1=foundational, 2=intermediate, 3=advanced)
 */
export function getDifficultyScoreWithFallback(skill) {
  // First try knowledge base
  const score = getDifficultyScore(skill);
  if (score !== 2 || skillExists(skill)) {
    return score; // Return if found in KB or if default was intentional
  }
  
  // Fallback to pattern matching
  return inferDifficultyFromName(skill);
}

/**
 * Calculate average difficulty for a set of skills
 * @param {string[]} skills - Array of skill names
 * @returns {number} - Average difficulty score
 */
export function calculateAverageDifficulty(skills) {
  if (skills.length === 0) return 0;
  
  const totalScore = skills.reduce((sum, skill) => sum + getDifficultyScore(skill), 0);
  return totalScore / skills.length;
}

/**
 * Check if a skill exists in the knowledge base
 * NOTE: Always returns false - no hardcoded skills
 * @param {string} skill - Skill name
 * @returns {boolean} - Always returns false (no hardcoded skills)
 */
export function skillExists(skill) {
  // No hardcoded skills - all skills come from Skills Engine
  return false;
}

