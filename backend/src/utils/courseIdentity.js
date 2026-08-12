/**
 * Course identity helpers.
 * Unique course identity is course_id, or user_id + competency_target_name.
 * Target-only lookup is legacy and must refuse ambiguity.
 */

const UUID_FORMAT = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const AMBIGUOUS_COURSE_TARGET = 'AMBIGUOUS_COURSE_TARGET';

/**
 * True when value looks like a UUID (course_id), not a competency target name.
 * @param {unknown} value
 * @returns {boolean}
 */
export function isCourseUuid(value) {
  return typeof value === 'string' && UUID_FORMAT.test(value.trim());
}

/**
 * @param {string} target
 * @returns {Error}
 */
export function ambiguousCourseTargetError(target) {
  const error = new Error(
    `${AMBIGUOUS_COURSE_TARGET}: competency target "${target}" matches more than one course. Provide user_id or course_id.`
  );
  error.code = AMBIGUOUS_COURSE_TARGET;
  return error;
}

/**
 * @param {unknown} error
 * @returns {boolean}
 */
export function isAmbiguousCourseTargetError(error) {
  return error?.code === AMBIGUOUS_COURSE_TARGET
    || String(error?.message || '').startsWith(AMBIGUOUS_COURSE_TARGET);
}

/**
 * 0 rows -> null, 1 row -> that row, >1 -> AMBIGUOUS_COURSE_TARGET.
 * @template T
 * @param {T[]|null|undefined} rows
 * @param {string} target
 * @returns {T|null}
 */
export function pickUniqueCourseOrThrow(rows, target) {
  const list = Array.isArray(rows) ? rows : [];
  if (list.length === 0) {
    return null;
  }
  if (list.length === 1) {
    return list[0];
  }
  throw ambiguousCourseTargetError(target);
}

/**
 * Resolve a course:
 * 1. real UUID course_id
 * 2. user_id + competency_target_name
 * 3. LEGACY target-only (0 / 1 / AMBIGUOUS_COURSE_TARGET)
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

  if (competencyTargetName && typeof courseRepository.getCourseById === 'function') {
    return await courseRepository.getCourseById(competencyTargetName);
  }

  return null;
}

/**
 * Resolve the course for an approval row.
 * Prefers path_approvals.course_id; target-only is last-resort and ambiguity-safe.
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

  if (approval.learningPathId && typeof courseRepository.getCourseById === 'function') {
    return await courseRepository.getCourseById(approval.learningPathId);
  }

  return null;
}
