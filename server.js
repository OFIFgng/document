const express = require('express');
const fs = require('fs');
const app = express();

const RATE_LIMIT = 5;
const TIME_WINDOW = 60000;

const ipRequestMap = {};

const LOG_USERNAME = 'OFIF';
const LOG_PASSWORD = 'ASyhw@S&78$bds!*ashd*(bsaQ!*(@$YSAB182723179ASB1SSBuAUuds!&bvsa!@$S'; 

// Middleware to protect /logs with basic auth
function basicAuth(req, res, next) {
  const auth = req.headers.authorization;

  if (!auth) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Logs Area"');
    return res.status(401).send('Authentication required.');
  }

  // Decode base64 username:password
  const base64Credentials = auth.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');

  if (username === LOG_USERNAME && password === LOG_PASSWORD) {
    next(); // Auth success
  } else {
    res.setHeader('WWW-Authenticate', 'Basic realm="Logs Area"');
    return res.status(401).send('Access denied.');
  }
}

app.use((req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const timestamp = new Date().toISOString();

  // Log the IP to a file
  const logLine = `${timestamp} - ${ip}\n`;
  fs.appendFile('logs.txt', logLine, err => {
    if (err) console.error('Failed to log IP:', err);
  });

  // Rate limiting logic
  if (!ipRequestMap[ip]) ipRequestMap[ip] = [];

  // Remove requests older than TIME_WINDOW
  ipRequestMap[ip] = ipRequestMap[ip].filter(time => now - time < TIME_WINDOW);

  if (ipRequestMap[ip].length >= RATE_LIMIT) {
    return res.status(429).send('Too many requests. Try later.');
  }

  ipRequestMap[ip].push(now);
  next();
});

// Root route
app.get('/', (req, res) => {
  res.send('Unable to load documents, website has been deleted');
});

// Rate-limit test route
app.get('/check', (req, res) => {
  res.send('✅ YAL');
});

// Protect /logs with basic auth
app.get('/logs', basicAuth, (req, res) => {
  fs.readFile('logs.txt', 'utf8', (err, data) => {
    if (err) return res.status(500).send('Could not read logs.');
    res.type('text/plain').send(data);
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
