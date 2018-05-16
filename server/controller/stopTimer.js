'use strict'

import { addLog } from '../utils/log';
import { updateInTable } from '../models/models';

export default function (req, res) {
  let { email } = req.body;

  // Must have email
  if (!email) {
    res.status(400).json('Missing data');
    return;
  }

  // Set stop to now
  updateInTable({
    table: 'Accounts',
    condition: { email },
    changes: { stop: new Date().getTime() }
  }).then(success => {
    if (success) {
      // Done -> response and add log
      res.status(200).json('Ok');
      addLog({
        code: 'force-stop',
        content: `${email}: reset timer to stop`
      });
    } else {
      // Err -> response and log :v
      res.status(500).json('Internal error');
      addLog({
        code: 'error',
        content: `Cannot reset timer of ${email} to stop`
      });
    }
  });
}
