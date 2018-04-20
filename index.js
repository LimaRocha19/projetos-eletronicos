// mark - express
var express = require('express')
var subdomain = require('express-subdomain')
var mqtt = require('mqtt')
var app = express()
var http = require('http').Server(app)
var io = require('socket.io')(http)

var port = process.env.PORT || 5000

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
    return uuid.v1()
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

var device_route = require('./routes/device')
app.use('/device', device_route)

// mark: WELCOME MESSAGE FOR EVERYONE WHO'S TRYING TO GET TO THIS BEAUTIFULL SERVER MADE BY US

app.get('/', function (req, res) {
  let welcome = {
    port: port
    , message: 'Servidor de Projetos Eletrônicos I está funcionando'
    , success: true
  }
  res.status(200).json(welcome)
})

// mark: test mqtt publish route

var mqtt_url = 'mqtt://ryrnnwvc:q4JBhYKmD1FO@m10.cloudmqtt.com:17269'
var client = mqtt.connect(mqtt_url)

client.on('connect', function () {

  console.log('Connected to: ' + mqtt_url)

  app.get('/publish/:message', function (req, res) {
    // let msg = JSON.stringify({
    //   date: new Date().toString
    //   , message: req.params['message']
    // })
    let msg = req.params['message']
    client.subscribe('node-pub')
    client.subscribe('node-tests')
    client.publish('esp8266/node-tests', msg)
    res.json({
      topic: 'node-tests'
      , message: req.params['message']
      , success: true
    })
  })
})
//
// client.on('reconnect', function () {
//
//   console.log('Reconnected to: ' + mqtt_url)
//
//   app.post('/publish/:message', function (req, res) {
//     let msg = JSON.stringify({
//       date: new Date().toString
//       , message: req.params['message']
//     })
//     client.subscribe('node-tests')
//     client.publish('node-tests', msg)
//     res.json({
//       topic: 'node-tests'
//       , message: req.params['message']
//       , success: true
//     })
//   })
// })
//
// client.on('close', function () {
//
//   console.log('Closed to: ' + mqtt_url)
//
//   app.post('/publish/:message', function (req, res) {
//     res.json({
//       topic: 'node-tests'
//       , message: 'connection closed'
//       , success: false
//     })
//   })
// })
//
// client.on('offline', function () {
//
//   console.log('Offline to: ' + mqtt_url)
//
//   app.post('/publish/:message', function (req, res) {
//     res.json({
//       topic: 'node-tests'
//       , message: 'econnection offline'
//       , success: false
//     })
//   })
// })
//
client.on('message', function (topic, message) {
  // message is Buffer
  // let msg = JSON.parse(message.toString())
  // console.log('Message received: ' + msg['message'])
  console.log(message.toString())
})

var dev_manager = require('./managers/device')
var token = require('./security/token')

io.on('connection', function (client) {
    console.log(client.id + 'user connected')

    client.on("consult", function(device_data) {

      // device_data should contain the user's VALID token, the user's id and the device's id
      if (!device_data.token || !device_data.user_id || !device_data.device_id) {
        return
      }
      let verify = token.verify(device_data.token)
      if (!verify) {
        return
      }

      dev_manager.device(device_data.user_id, device_data.device_id, function (dev) {
        if (dev == null) {
          return
        } else {
          client.emit("device", dev)
        }
      })
    })

    client.on("disconnect", function() {
      console.log("Disconnect")
    })
})

http.listen(port)
console.log({
  port: port
  , message: 'Servidor de Projetos Eletrônicos I está funcionando'
  , success: true
})
