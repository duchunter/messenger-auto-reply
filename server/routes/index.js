'use strict'

import express from 'express';
import setupBot from '../controller/bot';
import jwtAuthz from 'express-jwt-authz';
import { authCheck } from '../utils/auth0';
import sendLog from '../utils/sendLog';

const router = express.Router();
const scopeCheck = jwtAuthz(['admin']);

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log('Ping');
  res.render('index', { title: 'Express' });
});

// POST timer
router.post('/timer', setupBot);

module.exports = router;
