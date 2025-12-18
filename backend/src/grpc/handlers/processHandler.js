import { createClient } from '@supabase/supabase-js';

function nowIso() {
  return new Date().toISOString();
}

function safeJsonParse(s, fallback = null) {
  try {
    return JSON.parse(s);
  } catch {
    return fallback;
  }
}

function detectMode(payload) {
  return payload?.sync_type === 'batch' ? 'batch' : 'realtime';
}

function extractDigitsId(query) {
  const match = String(query || '').match(/\d+/);
  return match ? match[0] : null;
}

/**
 * GRPC Process handler for LearnerAI.
 *
 * IMPORTANT RESPONSE RULES (Coordinator quality checks):
 * - realtime: data MUST be an array (no wrappers)
 * - batch: data MUST be { items: [...], page, limit, total } (no extra wrappers)
 */
export class ProcessHandler {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_KEY;
    this.client = (this.supabaseUrl && this.supabaseKey)
      ? createClient(this.supabaseUrl, this.supabaseKey)
      : null;
  }

  async handle(call, callback) {
    const startTime = Date.now();
    let envelope = null;

    try {
      envelope = safeJsonParse(call.request?.envelope_json, null);
      if (!envelope || typeof envelope !== 'object') {
        throw new Error('Invalid envelope_json (must be valid JSON object)');
      }

      const { request_id, tenant_id, user_id, payload } = envelope;
      const mode = detectMode(payload);

      if (!this.client) {
        throw new Error('Supabase is not configured (SUPABASE_URL/SUPABASE_KEY missing)');
      }

      let result;
      if (mode === 'batch') {
        result = await this.handleBatchSync(envelope);
      } else {
        result = await this.handleRealtimeQuery(envelope);
      }

      const responseEnvelope = {
        request_id,
        success: true,
        data: result.data,
        metadata: {
          ...(result.metadata || {}),
          processed_at: nowIso(),
          service: process.env.SERVICE_NAME || 'learnerAI',
          duration_ms: Date.now() - startTime,
          mode
        }
      };

      callback(null, {
        success: true,
        envelope_json: JSON.stringify(responseEnvelope),
        error: ''
      });
    } catch (error) {
      const responseEnvelope = {
        request_id: envelope?.request_id,
        success: false,
        error: error.message,
        metadata: {
          processed_at: nowIso(),
          service: process.env.SERVICE_NAME || 'learnerAI'
        }
      };

      callback(null, {
        success: false,
        envelope_json: JSON.stringify(responseEnvelope),
        error: error.message
      });
    }
  }

  async handleBatchSync(envelope) {
    const { tenant_id, payload } = envelope;
    const page = Number(payload?.page || 1);
    const limit = Number(payload?.limit || 1000);
    const since = payload?.since || null;
    const offset = (page - 1) * limit;

    // We treat tenant_id as company_id for filtering, but courses table doesn't store company_id.
    // So we sync courses by time (and optionally by user_id if provided).
    const items = await this.queryCourses({ limit, offset, since, userId: payload?.user_id || null });
    const total = await this.countCourses({ since, userId: payload?.user_id || null });

    const hasMore = (page * limit) < total;

    return {
      data: {
        items,
        page,
        limit,
        total
      },
      metadata: {
        tenant_id,
        has_more: hasMore,
        page,
        total_pages: limit > 0 ? Math.ceil(total / limit) : 0
      }
    };
  }

  async handleRealtimeQuery(envelope) {
    const { tenant_id, user_id, payload } = envelope;
    const query = payload?.query || '';

    // Always return an ARRAY (Coordinator rule).
    let data = [];

    // Prefer structured fields if provided.
    const competencyTargetName = payload?.competency_target_name || payload?.course_id || null;
    if (competencyTargetName) {
      const course = await this.getCourseByCompetencyTargetName(competencyTargetName);
      data = course ? [course] : [];
      return { data, metadata: { tenant_id, query_type: 'by_competency_target_name' } };
    }

    if (String(query).toLowerCase().includes('recent')) {
      data = await this.getRecentCourses({ userId: user_id || payload?.user_id || null, limit: 10 });
      return { data, metadata: { tenant_id, query_type: 'recent' } };
    }

    if (String(query).toLowerCase().includes('id') || String(query).toLowerCase().includes('show')) {
      const id = extractDigitsId(query);
      if (id) {
        const course = await this.getCourseByCompetencyTargetName(id);
        data = course ? [course] : [];
        return { data, metadata: { tenant_id, query_type: 'by_id' } };
      }
    }

    // Default: courses for this user if available, else recent global courses.
    if (user_id) {
      data = await this.getRecentCourses({ userId: user_id, limit: 10 });
      return { data, metadata: { tenant_id, query_type: 'default_user_recent' } };
    }

    data = await this.getRecentCourses({ userId: null, limit: 10 });
    return { data, metadata: { tenant_id, query_type: 'default_recent' } };
  }

  async queryCourses({ limit, offset, since, userId }) {
    let q = this.client
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (since) {
      q = q.gte('created_at', since);
    }
    if (userId) {
      q = q.eq('user_id', userId);
    }

    const { data, error } = await q;
    if (error) throw new Error(`Failed to query courses: ${error.message}`);
    return Array.isArray(data) ? data : [];
  }

  async countCourses({ since, userId }) {
    let q = this.client
      .from('courses')
      .select('competency_target_name', { count: 'exact', head: true });

    if (since) {
      q = q.gte('created_at', since);
    }
    if (userId) {
      q = q.eq('user_id', userId);
    }

    const { count, error } = await q;
    if (error) throw new Error(`Failed to count courses: ${error.message}`);
    return Number(count || 0);
  }

  async getRecentCourses({ userId, limit }) {
    let q = this.client
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (userId) {
      q = q.eq('user_id', userId);
    }

    const { data, error } = await q;
    if (error) throw new Error(`Failed to get recent courses: ${error.message}`);
    return Array.isArray(data) ? data : [];
  }

  async getCourseByCompetencyTargetName(competencyTargetName) {
    const { data, error } = await this.client
      .from('courses')
      .select('*')
      .eq('competency_target_name', competencyTargetName)
      .maybeSingle();

    if (error) throw new Error(`Failed to get course: ${error.message}`);
    return data || null;
  }
}

export const processHandler = new ProcessHandler();


