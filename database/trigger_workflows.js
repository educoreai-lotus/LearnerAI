/**
 * Trigger Workflows Script
 * This script triggers the actual learning path generation workflow
 * for each of the 5 additional skills gaps via API calls.
 * 
 * Usage: node trigger_workflows.js
 * 
 * Prerequisites:
 * 1. Backend server must be running on http://localhost:5000
 * 2. Skills gaps must already exist in the database (run complete_workflow_example.sql first for gaps)
 * 3. Company must be set to manual approval policy
 * 4. Node.js 18+ (for built-in fetch) or install node-fetch: npm install node-fetch
 */

// Use built-in fetch (Node 18+) or require node-fetch for older versions
let fetch;
if (typeof globalThis.fetch === 'function') {
  // Node.js 18+ has built-in fetch
  fetch = globalThis.fetch;
} else {
  // For older Node versions, try to use node-fetch
  try {
    fetch = require('node-fetch');
  } catch (e) {
    console.error('❌ fetch is not available. Please use Node.js 18+ or install node-fetch: npm install node-fetch');
    process.exit(1);
  }
}

const API_URL = process.env.API_URL || 'http://localhost:5000';
const API_VERSION = 'v1';

// Skills gaps to process (these should already exist in the database)
const gapsToProcess = [
  {
    competencyTargetName: 'Microservices Architecture',
    userId: 'a1b2c3d4-e5f6-4789-a012-345678901234', // Alice Johnson
    companyId: 'c1d2e3f4-5678-9012-3456-789012345678' // TechCorp Inc.
  },
  {
    competencyTargetName: 'CI/CD Pipeline Development',
    userId: 'a1b2c3d4-e5f6-4789-a012-345678901234',
    companyId: 'c1d2e3f4-5678-9012-3456-789012345678'
  },
  {
    competencyTargetName: 'Database Design & Optimization',
    userId: 'a1b2c3d4-e5f6-4789-a012-345678901234',
    companyId: 'c1d2e3f4-5678-9012-3456-789012345678'
  },
  {
    competencyTargetName: 'Cloud Security Fundamentals',
    userId: 'a1b2c3d4-e5f6-4789-a012-345678901234',
    companyId: 'c1d2e3f4-5678-9012-3456-789012345678'
  },
  {
    competencyTargetName: 'API Gateway Patterns',
    userId: 'a1b2c3d4-e5f6-4789-a012-345678901234',
    companyId: 'c1d2e3f4-5678-9012-3456-789012345678'
  }
];

async function triggerWorkflow(gap) {
  const url = `${API_URL}/api/${API_VERSION}/learning-paths/generate`;
  
  console.log(`\n🚀 Triggering workflow for: ${gap.competencyTargetName}`);
  console.log(`   URL: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: gap.userId,
        companyId: gap.companyId,
        competencyTargetName: gap.competencyTargetName
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}`);
    }

    console.log(`   ✅ Workflow started successfully!`);
    console.log(`   📋 Job ID: ${data.jobId}`);
    console.log(`   📊 Status: ${data.status}`);
    
    return {
      success: true,
      competencyTargetName: gap.competencyTargetName,
      jobId: data.jobId,
      status: data.status
    };
  } catch (error) {
    console.error(`   ❌ Failed to trigger workflow: ${error.message}`);
    return {
      success: false,
      competencyTargetName: gap.competencyTargetName,
      error: error.message
    };
  }
}

async function checkJobStatus(jobId) {
  const url = `${API_URL}/api/${API_VERSION}/jobs/${jobId}/status`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error(`   ⚠️  Failed to check job status: ${error.message}`);
    return null;
  }
}

async function waitForJobCompletion(jobId, maxWaitTime = 300000) { // 5 minutes max
  const startTime = Date.now();
  const pollInterval = 5000; // Check every 5 seconds
  
  console.log(`   ⏳ Waiting for job to complete...`);
  
  while (Date.now() - startTime < maxWaitTime) {
    const status = await checkJobStatus(jobId);
    
    if (!status) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      continue;
    }
    
    console.log(`   📊 Progress: ${status.progress || 0}% | Status: ${status.status} | Stage: ${status.current_stage || 'N/A'}`);
    
    if (status.status === 'completed') {
      console.log(`   ✅ Job completed successfully!`);
      return true;
    }
    
    if (status.status === 'failed' || status.error) {
      console.error(`   ❌ Job failed: ${status.error || 'Unknown error'}`);
      return false;
    }
    
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }
  
  console.log(`   ⏰ Timeout waiting for job completion`);
  return false;
}

async function main() {
  console.log('='.repeat(60));
  console.log('🎯 Triggering Learning Path Generation Workflows');
  console.log('='.repeat(60));
  console.log(`\n📡 API URL: ${API_URL}`);
  console.log(`📦 Processing ${gapsToProcess.length} skills gaps\n`);

  const results = [];
  
  // Process each gap sequentially (to avoid overwhelming the system)
  for (const gap of gapsToProcess) {
    const result = await triggerWorkflow(gap);
    results.push(result);
    
    // If workflow started successfully, optionally wait for completion
    if (result.success && result.jobId) {
      // Uncomment the line below if you want to wait for each job to complete
      // await waitForJobCompletion(result.jobId);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`\n✅ Successful: ${successful}/${gapsToProcess.length}`);
  console.log(`❌ Failed: ${failed}/${gapsToProcess.length}`);
  
  if (failed > 0) {
    console.log('\n❌ Failed workflows:');
    results
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`   - ${r.competencyTargetName}: ${r.error}`);
      });
  }
  
  if (successful > 0) {
    console.log('\n✅ Successful workflows:');
    results
      .filter(r => r.success)
      .forEach(r => {
        console.log(`   - ${r.competencyTargetName} (Job ID: ${r.jobId})`);
      });
  }
  
  console.log('\n💡 Note: Jobs are processed in the background.');
  console.log('   Check job status with: GET /api/v1/jobs/{jobId}/status');
  console.log('   Once completed, learning paths will be available in the courses table.');
  console.log('   Approval requests will be created automatically for manual approval companies.\n');
}

// Run the script
main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

