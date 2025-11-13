/**
 * Test script to check available Gemini models
 * Run this to see which models your API key has access to
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('❌ GEMINI_API_KEY not found in environment variables');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

// List of models to try
const modelsToTry = [
  'gemini-pro',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'gemini-1.0-pro',
  'models/gemini-pro',
  'models/gemini-1.5-pro',
  'models/gemini-1.5-flash'
];

console.log('🔍 Testing Gemini API Models...\n');
console.log(`API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}\n`);

async function testModel(modelName) {
  try {
    console.log(`Testing: ${modelName}...`);
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent('Say "Hello" in one word.');
    const response = await result.response;
    const text = response.text();
    console.log(`✅ ${modelName} - SUCCESS! Response: "${text.trim()}"\n`);
    return { model: modelName, success: true };
  } catch (error) {
    console.log(`❌ ${modelName} - FAILED: ${error.message}\n`);
    return { model: modelName, success: false, error: error.message };
  }
}

async function runTests() {
  const results = [];
  
  for (const modelName of modelsToTry) {
    const result = await testModel(modelName);
    results.push(result);
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('='.repeat(60));
  console.log('📊 RESULTS SUMMARY');
  console.log('='.repeat(60));
  
  const workingModels = results.filter(r => r.success);
  const failedModels = results.filter(r => !r.success);
  
  if (workingModels.length > 0) {
    console.log('\n✅ Working Models:');
    workingModels.forEach(r => console.log(`   - ${r.model}`));
  }
  
  if (failedModels.length > 0) {
    console.log('\n❌ Failed Models:');
    failedModels.forEach(r => console.log(`   - ${r.model}: ${r.error}`));
  }
  
  if (workingModels.length === 0) {
    console.log('\n⚠️  No working models found!');
    console.log('   Possible issues:');
    console.log('   1. API key is invalid or expired');
    console.log('   2. API key doesn\'t have access to Gemini models');
    console.log('   3. Network/firewall issues');
    console.log('   4. Google API service is down');
  } else {
    console.log(`\n💡 Recommended model: ${workingModels[0].model}`);
    console.log(`   Add this to your .env file:`);
    console.log(`   GEMINI_MODEL=${workingModels[0].model}`);
  }
}

runTests().catch(error => {
  console.error('❌ Test script failed:', error);
  process.exit(1);
});

