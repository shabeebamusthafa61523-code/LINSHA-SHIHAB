/**
 * ============================================================================
 * Linsha & Shihab Wedding Invitation - Live MongoDB Wishes Server
 * ============================================================================
 * Database: weddinglamiazenbaq (Collection: wishes)
 * Partition: wedding = "linshaandshihab"
 * 
 * Run server with:
 *    node linshaandshihab.js
 * Or:
 *    npm start
 * 
 * Then open in your browser:
 *    http://localhost:3000
 * ============================================================================
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Helper: dynamically determine host & protocol for Open Graph scrapers (WhatsApp, iMessage, etc.)
function getBaseUrl(req) {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const protocol = forwardedProto ? forwardedProto.split(',')[0].trim() : req.protocol;
  const host = req.get('host');
  return `${protocol}://${host}`;
}

function serveHtmlWithAbsoluteOg(filePath, req, res) {
  try {
    let html = fs.readFileSync(filePath, 'utf-8');
    const baseUrl = getBaseUrl(req);
    // Replace relative paths with absolute URL so WhatsApp thumbnail scraper picks up the couple photo
    html = html.replace(/content="\/couple\.jpg"/g, `content="${baseUrl}/couple.jpg"`);
    html = html.replace(/content="\/og-thumb\.jpg"/g, `content="${baseUrl}/og-thumb.jpg"`);
    html = html.replace(/href="\/og-thumb\.jpg"/g, `href="${baseUrl}/og-thumb.jpg"`);
    html = html.replace(/href="\/couple\.jpg"/g, `href="${baseUrl}/couple.jpg"`);
    html = html.replace(/content="thesacredgarden830f\.html"/g, `content="${baseUrl}/webgency.tilda.ws/thesacredgarden830f.html"`);
    html = html.replace(/content="thesacredgarden\.html"/g, `content="${baseUrl}/webgency.tilda.ws/thesacredgarden830f.html"`);
    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    res.send(html);
  } catch (err) {
    res.status(500).send('Error loading page: ' + err.message);
  }
}

// MongoDB Connection URI (Using existing weddinglamiazenbaq database and wishes collection)
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://shabeeba:9995982324@cluster0.i23tzbf.mongodb.net/weddinglamiazenbaq?retryWrites=true&w=majority";

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Specific HTML endpoints served with dynamic absolute Open Graph meta tags for WhatsApp
const sacredGardenPath = path.join(__dirname, 'webgency.tilda.ws', 'thesacredgarden830f.html');

app.get([
  '/',
  '/index',
  '/index.html',
  '/thesacredgarden830f',
  '/thesacredgarden830f.html',
  '/thesacredgarden',
  '/thesacredgarden.html',
  '/webgency.tilda.ws',
  '/webgency.tilda.ws/',
  '/webgency.tilda.ws/thesacredgarden830f',
  '/webgency.tilda.ws/thesacredgarden830f.html',
  '/webgency.tilda.ws/thesacredgarden',
  '/webgency.tilda.ws/thesacredgarden.html'
], (req, res) => {
  serveHtmlWithAbsoluteOg(sacredGardenPath, req, res);
});

// Explicit couple.jpg endpoints
app.get(['/og-thumb.jpg', '/webgency.tilda.ws/og-thumb.jpg'], (req, res) => {
  res.sendFile(path.join(__dirname, 'og-thumb.jpg'));
});

app.get(['/couple.jpg', '/webgency.tilda.ws/couple.jpg'], (req, res) => {
  res.sendFile(path.join(__dirname, 'couple.jpg'));
});

// Explicit splash video endpoints (case-insensitive fallback)
// Explicit hero2.mp4 endpoint with high-speed immutable caching
app.get([
  '/hero2.mp4',
  '/webgency.tilda.ws/hero2.mp4'
], (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
  res.sendFile(path.join(__dirname, 'hero2.mp4'));
});

app.get([
  '/splash.mp4',
  '/splash.MP4',
  '/webgency.tilda.ws/splash.mp4',
  '/webgency.tilda.ws/splash.MP4'
], (req, res) => {
  const filePath = fs.existsSync(path.join(__dirname, 'splash.MP4'))
    ? path.join(__dirname, 'splash.MP4')
    : path.join(__dirname, 'splash.mp4');
  res.sendFile(filePath);
});

// Serve all static assets from the current directory and subdirectories
const staticOptions = {
  index: false,
  maxAge: '7d',
  setHeaders: (res, filePath) => {
    if (/\.(mp4|MP4|mp3|mpeg|jpg|jpeg|png|gif|webp|svg|woff2?|css|js)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    }
  }
};
app.use(express.static(path.join(__dirname), staticOptions));
app.use('/webgency.tilda.ws', express.static(path.join(__dirname, 'webgency.tilda.ws'), staticOptions));

// Fallback for any other page route: render invitation directly instead of "Cannot GET"
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  if (req.path.startsWith('/api/') || req.path.match(/\.(jpg|jpeg|png|gif|mp4|mp3|mpeg|css|js|ico|svg|woff2?|map)$/i)) {
    return next();
  }
  serveHtmlWithAbsoluteOg(sacredGardenPath, req, res);
});

// ============================================================================
// MongoDB Schema & Model
// ============================================================================
const WishSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: 120
  },
  wish: {
    type: String,
    required: [true, 'Wish message is required'],
    trim: true,
    maxlength: 2500
  },
  attendance: {
    type: String,
    default: 'Joyfully Attending',
    trim: true
  },
  wedding: {
    type: String,
    default: 'linshaandshihab',
    index: true
  },
  date: {
    type: String,
    default: function() {
      const now = new Date();
      return now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    }
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

const Wish = mongoose.model('Wish', WishSchema, 'wishes');

// ============================================================================
// Initial Seed Wishes for Linsha & Shihab
// ============================================================================
const defaultSeedWishes = [
  {
    name: "Adil & Nadiya",
    attendance: "Joyfully Attending",
    wedding: "linshaandshihab",
    wish: "Heartiest congratulations Linsha and Shihab! May Allah bless your beautiful union with eternal love, happiness, and peace. Can't wait to celebrate with you at Keyath Garden!",
    date: "Yesterday"
  },
  {
    name: "Shamna & Ramees",
    attendance: "Joyfully Attending",
    wedding: "linshaandshihab",
    wish: "Wishing the sweetest couple a lifetime of joy, laughter, and endless blessings. Looking forward to Nov 28th!",
    date: "2 days ago"
  },
  {
    name: "Dr. Farhan & Family",
    attendance: "Joyfully Attending",
    wedding: "linshaandshihab",
    wish: "May your journey together be filled with harmony, prosperity, and cherished moments. Congratulations Linsha & Shihab!",
    date: "3 days ago"
  }
];

async function seedInitialWishes() {
  try {
    const count = await Wish.countDocuments({ wedding: 'linshaandshihab' });
    if (count === 0) {
      console.log('Seeding initial wishes for Linsha & Shihab in MongoDB...');
      await Wish.insertMany(defaultSeedWishes);
      console.log('✓ Successfully seeded 3 initial wishes.');
    }
  } catch (err) {
    console.error('Seeding notice:', err.message);
  }
}

// ============================================================================
// API Endpoints
// ============================================================================

// 1. GET /api/wishes - Retrieve all wishes for Linsha & Shihab (newest first)
app.get('/api/wishes', async (req, res) => {
  try {
    const wishes = await Wish.find({ wedding: 'linshaandshihab' }).sort({ createdAt: -1 });
    res.json({
      success: true,
      count: wishes.length,
      data: wishes
    });
  } catch (err) {
    console.error('Error retrieving wishes:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve wishes from database' });
  }
});

// 2. POST /api/wishes - Save a new wish
app.post('/api/wishes', async (req, res) => {
  try {
    const { name, wish, attendance } = req.body;

    if (!name || !wish) {
      return res.status(400).json({
        success: false,
        error: 'Please enter both your name and heartfelt wish.'
      });
    }

    const newWish = new Wish({
      name: name.trim(),
      wish: wish.trim(),
      attendance: (attendance || 'Joyfully Attending').trim(),
      wedding: 'linshaandshihab',
      date: 'Just now'
    });

    const saved = await newWish.save();
    console.log(`[MongoDB] New wish added from: ${saved.name}`);

    res.status(201).json({
      success: true,
      message: 'Your lovely wish has been stored safely in MongoDB!',
      data: saved
    });
  } catch (err) {
    console.error('Error saving wish:', err);
    res.status(500).json({ success: false, error: 'Failed to save wish to database' });
  }
});

// 3. GET /health - Server & MongoDB Status
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    database: 'weddinglamiazenbaq',
    partition: 'linshaandshihab',
    mongodbState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// ============================================================================
// Start Server
// ============================================================================
// 1. Bind to PORT immediately so Render detects the server is UP in < 1 second
app.listen(PORT, () => {
  console.log('=======================================================');
  console.log(' Linsha & Shihab Wedding Server is Live!');
  console.log(' Listening on port: ' + PORT);
  console.log(' Wishes API: /api/wishes');
  console.log('=======================================================');
});

// 2. Connect to MongoDB Atlas in the background
async function connectDatabase() {
  try {
    console.log('Connecting to MongoDB Atlas (weddinglamiazenbaq.wishes)...');
    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected to MongoDB Atlas successfully!');
    await seedInitialWishes();
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
  }
}

connectDatabase();
