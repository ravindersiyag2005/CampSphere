require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const initChatSocket = require('./socket/chatSocket');
const rateLimit = require('express-rate-limit');

const app = express();
const server = http.createServer(app);

app.set('trust proxy', 1); // Trust the reverse proxy (Render) to properly set req.protocol

connectDB();

// Allow localhost (dev) + deployed Vercel URL (prod) — both from CLIENT_URL
const allowedOrigins = [
  'http://localhost:4200',
  'https://campsphere.vercel.app',
  ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, Render health checks)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many authentication attempts from this IP, please try again after 15 minutes' }
});

app.use('/api', apiLimiter);

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

app.use('/api/auth', authLimiter, require('./routes/authRoutes'));
app.use('/api/resources', require('./routes/resourceRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/travel', require('./routes/travelRoutes'));
app.use('/api/food', require('./routes/foodRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/posts', require('./routes/postRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

const io = new Server(server, {
  cors: corsOptions,
});
initChatSocket(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Campus Hub API + Socket.io running on port ${PORT}`));
