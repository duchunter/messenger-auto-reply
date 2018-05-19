'use strict'

import login from "facebook-chat-api";
import apiai from '../utils/apiai';
import { addLog } from '../utils/log';
import { scanTable } from '../models/models';
import { period, defaultMsg, introMsg, welcomeMsg, endMsg } from './default';
import keepAlive from './keepAlive';

export default async function (req, res) {
  let answeredThreads = {};   // Make sure just answer once
  let chatThreads = {};       // If anyone want to chat with a bot :v

  // Must-have data
  let { email, stop, msg, code } = req.body;
  if (!email || !stop || !code) {
    res.status(400).json('Missing info');
    return;
  }

  // Get user info
  let users = await scanTable({
    table: 'Accounts',
    condition: { email }
  });

  // If user not exist
  if (users.length == 0) {
    res.status(404).json('No user found');
    return;
  }

  // Ok -> get credential to login
  let user = users[0];
  let credentials = {
    email: user.email,
    password: user.password
  };

  // Login
  login(credentials, (err, api) => {
    // Error handling
    if (err) {
      // Login approval - 2 factor authen -> using code
      if (err.error == 'login-approval') {
        err.continue(code);
        return;
      }

      // Other error
      res.status(403).json(JSON.stringify(err));
      console.log(err);
      addLog({
        code: 'error',
        content: `Login ${user.email} err: ${JSON.stringify(err)}`
      });
      return;
    }

    // Ok -> set keep alive interval
    keepAlive(res, email, stop, msg || defaultMsg, period);

    // Login setup
    api.setOptions({
      forceLogin: true,
      logLevel: "silent"
    });

    // Listen to incoming message
    api.listen(async (err, message) => {
      if (!answeredThreads[message.threadID]) {
        // Answer group chat only when being mentioned, if not, return
        if (message.isGroup) {
          if (message.mentions) {
            if (!message.mentions[api.getCurrentUserID()]) { return; }
          }
        }

        // Mark as aswered
        answeredThreads[message.threadID] = true;
        let reply = '';

        // Get user data to fetch msg
        let users = await scanTable({
          table: 'Accounts',
          condition: { email }
        });

        // User not exist (somehow) -> reply with default msg
        if (users.length == 0) {
          addLog({
            code: 'error',
            content: 'Reply: cannot find user info of ' + email
          });

          reply = defaultMsg;
        } else {
          // If bot has stopped -> do nothing
          if (users[0].stop < new Date().getTime()) { return; }

          // Choose the corresponding reply
          reply = (!users[0].msg || users[0].msg == 'default')
            ? defaultMsg
            : users[0].msg;
        }

        // Reply with msg
        api.sendMessage('BOT: ' + reply, message.threadID, (err, info) => {
          // Make sure intro message send after user's message
          api.sendMessage(introMsg, message.threadID);
        });
      }

      // If sender is chatting with bot
      if (chatThreads[message.threadID]) {
        let text = await apiai(message.body);
        api.sendMessage(`BOT: ${text}`, message.threadID);
      }

      // If sender want to chat
      if (!message.isGroup && message.body.toLowerCase() == 'i want to chat') {
        chatThreads[message.threadID] = true;
        api.sendMessage(welcomeMsg, message.threadID);
      }

      // If sender want to stop chatting
      if (!message.isGroup && message.body.toLowerCase() == 'bye') {
        chatThreads[message.threadID] = false;
        api.sendMessage(endMsg, message.threadID);
      }
    });
  });
}
