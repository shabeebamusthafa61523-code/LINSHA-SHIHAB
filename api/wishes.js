const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://shabeeba:9995982324@cluster0.i23tzbf.mongodb.net/weddinglamiazenbaq?retryWrites=true&w=majority";

const wishSchema = new mongoose.Schema({
  name: { type: String, required: true },
  wish: { type: String, required: true },
  attendance: { type: String, default: 'Joyfully Attending' },
  wedding: { type: String, default: 'linshaandshihab' },
  date: { type: String, default: 'Just now' },
  createdAt: { type: Date, default: Date.now }
});

let cachedDb = null;
async function connectToDatabase() {
  if (cachedDb && mongoose.connection.readyState === 1) return cachedDb;
  cachedDb = await mongoose.connect(MONGO_URI);
  return cachedDb;
}

const Wish = mongoose.models.Wish || mongoose.model('Wish', wishSchema, 'wishes');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectToDatabase();

    if (req.method === 'GET') {
      const wishes = await Wish.find({ wedding: 'linshaandshihab' }).sort({ createdAt: -1 });
      return res.status(200).json({
        success: true,
        count: wishes.length,
        database: 'weddinglamiazenbaq',
        partition: 'linshaandshihab',
        data: wishes
      });
    }

    if (req.method === 'POST') {
      const { name, wish, attendance } = req.body || {};
      if (!name || !wish) {
        return res.status(400).json({ success: false, error: 'Name and wish are required' });
      }

      const newWish = new Wish({
        name: name.trim(),
        wish: wish.trim(),
        attendance: (attendance || 'Joyfully Attending').trim(),
        wedding: 'linshaandshihab',
        date: 'Just now'
      });

      const saved = await newWish.save();
      return res.status(201).json({
        success: true,
        message: 'Your lovely wish has been stored safely in MongoDB!',
        data: saved
      });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err) {
    console.error('Vercel API error:', err);
    return res.status(500).json({ success: false, error: 'Database operation failed: ' + err.message });
  }
};
