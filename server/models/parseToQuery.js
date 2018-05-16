'use strict'

import { noInjection } from './security';

/*
  Parse condition (object) to query for WHERE and SET statement
  Condition will be divide into `key|operation|value` + connector
  Value will be encode if it contains special characters to prevent injection
*/

export default function (condition, connector) {
  return Object.keys(condition)
    // Filter out all 'null' value
    .filter(key => !!condition[key])

    // Iterate through each key
    .map((key) => {
    // For comparision logic, value is obj = {logic, value}
    if (typeof(condition[key]) === 'object') {
      let { logic, value } = condition[key];
      switch (logic) {
        // NOT
        case '!=':
          return `not ${key}=${noInjection(value)}`;

        // AND / OR
        case '||': case '&&': {
          // If value != array -> bypass, else create sub-query
          return !value.length
            ? key
            : value.map((option) => {
              // If even option contain logic operation (fuk my life)
              if (typeof(option) === 'object') {
                let {logic, value} = option;
                return (logic === '!=')
                  ? `not ${key}=${noInjection(value)}`
                  : `${key}${noInjection(logic)}${noInjection(value)}`
              }

              // No logic, just '='
              return `${key}=${noInjection(option)}`;
            }).join(logic === '||' ? ' or ' : ' and ');
        }

        // Includes, partial value, like string, value also an array
        case 'include': {
          // If value != array -> bypass, else create sub-query
          return !value.length
            ? key
            : value.map(word => {
              return `upper(${key}) like upper('%${noInjection(word)}%')`;
            }).join(' and ');
        }

        // Others (>, <, >=, <= or even invalid character)
        default:
          return `${key}${noInjection(logic)}${noInjection(value)}`;
      }
    }

    // Common =
    return `${key}='${noInjection(condition[key].toString())}'`;
  }).join(connector);
}
