'use strict'

import express from 'express';
import jwtAuthz from 'express-jwt-authz';
import { authCheck } from '../utils/auth0';
import setTimer from '../controller/setTimer';
import stopTimer from '../controller/stopTimer';
import updateTimer from '../controller/updateTimer';

// Comment this if you cloned this project
import sendLog from '../utils/sendLog';

const router = express.Router();

// Only response to request from Admin
const scopeCheck = jwtAuthz(['admin']);

// No front-end provided -> send default home page
router.get('/', function(req, res, next) {
  console.log('Ping');
  res.render('index', { title: 'Express' });
});

// POST set timer
router.post('/api/set', authCheck, scopeCheck, setTimer);

// POST stop timer
router.post('/api/stop', authCheck, scopeCheck, stopTimer);

// POST update timer or message
router.post('/api/update', authCheck, scopeCheck, updateTimer);

// POST send log to log server
// Comment this route if you cloned this project
router.post('/api/log', authCheck, scopeCheck, (req, res) => {
  sendLog(req.headers.authorization).then(isSuccess => {
    if (isSuccess) {
      res.status(200).json('All logs have been sent');
    } else {
      res.status(500).json('ERROR: Cannot send logs');
    }
  });
});

export default router;
