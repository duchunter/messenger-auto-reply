'use strict'

// Special code
let transform = {};
transform['This_is_a_quote'] = `'`;
transform['This_is_a_double_quote'] = '"'
transform['This_is_left_parenthesis'] = '(';
transform['This_is_right_parenthesis'] = ')';

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
