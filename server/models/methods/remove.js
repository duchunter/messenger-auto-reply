import parse from '../parseToQuery';
import { addLog } from '../../utils/log';

export default async function ({ db, table, condition }) {
  // Must have condition
  if(!condition) return false;
  let result = true;

  // Parse condition
  let query = parse(condition, ' and ');

  // Await db to respond and return result
  try {
    await db.none(`delete from ${table} where ${query}`);
  } catch (e) {
    // ERROR
    addLog({
      code: 'error',
      content: `Model: delete from ${table} where ${query}`,
    });
    result = false;
  }

  return result;
}
