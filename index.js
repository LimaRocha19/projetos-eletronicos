// mark - express
var express = require('express')
var subdomain = require('express-subdomain')
var mqtt = require('mqtt');
var app = express()

// mark - express-session / uuid
var session = require('express-session')
var uuid = require('uuid')

var multer = require('multer')

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads')
  }
  , filename: function (req, file, cb) {
    cb(null, 'upload-' + Date.now() + '.png')
  }
})

var upload = multer({
  storage: storage
})

app.set('subdomain offset', 3)

app.use(session({
  genid: function (req) {
    return uuid.v1();
  }
  , secret: 'lumamiruvisado'
  , resave: false
  , saveUninitialized: true
}))

app.set('view engine', 'pug')

// mark - body-parser
var body_parser = require('body-parser')
app.use(body_parser.urlencoded({
  extended: false
}))
app.use(body_parser.json())

// mark - morgan
var morgan = require('morgan')
app.use(morgan('dev'))

// mark - database
var mongoose = require('mongoose')
var config = require('./database/config')
mongoose.Promise = global.Promise
console.log(config.database)
mongoose.connect(config.database)
app.set('superSecret', config.secret)

// mark: password recover
app.set('views', __dirname + '/views')
var web_route = require('./web/index')
app.use('/web', web_route)

// mark: USER ROUTES
var user_route = require('./routes/user')
app.use('/user', user_route)

// mark: WELCOME MESSAGE FOR EVERYONE WHO'S TRYING TO GET TO THIS BEAUTIFULL SERVER MADE BY US

app.get('/', function (req, res) {
  let welcome = {
    port: 5000
    , message: 'Servidor de Projetos Eletrônicos I está funcionando'
    , success: true
  }
  res.status(200).json(welcome)
})

// mark: test mqtt publish route

var mqtt_url = 'mqtt://ryrnnwvc:q4JBhYKmD1FO@m10.cloudmqtt.com:17269';
var client = mqtt.connect(mqtt_url);

client.on('connect', function () {

  console.log('Connected to: ' + mqtt_url)

  app.post('/publish/:message', function (req, res) {
    let msg = JSON.stringify({
      date: new Date().toString
      , message: req.params['message']
    })
    client.subscribe('node-tests')
    client.publish('node-tests', msg)
    res.json({
      topic: 'node-tests'
      , message: req.params['message']
      , success: true
    })
  })
})

client.on('reconnect', function () {

  console.log('Reconnected to: ' + mqtt_url)

  app.post('/publish/:message', function (req, res) {
    let msg = JSON.stringify({
      date: new Date().toString
      , message: req.params['message']
    })
    client.subscribe('node-tests')
    client.publish('node-tests', msg)
    res.json({
      topic: 'node-tests'
      , message: req.params['message']
      , success: true
    })
  })
})

client.on('close', function () {

  console.log('Closed to: ' + mqtt_url)

  app.post('/publish/:message', function (req, res) {
    res.json({
      topic: 'node-tests'
      , message: 'connection closed'
      , success: false
    })
  })
})

client.on('offline', function () {

  console.log('Offline to: ' + mqtt_url)

  app.post('/publish/:message', function (req, res) {
    res.json({
      topic: 'node-tests'
      , message: 'econnection offline'
      , success: false
    })
  })
})

client.on('message', function (topic, message) {
  // message is Buffer
  console.log('Message received: ' + message.toString())
})

app.listen(5000)
console.log({
  port: 5000
  , message: 'Servidor de Projetos Eletrônicos I está funcionando'
  , success: true
})