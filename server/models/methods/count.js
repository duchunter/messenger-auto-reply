import parse from '../parseToQuery';
import { addLog } from '../../utils/log';

export default async function ({ db, table, col, condition }) {
  let result;

  // Parse condition to query string
  let notEmpty = condition ? Object.keys(condition).length !== 0 : false;
  let query = notEmpty ? `where ${parse(condition || {}, ' and ')}` : '';

  // Await db to respond and return result
  try {
    result = await db.any(
      `select count(${col || '*'}) from ${table} ${query}`
    );
  } catch (e) {
    // ERROR
    addLog({
      code: 'error',
      content:
        `Model: select count(${col || '*'}) from ${table} ${query}`,
    });

    result = [{ count: -1 }];
  }

  return result;
}
