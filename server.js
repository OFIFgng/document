const express = require('express');
const fs = require('fs');
const app = express();

// ✅ Trust proxy so Render forwards the real IP
app.set('trust proxy', true);

const RATE_LIMIT = 5; // Max 5 requests
const TIME_WINDOW = 60000; // 1 minute in milliseconds
const LOG_FILE = 'logs.txt';
const LOGS_PASSWORD = 'admin123'; // Change this password later!

const ipRequestMap = {};

// ✅ Log IPs and apply rate limiting
app.use((req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const timestamp = new Date().toISOString();

  // Log the IP to logs.txt
  const logLine = `${timestamp} - ${ip}\n`;
  fs.appendFile(LOG_FILE, logLine, err => {
    if (err) console.error('Failed to log IP:', err);
  });

  // Rate limiting logic
  if (!ipRequestMap[ip]) ipRequestMap[ip] = [];

  // Keep only requests in the last minute
  ipRequestMap[ip] = ipRequestMap[ip].filter(time => now - time < TIME_WINDOW);

  if (ipRequestMap[ip].length >= RATE_LIMIT) {
    return res.status(429).send('Too many requests. Try later.');
  }

  ipRequestMap[ip].push(now);
  next();
});

// ✅ Homepage
app.get('/', (req, res) => {
  res.send('✅ Server is running. IP is logged.');
});

// ✅ Optional test route
app.get('/check', (req, res) => {
  const ip = req.ip || req.connection.remoteAddress;
  res.send(`✅ YAL — Your IP is: ${ip}`);
});

// ✅ Protected /logs route
app.get('/logs', (req, res) => {
  const user = req.query.user;
  const pass = req.query.pass;

  if (user !== 'admin' || pass !== LOGS_PASSWORD) {
    return res.status(403).send('Access denied: incorrect credentials.');
  }

  fs.readFile(LOG_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).send('Could not read logs.');
    res.type('text/plain').send(data);
  });
});

// ✅ Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
