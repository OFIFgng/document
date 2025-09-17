const express = require('express');
const fs = require('fs');
const geoip = require('geoip-lite');
const app = express();

app.set('trust proxy', true);

const RATE_LIMIT = 5;
const TIME_WINDOW = 60000;
const LOG_FILE = 'logs.txt';

const AUTH_USER = 'admin';
const AUTH_PASS = 'S&bdWBA^WVGsdvg&^!^GYSAvD^!SAV61gsaAgdHU*87qpsidjglQSbfoAhjbf891092785812*1489JsoQ317';

const ipRequestMap = {};

function basicAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Restricted Area"');
    return res.status(401).send('Authentication required.');
  }

  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [user, pass] = credentials.split(':');

  if (user === AUTH_USER && pass === AUTH_PASS) {
    return next();
  } else {
    res.setHeader('WWW-Authenticate', 'Basic realm="Restricted Area"');
    return res.status(401).send('Authentication required.');
  }
}

app.use((req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const timestamp = new Date().toISOString();

  // Get geo info for IP
  const geo = geoip.lookup(ip) || {};
  const country = geo.country || 'Unknown Country';
  const region = geo.region || 'Unknown Region';
  const city = geo.city || 'Unknown City';

  const logLine = `${timestamp} - ${ip} - ${country}, ${region}, ${city}\n`;
  fs.appendFile(LOG_FILE, logLine, err => {
    if (err) console.error('Failed to log IP:', err);
  });

  if (!ipRequestMap[ip]) ipRequestMap[ip] = [];

  ipRequestMap[ip] = ipRequestMap[ip].filter(time => now - time < TIME_WINDOW);

  if (ipRequestMap[ip].length >= RATE_LIMIT) {
    return res.status(429).send('STOP REFRESHING THE PAGE GOD DAMN IT! Get banned for a few seconds.');
  }

  ipRequestMap[ip].push(now);
  next();
});

app.get('/', (req, res) => {
  res.send('Unable to load documents.');
});

app.get('/check', (req, res) => {
  res.send('Invalid');
});

app.get('/logs', basicAuth, (req, res) => {
  fs.readFile(LOG_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).send('Could not read logs.');
    res.type('text/plain').send(data);
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
