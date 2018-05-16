'use strict'

import { addToTable } from '../models/models';

export async function addLog({ code, content }) {
  // Add to log table
  let isSuccess = await addToTable({
    table: 'Logs',
    data: {
      code,
      content,
      created: new Date().getTime()
    }
  });
}
