const { createServer } = require('http');
const next = require('next');
const { Server } = require('socket.io');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const expressApp = express();
  const server = createServer(expressApp);
  const io = new Server(server, {
    cors: { origin: '*' }
  });

  expressApp.use(cors());
  expressApp.use(express.json());

  // MongoDB
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch(err => console.error('MongoDB error:', err));

  // Express API Routes
  const userRoutes = require('./backend/routes/userRoutes');
  expressApp.use('/api/users', userRoutes);

  // Socket Handler
  require('./backend/socket/socketHandler')(io);

  // Next.js Handler
  expressApp.use((req, res) => {
    return handle(req, res);
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
