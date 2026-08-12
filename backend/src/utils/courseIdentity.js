/**
 * Course identity helpers for Stage 1 (internal course_id / user+target).
 * Target-only lookup remains a documented LEGACY fallback while the DB PK
 * is still competency_target_name.
 */

const UUID_FORMAT = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * True when value looks like a UUID (course_id), not a competency target name.
 * @param {unknown} value
 * @returns {boolean}
 */
export function isCourseUuid(value) {
  return typeof value === 'string' && UUID_FORMAT.test(value.trim());
}

/**
 * Resolve a course using Stage 1 identity priority:
 * 1. real UUID course_id
 * 2. user_id + competency_target_name
 * 3. LEGACY target-only (current global PK — Stage 2/C4 cutover blocker)
 *
 * Never treats a non-UUID course_id as a competency target name.
 *
 * @param {Object} courseRepository
 * @param {{ courseId?: string|null, userId?: string|null, competencyTargetName?: string|null }} identity
 * @returns {Promise<Object|null>}
 */
export async function resolveCourse(courseRepository, identity = {}) {
  if (!courseRepository) {
    return null;
  }

  const courseId = identity.courseId || null;
  const userId = identity.userId || null;
  const competencyTargetName = identity.competencyTargetName || null;

  if (isCourseUuid(courseId) && typeof courseRepository.getCourseByCourseId === 'function') {
    return await courseRepository.getCourseByCourseId(courseId);
  }

  if (userId && competencyTargetName && typeof courseRepository.getCourseByUserAndTarget === 'function') {
    return await courseRepository.getCourseByUserAndTarget(userId, competencyTargetName);
  }

  // STAGE 1 LEGACY TARGET-ONLY FALLBACK — target is still globally unique.
  // MUST be removed/disabled at final DB cutover.
  if (competencyTargetName && typeof courseRepository.getCourseById === 'function') {
    return await courseRepository.getCourseById(competencyTargetName);
  }

  return null;
}

/**
 * Resolve the course for an approval row.
 * Prefers path_approvals.course_id; falls back to learning_path_id (target).
 *
 * @param {Object} courseRepository
 * @param {{ courseId?: string|null, learningPathId?: string|null }} approval
 * @returns {Promise<Object|null>}
 */
export async function resolveApprovalCourse(courseRepository, approval) {
  if (!courseRepository || !approval) {
    return null;
  }

  if (approval.courseId && typeof courseRepository.getCourseByCourseId === 'function') {
    const byId = await courseRepository.getCourseByCourseId(approval.courseId);
    if (byId) {
      return byId;
    }
  }

  // STAGE 1 LEGACY: approval rows with no course_id still use learning_path_id = target
  if (approval.learningPathId && typeof courseRepository.getCourseById === 'function') {
    return await courseRepository.getCourseById(approval.learningPathId);
  }

  return null;
}
