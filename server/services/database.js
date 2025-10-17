const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service key for admin operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

// Database connection test
async function connectDatabase() {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist yet
      throw error;
    }
    console.log('✅ Supabase connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    return false;
  }
}

// Graceful shutdown (not needed for Supabase but keeping for compatibility)
async function disconnectDatabase() {
  console.log('🔌 Supabase connection closed');
}

// User operations
const userService = {
  async createUser(email, passwordHash) {
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          email,
          password_hash: passwordHash,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async findUserByEmail(email) {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        devices (*)
      `)
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') {
      return null; // User not found
    }
    
    // Transform to match expected format
    if (data) {
      return {
        ...data,
        passwordHash: data.password_hash,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    }
    return data;
  },

  async findUserById(id) {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        devices (*)
      `)
      .eq('id', id)
      .single();

    if (error) return null;
    
    // Transform to match expected format
    if (data) {
      return {
        ...data,
        passwordHash: data.password_hash,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    }
    return data;
  },
};

// Device operations
const deviceService = {
  async createDevice(userId, name, deviceApiKey, viewerApiKey) {
    const { data, error } = await supabase
      .from('devices')
      .insert([
        {
          user_id: userId,
          name,
          device_api_key: deviceApiKey,
          viewer_api_key: viewerApiKey,
          is_online: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async findDeviceByApiKey(apiKey, type = 'device') {
    const column = type === 'device' ? 'device_api_key' : 'viewer_api_key';
    
    const { data, error } = await supabase
      .from('devices')
      .select(`
        *,
        users (*)
      `)
      .eq(column, apiKey)
      .single();

    if (error) return null;
    
    // Transform to match Prisma structure
    return {
      ...data,
      user: data.users,
      deviceApiKey: data.device_api_key,
      viewerApiKey: data.viewer_api_key,
      isOnline: data.is_online,
      lastActive: data.last_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      userId: data.user_id
    };
  },

  async findDeviceById(id) {
    const { data, error } = await supabase
      .from('devices')
      .select(`
        *,
        users (*)
      `)
      .eq('id', id)
      .single();

    if (error) return null;
    
    // Transform to match Prisma structure
    return {
      ...data,
      user: data.users,
      deviceApiKey: data.device_api_key,
      viewerApiKey: data.viewer_api_key,
      isOnline: data.is_online,
      lastActive: data.last_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      userId: data.user_id
    };
  },

  async updateDeviceStatus(id, isOnline) {
    const { data, error } = await supabase
      .from('devices')
      .update({
        is_online: isOnline,
        last_active: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getUserDevices(userId) {
    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Transform to match Prisma structure
    return data.map(device => ({
      ...device,
      deviceApiKey: device.device_api_key,
      viewerApiKey: device.viewer_api_key,
      isOnline: device.is_online,
      lastActive: device.last_active,
      createdAt: device.created_at,
      updatedAt: device.updated_at,
      userId: device.user_id
    }));
  },

  async deleteDevice(id, userId) {
    const { error } = await supabase
      .from('devices')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    return { count: 1 }; // Supabase doesn't return count, but we assume success
  },

  async regenerateApiKeys(id, userId, deviceApiKey, viewerApiKey) {
    const { data, error } = await supabase
      .from('devices')
      .update({
        device_api_key: deviceApiKey,
        viewer_api_key: viewerApiKey,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select();

    if (error) throw error;
    return { count: data.length };
  },
};

// Stream session operations
const streamService = {
  async startSession(deviceId) {
    const { data, error } = await supabase
      .from('stream_sessions')
      .insert([
        {
          device_id: deviceId,
          started_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async endSession(deviceId) {
    const { data, error } = await supabase
      .from('stream_sessions')
      .update({
        ended_at: new Date().toISOString()
      })
      .eq('device_id', deviceId)
      .is('ended_at', null)
      .select();

    if (error) throw error;
    return data;
  },

  async getActiveSession(deviceId) {
    const { data, error } = await supabase
      .from('stream_sessions')
      .select('*')
      .eq('device_id', deviceId)
      .is('ended_at', null)
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') return null;
    return data;
  },
};

// Custom Scripts operations
const customScriptService = {
  async createScript(userId, deviceId, name, description, scriptContent, scriptType = 'python') {
    const { data, error } = await supabase
      .from('custom_scripts')
      .insert([
        {
          user_id: userId,
          device_id: deviceId,
          name,
          description,
          script_content: scriptContent,
          script_type: scriptType,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getUserScripts(userId) {
    const { data, error } = await supabase
      .from('custom_scripts')
      .select(`
        *,
        devices (name)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(script => ({
      ...script,
      deviceName: script.devices?.name,
      createdAt: script.created_at,
      updatedAt: script.updated_at,
      userId: script.user_id,
      deviceId: script.device_id,
      scriptType: script.script_type,
      scriptContent: script.script_content,
      isActive: script.is_active,
      processId: script.process_id,
      configJson: script.config_json
    }));
  },

  async getScriptById(id, userId) {
    const { data, error } = await supabase
      .from('custom_scripts')
      .select(`
        *,
        devices (name)
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) return null;
    return {
      ...data,
      deviceName: data.devices?.name,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      userId: data.user_id,
      deviceId: data.device_id,
      scriptType: data.script_type,
      scriptContent: data.script_content,
      isActive: data.is_active,
      processId: data.process_id,
      configJson: data.config_json
    };
  },

  async updateScript(id, userId, updates) {
    const { data, error } = await supabase
      .from('custom_scripts')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateScriptStatus(id, status, processId = null) {
    const { data, error } = await supabase
      .from('custom_scripts')
      .update({
        status,
        process_id: processId,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteScript(id, userId) {
    const { error } = await supabase
      .from('custom_scripts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    return { count: 1 };
  },

  async getActiveScripts() {
    const { data, error } = await supabase
      .from('custom_scripts')
      .select(`
        *,
        devices (name),
        users (email)
      `)
      .eq('is_active', true)
      .eq('status', 'running');

    if (error) throw error;
    return data;
  }
};

// Analytics operations
const analyticsService = {
  async logDetection(userId, deviceId, scriptId, detectionType, detectedCount, confidence = null, metadata = {}) {
    const { data, error } = await supabase
      .from('analytics_data')
      .insert([
        {
          user_id: userId,
          device_id: deviceId,
          script_id: scriptId,
          detection_type: detectionType,
          detected_count: detectedCount,
          confidence,
          metadata,
          timestamp: new Date().toISOString(),
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getDeviceAnalytics(deviceId, userId, timeRange = '24h') {
    let timeFilter = new Date();
    switch (timeRange) {
      case '1h':
        timeFilter.setHours(timeFilter.getHours() - 1);
        break;
      case '24h':
        timeFilter.setDate(timeFilter.getDate() - 1);
        break;
      case '7d':
        timeFilter.setDate(timeFilter.getDate() - 7);
        break;
      case '30d':
        timeFilter.setDate(timeFilter.getDate() - 30);
        break;
      default:
        timeFilter.setDate(timeFilter.getDate() - 1);
    }

    const { data, error } = await supabase
      .from('analytics_data')
      .select(`
        *,
        custom_scripts (name, script_type)
      `)
      .eq('device_id', deviceId)
      .eq('user_id', userId)
      .gte('timestamp', timeFilter.toISOString())
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return data.map(item => ({
      ...item,
      scriptName: item.custom_scripts?.name,
      scriptType: item.custom_scripts?.script_type,
      detectedCount: item.detected_count,
      detectionType: item.detection_type,
      userId: item.user_id,
      deviceId: item.device_id,
      scriptId: item.script_id,
      createdAt: item.created_at
    }));
  },

  async getAnalyticsSummary(deviceId, userId, timeRange = '24h') {
    let timeFilter = new Date();
    switch (timeRange) {
      case '1h':
        timeFilter.setHours(timeFilter.getHours() - 1);
        break;
      case '24h':
        timeFilter.setDate(timeFilter.getDate() - 1);
        break;
      case '7d':
        timeFilter.setDate(timeFilter.getDate() - 7);
        break;
      case '30d':
        timeFilter.setDate(timeFilter.getDate() - 30);
        break;
      default:
        timeFilter.setDate(timeFilter.getDate() - 1);
    }

    const { data, error } = await supabase
      .from('analytics_summary')
      .select('*')
      .eq('device_id', deviceId)
      .gte('hour', timeFilter.toISOString())
      .order('hour', { ascending: true });

    if (error) throw error;
    return data;
  },

  async getTotalDetections(deviceId, userId, timeRange = '24h') {
    let timeFilter = new Date();
    switch (timeRange) {
      case '1h':
        timeFilter.setHours(timeFilter.getHours() - 1);
        break;
      case '24h':
        timeFilter.setDate(timeFilter.getDate() - 1);
        break;
      case '7d':
        timeFilter.setDate(timeFilter.getDate() - 7);
        break;
      case '30d':
        timeFilter.setDate(timeFilter.getDate() - 30);
        break;
      default:
        timeFilter.setDate(timeFilter.getDate() - 1);
    }

    const { data, error } = await supabase
      .from('analytics_data')
      .select('detected_count')
      .eq('device_id', deviceId)
      .eq('user_id', userId)
      .gte('timestamp', timeFilter.toISOString());

    if (error) throw error;
    
    const total = data.reduce((sum, item) => sum + (item.detected_count || 0), 0);
    return { total, count: data.length };
  }
};

module.exports = {
  supabase,
  connectDatabase,
  disconnectDatabase,
  userService,
  deviceService,
  streamService,
  customScriptService,
  analyticsService,
};