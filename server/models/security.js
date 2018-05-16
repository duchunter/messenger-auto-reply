'use strict'

// Special code, choose any encoding you want
let transform = {};
transform['a_quote'] = `'`;
transform['a_double_quote'] = '"'
transform['left_parenthesis'] = '(';
transform['right_parenthesis'] = ')';

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
