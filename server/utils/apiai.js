const uuidv1 = require('uuid/v1');
const clientAccessKey = require('./apiaiConfig');
const dialogflow = require('apiai-promise');

const bot = dialogflow(clientAccessKey);

module.exports = apiai;

async function apiai(text) {
  let res;
  try {
    res = await bot.textRequest(text, {
      sessionId: uuidv1()
    });
  } catch (e) {
    return `Err, i don't understand that`;
  }

  return res.result.fulfillment.speech;
}
