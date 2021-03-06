'use strict'

import { addLog } from '../utils/log';
import { updateInTable } from '../models/models';

export default function (req, res) {
  let { email, stop, msg } = req.body;

  // Must have email
  if (!email) {
    res.status(400).json('Missing data');
    return;
  }

  // Update db with new data
  updateInTable({
    table: 'Accounts',
    condition: { email },
    changes: { stop, msg }
  }).then(success => {
    if (success) {
      // Data updated
      res.status(200).json('Ok');
      addLog({
        code: 'update',
        content: `${email}: stop - ${stop}, msg - ${msg}`
      });
    } else {
      // Cannot update data
      res.status(500).json('Internal error');
      addLog({
        code: 'error',
        content: `Cannot update timer of ${email}`
      });
    }
  });
}
