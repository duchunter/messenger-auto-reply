'use strict'

import { addLog } from '../utils/log';
import { updateInTable } from '../models/models';

export default function (req, res) {
  let { email } = req.body;
  if (!email) {
    res.status(400).json('Missing data');
    return;
  }

  updateInTable({
    table: 'Accounts',
    condition: { email },
    changes: {
      stop: new Date().getTime(),
    }
  }).then(success => {
    if (success) {
      res.status(200).json('Ok');
      addLog({
        code: 'force-stop',
        msg: `${email}: reset timer to stop`
      });
    } else {
      res.status(500).json('Internal error');
      addLog({
        code: 'error',
        msg: `Cannot reset timer of ${email} to stop`
      });
    }
  });
}
