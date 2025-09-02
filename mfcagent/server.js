
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    message: 'Server is running!',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.send('Montana Feed Company Server is running!');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});t setup
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

// Environment variable debugging for voice integration
function debugEnvironmentVars() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  
  console.log('=== ENVIRONMENT VARIABLE DEBUG ===');
  console.log('API Key exists:', !!apiKey);
  console.log('API Key length:', apiKey ? apiKey.length : 0);
  console.log('API Key first 10 chars:', apiKey ? apiKey.substring(0, 10) : 'N/A');
  console.log('API Key has whitespace:', apiKey ? /\s/.test(apiKey) : false);
  console.log('Voice ID exists:', !!voiceId);
  console.log('Voice ID:', voiceId);
  console.log('Voice ID length:', voiceId ? voiceId.length : 0);
  console.log('Voice ID has whitespace:', voiceId ? /\s/.test(voiceId) : false);
  console.log('Voice ID bytes:', voiceId ? Buffer.from(voiceId).toString('hex') : 'N/A');
  console.log('===================================');
  
  return { 
    apiKey: apiKey ? apiKey.trim() : null, 
    voiceId: voiceId ? voiceId.trim() : null 
  };
}

// Calculate lead score based on customer interaction
function calculateLeadScore(customer, inquiry) {
  let score = 50; // Base score
  
  // Customer factors
  if (customer) {
    if (customer.purchase_history && customer.purchase_history.length > 0) {
      score += 20; // Existing customer
    }
    if (customer.total_spent && customer.total_spent > 10000) {
      score += 15; // High value customer
    }
  }
  
  // Inquiry factors
  if (inquiry) {
    const urgentKeywords = ['urgent', 'asap', 'emergency', 'immediately', 'crisis'];
    const highValueKeywords = ['bulk', 'large order', 'contract', 'partnership'];
    const budgetKeywords = ['budget', 'price', 'cost', 'quote'];
    
    const text = inquiry.toLowerCase();
    
    if (urgentKeywords.some(keyword => text.includes(keyword))) {
      score += 25;
    }
    if (highValueKeywords.some(keyword => text.includes(keyword))) {
      score += 20;
    }
    if (budgetKeywords.some(keyword => text.includes(keyword))) {
      score += 10;
    }
  }
  
  return Math.min(100, Math.max(0, score));
}

// Get territory assignment based on location
function getTerritoryByLocation(location) {
  const territories = {
    'northwest': { 
      rep: 'Sarah Johnson', 
      phone: '(406) 555-0101',
      email: 'sarah.johnson@mfcompany.com',
      coverage: ['Missoula', 'Kalispell', 'Whitefish', 'Columbia Falls'] 
    },
    'northeast': { 
      rep: 'Mike Peterson', 
      phone: '(406) 555-0102',
      email: 'mike.peterson@mfcompany.com',
      coverage: ['Great Falls', 'Havre', 'Glasgow', 'Malta'] 
    },
    'central': { 
      rep: 'Lisa Chen', 
      phone: '(406) 555-0103',
      email: 'lisa.chen@mfcompany.com',
      coverage: ['Helena', 'Butte', 'Bozeman', 'Livingston'] 
    },
    'south': { 
      rep: 'David Rodriguez', 
      phone: '(406) 555-0104',
      email: 'david.rodriguez@mfcompany.com',
      coverage: ['Billings', 'Miles City', 'Glendive', 'Sidney'] 
    },
    'southwest': { 
      rep: 'Jennifer White', 
      phone: '(406) 555-0105',
      email: 'jennifer.white@mfcompany.com',
      coverage: ['Missoula', 'Hamilton', 'Dillon', 'Anaconda'] 
    }
  };
  
  // Simple location matching - in production, use more sophisticated geo-lookup
  const loc = location.toLowerCase();
  
  for (const [territory, info] of Object.entries(territories)) {
    if (info.coverage.some(city => loc.includes(city.toLowerCase()))) {
      return { territory, ...info };
    }
  }
  
  // Default to central territory
  return { territory: 'central', ...territories.central };
}

// Generate consultation recommendations
function generateConsultationRecommendations(customer, inquiry, leadScore) {
  const recommendations = [];
  
  // Base recommendations
  if (leadScore >= 80) {
    recommendations.push({
      priority: 'HIGH',
      action: 'Immediate personal consultation',
      timeline: 'Within 24 hours',
      reason: 'High-value lead with urgent needs'
    });
  } else if (leadScore >= 60) {
    recommendations.push({
      priority: 'MEDIUM',
      action: 'Scheduled consultation call',
      timeline: 'Within 3 business days',
      reason: 'Qualified lead requiring personalized attention'
    });
  } else {
    recommendations.push({
      priority: 'STANDARD',
      action: 'Email follow-up with resources',
      timeline: 'Within 1 week',
      reason: 'General inquiry, provide educational materials'
    });
  }
  
  // Product-specific recommendations
  const inquiryText = inquiry ? inquiry.toLowerCase() : '';
  
  if (inquiryText.includes('cattle') || inquiryText.includes('beef')) {
    recommendations.push({
      priority: 'PRODUCT',
      action: 'Cattle nutrition consultation',
      products: ['High-energy cattle feed', 'Mineral supplements', 'Pasture management'],
      specialist: 'Cattle nutrition expert'
    });
  }
  
  if (inquiryText.includes('horse') || inquiryText.includes('equine')) {
    recommendations.push({
      priority: 'PRODUCT',
      action: 'Equine feed consultation',
      products: ['Premium horse feed', 'Performance supplements', 'Hay quality assessment'],
      specialist: 'Equine nutrition specialist'
    });
  }
  
  return recommendations;
}

// =============================================================================
// CORE API ENDPOINTS
// =============================================================================

// Health check
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    const { data, error } = await supabase.from('customers').select('count').limit(1);
    
    if (error) throw error;
    
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      database: 'connected',
      services: {
        supabase: 'operational',
        voice: process.env.ELEVENLABS_API_KEY ? 'configured' : 'not_configured'
      }
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Customer lookup and management
app.get('/api/customer/lookup', async (req, res) => {
  try {
    const { phone, email, name } = req.query;
    
    let query = supabase.from('customers').select('*');
    
    if (phone) {
      query = query.eq('phone', phone);
    } else if (email) {
      query = query.eq('email', email);
    } else if (name) {
      query = query.ilike('name', `%${name}%`);
    } else {
      return res.status(400).json({ error: 'Phone, email, or name parameter required' });
    }
    
    const { data, error } = await query.limit(10);
    
    if (error) throw error;
    
    res.json({ 
      customers: data,
      found: data.length > 0
    });
  } catch (error) {
    console.error('Customer lookup error:', error);
    res.status(500).json({ error: 'Customer lookup failed' });
  }
});

// Create new customer
app.post('/api/customer/create', async (req, res) => {
  try {
    const { name, phone, email, location, notes } = req.body;
    
    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required' });
    }
    
    const territory = getTerritoryByLocation(location || '');
    
    const customerData = {
      name,
      phone,
      email: email || null,
      location: location || null,
      territory: territory.territory,
      assigned_rep: territory.rep,
      rep_contact: territory.phone,
      notes: notes || null,
      created_at: new Date().toISOString(),
      last_contact: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('customers')
      .insert([customerData])
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ 
      success: true, 
      customer: data,
      territory: territory
    });
  } catch (error) {
    console.error('Customer creation error:', error);
    res.status(500).json({ error: 'Failed to create customer' });
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
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }
    
    const { data, error } = await query.order('name');
    
    if (error) throw error;
    
    res.json({ products: data });
  } catch (error) {
    console.error('Products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Territories endpoint
app.get('/api/territories', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('territories')
      .select('*')
      .order('territory_name');
    
    if (error) throw error;
    
    res.json({ territories: data });
  } catch (error) {
    console.error('Territories error:', error);
    res.status(500).json({ error: 'Failed to fetch territories' });
  }
});

// Consultation request - Main business logic endpoint
app.post('/api/consultation', async (req, res) => {
  try {
    const { 
      customerInfo, 
      inquiry, 
      urgency = 'medium',
      preferredContact = 'phone',
      location 
    } = req.body;
    
    if (!customerInfo || !inquiry) {
      return res.status(400).json({ error: 'Customer info and inquiry are required' });
    }
    
    // Look up existing customer or create new one
    let customer = null;
    if (customerInfo.phone) {
      const { data } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', customerInfo.phone)
        .single();
      customer = data;
    }
    
    // Calculate lead score
    const leadScore = calculateLeadScore(customer, inquiry);
    
    // Get territory assignment
    const territory = getTerritoryByLocation(location || customerInfo.location || '');
    
    // Generate recommendations
    const recommendations = generateConsultationRecommendations(customer, inquiry, leadScore);
    
    // Create consultation record
    const consultationData = {
      customer_phone: customerInfo.phone,
      customer_name: customerInfo.name,
      customer_email: customerInfo.email || null,
      inquiry: inquiry,
      urgency: urgency,
      lead_score: leadScore,
      territory: territory.territory,
      assigned_rep: territory.rep,
      status: 'new',
      preferred_contact: preferredContact,
      created_at: new Date().toISOString()
    };
    
    const { data: consultation, error } = await supabase
      .from('consultations')
      .insert([consultationData])
      .select()
      .single();
    
    if (error) throw error;
    
    // Update customer record if exists
    if (customer) {
      await supabase
        .from('customers')
        .update({ 
          last_contact: new Date().toISOString(),
          notes: `${customer.notes || ''}\n[${new Date().toLocaleDateString()}] New consultation: ${inquiry.substring(0, 100)}...`
        })
        .eq('id', customer.id);
    }
    
    res.json({
      success: true,
      consultation: consultation,
      leadScore: leadScore,
      territory: territory,
      recommendations: recommendations,
      nextSteps: {
        immediate: leadScore >= 80 ? 'High priority - immediate callback' : 'Standard processing',
        timeline: leadScore >= 80 ? '< 4 hours' : '1-2 business days',
        assignedRep: territory.rep,
        contactInfo: {
          phone: territory.phone,
          email: territory.email
        }
      }
    });
    
  } catch (error) {
    console.error('Consultation error:', error);
    res.status(500).json({ error: 'Failed to process consultation request' });
  }
});

// =============================================================================
// VOICE INTEGRATION - COMPREHENSIVE DEBUG SYSTEM
// =============================================================================

// Comprehensive voice debug endpoint
app.post('/api/voice/debug', async (req, res) => {
  try {
    console.log('\n🔧 STARTING COMPREHENSIVE VOICE DEBUG');
    
    const { apiKey, voiceId } = debugEnvironmentVars();
    
    if (!apiKey) {
      return res.json({ 
        success: false, 
        error: 'ELEVENLABS_API_KEY missing',
        step: 'env_check'
      });
    }
    
    if (!voiceId) {
      return res.json({ 
        success: false, 
        error: 'ELEVENLABS_VOICE_ID missing', 
        step: 'env_check'
      });
    }

    // Step 1: Test API key with voices list
    console.log('\n📋 STEP 1: Testing API key with voices list...');
    const voicesUrl = 'https://api.elevenlabs.io/v1/voices';
    const voicesHeaders = {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json'
    };
    
    console.log('Voices URL:', voicesUrl);
    console.log('Voices Headers:', JSON.stringify(voicesHeaders, null, 2));
    
    const voicesResponse = await fetch(voicesUrl, {
      method: 'GET',
      headers: voicesHeaders
    });
    
    console.log('Voices Response Status:', voicesResponse.status);
    console.log('Voices Response Headers:', Object.fromEntries(voicesResponse.headers.entries()));
    
    if (!voicesResponse.ok) {
      const errorText = await voicesResponse.text();
      console.log('❌ Voices API Error:', errorText);
      return res.json({
        success: false,
        error: `Voices API failed: ${voicesResponse.status}`,
        details: errorText,
        step: 'voices_list'
      });
    }
    
    const voicesData = await voicesResponse.json();
    console.log(`✅ Found ${voicesData.voices.length} voices`);
    
    // Step 2: Check if target voice exists
    console.log('\n🎯 STEP 2: Checking if target voice exists...');
    const targetVoice = voicesData.voices.find(v => v.voice_id === voiceId);
    
    if (!targetVoice) {
      console.log('❌ Target voice not found!');
      console.log('Available voices (first 10):');
      voicesData.voices.slice(0, 10).forEach((v, i) => {
        console.log(`${i + 1}. ${v.name} (${v.voice_id}) - ${v.category}`);
      });
      
      return res.json({
        success: false,
        error: 'Target voice ID not found in your available voices',
        targetVoiceId: voiceId,
        availableVoices: voicesData.voices.slice(0, 10).map(v => ({
          name: v.name,
          voice_id: v.voice_id,
          category: v.category
        })),
        step: 'voice_check',
        recommendation: 'Use one of the available voice IDs or add the target voice to your Voice Lab'
      });
    }
    
    console.log(`✅ Target voice found: ${targetVoice.name} (${targetVoice.category})`);
    
    // Step 3: Test voice metadata endpoint
    console.log('\n📝 STEP 3: Testing voice metadata endpoint...');
    const voiceMetaUrl = `https://api.elevenlabs.io/v1/voices/${voiceId}`;
    const voiceMetaHeaders = {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json'
    };
    
    console.log('Voice Meta URL:', voiceMetaUrl);
    console.log('Voice Meta Headers:', JSON.stringify(voiceMetaHeaders, null, 2));
    
    const voiceMetaResponse = await fetch(voiceMetaUrl, {
      method: 'GET',
      headers: voiceMetaHeaders
    });
    
    console.log('Voice Meta Response Status:', voiceMetaResponse.status);
    
    if (!voiceMetaResponse.ok) {
      const errorText = await voiceMetaResponse.text();
      console.log('❌ Voice Meta Error:', errorText);
      return res.json({
        success: false,
        error: `Voice metadata failed: ${voiceMetaResponse.status}`,
        details: errorText,
        step: 'voice_metadata'
      });
    }
    
    console.log('✅ Voice metadata accessible');
    
    // Step 4: Test speech generation with minimal payload
    console.log('\n🎵 STEP 4: Testing speech generation...');
    const speechUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
    const speechHeaders = {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json'
    };
    const speechBody = {
      text: "Welcome to Montana Feed Company! Your trusted partner for quality livestock feed.",
      model_id: "eleven_multilingual_v2"
    };
    
    console.log('Speech URL:', speechUrl);
    console.log('Speech Headers:', JSON.stringify(speechHeaders, null, 2));
    console.log('Speech Body:', JSON.stringify(speechBody, null, 2));
    
    const speechResponse = await fetch(speechUrl, {
      method: 'POST',
      headers: speechHeaders,
      body: JSON.stringify(speechBody)
    });
    
    console.log('Speech Response Status:', speechResponse.status);
    console.log('Speech Response Headers:', Object.fromEntries(speechResponse.headers.entries()));
    
    if (!speechResponse.ok) {
      const errorText = await speechResponse.text();
      console.log('❌ Speech Generation Error:', errorText);
      
      // Try to parse error details
      let errorDetails;
      try {
        errorDetails = JSON.parse(errorText);
      } catch (e) {
        errorDetails = { raw: errorText };
      }
      
      return res.json({
        success: false,
        error: `Speech generation failed: ${speechResponse.status}`,
        details: errorDetails,
        step: 'speech_generation',
        debugInfo: {
          url: speechUrl,
          headers: speechHeaders,
          body: speechBody,
          responseStatus: speechResponse.status,
          responseHeaders: Object.fromEntries(speechResponse.headers.entries())
        }
      });
    }
    
    const audioBuffer = await speechResponse.arrayBuffer();
    console.log(`✅ Speech generated successfully! Audio size: ${audioBuffer.byteLength} bytes`);
    
    return res.json({
      success: true,
      message: '🎉 ALL TESTS PASSED! Voice integration working perfectly!',
      voiceDetails: {
        name: targetVoice.name,
        voice_id: targetVoice.voice_id,
        category: targetVoice.category
      },
      audioSize: audioBuffer.byteLength,
      step: 'complete'
    });
    
  } catch (error) {
    console.error('🚨 DEBUG ERROR:', error);
    return res.json({
      success: false,
      error: error.message,
      stack: error.stack,
      step: 'exception'
    });
  }
});

// Official 11 Labs library test
app.post('/api/voice/official-test', async (req, res) => {
  try {
    console.log('\n🏢 TESTING WITH OFFICIAL 11 LABS LIBRARY');
    
    // Note: You'll need to: npm install @elevenlabs/elevenlabs-js
    const { ElevenLabsClient } = require('@elevenlabs/elevenlabs-js');
    
    const { apiKey, voiceId } = debugEnvironmentVars();
    
    const elevenlabs = new ElevenLabsClient({
      apiKey: apiKey
    });
    
    // Test with official library
    const audio = await elevenlabs.textToSpeech.convert(voiceId, {
      text: "Montana Feed Company - Testing with official 11 Labs library!",
      model_id: "eleven_multilingual_v2"
    });
    
    const audioBuffer = await audio.arrayBuffer();
    
    console.log(`✅ Official library success! Audio size: ${audioBuffer.byteLength} bytes`);
    
    return res.json({
      success: true,
      message: 'Official 11 Labs library working perfectly!',
      audioSize: audioBuffer.byteLength,
      method: 'official_library'
    });
    
  } catch (error) {
    console.error('Official library error:', error);
    return res.json({
      success: false,
      error: error.message,
      method: 'official_library',
      note: 'Install @elevenlabs/elevenlabs-js if not installed'
    });
  }
});

// Production voice generation endpoint
app.post('/api/voice/generate', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    const { apiKey, voiceId } = debugEnvironmentVars();
    
    if (!apiKey || !voiceId) {
      return res.status(500).json({ error: 'Missing API credentials' });
    }
    
    // Clean and validate inputs
    const cleanText = text.toString().trim();
    const cleanVoiceId = voiceId.trim();
    const cleanApiKey = apiKey.trim();
    
    console.log(`Generating speech for: "${cleanText.substring(0, 50)}..."`);
    console.log(`Using voice: ${cleanVoiceId}`);
    
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${cleanVoiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': cleanApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: cleanText,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.6,
          similarity_boost: 0.8,
          style: 0.2,
          use_speaker_boost: true
        }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Voice generation failed:', response.status, errorText);
      return res.status(response.status).json({ 
        error: 'Voice generation failed',
        details: errorText 
      });
    }
    
    const audioBuffer = await response.arrayBuffer();
    
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.byteLength);
    res.send(Buffer.from(audioBuffer));
    
    console.log(`✅ Speech generated successfully: ${audioBuffer.byteLength} bytes`);
    
  } catch (error) {
    console.error('Voice generation error:', error);
    res.status(500).json({ error: 'Voice generation failed' });
  }
});

// Enhanced original voice test
app.post('/api/voice/test', async (req, res) => {
  try {
    console.log('\n🧪 ENHANCED VOICE TEST');
    
    const { apiKey, voiceId } = debugEnvironmentVars();
    
    const testVoiceId = voiceId ? voiceId.trim() : '21m00Tcm4TlvDq8ikWAM'; // Fallback to Rachel
    const testApiKey = apiKey ? apiKey.trim() : '';
    
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${testVoiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': testApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: "Montana Feed Company voice integration test successful!",
        model_id: 'eleven_multilingual_v2'
      })
    });
    
    if (response.ok) {
      const audioBuffer = await response.arrayBuffer();
      return res.json({
        success: true,
        message: "Voice integration test successful!",
        audioSize: audioBuffer.byteLength,
        voiceUsed: testVoiceId
      });
    } else {
      const errorText = await response.text();
      return res.json({
        success: false,
        message: `Voice test failed: ${response.status}`,
        error: errorText,
        voiceUsed: testVoiceId
      });
    }
    
  } catch (error) {
    return res.json({
      success: false,
      message: `Voice test failed: ${error.message}`
    });
  }
});

// =============================================================================
// CONVERSATION FLOW - AI AGENT SIMULATION
// =============================================================================

app.post('/api/conversation', async (req, res) => {
  try {
    const { message, customerPhone, context } = req.body;
    
    // This would integrate with your AI conversation logic
    // For now, returning structured response for voice generation
    
    let response = {
      text: '',
      action: 'continue',
      data: null
    };
    
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      response.text = "Hello! Welcome to Montana Feed Company. I'm here to help you with all your livestock feed needs. How can I assist you today?";
    } else if (lowerMessage.includes('feed') || lowerMessage.includes('cattle')) {
      response.text = "Great! We have excellent cattle feed options. Can you tell me about your operation? How many head of cattle do you have?";
    } else if (lowerMessage.includes('horse') || lowerMessage.includes('equine')) {
      response.text = "Perfect! We specialize in premium horse feed and equine nutrition. What type of horses do you have, and what are you currently feeding them?";
    } else if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
      response.text = "I'd be happy to get you pricing information. Let me connect you with our sales representative who can provide you with the most current pricing and volume discounts. What's the best number to reach you at?";
      response.action = 'transfer_to_sales';
    } else {
      response.text = "I understand. Let me make sure I get you connected with the right person who can help. Can you tell me a bit more about what you're looking for?";
    }
    
    res.json(response);
    
  } catch (error) {
    console.error('Conversation error:', error);
    res.status(500).json({ error: 'Conversation processing failed' });
  }
});

// =============================================================================
// SERVER STARTUP
// =============================================================================

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Montana Feed Company AI Voice Agent Server running on port ${port}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️ Database: ${process.env.SUPABASE_URL ? 'Connected' : 'Not configured'}`);
  console.log(`🎤 Voice: ${process.env.ELEVENLABS_API_KEY ? 'Configured' : 'Not configured'}`);
  console.log(`\n🔧 Available endpoints:`);
  console.log(`   GET  /api/health - Health check`);
  console.log(`   GET  /api/customer/lookup - Customer lookup`);
  console.log(`   POST /api/customer/create - Create customer`);
  console.log(`   GET  /api/products - Products catalog`);
  console.log(`   GET  /api/territories - Territory info`);
  console.log(`   POST /api/consultation - Main consultation logic`);
  console.log(`   POST /api/conversation - AI conversation flow`);
  console.log(`   \n🎤 Voice endpoints:`);
  console.log(`   POST /api/voice/debug - Comprehensive voice debug`);
  console.log(`   POST /api/voice/test - Enhanced voice test`);
  console.log(`   POST /api/voice/official-test - Official library test`);
  console.log(`   POST /api/voice/generate - Production voice generation`);
  console.log(`\n✅ Montana Feed Company AI Voice Agent ready!`);
});
