const { MongoClient } = require('mongodb');
let weather, client, reports;

const express = require('express');
const app = express();
const http = require('http').Server(app);
require("dotenv").config({ 
  path: require("path").resolve(__dirname, "..", "hub", ".env")
});

const { 
  CONSUL_HOST, 
  WEATHER_IP,
  WEATHER_PORT,
  WEATHER_ID
} = process.env;

var url = require("util").format("mongodb://%s,%s,%s/%s?replicaSet=%s&readPreference=%s"
  , `${ WEATHER_IP }:27017`
  , `${ WEATHER_IP }:27018`
  , `${ WEATHER_IP }:27019`
  , "weather"
  , "projectRepl"
  , "secondary");

const dbProm = MongoClient.connect(url, { 
  useNewUrlParser: true,
  bufferMaxEntries:0,
});


var bodyParser = require('body-parser')
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

var consul = require('consul')({
  promisify: true,
  host: CONSUL_HOST,
});

const details = {
  name: 'weather',
  address: WEATHER_IP,
  port: Number(WEATHER_PORT),
  check: {
    ttl: '10s',
    deregistercriticalserviceafter: '1s',
  },
  id: WEATHER_ID
};

consul.agent.service.register(details, (err, xyz) => {
  if (err) {
    console.error(err);
    throw new Error(err);
  }
  console.log('registered with Consul');

  let interval = setInterval(() => {
    consul.agent.check.pass({id:`service:${ WEATHER_ID }`}, err => {
      if (err) throw new Error(err);
      console.log('told Consul that we are healthy');
    });
  }, 5 * 1000);

  process.on('SIGINT', () => {
    console.log('SIGINT. De-Registering...');
    clearInterval(interval);
    interval = null;

    let details = { id: WEATHER_ID };
    consul.agent.service.deregister(details, (err) => {
      console.log('de-registered.', err);
      process.exit();
    });
    // process.exit();
  });
});


app.get("/reports", async function(req, res){
  res.send(await reports.find().toArray());
});

app.post("/weatherReport", async function(req, res){
  const { body: { day, hour, desc } } = req;

  try {
    await reports.insertOne({ day, hour, desc });
  } catch(e){
    return res.send("Write error.");
  }

  res.send("Success");
})


!async function(){
  client = await dbProm;
  weather = client.db("weather");
  reports = weather.collection("reports");


  const server = http.listen(WEATHER_PORT, function() {
    console.log(`Weather listening on ${ WEATHER_PORT }`);
  });
}();