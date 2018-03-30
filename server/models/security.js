'use strict'

// Special code
let transform = {};
transform['//'] = `'`;
transform['/?'] = '"'
transform['|<'] = '(';
transform['|>'] = ')';

// Replace sql character to prevent sql injection
export function noInjection(str) {
  if (typeof(str) != 'string') return str;
  return Object.keys(transform).reduce((final, key) => {
    return final.split(transform[key]).join(key);
  }, str);
}

// Parse character back to normal
export function normalizeStr(str) {
  if (typeof(str) != 'string') return str;
  return Object.keys(transform).reduce((final, key) => {
    return final.split(key).join(transform[key]);
  }, str);
}
