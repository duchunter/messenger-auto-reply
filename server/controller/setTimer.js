'use strict'

import request from "request";
import login from "facebook-chat-api";
import handleInbox from '../utils/handleInbox';
import { addLog } from '../utils/log';
import { scanTable, updateInTable } from '../models/models';

// Some default value
const period = 1790000; // 29:50
const defaultMsg = `BOT: I'm currently busy, please leave a message here, i will reply as soon as posible`;

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
    // Error
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

    // If ok, set option and update info
    addLog({
      code: 'login',
      content: `Login ${email} success, stop: ${new Date(stop).toString()}`
    });

    // Login setup
    api.setOptions({
      forceLogin: true,
      logLevel: "silent"
    });

    // Save info in db
    updateInTable({
      table: 'Accounts',
      condition: { email },
      changes: {
        stop,
        start: new Date().getTime(),
        msg: msg || defaultMsg,
      },
    }).then(success => {
      // If cannot save info to db
      if (!success) {
        addLog({
          code: 'error',
          content: 'Cannot update info of ' + email,
        });
        res.status(500).json('Cannot set timer');
      } else {
        // Saved -> set keep-alive interval
        res.status(200).json('Timer set');
        let loop = setInterval(() => {
          // Get user data
          scanTable({
            table: 'Accounts',
            condition: { email }
          }).then(users => {
            // User not exist (somehow) -> stop interval
            if (users.length == 0) {
              addLog({
                code: 'error',
                content: 'Keep alive: cannot find user info of ' + email
              });

              clearInterval(loop);
            } else {
              // Check if timer expired
              if (new Date().getTime() >= users[0].stop) {
                clearInterval(loop);
                addLog({
                  code: 'stop',
                  content: `${email}: stopping`,
                });
              } else {
                // Not expired -> Keep alive
                request(process.env.BOT_URL, (err, res, html) => {
                  err && addLog({
                    code: 'error',
                    content: `Ping ${email} error: ${JSON.stringify(err)}`
                  });
                });
              }
            }
          });
        }, period);
      }
    });

    // Listen to incoming message
    api.listen((err, message) => {
      console.log(1);
      console.log(message);
      handleInbox(api, err, message, answeredThreads, chatThreads);
    });
  });
}
