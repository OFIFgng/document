const express = require('express');
const fs = require('fs');
const app = express();


app.set('trust proxy', true);

const RATE_LIMIT = 5;
const TIME_WINDOW = 60000;
const LOG_FILE = 'logs.txt';
const LOGS_PASSWORD = 'S&bdWBA^WVGsdvg&^!^GYSAvD^!SAV61gsaAgdHU*87qpsidjglQSbfoAhjbf891092785812*1489JsoQ317';

const ipRequestMap = {};


app.use((req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const timestamp = new Date().toISOString();

 
  const logLine = `${timestamp} - ${ip}\n`;
  fs.appendFile(LOG_FILE, logLine, err => {
    if (err) console.error('Failed to log IP:', err);
  });

 
  if (!ipRequestMap[ip]) ipRequestMap[ip] = [];

  
  ipRequestMap[ip] = ipRequestMap[ip].filter(time => now - time < TIME_WINDOW);

  if (ipRequestMap[ip].length >= RATE_LIMIT) {
    return res.status(429).send('AY! Stop it! You have been banned for a few seconds, BAD DOG!');
  }

  ipRequestMap[ip].push(now);
  next();
});


app.get('/', (req, res) => {
  res.send('Unable to load documents.');
});


app.get('/check', (req, res) => {
  const ip = req.ip || req.connection.remoteAddress;
  res.send(`Invalid`);
});


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


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
