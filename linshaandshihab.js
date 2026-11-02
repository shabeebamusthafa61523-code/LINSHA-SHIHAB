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
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Connection URI (Using existing weddinglamiazenbaq database and wishes collection)
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://shabeeba:9995982324@cluster0.i23tzbf.mongodb.net/weddinglamiazenbaq?retryWrites=true&w=majority";

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve all static assets from the current directory and subdirectories
app.use(express.static(path.join(__dirname)));
app.use('/webgency.tilda.ws', express.static(path.join(__dirname, 'webgency.tilda.ws')));

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

// 4. Default home redirect to wedding invitation
app.get('/', (req, res) => {
  res.redirect('/webgency.tilda.ws/thesacredgarden830f.html');
});

// ============================================================================
// Start Server
// ============================================================================
async function startServer() {
  try {
    console.log('Connecting to MongoDB Atlas (weddinglamiazenbaq.wishes)...');
    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected to MongoDB Atlas successfully!');

    await seedInitialWishes();

    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(` Linsha & Shihab Wedding Server is Live!`);
      console.log(` Open Invitation in Browser:`);
      console.log(`    http://localhost:${PORT}`);
      console.log(` Wishes API:`);
      console.log(`    http://localhost:${PORT}/api/wishes`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
}

startServer();

module.exports = app;
