'use strict'

import express from 'express';
import jwtAuthz from 'express-jwt-authz';

import { authCheck } from '../utils/auth0';
import sendLog from '../utils/sendLog';
import setTimer from '../controller/setTimer';
import stopTimer from '../controller/stopTimer';

const router = express.Router();
const scopeCheck = jwtAuthz(['admin']);

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log('Ping');
  res.render('index', { title: 'Express' });
});

// POST timer
router.post('/api/set', authCheck, scopeCheck, setTimer);

// POST stop
router.post('/api/stop', authCheck, scopeCheck, stopTimer);

// Request instant log transfer
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
