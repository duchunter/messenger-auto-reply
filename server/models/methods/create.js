import { addLog } from '../../utils/log';
import { noInjection } from '../security';

export default async function ({ db, table, data }) {
  // Must have data
  if (!data) return false;
  let result = true;

  // Parse keys and values from data
  let keys = Object.keys(data).filter(key => !!data[key]);
  let values = keys.map(key => {
    return `'${noInjection(data[key].toString())}'`;
  });

  // Await db to respond and return result
  try {
    await db.none(
      `insert into ${table} (${keys.join(', ')}) values (${values.join(', ')})`
    );
  } catch (e) {
    // ERROR
    addLog({
      code: 'error',
      content:
        `Model: insert into ${table} (${keys}) values (${values})`,
    });
    result = false;
  }

  return result;
}
