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
  let { email, stop, msg } = req.body;
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
  if (!user.appstate) {
    credentials.email = user.email;
    credentials.password = user.password;
  } else {
    credentials.appstate = JSON.parse(user.appstate);
  }

  // Login
  login(credentials, (err, api) => {
    // Error
    if (err) {
      res.status(403).json(JSON.stringify(err));
      addLog({
        code: 'error',
        msg: 'Login err: ' + JSON.stringify(err)
      });
      return;
    }

    // If ok, set option and update info
    let start = new Date().getTime();
    addLog({
      code: 'login',
      msg: `Login success using ${user.appstate ? 'appstate' : 'user-pw'}. `
           + `Timer stop at ${new Date(stop).toString()}`,
    });
    api.setOptions({
        forceLogin: true,
        logLevel: "silent"
    });

    // Save info in db
    updateInTable({
      table: 'Accounts',
      condition: { email },
      changes: {
        start,
        stop,
        msg: msg || defaultMsg,
        appstate: user.appstate || JSON.stringify(api.getAppState()),
      },
    }).then(success => {
      // If cannot save info to db
      if (!success) {
        addLog({
          code: 'error',
          msg: 'Cannot update info of ' + email,
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
                msg: 'Keep alive: cannot find user info'
              });

              clearInterval(loop);
            } else {
              // Check if timer expired
              if (new Date().getTime() >= users[0].stop) {
                clearInterval(loop);
                addLog({
                  code: 'stop',
                  msg: `${email}: stopping`,
                });
              } else {
                // Not expired -> Keep alive
                request(process.env.BOT_URL, (err, res, html) => {
                  err && addLog({
                    code: 'error',
                    msg: 'Keep alive error: ' + JSON.stringify(err)
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
              msg: 'Reply: cannot find user info'
            });
            api.sendMessage(defaultMsg, message.threadID);
          } else {
            // Reply with msg
            api.sendMessage(users[0].msg || defaultMsg, message.threadID);
          }
        });
      }
    });
  });
}
