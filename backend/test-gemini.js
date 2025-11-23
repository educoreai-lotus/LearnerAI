/**
 * Test Script: Verify Gemini API and Prompts
 * 
 * This script tests:
 * 1. Gemini API connection
 * 2. Prompt loading
 * 3. Full prompt execution with Gemini
 * 
 * Usage:
 *   node test-gemini.js
 */

import dotenv from 'dotenv';
import { GeminiApiClient } from './src/infrastructure/clients/GeminiApiClient.js';
import { PromptLoader } from './src/infrastructure/prompts/PromptLoader.js';

dotenv.config();

async function testGemini() {
  console.log('🧪 Testing Gemini API and Prompts...\n');

  // Check API key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not found in environment variables');
    console.log('💡 Set GEMINI_API_KEY in your .env file or environment');
    process.exit(1);
  }
  console.log('✅ GEMINI_API_KEY found');

  // Initialize Gemini client
  let geminiClient;
  try {
    geminiClient = new GeminiApiClient(apiKey);
    console.log('✅ Gemini client initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Gemini client:', error.message);
    process.exit(1);
  }

  // Initialize Prompt Loader
  let promptLoader;
  try {
    promptLoader = new PromptLoader();
    console.log('✅ Prompt loader initialized');
  } catch (error) {
    console.error('❌ Failed to initialize prompt loader:', error.message);
    process.exit(1);
  }

  // Test 1: Simple Gemini API call
  console.log('\n📝 Test 1: Simple Gemini API Call');
  try {
    const simplePrompt = 'Say "Hello, Gemini is working!" in JSON format: {"message": "your response"}';
    const result = await geminiClient.executePrompt(simplePrompt, '', { timeout: 10000 });
    console.log('✅ Gemini API responded:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Gemini API call failed:', error.message);
    return;
  }

  // Test 2: Load Prompt 1
  console.log('\n📝 Test 2: Load Prompt 1 (Skill Expansion)');
  try {
    const prompt1 = await promptLoader.loadPrompt('prompt1-skill-expansion');
    console.log('✅ Prompt 1 loaded');
    console.log(`   Length: ${prompt1.length} characters`);
    console.log(`   First 200 chars: ${prompt1.substring(0, 200)}...`);
  } catch (error) {
    console.error('❌ Failed to load Prompt 1:', error.message);
    return;
  }

  // Test 3: Load Prompt 2
  console.log('\n📝 Test 3: Load Prompt 2 (Competency Identification)');
  try {
    const prompt2 = await promptLoader.loadPrompt('prompt2-competency-identification');
    console.log('✅ Prompt 2 loaded');
    console.log(`   Length: ${prompt2.length} characters`);
  } catch (error) {
    console.error('❌ Failed to load Prompt 2:', error.message);
    return;
  }

  // Test 4: Load Prompt 3
  console.log('\n📝 Test 4: Load Prompt 3 (Path Creation)');
  try {
    const prompt3 = await promptLoader.loadPrompt('prompt3-path-creation');
    console.log('✅ Prompt 3 loaded');
    console.log(`   Length: ${prompt3.length} characters`);
  } catch (error) {
    console.error('❌ Failed to load Prompt 3:', error.message);
    return;
  }

  // Test 4.5: Load Prompt 4
  console.log('\n📝 Test 4.5: Load Prompt 4 (Course Suggestions)');
  try {
    const prompt4 = await promptLoader.loadPrompt('prompt4-course-suggestions');
    console.log('✅ Prompt 4 loaded');
    console.log(`   Length: ${prompt4.length} characters`);
  } catch (error) {
    console.warn('⚠️  Prompt 4 not found (optional):', error.message);
    // Don't return, continue with other tests
  }

  // Test 5: Execute Prompt 1 with sample data
  console.log('\n📝 Test 5: Execute Prompt 1 with Sample Data');
  try {
    const prompt1 = await promptLoader.loadPrompt('prompt1-skill-expansion');
    
    // Sample skills gap data
    const sampleSkillsGap = {
      userId: 'test-user-123',
      companyId: 'test-company-456',
      competencyTargetName: 'JavaScript Basics',
      skills_raw_data: {
        'Competency_JavaScript_Fundamentals': [
          'MGS_ES6_Syntax',
          'MGS_Promise_Handling',
          'MGS_Async_Await'
        ]
      }
    };

    const promptInput = JSON.stringify(sampleSkillsGap.skills_raw_data, null, 2);
    const fullPrompt = `${prompt1}\n\nInput:\n${promptInput}`;

    console.log('   Sending to Gemini... (this may take 10-30 seconds)');
    const result = await geminiClient.executePrompt(fullPrompt, '', {
      timeout: 60000, // 60 seconds
      maxRetries: 2
    });

    console.log('✅ Prompt 1 executed successfully!');
    console.log('   Response type:', typeof result);
    console.log('   Response preview:', JSON.stringify(result).substring(0, 300) + '...');
    
    // Check if response is valid
    if (typeof result === 'object' && result !== null) {
      console.log('   ✅ Response is valid JSON object');
    } else if (typeof result === 'string') {
      console.log('   ⚠️  Response is string (may need JSON parsing)');
    }
  } catch (error) {
    console.error('❌ Prompt 1 execution failed:', error.message);
    console.error('   Full error:', error);
  }

  // Test 6: Verify prompt placeholders
  console.log('\n📝 Test 6: Verify Prompt Placeholders');
  try {
    const prompt1 = await promptLoader.loadPrompt('prompt1-skill-expansion');
    const prompt2 = await promptLoader.loadPrompt('prompt2-competency-identification');
    const prompt3 = await promptLoader.loadPrompt('prompt3-path-creation');
    
    const checks = {
      'Prompt 1 has {input}': prompt1.includes('{input}'),
      'Prompt 2 has {input}': prompt2.includes('{input}'),
      'Prompt 3 has {initialGap}': prompt3.includes('{initialGap}'),
      'Prompt 3 has {expandedBreakdown}': prompt3.includes('{expandedBreakdown}')
    };
    
    console.log('   Placeholder checks:');
    Object.entries(checks).forEach(([check, passed]) => {
      console.log(`   ${passed ? '✅' : '❌'} ${check}`);
    });
  } catch (error) {
    console.warn('⚠️  Could not verify placeholders:', error.message);
  }

  console.log('\n✅ All tests completed!');
  console.log('\n💡 Next steps:');
  console.log('   1. Check backend logs when generating a learning path');
  console.log('   2. Test the endpoint: POST /api/v1/learning-paths/generate');
  console.log('   3. Check job status: GET /api/v1/jobs/:jobId/status');
  console.log('   4. Health check: GET /api/v1/ai/health');
}

// Run tests
testGemini().catch(error => {
  console.error('❌ Test script failed:', error);
  process.exit(1);
});

