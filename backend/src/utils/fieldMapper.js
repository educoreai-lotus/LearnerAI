/**
 * Field Mapper Utility
 * Maps field names from different microservices to LearnerAI's expected field names
 */

/**
 * Predefined field mappings for common microservices
 */
const FIELD_MAPPINGS = {
  // Skills Engine mappings
  'skills-engine': {
    // User/learner fields
    'learner_id': 'user_id',
    'learner_name': 'user_name',
    'learner_uuid': 'user_id',
    'user_uuid': 'user_id',
    'trainer_id': 'user_id', // Skills Engine sometimes sends trainer_id instead of user_id
    'trainer_name': 'user_name', // Skills Engine sometimes sends trainer_name instead of user_name
    
    // Company/organization fields
    'organization_id': 'company_id',
    'organization_name': 'company_name',
    'org_id': 'company_id',
    'org_name': 'company_name',
    
    // Competency fields
    'competency_name': 'competency_target_name',
    'target_competency': 'competency_target_name',
    'course_name': 'competency_target_name',
    
    // Status fields
    'exam_status': 'status',
    'test_status': 'status',
    'assessment_status': 'status',
    
    // Gap/skills fields
    'missing_skills_map': 'gap',
    'skills_gap': 'gap',
    'missing_skills': 'gap',
    'identified_gaps': 'gap',
    'skills_raw_data': 'gap'
  },
  
  // Directory mappings
  'directory': {
    'employee_id': 'user_id',
    'employee_name': 'user_name',
    'employee_uuid': 'user_id',
    'organization_id': 'company_id',
    'organization_name': 'company_name',
    'org_id': 'company_id',
    'org_name': 'company_name'
  },
  
  // Course Builder mappings (incoming: Course Builder → LearnerAI)
  'course-builder': {
    'course_id': 'competency_target_name',
    'course_name': 'competency_target_name',
    'path_id': 'competency_target_name',
    'learner_id': 'user_id',
    'learner_name': 'user_name'
  },
  
  // Course Builder reverse mappings (outgoing: LearnerAI → Course Builder)
  'course-builder-out': {
    'user_id': 'learner_id', // LearnerAI sends user_id, Course Builder expects learner_id
    'user_name': 'learner_name', // LearnerAI sends user_name, Course Builder expects learner_name
    'competency_target_name': 'course_id', // LearnerAI sends competency_target_name, Course Builder expects course_id
    'company_id': 'organization_id', // Optional: if Course Builder uses organization_id
    'company_name': 'organization_name' // Optional: if Course Builder uses organization_name
  },
  
  // Learning Analytics mappings
  'learning-analytics': {
    'learner_id': 'user_id',
    'learner_name': 'user_name',
    'organization_id': 'company_id',
    'organization_name': 'company_name',
    'course_id': 'competency_target_name',
    'path_id': 'competency_target_name'
  },
  
  // Generic/common mappings (applied to all services)
  'common': {
    'id': 'user_id', // Only if context suggests it's a user ID
    'name': 'user_name', // Only if context suggests it's a user name
    'uuid': 'user_id' // Only if context suggests it's a UUID
  }
};

/**
 * Map fields from a source object using predefined mappings
 * @param {Object} sourceData - Source data object
 * @param {string} serviceName - Name of the microservice (e.g., 'skills-engine', 'directory')
 * @param {Object} customMappings - Optional custom field mappings to override defaults
 * @returns {Object} Mapped data object
 */
export function mapFields(sourceData, serviceName = 'common', customMappings = {}) {
  if (!sourceData || typeof sourceData !== 'object' || Array.isArray(sourceData)) {
    return sourceData;
  }

  const mapped = {};
  const serviceMappings = FIELD_MAPPINGS[serviceName] || {};
  const allMappings = { ...serviceMappings, ...customMappings };

  // Map each field
  for (const [sourceKey, sourceValue] of Object.entries(sourceData)) {
    // Check if there's a mapping for this field
    const targetKey = allMappings[sourceKey] || sourceKey;
    
    // If value is an object, recursively map it
    if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue)) {
      mapped[targetKey] = mapFields(sourceValue, serviceName, customMappings);
    } else if (Array.isArray(sourceValue)) {
      // If value is an array, map each object in the array
      mapped[targetKey] = sourceValue.map(item => 
        typeof item === 'object' && item !== null && !Array.isArray(item)
          ? mapFields(item, serviceName, customMappings)
          : item
      );
    } else {
      mapped[targetKey] = sourceValue;
    }
  }

  return mapped;
}

/**
 * Get all available field mappings for a service
 * @param {string} serviceName - Name of the microservice
 * @returns {Object} Field mappings object
 */
export function getFieldMappings(serviceName) {
  return {
    service: serviceName,
    mappings: FIELD_MAPPINGS[serviceName] || {},
    common: FIELD_MAPPINGS['common'] || {}
  };
}

/**
 * Add custom field mappings
 * @param {string} serviceName - Name of the microservice
 * @param {Object} mappings - Custom mappings to add
 */
export function addFieldMappings(serviceName, mappings) {
  if (!FIELD_MAPPINGS[serviceName]) {
    FIELD_MAPPINGS[serviceName] = {};
  }
  FIELD_MAPPINGS[serviceName] = { ...FIELD_MAPPINGS[serviceName], ...mappings };
}

/**
 * Detect which service the data might be from based on field names
 * @param {Object} data - Source data object
 * @returns {string[]} Array of possible service names (ordered by confidence)
 */
export function detectService(data) {
  if (!data || typeof data !== 'object') {
    return ['common'];
  }

  const fieldNames = Object.keys(data).map(k => k.toLowerCase());
  const scores = {};

  // Score each service based on matching field names
  for (const [serviceName, mappings] of Object.entries(FIELD_MAPPINGS)) {
    if (serviceName === 'common') continue;
    
    let score = 0;
    for (const [sourceField] of Object.entries(mappings)) {
      if (fieldNames.includes(sourceField.toLowerCase())) {
        score++;
      }
    }
    scores[serviceName] = score;
  }

  // Sort by score (highest first)
  const sorted = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .filter(([_, score]) => score > 0)
    .map(([service]) => service);

  return sorted.length > 0 ? sorted : ['common'];
}

/**
 * Map fields with automatic service detection
 * @param {Object} sourceData - Source data object
 * @param {Object} customMappings - Optional custom field mappings
 * @returns {Object} Mapped data object with detection info
 */
export function mapFieldsAuto(sourceData, customMappings = {}) {
  const detectedServices = detectService(sourceData);
  const serviceName = detectedServices[0] || 'common';
  
  const mapped = mapFields(sourceData, serviceName, customMappings);
  
  return {
    mapped_data: mapped,
    detected_service: serviceName,
    confidence: detectedServices.length > 0,
    alternative_services: detectedServices.slice(1)
  };
}

/**
 * AI-powered field mapping - uses AI to map unknown fields intelligently
 * @param {Object} sourceData - Source data object
 * @param {Object} geminiClient - Gemini API client instance
 * @param {string} serviceName - Optional service name hint
 * @param {Object} customMappings - Optional custom field mappings
 * @param {Object} targetSchema - Optional target schema to help AI understand expected fields
 * @returns {Promise<Object>} Mapped data object with AI mapping info
 */
export async function mapFieldsWithAI(sourceData, geminiClient, serviceName = null, customMappings = {}, targetSchema = null) {
  if (!sourceData || typeof sourceData !== 'object' || Array.isArray(sourceData)) {
    return {
      mapped_data: sourceData,
      ai_mappings: {},
      predefined_mappings: {},
      unmapped_fields: []
    };
  }

  // Step 1: Apply predefined mappings first (fast path)
  const detectedServices = serviceName ? [serviceName] : detectService(sourceData);
  const detectedService = detectedServices[0] || 'common';
  const predefinedMapped = mapFields(sourceData, detectedService, customMappings);
  
  // Step 2: Identify unmapped fields (fields that weren't changed by mapping)
  const unmappedFields = [];
  const sourceFields = Object.keys(sourceData);
  const predefinedMappedFields = Object.keys(predefinedMapped);
  
  for (const field of sourceFields) {
    // If field exists in source but not in mapped (or value changed), it was mapped
    // If field exists in both with same value and no mapping rule, it's unmapped
    const hasMapping = FIELD_MAPPINGS[detectedService]?.[field] || customMappings[field];
    if (!hasMapping && sourceData[field] === predefinedMapped[field]) {
      unmappedFields.push(field);
    }
  }

  // Step 3: If no unmapped fields or no AI client, return predefined mappings
  if (unmappedFields.length === 0 || !geminiClient) {
    return {
      mapped_data: predefinedMapped,
      ai_mappings: {},
      predefined_mappings: {},
      detected_service: detectedService,
      unmapped_fields: []
    };
  }

  // Step 4: Use AI to map unmapped fields
  const targetFields = targetSchema ? Object.keys(targetSchema) : [
    'user_id', 'user_name', 'company_id', 'company_name', 
    'competency_target_name', 'status', 'gap', 'gap_id',
    'skills_raw_data', 'exam_status', 'competency_name'
  ];

  const unmappedData = {};
  for (const field of unmappedFields) {
    unmappedData[field] = sourceData[field];
  }

  const aiPrompt = `You are an intelligent field mapping assistant. Your task is to map source field names to target field names based on semantic meaning, context, and data patterns.

SOURCE FIELDS TO MAP: ${JSON.stringify(unmappedFields, null, 2)}
SOURCE DATA SAMPLE: ${JSON.stringify(unmappedData, null, 2).substring(0, 1500)}
TARGET FIELDS: ${JSON.stringify(targetFields, null, 2)}
${targetSchema ? `TARGET SCHEMA: ${JSON.stringify(targetSchema, null, 2)}` : ''}
SERVICE CONTEXT: ${detectedService}

MAPPING RULES (apply ALL of these):
1. SEMANTIC SIMILARITY: Match fields by meaning, not just name
   - "trainer_id", "learner_id", "student_id", "participant_id" → "user_id"
   - "trainer_name", "learner_name", "student_name" → "user_name"
   - "organization_id", "org_id", "company_uuid" → "company_id"
   - "organization_name", "org_name", "company_display_name" → "company_name"
   - "course_id", "path_id", "program_id" → "competency_target_name"
   - "exam_result", "test_status", "assessment_outcome" → "status"
   - "skills_map", "missing_skills", "identified_gaps" → "gap"

2. SYNONYM RECOGNITION: Recognize synonyms and related terms
   - User/learner/trainer/student/participant → user
   - Company/organization/org/employer → company
   - Course/path/program/curriculum → competency_target_name
   - Status/result/outcome/state → status
   - Gap/skills/missing/identified → gap

3. DATA TYPE ANALYSIS: Use field values to infer meaning
   - UUIDs (36 chars with hyphens) → likely ID fields
   - Strings with names → likely name fields
   - Objects with competency keys → likely gap/skills data
   - "pass"/"fail" values → likely status fields

4. CONTEXT CLUES: Analyze surrounding fields for context
   - If "trainer_id" appears with "user_name", map trainer_id → user_id
   - If "org_name" appears with "company_id", map org_name → company_name
   - If field contains "competency" or "course", likely maps to competency_target_name

5. CONFIDENCE THRESHOLD: Only map if confidence > 0.6
   - High confidence (0.8-1.0): Clear semantic match
   - Medium confidence (0.6-0.8): Probable match with context
   - Low confidence (<0.6): Don't map, leave unmapped

6. HANDLE VARIATIONS: Consider common naming patterns
   - snake_case, camelCase, kebab-case, PascalCase
   - Singular vs plural (user vs users)
   - Abbreviations (id vs identifier, uuid vs unique_id)

EXAMPLES OF GOOD MAPPINGS:
- "trainer_id": "b2c3d4e5-..." → "user_id" (confidence: 0.95) - UUID pattern + trainer synonym
- "org_display_name": "TechCorp Inc." → "company_name" (confidence: 0.9) - org synonym + name pattern
- "course_identifier": "Node.js Backend" → "competency_target_name" (confidence: 0.85) - course synonym
- "exam_result_status": "fail" → "status" (confidence: 0.8) - status synonym + value pattern

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "mappings": {
    "source_field_name": "target_field_name",
    ...
  },
  "confidence": {
    "source_field_name": 0.0-1.0,
    ...
  },
  "unmapped": ["field1", "field2"],
  "reasoning": "Brief explanation of key mappings and why they were chosen"
}`;

  try {
    const options = {
      maxRetries: 2,
      retryDelay: 1000,
      timeout: 20000 // 20 seconds for AI mapping
    };

    const aiResponse = await geminiClient.executePrompt(aiPrompt, '', options);
    
    // Parse AI response
    let aiMappings = {};
    let aiConfidence = {};
    let aiUnmapped = [];
    let reasoning = '';

    if (typeof aiResponse === 'string') {
      try {
        // Try to extract JSON from response
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          aiMappings = parsed.mappings || {};
          aiConfidence = parsed.confidence || {};
          aiUnmapped = parsed.unmapped || [];
          reasoning = parsed.reasoning || '';
        }
      } catch (e) {
        console.warn('Failed to parse AI mapping response:', e.message);
      }
    } else if (typeof aiResponse === 'object') {
      aiMappings = aiResponse.mappings || {};
      aiConfidence = aiResponse.confidence || {};
      aiUnmapped = aiResponse.unmapped || [];
      reasoning = aiResponse.reasoning || '';
    }

    // Step 5: Apply AI mappings (only high-confidence ones)
    const finalMapped = { ...predefinedMapped };
    const appliedAiMappings = {};

    for (const [sourceField, targetField] of Object.entries(aiMappings)) {
      const confidence = aiConfidence[sourceField] || 0;
      if (confidence > 0.6 && sourceData[sourceField] !== undefined) {
        finalMapped[targetField] = sourceData[sourceField];
        // Remove source field if it's different from target
        if (sourceField !== targetField && finalMapped[sourceField] === sourceData[sourceField]) {
          delete finalMapped[sourceField];
        }
        appliedAiMappings[sourceField] = {
          target: targetField,
          confidence: confidence
        };
      }
    }

    return {
      mapped_data: finalMapped,
      ai_mappings: appliedAiMappings,
      predefined_mappings: detectedService !== 'common' ? FIELD_MAPPINGS[detectedService] || {} : {},
      detected_service: detectedService,
      unmapped_fields: aiUnmapped,
      ai_reasoning: reasoning,
      ai_confidence_scores: aiConfidence
    };
  } catch (error) {
    console.warn('AI field mapping failed, using predefined mappings only:', error.message);
    // Fallback to predefined mappings if AI fails
    return {
      mapped_data: predefinedMapped,
      ai_mappings: {},
      predefined_mappings: detectedService !== 'common' ? FIELD_MAPPINGS[detectedService] || {} : {},
      detected_service: detectedService,
      unmapped_fields: unmappedFields,
      ai_error: error.message
    };
  }
}

/**
 * Reverse field mapping - maps LearnerAI fields to target microservice format
 * @param {Object} sourceData - LearnerAI data object
 * @param {string} targetService - Target microservice name (e.g., 'course-builder-out', 'learning-analytics-out')
 * @param {Object} customMappings - Optional custom field mappings
 * @returns {Object} Mapped data object in target service format
 */
export function mapFieldsOutgoing(sourceData, targetService, customMappings = {}) {
  if (!sourceData || typeof sourceData !== 'object' || Array.isArray(sourceData)) {
    return sourceData;
  }

  const mapped = {};
  const serviceMappings = FIELD_MAPPINGS[targetService] || {};
  const allMappings = { ...serviceMappings, ...customMappings };

  // Create reverse lookup: target field -> source field
  const reverseMappings = {};
  for (const [sourceField, targetField] of Object.entries(allMappings)) {
    reverseMappings[targetField] = sourceField;
  }

  // Map each field from LearnerAI format to target service format
  for (const [sourceKey, sourceValue] of Object.entries(sourceData)) {
    // Check if there's a reverse mapping for this field
    const targetKey = reverseMappings[sourceKey] || sourceKey;
    
    // If value is an object, recursively map it
    if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue)) {
      mapped[targetKey] = mapFieldsOutgoing(sourceValue, targetService, customMappings);
    } else if (Array.isArray(sourceValue)) {
      // If value is an array, map each object in the array
      mapped[targetKey] = sourceValue.map(item => 
        typeof item === 'object' && item !== null && !Array.isArray(item)
          ? mapFieldsOutgoing(item, targetService, customMappings)
          : item
      );
    } else {
      mapped[targetKey] = sourceValue;
    }
  }

  return mapped;
}

/**
 * AI-powered reverse field mapping - maps LearnerAI fields to target microservice format using AI
 * @param {Object} sourceData - LearnerAI data object
 * @param {Object} geminiClient - Gemini API client instance
 * @param {string} targetService - Target microservice name
 * @param {Object} targetSchema - Target service's expected schema
 * @param {Object} customMappings - Optional custom field mappings
 * @returns {Promise<Object>} Mapped data object with AI mapping info
 */
export async function mapFieldsOutgoingWithAI(sourceData, geminiClient, targetService, targetSchema = null, customMappings = {}) {
  if (!sourceData || typeof sourceData !== 'object' || Array.isArray(sourceData)) {
    return {
      mapped_data: sourceData,
      ai_mappings: {},
      predefined_mappings: {}
    };
  }

  // Step 1: Apply predefined reverse mappings first (fast path)
  const predefinedMapped = mapFieldsOutgoing(sourceData, targetService, customMappings);
  
  // Step 2: If no AI client or no target schema, return predefined mappings
  if (!geminiClient || !targetSchema) {
    return {
      mapped_data: predefinedMapped,
      ai_mappings: {},
      predefined_mappings: FIELD_MAPPINGS[targetService] || {},
      mapping_method: 'predefined'
    };
  }

  // Step 3: Use AI to map any remaining unmapped fields
  const sourceFields = Object.keys(sourceData);
  const targetFields = Object.keys(targetSchema);
  
  const aiPrompt = `You are a field mapping assistant. Map LearnerAI's field names to ${targetService}'s expected field names.

LearnerAI source fields: ${JSON.stringify(sourceFields, null, 2)}
LearnerAI data sample: ${JSON.stringify(sourceData, null, 2).substring(0, 1000)}
${targetService} target fields: ${JSON.stringify(targetFields, null, 2)}
${targetService} target schema: ${JSON.stringify(targetSchema, null, 2)}

Rules:
1. Map based on semantic similarity (e.g., "user_id" → "learner_id", "competency_target_name" → "course_id")
2. Consider data type compatibility
3. Use context clues from field values
4. Only map if confidence > 0.6
5. Return JSON with mappings and confidence scores

Return ONLY valid JSON in this exact format:
{
  "mappings": {
    "learnerai_field": "target_service_field",
    ...
  },
  "confidence": {
    "learnerai_field": 0.0-1.0,
    ...
  },
  "unmapped": ["field1", "field2"],
  "reasoning": "Brief explanation"
}`;

  try {
    const options = {
      maxRetries: 2,
      retryDelay: 1000,
      timeout: 20000
    };

    const aiResponse = await geminiClient.executePrompt(aiPrompt, '', options);
    
    // Parse AI response
    let aiMappings = {};
    let aiConfidence = {};
    let reasoning = '';

    if (typeof aiResponse === 'string') {
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          aiMappings = parsed.mappings || {};
          aiConfidence = parsed.confidence || {};
          reasoning = parsed.reasoning || '';
        }
      } catch (e) {
        console.warn('Failed to parse AI outgoing mapping response:', e.message);
      }
    } else if (typeof aiResponse === 'object') {
      aiMappings = aiResponse.mappings || {};
      aiConfidence = aiResponse.confidence || {};
      reasoning = aiResponse.reasoning || '';
    }

    // Step 4: Apply AI mappings (only high-confidence ones)
    const finalMapped = { ...predefinedMapped };
    const appliedAiMappings = {};

    for (const [learnerAIField, targetField] of Object.entries(aiMappings)) {
      const confidence = aiConfidence[learnerAIField] || 0;
      if (confidence > 0.6 && sourceData[learnerAIField] !== undefined) {
        finalMapped[targetField] = sourceData[learnerAIField];
        // Remove original field if it's different from target
        if (learnerAIField !== targetField && finalMapped[learnerAIField] === sourceData[learnerAIField]) {
          delete finalMapped[learnerAIField];
        }
        appliedAiMappings[learnerAIField] = {
          target: targetField,
          confidence: confidence
        };
      }
    }

    return {
      mapped_data: finalMapped,
      ai_mappings: appliedAiMappings,
      predefined_mappings: FIELD_MAPPINGS[targetService] || {},
      ai_reasoning: reasoning,
      ai_confidence_scores: aiConfidence,
      mapping_method: 'ai_powered'
    };
  } catch (error) {
    console.warn('AI outgoing field mapping failed, using predefined mappings only:', error.message);
    return {
      mapped_data: predefinedMapped,
      ai_mappings: {},
      predefined_mappings: FIELD_MAPPINGS[targetService] || {},
      ai_error: error.message,
      mapping_method: 'predefined_fallback'
    };
  }
}

