const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const scoreRoutes = require('./routes/scores');

const activeStreams = require('./utils/streamManager');

dotenv.config();

let isConnected = false;

async function connectDatabase() {
  if (isConnected) return;
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI not configured');
  }
  mongoose.set('strictQuery', true);
  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 5000
  });
  isConnected = true;
}

function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({
    origin: '*'
  }));
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));

  async function ensureDatabase(req, res, next) {
    try {
      await connectDatabase();
      next();
    } catch (error) {
      console.error('Database connection error:', error.message);
      res.status(500).json({ message: 'Database unavailable' });
    }
  }

  app.use('/auth', ensureDatabase, authRoutes);
  app.use('/users', ensureDatabase, userRoutes);
  app.use('/scores', ensureDatabase, scoreRoutes);

  app.get('/leaderboard/stream/:gameId', ensureDatabase, (req, res) => {
    const { gameId } = req.params;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const streamList = activeStreams.get(gameId);
    streamList.add(res);

    const keepAlive = setInterval(() => {
      res.write('event: keepalive\ndata: ping\n\n');
    }, 25000);

    req.on('close', () => {
      streamList.delete(res);
      clearInterval(keepAlive);
    });
  });

  app.use('/leaderboard', ensureDatabase, require('./routes/leaderboard'));

  const publicDir = path.join(__dirname, 'public');
  app.use('/games', express.static(path.join(__dirname, 'games')));
  app.use(express.static(publicDir));
  app.get('*', (_, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });

  return app;
}

module.exports = createApp;
