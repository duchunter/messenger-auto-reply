'use strict'

import promise from 'bluebird';
import pg from 'pg-promise';
import read from './methods/read';
import create from './methods/create';
import update from './methods/update';
import remove from './methods/remove';
import count from './methods/count';

const pgp = pg({
  promiseLib: promise
});

// Comment this when deploy
const connectionString = 'postgres://localhost:5432/link';
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

// COUNT
export async function countInTable({ table, col, condition }) {
  return await count({ db, table, col, condition });
}
