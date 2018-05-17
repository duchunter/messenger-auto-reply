'use strict'

import request from "request";
import login from "facebook-chat-api";
import apiai from '../utils/apiai';
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
      if (!answeredThreads[message.threadID]) {
        // Answer group chat only when being mentioned, if not, return
        if (message.isGroup) {
          if (message.mentions) {
            if (!message.mentions[api.getCurrentUserID()]) { return; }
          }
        }

        // Mark as aswered
        answeredThreads[message.threadID] = true;

        // Get user data to fetch msg
        scanTable({
          table: 'Accounts',
          condition: { email }
        }).then(users => {
          // User not exist (somehow) -> reply with default msg
          if (users.length == 0) {
            addLog({
              code: 'error',
              content: 'Reply: cannot find user info of ' + email
            });
            api.sendMessage(defaultMsg, message.threadID, (err, info) => {
              api.sendMessage(
                `BOT: If you want chat with me, type 'i want to chat'`,
                message.threadID
              );
            });

          // Valid user -> reply with msg if still active
          } else {
            if (users[0].stop > new Date().getTime()) {
              // Reply with msg
              let msg = users[0].msg || defaultMsg;
              msg = (msg == 'default') ? defaultMsg : 'BOT: ' + msg;
              api.sendMessage(msg, message.threadID, (err, info) => {
                api.sendMessage(
                  `BOT: If you want chat with me, type 'i want to chat'`,
                  message.threadID
                );
              });
            }
          }
        });
      }

      // If sender is chatting with bot
      if (chatThreads[message.threadID]) {
        apiai(message.body).then(text => {
          api.sendMessage(`BOT: ${text}`, message.threadID);
        });
      }

      // If sender want to chat
      if (!message.isGroup && message.body.toLowerCase() == 'i want to chat') {
        chatThreads[message.threadID] = true;
        api.sendMessage(
          `BOT: Great! Now i will reply to your message :), type 'bye' to stop`,
          message.threadID
        );
      }

      // If sender want to stop chatting
      if (!message.isGroup && message.body.toLowerCase() == 'bye') {
        chatThreads[message.threadID] = false;
        api.sendMessage(
          `BOT: You can type 'i want to chat' anytime to chat with me again :)`,
          message.threadID
        );
      }
    });
  });
}
