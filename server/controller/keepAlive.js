'use strict'

import request from "request";
import { addLog } from '../utils/log';
import { scanTable, updateInTable } from '../models/models';

export default async function (res, email, stop, msg, period) {
  // Update info
  addLog({
    code: 'login',
    content: `Login ${email} success, stop: ${new Date(stop).toString()}`
  });

  // Save info in db
  let updateSuccess = await updateInTable({
    table: 'Accounts',
    condition: { email },
    changes: {
      stop,
      msg,
      start: new Date().getTime()
    },
  });

  // Update db error handling
  if (!updateSuccess) {
    addLog({
      code: 'error',
      content: 'Cannot update info of ' + email,
    });
    res.status(500).json('Cannot set timer');
    return;
  }

  // Update complete -> set keep-alive interval
  res.status(200).json('Timer set');
  let loop = setInterval(async () => {
    // Get user data
    let users = await scanTable({
      table: 'Accounts',
      condition: { email }
    });

    // User not exist (somehow) -> stop interval
    if (users.length == 0) {
      addLog({
        code: 'error',
        content: 'Keep alive: cannot find user info of ' + email
      });
      clearInterval(loop);
      return;
    }

    // Check if timer expired
    if (new Date().getTime() >= users[0].stop) {
      clearInterval(loop);
      addLog({
        code: 'stop',
        content: `${email}: stopping`
      });
      return;
    }

    // Not expired -> Keep alive
    request(process.env.BOT_URL, (err, res, html) => {
      // Error handling
      err && addLog({
        code: 'error',
        content: `Ping ${email} error: ${JSON.stringify(err)}`
      });
    });
  }, period);
}
