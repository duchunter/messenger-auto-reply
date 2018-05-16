'use strict'

import promise from 'bluebird';
import pg from 'pg-promise';
import create from './methods/create';
import read from './methods/read';
import update from './methods/update';
import remove from './methods/remove';

const pgp = pg({ promiseLib: promise });

// Connection string use for local testing only
const connectionString = 'postgres://localhost:5432/replybot';
const db = pgp(process.env.DATABASE_URL || connectionString);

// READ
export async function scanTable ({ table, limit, offset, condition }) {
  return await read({ db, table, limit, offset, condition });
}

// CREATE
export async function addToTable({ table, data }) {
  return await create({ db, table, data });
}

// UPDATE
export async function updateInTable({ table, changes, condition }) {
  return await update({ db, table, changes, condition });
}

// REMOVE
export async function delFromTable({ table, condition}) {
  return await remove({ db, table, condition });
}
