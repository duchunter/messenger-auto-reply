'use strict'

import request from "request";
import login from "facebook-chat-api";
import { addLog } from '../utils/log';
import { scanTable, updateInTable } from '../models/models';

const period = 1790000; // 29:50
const defaultMsg = `BOT: I'm currently busy, please leave a message here, i will reply as soon as posible`;

export default async function (req, res) {
  // Make sure just answer once
  let answeredThreads = {};

  // Must-have data
  let { email, stop, msg, useAppstate } = req.body;
  if (!email || !stop) {
    res.status(400).json('Missing info');
    return;
  }

  // Get user info
  let users = await scanTable({
    table: 'Accounts',
    condition: { email },
  });

  // If user not exist
  if (users.length == 0) {
    res.status(404).json('No user found');
    return;
  }

  // Ok -> get appstate or credential to login
  let user = users[0];
  let credentials = {};
  if (!user.appstate || user.appstate == 'null' || !useAppstate) {
    credentials.email = user.email;
    credentials.password = user.password;
  } else {
    try {
      credentials.appstate = JSON.parse(user.appstate);
    } catch (e) {
      addLog({
        code: 'error',
        content: 'Login err: cannot parse appstate for email ' + user.email
      });
      updateInTable({
        table: 'Accounts',
        condition: { email },
        changes: { appstate: 'null' }
      });

      delete credentials.appstate;
      credentials.email = user.email;
      credentials.password = user.password;
    }
  }

  // Login
  login(credentials, (err, api) => {
    // Error
    if (err) {
      res.status(403).json(JSON.stringify(err));
      console.log(err);
      addLog({
        code: 'error',
        content: `Login ${user.email} err: ${JSON.stringify(err)}`
      });
      return;
    }

    // If ok, set option and update info
    let start = new Date().getTime();
    addLog({
      code: 'login',
      content: `Login ${email} success, appstate: ${!!credentials.appstate}. `
           + `Timer stop at ${new Date(stop).toString()}`,
    });
    api.setOptions({
        forceLogin: true,
        logLevel: "silent"
    });

    let appstate = credentials.appstate
      ? user.appstate
      : JSON.stringify(api.getAppState());

    // Save info in db
    updateInTable({
      table: 'Accounts',
      condition: { email },
      changes: {
        appstate,
        start,
        stop,
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
      if (!answeredThreads.hasOwnProperty(message.threadID)) {
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
            api.sendMessage(defaultMsg, message.threadID);
          } else {
            if (users[0].stop > new Date().getTime()) {
              // Reply with msg
              let msg = users[0].msg || defaultMsg;
              msg = (msg == 'default') ? defaultMsg : 'BOT: ' + msg;
              api.sendMessage(msg, message.threadID);
            }
          }
        });
      }
    });
  });
}
