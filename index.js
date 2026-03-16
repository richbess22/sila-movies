const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const axios = require('axios');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, './')));

// Supabase Client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// ==================== DATABASE SETUP ====================
async function setupDatabase() {
  try {
    // Create tables if they don't exist
    await supabase.rpc('init_database', {}).catch(async () => {
      // Create movies table
      await supabase.query(`
        CREATE TABLE IF NOT EXISTS movies (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          poster TEXT,
          backdrop TEXT,
          year INTEGER,
          rating FLOAT,
          genre TEXT[],
          duration TEXT,
          video_url TEXT,
          download_url TEXT,
          trailer_url TEXT,
          trending BOOLEAN DEFAULT FALSE,
          views INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `).catch(e => console.log('Movies table exists'));

      // Create channels table
      await supabase.query(`
        CREATE TABLE IF NOT EXISTS channels (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          logo TEXT,
          stream_url TEXT,
          category TEXT,
          status TEXT DEFAULT 'online',
          created_at TIMESTAMP DEFAULT NOW()
        );
      `).catch(e => console.log('Channels table exists'));

      // Create settings table
      await supabase.query(`
        CREATE TABLE IF NOT EXISTS settings (
          id SERIAL PRIMARY KEY,
          key TEXT UNIQUE NOT NULL,
          value TEXT,
          type TEXT DEFAULT 'text',
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `).catch(e => console.log('Settings table exists'));

      // Create users table
      await supabase.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          device_id TEXT UNIQUE,
          username TEXT,
          email TEXT,
          subscription TEXT DEFAULT 'free',
          joined_at TIMESTAMP DEFAULT NOW(),
          last_active TIMESTAMP
        );
      `).catch(e => console.log('Users table exists'));

      // Create chat_history table
      await supabase.query(`
        CREATE TABLE IF NOT EXISTS chat_history (
          id SERIAL PRIMARY KEY,
          device_id TEXT,
          role TEXT,
          content TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `).catch(e => console.log('Chat table exists'));

      // Insert default settings
      const defaultSettings = [
        { key: 'theme', value: 'dark', type: 'string' },
        { key: 'admin_pin', value: 'sila', type: 'string' },
        { key: 'ads_enabled', value: 'true', type: 'boolean' },
        { key: 'subscription_price', value: '3000', type: 'number' },
        { key: 'whatsapp_number', value: '255637351031', type: 'string' },
        { key: 'app_name', value: 'SILA MOVIES', type: 'string' },
        { key: 'total_movies', value: '0', type: 'number' }
      ];

      for (const setting of defaultSettings) {
        await supabase
          .from('settings')
          .upsert(setting, { onConflict: 'key' });
      }
    });

    console.log('✅ Database setup complete');
  } catch (error) {
    console.error('Database setup error:', error);
  }
}

setupDatabase();

// ==================== MIDDLEWARE ====================
const authenticateAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') throw new Error();
    req.admin = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

// ==================== API ROUTES ====================

// Get all movies
app.get('/api/movies', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single movie
app.get('/api/movies/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;

    // Increment views
    await supabase
      .from('movies')
      .update({ views: (data.views || 0) + 1 })
      .eq('id', req.params.id);

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get trending movies
app.get('/api/movies/trending', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .eq('trending', true)
      .order('views', { ascending: false })
      .limit(10);

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get live TV channels
app.get('/api/channels', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('channels')
      .select('*')
      .eq('status', 'online');

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Track user
app.post('/api/user/track', async (req, res) => {
  try {
    const { device_id } = req.body;
    
    const { data, error } = await supabase
      .from('users')
      .upsert({ 
        device_id, 
        last_active: new Date() 
      }, { onConflict: 'device_id' });

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.json({ success: true }); // Don't block user
  }
});

// AI Chat with history
app.post('/api/chat', async (req, res) => {
  try {
    const { message, device_id } = req.body;

    // Save user message
    await supabase
      .from('chat_history')
      .insert({ device_id, role: 'user', content: message });

    // Call AI API
    const response = await axios.get(
      `https://api.yupra.my.id/api/ai/gpt5?text=${encodeURIComponent(message)}`
    );
    
    const aiResponse = response.data?.response || 
                      response.data?.message || 
                      "I'm here to help you find movies!";

    // Save AI response
    await supabase
      .from('chat_history')
      .insert({ device_id, role: 'ai', content: aiResponse });

    // Get chat history
    const { data: history } = await supabase
      .from('chat_history')
      .select('*')
      .eq('device_id', device_id)
      .order('created_at', { ascending: false })
      .limit(20);

    res.json({ 
      response: aiResponse,
      history: history || []
    });
  } catch (error) {
    // Fallback response
    const fallback = "You can find all latest movies in the Home section!";
    res.json({ response: fallback, history: [] });
  }
});

// Get chat history
app.get('/api/chat/history/:device_id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('chat_history')
      .select('*')
      .eq('device_id', req.params.device_id)
      .order('created_at', { ascending: true })
      .limit(50);

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.json([]);
  }
});

// Get settings
app.get('/api/settings/:key', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', req.params.key)
      .single();

    if (error) throw error;
    res.json({ value: data?.value });
  } catch (error) {
    res.json({ value: null });
  }
});

// Get all settings (admin only)
app.get('/api/admin/settings', authenticateAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .order('key');

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ADMIN ROUTES ====================

// Admin login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { pin } = req.body;

    // Get admin pin from settings
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'admin_pin')
      .single();

    if (error) throw error;

    if (pin === data?.value) {
      const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '7d' });
      res.json({ success: true, token });
    } else {
      res.status(401).json({ error: 'Invalid PIN' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add movie
app.post('/api/admin/movies', authenticateAdmin, async (req, res) => {
  try {
    const movieData = req.body;
    
    const { data, error } = await supabase
      .from('movies')
      .insert([movieData])
      .select();

    if (error) throw error;

    // Update total movies count
    const { count } = await supabase
      .from('movies')
      .select('*', { count: 'exact', head: true });

    await supabase
      .from('settings')
      .update({ value: count.toString() })
      .eq('key', 'total_movies');

    res.json({ success: true, movie: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update movie
app.put('/api/admin/movies/:id', authenticateAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('movies')
      .update(req.body)
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete movie
app.delete('/api/admin/movies/:id', authenticateAdmin, async (req, res) => {
  try {
    const { error } = await supabase
      .from('movies')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    // Update total movies count
    const { count } = await supabase
      .from('movies')
      .select('*', { count: 'exact', head: true });

    await supabase
      .from('settings')
      .update({ value: count.toString() })
      .eq('key', 'total_movies');

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add channel
app.post('/api/admin/channels', authenticateAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('channels')
      .insert([req.body])
      .select();

    if (error) throw error;
    res.json({ success: true, channel: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update channel
app.put('/api/admin/channels/:id', authenticateAdmin, async (req, res) => {
  try {
    const { error } = await supabase
      .from('channels')
      .update(req.body)
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete channel
app.delete('/api/admin/channels/:id', authenticateAdmin, async (req, res) => {
  try {
    const { error } = await supabase
      .from('channels')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update settings
app.post('/api/admin/settings', authenticateAdmin, async (req, res) => {
  try {
    const { key, value } = req.body;
    
    const { error } = await supabase
      .from('settings')
      .upsert({ key, value, updated_at: new Date() }, { onConflict: 'key' });

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all users (admin only)
app.get('/api/admin/users', authenticateAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('joined_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get statistics
app.get('/api/admin/stats', authenticateAdmin, async (req, res) => {
  try {
    const { count: movies } = await supabase
      .from('movies')
      .select('*', { count: 'exact', head: true });

    const { count: users } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    const { count: channels } = await supabase
      .from('channels')
      .select('*', { count: 'exact', head: true });

    const { data: totalViews } = await supabase
      .from('movies')
      .select('views');

    const views = totalViews?.reduce((sum, m) => sum + (m.views || 0), 0) || 0;

    res.json({
      totalMovies: movies || 0,
      totalUsers: users || 0,
      totalChannels: channels || 0,
      totalViews: views
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve admin page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Serve main app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📱 Main App: http://localhost:${PORT}`);
  console.log(`🔐 Admin Panel: http://localhost:${PORT}/admin`);
});
