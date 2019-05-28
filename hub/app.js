
require('dotenv').config({ 
  path: require("path").resolve( __dirname, ".env" ) 
});
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var auth = require('http-auth');
var basic = auth.basic({
    realm: "Simon Area.",
    file: path.resolve(__dirname, "./users.htpasswd")
});

const rp = require("request-promise");
function getServiceByName(services, name){
  for(var service in services)
    if(services[ service ].Service === name)
      return services[ service ];
  
  return null;
}

var app = express();

const { CONSUL_HOST } = process.env;

var bodyParser = require('body-parser')
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 



app.use('/newsAdmin', auth.connect(basic));
app.use("/weatherAdmin", auth.connect(basic));

app.post('/news', async function(req, res){
  const { body } = req;
  
  const services = await rp(`http://${ CONSUL_HOST }:8500/v1/agent/services`);
  const { Address, Port } = getServiceByName(JSON.parse(services), "news");

  const insertNews = await rp({
    method: 'POST',
    uri: `http://${ Address }:${Port}/news`,
    body,
    json: true
  });

  res.end();
});

app.post("/weatherReport", async function(req, res){
  const { body } = req;
  console.log(`http://${ CONSUL_HOST }:8500/v1/agent/services`);
  const services = await rp(`http://${ CONSUL_HOST }:8500/v1/agent/services`);
  const { Address, Port } = getServiceByName(JSON.parse(services), "weather");

  const insertReportRes = await rp({
    method: 'POST',
    uri: `http://${ Address }:${Port}/weatherReport`,
    body, 
    json:true
  });

  console.log(insertReportRes);
  if(insertReportRes == "Success")
    return res.end("Success");
  
  res.end("Error during insert");
})

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
