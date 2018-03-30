'use strict'

import { noInjection } from './security';

/*
  Parse condition (object) to query for WHERE and SET statement
  Condition will be divide into `key|operation|value`
  and connect using connector
*/

export default function (condition, connector) {
  return Object.keys(condition)
    .filter(key => !!condition[key])
    .map((key) => {
    // For comparision logic
    if (typeof(condition[key]) === 'object') {
      const { logic, value } = condition[key];

      // NOT
      if (logic === '!=') {
        return `not ${key}=${noInjection(value)}`;
      }

      // OR, AND, value will be an array of other values
      if (logic === '||' || logic === '&&') {
        // If value is not an array
        if (!value.length) return `${key}`;

        // Create a sub-query with connector 'or'/'and'
        return value.map((option) => {
          // If even option contain logic operation (fuk my life)
          if (typeof(option) === 'object') {
            // NOT
            if (option.logic === '!=') {
              return `not ${key}=${noInjection(option.value)}`;
            }

            // > < >= <=
            return `${key}${noInjection(option.logic)}`
                    + `${noInjection(option.value)}`
          }

          // No logic, just '='
          return `${key}=${noInjection(option)}`;
        }).join(logic === '||' ? ' or ' : ' and ');
      }

      // Includes, partial value, like string, value also an array
      if (logic == 'include') {
        // If not array
        if (!value.length) return `${key}`;

        // Create a sub query with connector 'and'
        return value.map(word => {
          return `upper(${key}) like upper('%${noInjection(word)}%')`;
        }).join(' and ');
      }

      // > < >= <=
      return `${key}${noInjection(logic)}`
              + `${noInjection(value)}`;
    }

    // Common =
    return `${key}='${noInjection(condition[key].toString())}'`;
  }).join(connector);
}
