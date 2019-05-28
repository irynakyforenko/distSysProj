const express = require('express');
const app = express();
const http = require('http').Server(app);
require("dotenv").config({ 
  path: require("path").resolve(__dirname, "..", "hub", ".env")
});
const bluebird = require('bluebird');

const { 
  CONSUL_HOST, CHAT_IP, CHAT_PORT, CHAT_ID
} = process.env;


var bodyParser = require('body-parser')
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

var redis = require("redis");
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
var client = redis.createClient();


const usernames = [];
var consul = require('consul')({
  promisify: true,
  host: CONSUL_HOST,
});

const details = {
  name: 'chat',
  address: CHAT_IP,
  port: Number(CHAT_PORT),
  check: {
    ttl: '10s',
    deregistercriticalserviceafter: '1s',
  },
  id: CHAT_ID
};

consul.agent.service.register(details, (err, xyz) => {
  if (err) {
    console.error(err);
    throw new Error(err);
  }
  console.log('registered with Consul');

  let interval = setInterval(() => {
    consul.agent.check.pass({id:`service:${ CHAT_ID }`}, err => {
      if (err) throw new Error(err);
      console.log('told Consul that we are healthy');
    });
  }, 5 * 1000);

  process.on('SIGINT', () => {
    console.log('SIGINT. De-Registering...');
    clearInterval(interval);
    interval = null;

    let details = {id: CHAT_ID};
    consul.agent.service.deregister(details, (err) => {
      console.log('de-registered.', err);
      process.exit();
    });
  });
});


app.post('/username', function(req, res){
  const { body: { username } } = req;
  if(usernames.indexOf(username) != -1)
    return res.send("taken");

  usernames.push(username);
  res.send("free");
});


app.delete('/username', function(req, res){
  const { body: { username } } = req;
  const index = usernames.indexOf(username);
  if(index != -1)
    usernames.splice(index, 1);

  res.end("Success");
});


app.post("/messages", async function(req, res){
  const { body: { name, msg } } = req;
  const msgObj = { name, msg, time: new Date().toISOString() };
  await client.rpushAsync("messages", JSON.stringify(msgObj) );
  const messages = await client.lrangeAsync( "messages", 0, -1 )

  res.send(JSON.stringify(messages));
});


app.get("/messages", async function(req, res){
  const messages = await client.lrangeAsync( "messages", 0, -1 );
  res.send(JSON.stringify(messages));
})

const server = http.listen(CHAT_PORT, function() {
    console.log(`Chat listening on ${ CHAT_PORT }`);
});