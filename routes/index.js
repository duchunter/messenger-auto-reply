var express = require('express');
var router = express.Router();
var request = require("request");
var login = require("facebook-chat-api");

const period = 1790000; // 29:50
const defaultMsg = `BOT: I'm currently busy, please leave a message here, i will answer as soon as posible`;

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log('Ping');
  res.render('index', { title: 'Express' });
});

// POST timer
router.post('/timer', (req, res) => {
  var answeredThreads = {};
  login({
    email: process.env.FB_ACCOUNT,
    password: process.env.FB_PASS
  }, (err, api) => {
    if (err) {
      res.json('err');
      return console.error(err);
    }

    res.json('ok');
    api.listen((err, message) => {
        if (!answeredThreads.hasOwnProperty(message.threadID)) {
            answeredThreads[message.threadID] = true;
            api.sendMessage(req.body.msg || defaultMsg , message.threadID);
        }
    });
  });

  let loop = setInterval(() => {
    request(process.env.BOT_URL, (err, res, html) => {
      if (err) console.error(err);
    });
  }, period);

  setTimeout(() => {
    clearInterval(loop);
  }, req.body.timer || 0);
});

module.exports = router;
