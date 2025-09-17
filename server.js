const express = require('express');
const fs = require('fs');
const app = express();

const RATE_LIMIT = 5; // Max 5 requests
const TIME_WINDOW = 60000; // 1 minute in milliseconds

const ipRequestMap = {};

app.use((req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const timestamp = new Date().toISOString();

  // ✅ Log the IP to a file
  const logLine = `${timestamp} - ${ip}\n`;
  fs.appendFile('logs.txt', logLine, err => {
    if (err) console.error('Failed to log IP:', err);
  });

  // ✅ Rate limiting logic
  if (!ipRequestMap[ip]) ipRequestMap[ip] = [];

  // Remove requests older than 1 minute
  ipRequestMap[ip] = ipRequestMap[ip].filter(time => now - time < TIME_WINDOW);

  if (ipRequestMap[ip].length >= RATE_LIMIT) {
    return res.status(429).send('Too many requests. Try later.');
  }

  ipRequestMap[ip].push(now);
  next();
});

// ✅ Root route
app.get('/', (req, res) => {
  res.send('✅ Server is running. You hit the root route!');
});

// ✅ Rate-limit test route
app.get('/check', (req, res) => {
  res.send('✅ You are allowed!');
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const fs = require('fs');

// ... your existing code ...

// Route to show logs (WARNING: For testing only! No security!)
app.get('/logs', (req, res) => {
  fs.readFile('logs.txt', 'utf8', (err, data) => {
    if (err) return res.status(500).send('Could not read logs.');
    res.type('text/plain').send(data);
  });
});
