require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const path = require('path');
const morgan = require('morgan');

const { PORT, apiLimiter, allowedOrigins } = require('./src/config');
const authRouter = require('./src/routes/auth');
const gamesRouter = require('./src/routes/games');
const steamRouter = require('./src/routes/steam');
const achievementsRouter = require('./src/routes/achievements');

const app = express();
app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https://cdn.akamai.steamstatic.com"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
}));

app.use(morgan('combined'));
app.use('/api/', apiLimiter);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }

    return callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'), false);
  },
}));
app.use(bodyParser.json({ limit: '1mb' }));

app.use('/api', authRouter);
app.use('/api/games', gamesRouter);
app.use('/api/steam', steamRouter);
app.use('/api', achievementsRouter);

const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

app.get('*path', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(publicPath, 'index.html'), (err) => {
    if (err) {
      res.status(404).send('Frontend not built. Please run npm run build in the frontend directory.');
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
