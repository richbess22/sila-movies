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
const supabaseUrl = process.env.SUPABASE_URL || 'https://ycapbrxjuywrcjwkflvg.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'sb_publishable_mdxWjzWNNZBhK33giwp0rg__SVVDKTe';
const supabase = createClient(supabaseUrl, supabaseKey);

// ==================== DATABASE SETUP ====================
async function setupDatabase() {
  try {
    console.log('🔄 Checking database tables...');

    // Check if tables exist by trying to select from them
    const tables = ['movies', 'channels', 'settings', 'users', 'chat_history'];
    
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error && error.code === '42P01') { // Table doesn't exist
        console.log(`📦 Creating table: ${table}`);
        
        // Create tables using SQL via REST API
        if (table === 'movies') {
          await supabase.rpc('exec_sql', {
            sql_string: `
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
            `
          }).catch(e => console.log('Movies table creation skipped'));
        }
        
        if (table === 'channels') {
          await supabase.rpc('exec_sql', {
            sql_string: `
              CREATE TABLE IF NOT EXISTS channels (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                logo TEXT,
                stream_url TEXT,
                category TEXT,
                status TEXT DEFAULT 'online',
                created_at TIMESTAMP DEFAULT NOW()
              );
            `
          }).catch(e => console.log('Channels table creation skipped'));
        }
        
        if (table === 'settings') {
          await supabase.rpc('exec_sql', {
            sql_string: `
              CREATE TABLE IF NOT EXISTS settings (
                id SERIAL PRIMARY KEY,
                key TEXT UNIQUE NOT NULL,
                value TEXT,
                type TEXT DEFAULT 'text',
                updated_at TIMESTAMP DEFAULT NOW()
              );
            `
          }).catch(e => console.log('Settings table creation skipped'));
        }
        
        if (table === 'users') {
          await supabase.rpc('exec_sql', {
            sql_string: `
              CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                device_id TEXT UNIQUE,
                username TEXT,
                email TEXT,
                subscription TEXT DEFAULT 'free',
                joined_at TIMESTAMP DEFAULT NOW(),
                last_active TIMESTAMP
              );
            `
          }).catch(e => console.log('Users table creation skipped'));
        }
        
        if (table === 'chat_history') {
          await supabase.rpc('exec_sql', {
            sql_string: `
              CREATE TABLE IF NOT EXISTS chat_history (
                id SERIAL PRIMARY KEY,
                device_id TEXT,
                role TEXT,
                content TEXT,
                created_at TIMESTAMP DEFAULT NOW()
              );
            `
          }).catch(e => console.log('Chat history table creation skipped'));
        }
      }
    }

    // Insert default settings
    console.log('⚙️ Checking default settings...');
    const defaultSettings = [
      { key: 'theme', value: 'dark', type: 'string' },
      { key: 'admin_pin', value: 'sila', type: 'string' },
      { key: 'ads_enabled', value: 'true', type: 'boolean' },
      { key: 'subscription_price', value: '3000', type: 'number' },
      { key: 'whatsapp_number', value: '255637351031', type: 'string' },
      { key: 'app_name', value: 'SILA MOVIES', type: 'string' }
    ];

    for (const setting of defaultSettings) {
      const { data: existing } = await supabase
        .from('settings')
        .select('*')
        .eq('key', setting.key)
        .single();

      if (!existing) {
        await supabase
          .from('settings')
          .insert([setting]);
      }
    }

    // Add sample movies if none exist
    const { count } = await supabase
      .from('movies')
      .select('*', { count: 'exact', head: true });

    if (count === 0) {
      console.log('🎬 Adding sample movies...');
      const sampleMovies = [
        {
          title: "Fast & Furious 10",
          description: "The final chapter of the Fast & Furious saga. Dom Toretto and his family must face their most terrifying opponent yet.",
          poster: "https://image.tmdb.org/t/p/w500/1E5baAaEse26fej7uHcjOgEE2t2.jpg",
          backdrop: "https://image.tmdb.org/t/p/original/4XM8DUTQb3lhLemJC51Jx4a2EuA.jpg",
          year: 2024,
          rating: 7.8,
          genre: ["Action", "Thriller"],
          duration: "2h 21min",
          video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
          download_url: "https://drive.google.com/file/d/1IyyDGATtjaE6z5yncmBNf0_V2UoicVZO/view",
          trending: true
        },
        {
          title: "Oppenheimer",
          description: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.",
          poster: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
          backdrop: "https://image.tmdb.org/t/p/original/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg",
          year: 2023,
          rating: 8.5,
          genre: ["Drama", "History"],
          duration: "3h",
          video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
          download_url: "https://drive.google.com/file/d/1IyyDGATtjaE6z5yncmBNf0_V2UoicVZO/view",
          trending: true
        }
      ];

      for (const movie of sampleMovies) {
        await supabase.from('movies').insert([movie]);
      }
    }

    console.log('✅ Database setup complete');
  } catch (error) {
    console.error('Database setup warning:', error.message);
    // Don't crash the app, just log the warning
    console.log('⚠️ Continuing with existing database structure...');
  }
}

// Run database setup
setupDatabase();

// ==================== MIDDLEWARE ====================
const authenticateAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sila_movies_secret_2026');
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
    console.error('Error fetching movies:', error);
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
app.get('/api/movies/trending/trending', async (req, res) => {
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

// Get latest movies
app.get('/api/movies/latest/latest', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .order('year', { ascending: false })
      .limit(10);

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get popular movies
app.get('/api/movies/popular/popular', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .order('rating', { ascending: false })
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
    console.error('Error tracking user:', error);
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
    let aiResponse = "I'm here to help you find movies!";
    try {
      const response = await axios.get(
        `https://api.yupra.my.id/api/ai/gpt5?text=${encodeURIComponent(message)}`,
        { timeout: 5000 }
      );
      aiResponse = response.data?.response || response.data?.message || aiResponse;
    } catch (aiError) {
      console.error('AI API error:', aiError.message);
      // Use fallback responses
      const fallbacks = [
        "You can find all latest movies in the Home section!",
        "Fast & Furious 10 is trending now. Check it out!",
        "We have many movies available for streaming.",
        "Use the search to find your favorite movies.",
        "Download movies directly from Google Drive links.",
        "Live TV channels are available 24/7."
      ];
      aiResponse = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }

    // Save AI response
    await supabase
      .from('chat_history')
      .insert({ device_id, role: 'ai', content: aiResponse });

    // Get recent history
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
    console.error('Chat error:', error);
    res.json({ 
      response: "I'm here to help! Try checking the movies section.",
      history: []
    });
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

// Get setting
app.get('/api/settings/:key', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', req.params.key)
      .maybeSingle();

    if (error) throw error;
    res.json({ value: data?.value });
  } catch (error) {
    res.json({ value: null });
  }
});

// ==================== ADMIN ROUTES ====================

// Admin login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { pin } = req.body;

    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'admin_pin')
      .maybeSingle();

    if (error) throw error;

    if (pin === (data?.value || 'sila')) {
      const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET || 'sila_movies_secret_2026', { expiresIn: '7d' });
      res.json({ success: true, token });
    } else {
      res.status(401).json({ error: 'Invalid PIN' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add movie (admin)
app.post('/api/admin/movies', authenticateAdmin, async (req, res) => {
  try {
    const movieData = req.body;
    
    const { data, error } = await supabase
      .from('movies')
      .insert([movieData])
      .select();

    if (error) throw error;
    res.json({ success: true, movie: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete movie (admin)
app.delete('/api/admin/movies/:id', authenticateAdmin, async (req, res) => {
  try {
    const { error } = await supabase
      .from('movies')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add channel (admin)
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

// Delete channel (admin)
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

// Update setting (admin)
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

// Get all users (admin)
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

// Get stats (admin)
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

    const { data: viewsData } = await supabase
      .from('movies')
      .select('views');

    const views = viewsData?.reduce((sum, m) => sum + (m.views || 0), 0) || 0;

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

// ==================== SERVE FILES ====================

// Serve admin page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Serve main app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ==================== START SERVER ====================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📱 Main App: http://localhost:${PORT}`);
  console.log(`🔐 Admin Panel: http://localhost:${PORT}/admin`);
});
