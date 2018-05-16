import parse from '../parseToQuery';
import { addLog } from '../../utils/log';

export default async function ({ db, table, changes, condition }) {
  // Must have changes and condition
  if (!changes || !condition) return false;

  // Parse changes to format `key='value'`
  let update = parse(changes, ', ');

  // Parse condition
  let query = parse(condition, ' and ');

  // Await db to respond and return result
  try {
    await db.none(`update ${table} set ${update} where ${query}`);
  } catch (e) {
    // ERROR
    addLog({
      code: 'error',
      content: `Model: update ${table} set ${update} where ${query}`,
    });
    return false;
  }

  return true;
}
