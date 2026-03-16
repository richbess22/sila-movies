const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect('mongodb+srv://sila_md:sila0022@sila.67mxtd7.mongodb.net/sila_movies')
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.log('❌ MongoDB Error:', err));

// ==================== SCHEMAS ====================
const MovieSchema = new mongoose.Schema({
  title: String,
  description: String,
  poster: String,
  backdrop: String,
  year: Number,
  rating: Number,
  genre: [String],
  duration: String,
  videoUrl: String,      // MP4 or M3U8 link
  downloadUrl: String,   // Google Drive link
  trailerUrl: String,    // YouTube trailer
  type: { type: String, default: 'movie' },
  trending: { type: Boolean, default: false },
  views: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const LiveTVSchema = new mongoose.Schema({
  name: String,
  logo: String,
  streamUrl: String,     // M3U8 link
  category: String,
  status: { type: String, default: 'online' }
});

const UserSchema = new mongoose.Schema({
  deviceId: String,
  username: String,
  email: String,
  subscription: { type: String, default: 'free' },
  joinedAt: { type: Date, default: Date.now },
  lastActive: Date
});

const ChatSchema = new mongoose.Schema({
  deviceId: String,
  messages: [{
    role: String,        // 'user' or 'ai'
    content: String,
    timestamp: { type: Date, default: Date.now }
  }]
});

const SettingSchema = new mongoose.Schema({
  adsEnabled: Boolean,
  subscriptionPrice: Number,
  adminPin: String
});

const Movie = mongoose.model('Movie', MovieSchema);
const LiveTV = mongoose.model('LiveTV', LiveTVSchema);
const User = mongoose.model('User', UserSchema);
const Chat = mongoose.model('Chat', ChatSchema);
const Setting = mongoose.model('Setting', SettingSchema);

// ==================== API ROUTES ====================

// MOVIES API
app.get('/api/movies', async (req, res) => {
  const { page = 1, limit = 20, genre, year } = req.query;
  let query = {};
  if (genre) query.genre = genre;
  if (year) query.year = year;
  
  const movies = await Movie.find(query)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
  
  res.json(movies);
});

app.get('/api/movies/trending', async (req, res) => {
  const movies = await Movie.find({ trending: true }).limit(10);
  res.json(movies);
});

app.get('/api/movies/latest', async (req, res) => {
  const movies = await Movie.find().sort({ year: -1 }).limit(10);
  res.json(movies);
});

app.get('/api/movies/popular', async (req, res) => {
  const movies = await Movie.find().sort({ rating: -1 }).limit(10);
  res.json(movies);
});

app.get('/api/movies/:id', async (req, res) => {
  const movie = await Movie.findById(req.params.id);
  movie.views += 1;
  await movie.save();
  res.json(movie);
});

app.post('/api/movies', async (req, res) => {
  const movie = new Movie(req.body);
  await movie.save();
  res.json(movie);
});

// LIVE TV API
app.get/api/livetv', async (req, res) => {
  const channels = await LiveTV.find({ status: 'online' });
  res.json(channels);
});

// AI CHAT API
app.post('/api/chat', async (req, res) => {
  const { message, deviceId } = req.body;
  
  // Get or create chat history
  let chat = await Chat.findOne({ deviceId });
  if (!chat) {
    chat = new Chat({ deviceId, messages: [] });
  }
  
  // Save user message
  chat.messages.push({ role: 'user', content: message });
  
  try {
    // Call AI API
    const response = await axios.get(`https://api.yupra.my.id/api/ai/gpt5?text=${encodeURIComponent(message)}`);
    const aiResponse = response.data;
    
    // Save AI response
    chat.messages.push({ role: 'ai', content: aiResponse });
    await chat.save();
    
    res.json({ 
      response: aiResponse,
      history: chat.messages.slice(-10) // Last 10 messages
    });
  } catch (error) {
    res.status(500).json({ error: 'AI service error' });
  }
});

app.get('/api/chat/history/:deviceId', async (req, res) => {
  const chat = await Chat.findOne({ deviceId: req.params.deviceId });
  res.json(chat ? chat.messages : []);
});

// USER TRACKING
app.post('/api/user/track', async (req, res) => {
  const { deviceId } = req.body;
  let user = await User.findOne({ deviceId });
  
  if (!user) {
    user = new User({ deviceId });
  }
  user.lastActive = new Date();
  await user.save();
  
  res.json({ success: true });
});

// ADMIN VERIFICATION
app.post('/api/admin/verify', async (req, res) => {
  const { pin } = req.body;
  const settings = await Setting.findOne();
  
  if (settings && settings.adminPin === pin) {
    const token = jwt.sign({ role: 'admin' }, 'sila_secret_2026');
    res.json({ success: true, token });
  } else {
    res.status(401).json({ error: 'Invalid PIN' });
  }
});

// ADMIN: Get all users
app.get('/api/admin/users', async (req, res) => {
  const users = await User.find().sort({ joinedAt: -1 });
  res.json(users);
});

// ADMIN: Get stats
app.get('/api/admin/stats', async (req, res) => {
  const totalMovies = await Movie.countDocuments();
  const totalUsers = await User.countDocuments();
  const totalViews = await Movie.aggregate([{ $group: { _id: null, total: { $sum: '$views' } } }]);
  
  res.json({
    totalMovies,
    totalUsers,
    totalViews: totalViews[0]?.total || 0
  });
});

// Initialize admin PIN
app.post('/api/admin/init', async (req, res) => {
  let settings = await Setting.findOne();
  if (!settings) {
    settings = new Setting({ adminPin: 'sila0022', adsEnabled: true, subscriptionPrice: 3000 });
    await settings.save();
  }
  res.json({ success: true });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
