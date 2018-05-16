'use strict'

import apiai from './apiai';

// Handle incomming message
export default function (api, err, message, answeredThreads, chatThreads) {
  console.log(2);
  console.log(message);
  if (!answeredThreads[message.threadID]) {
    // Answer group chat only when being mentioned, if not, return
    if (message.isGroup) {
      if (message.mentions) {
        if (!message.mentions[api.getCurrentUserID()]) { return; }
      }
    }

    // Mark as aswered
    answeredThreads[message.threadID] = true;

    // Get user data to fetch msg
    scanTable({
      table: 'Accounts',
      condition: { email }
    }).then(users => {
      // User not exist (somehow) -> reply with default msg
      if (users.length == 0) {
        addLog({
          code: 'error',
          content: 'Reply: cannot find user info of ' + email
        });
        api.sendMessage(defaultMsg, message.threadID);
        api.sendMessage(
          `BOT: If you want chat with me, type 'i want to chat'`,
          message.threadID
        );
      } else {
        if (users[0].stop > new Date().getTime()) {
          // Reply with msg
          let msg = users[0].msg || defaultMsg;
          msg = (msg == 'default') ? defaultMsg : 'BOT: ' + msg;
          api.sendMessage(msg, message.threadID);
          api.sendMessage(
            `BOT: If you want chat with me, type 'i want to chat'`,
            message.threadID
          );
        }
      }
    });
  }

  // If sender is chatting with bot
  if (chatThreads[message.threadID]) {
    apiai(message.body).then(text => {
      api.sendMessage(`BOT: ${text}`, message.threadID);
    });
  }

  // If sender want to chat
  if (!message.isGroup && message.body.toLowerCase() == 'i want to chat') {
    chatThreads[message.threadID] = true;
    api.sendMessage(
      `BOT: Great! Now i will reply your inbox, type 'bye' to stop chatting`,
      message.threadID
    );
  }

  // If sender want to stop chatting
  if (!message.isGroup && message.body.toLowerCase() == 'bye') {
    chatThreads[message.threadID] = false;
    api.sendMessage(
      `BOT: You can type 'i want to chat' anytime to chat with me again :)`,
      message.threadID
    );
  }
}
