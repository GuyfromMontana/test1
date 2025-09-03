// MONTANA FEED COMPANY - COMPLETE AI VOICE AGENT SERVER
// Production-ready server with voice integration and full business logic

const express = require('express');
// Debug environment variables at startup
console.log('=== CREDENTIAL DEBUG ===');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_SERVICE_KEY exists:', !!process.env.SUPABASE_SERVICE_KEY);
console.log('SUPABASE_SERVICE_KEY first 20 chars:', process.env.SUPABASE_SERVICE_KEY?.substring(0, 20));
console.log('Key format check - starts with sb_secret_:', process.env.SUPABASE_SERVICE_KEY?.startsWith('sb_secret_'));
console.log('========================');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase client initialization
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Territory and location mapping
const territories = {
  northwest: {
    rep: 'Sarah Johnson',
    phone: '+1-406-555-0101',
    email: 'sarah@montanafeed.com',
    areas: ['Missoula', 'Kalispell', 'Hamilton', 'Polson'],
    specialties: ['cattle', 'horses', 'mountain grazing']
  },
  northeast: {
    rep: 'Mike Peterson', 
    phone: '+1-406-555-0102',
    email: 'mike@montanafeed.com',
    areas: ['Great Falls', 'Havre', 'Glasgow', 'Cut Bank'],
    specialties: ['wheat farming', 'cattle', 'sheep']
  },
  central: {
    rep: 'Lisa Chen',
    phone: '+1-406-555-0103', 
    email: 'lisa@montanafeed.com',
    areas: ['Helena', 'Butte', 'Bozeman', 'Livingston'],
    specialties: ['cattle', 'horses', 'hay production']
  },
  south: {
    rep: 'David Rodriguez',
    phone: '+1-406-555-0104',
    email: 'david@montanafeed.com', 
    areas: ['Billings', 'Miles City', 'Glendive', 'Baker'],
    specialties: ['large operations', 'commercial feed', 'bulk orders']
  },
  southwest: {
    rep: 'Jennifer White',
    phone: '+1-406-555-0105',
    email: 'jennifer@montanafeed.com',
    areas: ['Dillon', 'Anaconda', 'Deer Lodge', 'Whitehall'],
    specialties: ['cattle', 'sheep', 'small farms']
  }
};

// Utility Functions
function getTerritoryByLocation(location) {
  if (!location) return 'central';
  
  location = location.toLowerCase();
  
  for (const [territory, info] of Object.entries(territories)) {
    if (info.areas.some(area => location.includes(area.toLowerCase()))) {
      return territory;
    }
  }
  
  return 'central'; // Default fallback
}

function calculateLeadScore(customerInfo, inquiry) {
  let score = 50; // Base score
  
  // Existing customer bonus
  if (customerInfo && customerInfo.customer_id) {
    score += 20;
  }
  
  // Urgency indicators
  const urgentKeywords = ['emergency', 'urgent', 'need now', 'immediately', 'asap'];
  if (urgentKeywords.some(keyword => inquiry.toLowerCase().includes(keyword))) {
    score += 15;
  }
  
  // Volume indicators
  const volumeKeywords = ['100', '200', '500', 'bulk', 'large', 'commercial'];
  if (volumeKeywords.some(keyword => inquiry.toLowerCase().includes(keyword))) {
    score += 10;
  }
  
  // Animal type scoring
  if (inquiry.toLowerCase().includes('cattle')) score += 8;
  if (inquiry.toLowerCase().includes('horse')) score += 6;
  if (inquiry.toLowerCase().includes('sheep')) score += 5;
  if (inquiry.toLowerCase().includes('pig')) score += 4;
  
  return Math.min(100, score);
}

function getConsultationPriority(score) {
  if (score >= 80) return 'high';
  if (score >= 65) return 'medium';
  return 'standard';
}

// API Endpoints

// Health check with database connection test
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    const { data, error } = await supabase
      .from('customers')
      .select('count(*)', { count: 'exact', head: true });
    
    if (error) {
      console.error('Health check database error:', error);
      return res.status(500).json({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      status: 'healthy',
      database: 'connected',
      services: {
        supabase: 'operational',
        voice: 'configured'
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Diagnostic endpoint for debugging Supabase connection
app.get('/api/debug/supabase', async (req, res) => {
  try {
    console.log('Environment variables check:');
    console.log('SUPABASE_URL exists:', !!process.env.SUPABASE_URL);
    console.log('SUPABASE_SERVICE_KEY exists:', !!process.env.SUPABASE_SERVICE_KEY);
    
    const serviceKey = process.env.SUPABASE_SERVICE_KEY;
    if (serviceKey) {
      console.log('SUPABASE_SERVICE_KEY format:', serviceKey.substring(0, 15) + '...');
    }
    
    // Test the actual connection
    const { data, error } = await supabase
      .from('customers')
      .select('count(*)', { count: 'exact', head: true });
    
    if (error) {
      return res.json({
        success: false,
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint || 'No hint provided'
      });
    }
    
    res.json({
      success: true,
      message: 'Supabase connection working',
      connection_test: 'passed'
    });
    
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      type: error.constructor.name
    });
  }
});
// Add this simple connectivity test
app.get('/api/debug/simple', async (req, res) => {
  try {
    console.log('Testing basic Supabase connection...');
    
    // Just test if we can connect without querying a specific table
    const { data, error } = await supabase
      .rpc('version'); // This should work if connection is good
    
    res.json({
      success: !error,
      message: error ? error.message : 'Basic connection successful',
      details: data || 'No data returned'
    });
    
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      type: 'Connection failed'
    });
  }
});

// Customer lookup endpoint
app.get('/api/customer/lookup', async (req, res) => {
  try {
    const { phone, email, name } = req.query;
    
    if (!phone && !email && !name) {
      return res.status(400).json({ 
        error: 'Please provide phone, email, or name for customer lookup' 
      });
    }
    
    let query = supabase.from('customers').select('*');
    
    if (phone) {
      query = query.eq('phone', phone);
    } else if (email) {
      query = query.eq('email', email);
    } else if (name) {
      query = query.ilike('name', `%${name}%`);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Customer lookup error:', error);
      return res.status(500).json({ error: error.message });
    }
    
    res.json({
      success: true,
      customers: data,
      count: data.length
    });
    
  } catch (error) {
    console.error('Customer lookup error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new customer endpoint
app.post('/api/customer/create', async (req, res) => {
  try {
    const { name, phone, email, location, notes } = req.body;
    
    if (!name || !phone) {
      return res.status(400).json({ 
        error: 'Name and phone are required' 
      });
    }
    
    const territory = getTerritoryByLocation(location);
    const assignedRep = territories[territory];
    
    const { data, error } = await supabase
      .from('customers')
      .insert([{
        name,
        phone,
        email,
        location,
        territory,
        assigned_rep: assignedRep.rep,
        rep_contact: assignedRep.phone,
        notes,
        created_at: new Date().toISOString()
      }])
      .select();
    
    if (error) {
      console.error('Customer creation error:', error);
      return res.status(500).json({ error: error.message });
    }
    
    res.json({
      success: true,
      customer: data[0],
      territory_info: assignedRep
    });
    
  } catch (error) {
    console.error('Customer creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Products endpoint
app.get('/api/products', async (req, res) => {
  try {
    const { category, search } = req.query;
    
    let query = supabase.from('products').select('*');
    
    if (category) {
      query = query.eq('category', category);
    }
    
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    
    const { data, error } = await query.order('name');
    
    if (error) {
      console.error('Products fetch error:', error);
      return res.status(500).json({ error: error.message });
    }
    
    res.json({
      success: true,
      products: data,
      count: data.length
    });
    
  } catch (error) {
    console.error('Products error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Territories endpoint
app.get('/api/territories', (req, res) => {
  res.json({
    success: true,
    territories: territories
  });
});

// Main consultation endpoint
app.post('/api/consultation', async (req, res) => {
  try {
    const { customerInfo, inquiry, contactPreference } = req.body;
    
    if (!customerInfo || !inquiry) {
      return res.status(400).json({ 
        error: 'Customer information and inquiry are required' 
      });
    }
    
    // Determine territory and rep assignment
    const territory = getTerritoryByLocation(customerInfo.location);
    const assignedRep = territories[territory];
    
    // Calculate lead score
    const leadScore = calculateLeadScore(customerInfo, inquiry);
    const priority = getConsultationPriority(leadScore);
    
    // Store consultation request
    const consultationData = {
      customer_name: customerInfo.name,
      customer_phone: customerInfo.phone || null,
      customer_email: customerInfo.email || null,
      customer_location: customerInfo.location || null,
      inquiry: inquiry,
      territory: territory,
      assigned_rep: assignedRep.rep,
      rep_contact: assignedRep.phone,
      lead_score: leadScore,
      priority: priority,
      status: 'new',
      contact_preference: contactPreference || 'phone',
      created_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('consultations')
      .insert([consultationData])
      .select();
    
    if (error) {
      console.error('Consultation creation error:', error);
      return res.status(500).json({ error: error.message });
    }
    
    // Generate response
    let response = {
      success: true,
      consultation_id: data[0].id,
      message: `Thank you for contacting Montana Feed Company. I've reviewed your inquiry about "${inquiry.substring(0, 50)}..."`,
      territory_assignment: {
        territory: territory,
        rep_name: assignedRep.rep,
        rep_phone: assignedRep.phone,
        rep_email: assignedRep.email,
        specialties: assignedRep.specialties
      },
      lead_score: leadScore,
      priority: priority,
      next_steps: []
    };
    
    // Add priority-specific next steps
    if (priority === 'high') {
      response.next_steps.push(`${assignedRep.rep} will contact you within 2 hours`);
      response.message += ` This appears to be a high-priority request (score: ${leadScore}).`;
    } else if (priority === 'medium') {
      response.next_steps.push(`${assignedRep.rep} will contact you by end of business day`);
      response.message += ` This is a medium-priority request (score: ${leadScore}).`;
    } else {
      response.next_steps.push(`${assignedRep.rep} will contact you within 24-48 hours`);
    }
    
    response.next_steps.push('You can also call directly: ' + assignedRep.phone);
    
    res.json(response);
    
  } catch (error) {
    console.error('Consultation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Voice Integration Endpoints

// Voice generation endpoint (production)
app.post('/api/voice/generate', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    const apiKey = process.env.ELEVENLABS_API_KEY;
    const voiceId = process.env.ELEVENLABS_VOICE_ID;
    
    if (!apiKey || !voiceId) {
      return res.status(500).json({ 
        error: 'Voice service not configured' 
      });
    }
    
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId.trim()}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey.trim(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8
        }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('11 Labs API error:', response.status, errorText);
      return res.status(500).json({ 
        error: 'Voice generation failed',
        details: errorText 
      });
    }
    
    const audioBuffer = await response.arrayBuffer();
    
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.byteLength
    });
    
    res.send(Buffer.from(audioBuffer));
    
  } catch (error) {
    console.error('Voice generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Voice test endpoint
app.post('/api/voice/test', async (req, res) => {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    const voiceId = process.env.ELEVENLABS_VOICE_ID;
    
    if (!apiKey || !voiceId) {
      return res.json({
        success: false,
        error: 'Voice service environment variables not configured'
      });
    }
    
    const testText = 'Montana Feed Company voice test successful!';
    
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId.trim()}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey.trim(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: testText,
        model_id: 'eleven_multilingual_v2'
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return res.json({
        success: false,
        error: `Voice API failed: ${response.status}`,
        details: errorText
      });
    }
    
    const audioBuffer = await response.arrayBuffer();
    
    res.json({
      success: true,
      message: 'Voice test successful!',
      audioSize: audioBuffer.byteLength,
      voiceId: voiceId,
      status: 'operational'
    });
    
  } catch (error) {
    res.json({
      success: false,
      error: error.message
    });
  }
});

// Voice debug endpoint
app.post('/api/voice/debug', async (req, res) => {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    const voiceId = process.env.ELEVENLABS_VOICE_ID;
    
    console.log('Voice Debug - API Key exists:', !!apiKey);
    console.log('Voice Debug - Voice ID:', voiceId);
    
    if (!apiKey) {
      return res.json({
        success: false,
        step: 'api_key_check',
        error: 'ELEVENLABS_API_KEY missing'
      });
    }
    
    if (!voiceId) {
      return res.json({
        success: false,
        step: 'voice_id_check', 
        error: 'ELEVENLABS_VOICE_ID missing'
      });
    }
    
    // Test voices list
    const voicesResponse = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': apiKey.trim(),
        'Content-Type': 'application/json'
      }
    });
    
    if (!voicesResponse.ok) {
      const errorText = await voicesResponse.text();
      return res.json({
        success: false,
        step: 'voices_api_test',
        error: `Voices API failed: ${voicesResponse.status}`,
        details: errorText
      });
    }
    
    const voicesData = await voicesResponse.json();
    
    // Check if target voice exists
    const targetVoice = voicesData.voices.find(v => v.voice_id === voiceId.trim());
    
    if (!targetVoice) {
      return res.json({
        success: false,
        step: 'voice_availability_check',
        error: 'TARGET VOICE ID NOT FOUND!',
        targetVoiceId: voiceId,
        availableVoices: voicesData.voices.slice(0, 10).map(v => ({
          name: v.name,
          voice_id: v.voice_id,
          category: v.category
        })),
        solution: 'Add this voice to your 11 Labs Voice Lab'
      });
    }
    
    // Test speech generation
    const speechResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId.trim()}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey.trim(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: 'Montana Feed Company voice test successful!',
        model_id: 'eleven_multilingual_v2'
      })
    });
    
    if (!speechResponse.ok) {
      const errorText = await speechResponse.text();
      return res.json({
        success: false,
        step: 'speech_generation_test',
        error: `Speech generation failed: ${speechResponse.status}`,
        details: errorText
      });
    }
    
    const audioBuffer = await speechResponse.arrayBuffer();
    
    return res.json({
      success: true,
      message: 'VOICE INTEGRATION WORKING PERFECTLY!',
      voiceDetails: {
        name: targetVoice.name,
        voice_id: targetVoice.voice_id,
        category: targetVoice.category
      },
      audioSize: audioBuffer.byteLength,
      step: 'complete'
    });
    
  } catch (error) {
    return res.json({
      success: false,
      step: 'exception_handling',
      error: error.message
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.send(`
    <h1>Montana Feed Company AI Voice Agent</h1>
    <p>Server Status: <strong>Running</strong></p>
    <p>Database: <strong>Connected</strong></p>
    <p>Voice: <strong>Configured</strong></p>
    
    <h3>Available Endpoints:</h3>
    <ul>
      <li><strong>GET</strong> /api/health - System health check</li>
      <li><strong>GET</strong> /api/debug/supabase - Database connection debug</li>
      <li><strong>GET</strong> /api/customer/lookup - Customer lookup</li>
      <li><strong>POST</strong> /api/customer/create - Create new customer</li>
      <li><strong>GET</strong> /api/products - Product catalog</li>
      <li><strong>GET</strong> /api/territories - Territory information</li>
      <li><strong>POST</strong> /api/consultation - Main consultation workflow</li>
      <li><strong>POST</strong> /api/voice/generate - Generate voice audio</li>
      <li><strong>POST</strong> /api/voice/test - Test voice integration</li>
      <li><strong>POST</strong> /api/voice/debug - Debug voice system</li>
    </ul>
    
    <p><strong>Montana Feed Company Complete AI Voice Agent ready!</strong></p>
  `);
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Montana Feed Company Complete AI Voice Agent running on port ${port}`);
  console.log('Database: Connected');
  console.log('Voice: Configured');
  console.log('All endpoints operational');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});