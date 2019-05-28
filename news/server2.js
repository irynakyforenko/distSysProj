const express = require('express');
const app = express();
const http = require('http').Server(app);
require("dotenv").config({ 
  path: require("path").resolve(__dirname, "..", "hub", ".env")
});
const bluebird = require('bluebird');

const { 
  CONSUL_HOST, 
  NEWS_IP2: NEWS_IP,
  NEWS_PORT2: NEWS_PORT,
  NEWS_ID2:NEWS_ID
} = process.env;

var sqlite = require('sqlite');
const dbPromise = sqlite.open('./db.sqlite', { Promise });
let db;




var bodyParser = require('body-parser')
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

var redis = require("redis");
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
var client = redis.createClient();

var consul = require('consul')({
  promisify: true,
  host: CONSUL_HOST,
});

const details = {
  name: 'news',
  address: NEWS_IP,
  port: Number(NEWS_PORT),
  check: {
    ttl: '10s',
    deregistercriticalserviceafter: '1s',
  },
  id: NEWS_ID
};

consul.agent.service.register(details, (err, xyz) => {
  if (err) {
    console.error(err);
    throw new Error(err);
  }
  console.log('registered with Consul');

  let interval = setInterval(() => {
    consul.agent.check.pass({id:`service:${ NEWS_ID }`}, err => {
      if (err) throw new Error(err);
      console.log('told Consul that we are healthy');
    });
  }, 5 * 1000);

  process.on('SIGINT', () => {
    console.log('SIGINT. De-Registering...');
    clearInterval(interval);
    interval = null;

    let details = {id: NEWS_ID};
    // consul.agent.service.deregister(details, (err) => {
    //   console.log('de-registered.', err);
    //   process.exit();
    // });
    process.exit();
  });
});

app.post("/news", async function(req, res){
  const { body: { desc, title } } = req;
  
  await db.all(`Insert into news (title, desc) values('${ title }', '${ desc }')`);

  res.end();
});



app.get("/news", async function(req, res){
  const { query: { user } } = req;
  const news = await db.all("SELECT * FROM news");
  if(!user) return res.send(news);

  let favouriteMessages = await client.hgetAsync("favouriteMessages", user);
  
  if(favouriteMessages == null) favouriteMessages = "";

  let arr = favouriteMessages.split(",");
  for(let i = 0; i < news.length; i++){
    const msg = news[ i ];

    if(arr.indexOf(String(msg.id)) !== -1) 
      msg.isFavourite = true;
  }

  res.send(news);
});

app.post("/markSingleNewsAsFavourite", async function(req, res){
  const { query: { user }, body: { index } } = req;
  
  let favouriteMessages = await client.hgetAsync("favouriteMessages", user);
  if(favouriteMessages == null) favouriteMessages = "";

  let arr = favouriteMessages.split(",");
  if(arr.indexOf(String(index)) == -1) 
    arr.push(String(index));
  else
    arr = arr.filter(it => it !== String(index));
  
  await client.hsetAsync("favouriteMessages", user, arr.join(","));

  res.send("");
})

app.delete("/deleteFavourites", async function(req, res){
  const { body: { username } } = req;
  if(!username) return;
  
  await client.hsetAsync("favouriteMessages", username, "");
  res.send("");
});


!async function(){
  db = await dbPromise;

  await db.all("CREATE TABLE IF NOT EXISTS news (id integer primary key autoincrement, title text, desc text)");
  
  const server = http.listen(NEWS_PORT, function() {
    console.log(`News listening on ${ NEWS_PORT }`);
  });
}();