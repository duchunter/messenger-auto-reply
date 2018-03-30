'use strict'

import { addToTable } from '../models/models';

// ADD LOG TO DB
export async function addLog({ code, content }) {
  // Created time in millisecond
  const created = new Date().getTime();

  // Add to log table
  let isSuccess = await addToTable({
    table: 'Logs',
    data: {
      created,
      code,
      content: content
    }
  });
}
