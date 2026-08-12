/**
 * Database Seeding Utility
 * Seeds the database with mock data for testing
 */

import { CompanyRepository } from '../infrastructure/repositories/CompanyRepository.js';
import { LearnerRepository } from '../infrastructure/repositories/LearnerRepository.js';
import { SkillsGapRepository } from '../infrastructure/repositories/SkillsGapRepository.js';
import { CourseRepository } from '../infrastructure/repositories/CourseRepository.js';
import { SkillsExpansionRepository } from '../infrastructure/repositories/SkillsExpansionRepository.js';
import { RecommendationRepository } from '../infrastructure/repositories/RecommendationRepository.js';
import { JobRepository } from '../infrastructure/repositories/JobRepository.js';
import { Job } from '../domain/entities/Job.js';
import {
  mockCompanies,
  mockLearners,
  mockSkillsGaps,
  mockCourses,
  mockSkillsExpansions,
  mockRecommendations,
  mockJobs
} from './mockData.js';

/**
 * Seed all tables with mock data
 */
export async function seedDatabase(supabaseUrl, supabaseKey) {
  console.log('🌱 Starting database seeding...\n');

  try {
    // Initialize repositories
    const companyRepo = new CompanyRepository(supabaseUrl, supabaseKey);
    const learnerRepo = new LearnerRepository(supabaseUrl, supabaseKey);
    const skillsGapRepo = new SkillsGapRepository(supabaseUrl, supabaseKey);
    const courseRepo = new CourseRepository(supabaseUrl, supabaseKey);
    const skillsExpansionRepo = new SkillsExpansionRepository(supabaseUrl, supabaseKey);
    const recommendationRepo = new RecommendationRepository(supabaseUrl, supabaseKey);
    const jobRepo = new JobRepository(supabaseUrl, supabaseKey);

    // Seed companies first (required for foreign keys)
    console.log('🏢 Seeding companies...');
    const createdCompanies = [];
    for (const company of mockCompanies) {
      try {
        const created = await companyRepo.upsertCompany(company);
        createdCompanies.push(created);
        console.log(`  ✅ Created/updated company: ${company.company_name} (${company.company_id})`);
      } catch (error) {
        console.error(`  ❌ Error creating company ${company.company_name}:`, error.message);
      }
    }

    // Seed learners
    console.log('\n📝 Seeding learners...');
    const createdLearners = [];
    for (const learner of mockLearners) {
      try {
        const created = await learnerRepo.createLearner(learner);
        createdLearners.push(created);
        console.log(`  ✅ Created learner: ${learner.user_name} (${learner.user_id})`);
      } catch (error) {
        if (error.message.includes('duplicate') || error.message.includes('unique')) {
          console.log(`  ⚠️  Learner already exists: ${learner.user_name}`);
        } else {
          console.error(`  ❌ Error creating learner ${learner.user_name}:`, error.message);
        }
      }
    }

    // Seed skills gaps
    console.log('\n📊 Seeding skills gaps...');
    const createdSkillsGaps = [];
    for (const gap of mockSkillsGaps) {
      try {
        const created = await skillsGapRepo.createSkillsGap(gap);
        createdSkillsGaps.push(created);
        console.log(`  ✅ Created skills gap: ${gap.gap_id}`);
      } catch (error) {
        if (error.message.includes('duplicate') || error.message.includes('unique')) {
          console.log(`  ⚠️  Skills gap already exists: ${gap.gap_id}`);
        } else {
          console.error(`  ❌ Error creating skills gap ${gap.gap_id}:`, error.message);
        }
      }
    }

    // Seed courses
    console.log('\n📚 Seeding courses...');
    const createdCourses = [];
    for (const course of mockCourses) {
      try {
        const result = await upsertSeedCourse(courseRepo, course);
        createdCourses.push(result.course);
        if (result.created) {
          console.log(`  ✅ Created course: ${course.competency_target_name}`);
        } else {
          console.log(`  🔄 Updated course: ${course.competency_target_name} (with new detailed learning path)`);
        }
      } catch (error) {
        console.error(`  ❌ Error creating/updating course ${course.competency_target_name}:`, error.message);
      }
    }

    // Seed skills expansions
    console.log('\n🔍 Seeding skills expansions...');
    const createdExpansions = [];
    for (const expansion of mockSkillsExpansions) {
      try {
        const created = await skillsExpansionRepo.createSkillsExpansion(expansion);
        createdExpansions.push(created);
        console.log(`  ✅ Created skills expansion: ${expansion.expansion_id}`);
      } catch (error) {
        if (error.message.includes('duplicate') || error.message.includes('unique')) {
          console.log(`  ⚠️  Skills expansion already exists: ${expansion.expansion_id}`);
        } else {
          console.error(`  ❌ Error creating skills expansion ${expansion.expansion_id}:`, error.message);
        }
      }
    }

    // Seed recommendations
    console.log('\n💡 Seeding recommendations...');
    const createdRecommendations = [];
    for (const recommendation of mockRecommendations) {
      try {
        const created = await recommendationRepo.createRecommendation(recommendation);
        createdRecommendations.push(created);
        console.log(`  ✅ Created recommendation: ${recommendation.recommendation_id}`);
      } catch (error) {
        if (error.message.includes('duplicate') || error.message.includes('unique')) {
          console.log(`  ⚠️  Recommendation already exists: ${recommendation.recommendation_id}`);
        } else {
          console.error(`  ❌ Error creating recommendation ${recommendation.recommendation_id}:`, error.message);
        }
      }
    }

    // Seed jobs
    console.log('\n⚙️  Seeding jobs...');
    const createdJobs = [];
    for (const jobData of mockJobs) {
      try {
        const job = new Job({
          id: jobData.id,
          userId: jobData.user_id,
          companyId: jobData.company_id,
          competencyTargetName: jobData.competency_target_name,
          type: jobData.type,
          status: jobData.status,
          progress: jobData.progress,
          currentStage: jobData.current_stage,
          result: jobData.result,
          error: jobData.error,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        const created = await jobRepo.createJob(job);
        createdJobs.push(created);
        console.log(`  ✅ Created job: ${jobData.id} (${jobData.type} - ${jobData.status})`);
      } catch (error) {
        if (error.message.includes('duplicate') || error.message.includes('unique')) {
          console.log(`  ⚠️  Job already exists: ${jobData.id}`);
        } else {
          console.error(`  ❌ Error creating job ${jobData.id}:`, error.message);
        }
      }
    }

    // Summary
    console.log('\n✨ Seeding complete!');
    console.log('\n📊 Summary:');
    console.log(`  Companies: ${createdCompanies.length}/${mockCompanies.length}`);
    console.log(`  Learners: ${createdLearners.length}/${mockLearners.length}`);
    console.log(`  Skills Gaps: ${createdSkillsGaps.length}/${mockSkillsGaps.length}`);
    console.log(`  Courses: ${createdCourses.length}/${mockCourses.length}`);
    console.log(`  Skills Expansions: ${createdExpansions.length}/${mockSkillsExpansions.length}`);
    console.log(`  Recommendations: ${createdRecommendations.length}/${mockRecommendations.length}`);
    console.log(`  Jobs: ${createdJobs.length}/${mockJobs.length}`);

    return {
      companies: createdCompanies,
      learners: createdLearners,
      skillsGaps: createdSkillsGaps,
      courses: createdCourses,
      skillsExpansions: createdExpansions,
      recommendations: createdRecommendations,
      jobs: createdJobs
    };
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    throw error;
  }
}

/**
 * Clear all seeded data (for testing)
 */
export async function clearSeededData(supabaseUrl, supabaseKey) {
  console.log('🧹 Clearing seeded data...\n');

  try {
    const jobRepo = new JobRepository(supabaseUrl, supabaseKey);
    const recommendationRepo = new RecommendationRepository(supabaseUrl, supabaseKey);
    const skillsExpansionRepo = new SkillsExpansionRepository(supabaseUrl, supabaseKey);
    const courseRepo = new CourseRepository(supabaseUrl, supabaseKey);
    const skillsGapRepo = new SkillsGapRepository(supabaseUrl, supabaseKey);
    const learnerRepo = new LearnerRepository(supabaseUrl, supabaseKey);

    // Delete in reverse order of dependencies
    for (const job of mockJobs) {
      try {
        // Jobs don't have delete method, skip for now
      } catch (error) {
        console.log(`  ⚠️  Could not delete job ${job.id}`);
      }
    }

    for (const recommendation of mockRecommendations) {
      try {
        await recommendationRepo.deleteRecommendation(recommendation.recommendation_id);
        console.log(`  ✅ Deleted recommendation: ${recommendation.recommendation_id}`);
      } catch (error) {
        console.log(`  ⚠️  Could not delete recommendation ${recommendation.recommendation_id}`);
      }
    }

    for (const expansion of mockSkillsExpansions) {
      try {
        await skillsExpansionRepo.deleteSkillsExpansion(expansion.expansion_id);
        console.log(`  ✅ Deleted skills expansion: ${expansion.expansion_id}`);
      } catch (error) {
        console.log(`  ⚠️  Could not delete skills expansion ${expansion.expansion_id}`);
      }
    }

    for (const course of mockCourses) {
      try {
        await deleteSeedCourse(courseRepo, course);
        console.log(`  ✅ Deleted course: ${course.competency_target_name}`);
      } catch (error) {
        console.log(`  ⚠️  Could not delete course ${course.competency_target_name}`);
      }
    }

    for (const gap of mockSkillsGaps) {
      try {
        await skillsGapRepo.deleteSkillsGap(gap.gap_id);
        console.log(`  ✅ Deleted skills gap: ${gap.gap_id}`);
      } catch (error) {
        console.log(`  ⚠️  Could not delete skills gap ${gap.gap_id}`);
      }
    }

    for (const learner of mockLearners) {
      try {
        await learnerRepo.deleteLearner(learner.user_id);
        console.log(`  ✅ Deleted learner: ${learner.user_name}`);
      } catch (error) {
        console.log(`  ⚠️  Could not delete learner ${learner.user_id}`);
      }
    }

    console.log('\n✨ Clearing complete!');
  } catch (error) {
    console.error('\n❌ Clearing failed:', error);
    throw error;
  }
}

function isDuplicateError(error) {
  const message = error?.message || '';
  return message.includes('duplicate') || message.includes('unique') || message.includes('violates unique constraint');
}

/**
 * Seed create/update: identify by user_id + target, then update by course_id when present.
 * Does not use target-only update when ownership is known.
 */
export async function upsertSeedCourse(courseRepo, course) {
  const target = course.competency_target_name;
  const userId = course.user_id || null;

  try {
    const created = await courseRepo.createCourse(course);
    return { created: true, course: created };
  } catch (createError) {
    if (!isDuplicateError(createError)) {
      throw createError;
    }
  }

  const existing = userId && typeof courseRepo.getCourseByUserAndTarget === 'function'
    ? await courseRepo.getCourseByUserAndTarget(userId, target)
    : await courseRepo.getCourseById(target);

  const updates = {
    learning_path: course.learning_path,
    approved: course.approved
  };

  if (existing?.course_id && typeof courseRepo.updateCourseById === 'function') {
    const updated = await courseRepo.updateCourseById(existing.course_id, updates);
    return { created: false, course: updated };
  }

  if (userId && typeof courseRepo.updateCourseByUserAndTarget === 'function') {
    const updated = await courseRepo.updateCourseByUserAndTarget(userId, target, updates);
    return { created: false, course: updated };
  }

  throw new Error(`Cannot safely update seed course "${target}": missing course_id and user_id`);
}

/**
 * Seed delete: look up owned row, then delete by course_id (or user+target).
 * Does not use target-only DELETE when ownership is known.
 */
export async function deleteSeedCourse(courseRepo, course) {
  const target = course.competency_target_name;
  const userId = course.user_id || null;

  const existing = userId && typeof courseRepo.getCourseByUserAndTarget === 'function'
    ? await courseRepo.getCourseByUserAndTarget(userId, target)
    : typeof courseRepo.getCourseById === 'function'
      ? await courseRepo.getCourseById(target)
      : null;

  if (existing?.course_id && typeof courseRepo.deleteCourseById === 'function') {
    return await courseRepo.deleteCourseById(existing.course_id);
  }

  if (userId && typeof courseRepo.deleteCourseByUserAndTarget === 'function') {
    return await courseRepo.deleteCourseByUserAndTarget(userId, target);
  }

  if (!existing) {
    return true;
  }

  throw new Error(`Cannot safely delete seed course "${target}": missing course_id and user_id`);
}

