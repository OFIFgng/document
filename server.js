const express = require('express');
const app = express();

const RATE_LIMIT = 5; // max 5 requests
const TIME_WINDOW = 60000; // 1 minute (in milliseconds)

const ipRequestMap = {};

app.use((req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();

  if (!ipRequestMap[ip]) ipRequestMap[ip] = [];

  // Remove requests older than 1 minute
  ipRequestMap[ip] = ipRequestMap[ip].filter(time => now - time < TIME_WINDOW);

  if (ipRequestMap[ip].length >= RATE_LIMIT) {
    return res.status(429).send('Too many requests. Try later.');
  }

  ipRequestMap[ip].push(now);
  next();
});

app.get('/check', (req, res) => {
  res.send('You are allowed!');
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
