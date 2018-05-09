var express = require('express')
var multer = require('multer')
var path = require('path')
var fs = require('fs')
var merge = require('merge')

var router = express.Router()

var manager = require('../managers/device')
var token = require('../security/token')

var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './public/uploads')
  },
  filename: function(req, file, cb) {
    cb(null, 'upload-' + Date.now() + '.png')
  }
})
var upload = multer({
  storage: storage
})

var mqtt = require('mqtt')

var mqtt_url = 'mqtt://ryrnnwvc:q4JBhYKmD1FO@m10.cloudmqtt.com:17269'
var client = mqtt.connect(mqtt_url)

router.post('/add', function (req, res) {
  var session = req.session
  var user = session.user

  if (!user || !session) {
    var response = {
      success: false,
      message: 'Usuário não logado'
    }
    res.status(401).json(response)
    return
  }
  var verify = token.verify(session['token'])
  if (!verify) {
    var response = {
      success: false,
      message: 'Token de acesso expirado ou inexistente'
    }
    res.status(401).json(response)
    return
  }

  let user_id = user._id
  console.log(req.body, user_id)
  manager.add(req.body.name, req.body.topic, user_id, function (response) {
    res.status(response.code).json(response)
  })
})

router.get('/devices', function (req, res) {
  var session = req.session
  var user = session.user

  if (!user || !session) {
    var response = {
      success: false,
      message: 'Usuário não logado',
      devices: []
    }
    res.status(401).json(response)
    return
  }
  var verify = token.verify(session['token'])
  if (!verify) {
    var response = {
      success: false,
      message: 'Token de acesso expirado ou inexistente',
      devices: []
    }
    res.status(401).json(response)
    return
  }

  let user_id = user._id

  manager.user_devices(user_id, function (response) {
    for (var d in response.devices) {
      client.subscribe('esp8266/' + d.topic)
    }
    res.status(200).json(response)
  })
})

client.on('connect', function () {

  router.delete('/delete', function (req, res) {
    var session = req.session
    var user = session.user

    if (!user || !session) {
      var response = {
        success: false,
        message: 'Usuário não logado'
      }
      res.status(401).json(response)
      return
    }
    var verify = token.verify(session['token'])
    if (!verify) {
      var response = {
        success: false,
        message: 'Token de acesso expirado ou inexistente'
      }
      res.status(401).json(response)
      return
    }

    let topic = req.query.topic
    let user_id = user._id

    manager.delete(topic, user_id, function (response) {
      if (response.succes) {
        client.unsubscribe(topic)
      }
      res.status(response.code).json(response)
    })
  })

  router.put('/update/:topic/:key/:value', function (req, res) {
    var session = req.session
    var user = session.user

    if (!user || !session) {
      var response = {
        success: false,
        message: 'Usuário não logado'
      }
      res.status(401).json(response)
      return
    }
    var verify = token.verify(session['token'])
    if (!verify) {
      var response = {
        success: false,
        message: 'Token de acesso expirado ou inexistente'
      }
      res.status(401).json(response)
      return
    }

    let topic = req.params['topic']
    let key = req.params['key']
    let value = req.params['value']
    let user_id = user._id

    manager.verify_ownership(topic, user_id, function (ownership_valid, device) {
      if (!ownership_valid) {
        let response = {
          success: false
          , message: 'Este dispositivo não pertence à sua conta!'
          , device: null
        }
        callback(response)
        return
      } else {
        var msg = {}
        device[key] = value
        msg['closed'] = device['closed']
        msg['offDelay'] = device['offDelay']
        let message = JSON.stringify(msg)
        client.subscribe(topic + '_recv', { qos: 2 })
        client.publish('esp8266/' + topic, message, { qos: 2 })
        console.log(topic, message)
        res.status(200).json({
          success: true
          , message: 'Published'
          , device: device
        })
      }
    })
  })
})

client.on('reconnect', function () {

  router.delete('/delete', function (req, res) {
    var session = req.session
    var user = session.user

    if (!user || !session) {
      var response = {
        success: false,
        message: 'Usuário não logado'
      }
      res.status(401).json(response)
      return
    }
    var verify = token.verify(session['token'])
    if (!verify) {
      var response = {
        success: false,
        message: 'Token de acesso expirado ou inexistente'
      }
      res.status(401).json(response)
      return
    }

    let topic = req.query.topic
    let user_id = user._id

    manager.delete(topic, user_id, function (response) {
      if (response.succes) {
        client.unsubscribe(topic)
      }
      res.status(response.code).json(response)
    })
  })

  router.put('/update/:topic/:key/:value', function (req, res) {
    var session = req.session
    var user = session.user

    if (!user || !session) {
      var response = {
        success: false,
        message: 'Usuário não logado'
      }
      res.status(401).json(response)
      return
    }
    var verify = token.verify(session['token'])
    if (!verify) {
      var response = {
        success: false,
        message: 'Token de acesso expirado ou inexistente'
      }
      res.status(401).json(response)
      return
    }

    let topic = req.params['topic']
    let key = req.params['key']
    let value = req.params['value']
    let user_id = user._id

    manager.verify_ownership(topic, user_id, function (ownership_valid, device) {
      if (!ownership_valid) {
        res.status(404).json({
          success: false
          , message: 'Este dispositivo não pertence à sua conta!'
          , device: null
        })
      } else {
        var msg = {}
        device[key] = value
        msg['closed'] = device['closed']
        msg['offDelay'] = device['offDelay']
        let message = JSON.stringify(msg)
        client.subscribe(topic + '_recv', { qos: 2 })
        client.publish('esp8266/' + topic, message, { qos: 2 })
        console.log(topic, message)
        res.status(200).json({
          success: true
          , message: 'Published'
          , device: device
        })
      }
    })
  })
})

client.on('close', function () {

  router.delete('/delete', function (req, res) {
    var session = req.session
    var user = session.user

    if (!user || !session) {
      var response = {
        success: false,
        message: 'Usuário não logado'
      }
      res.status(401).json(response)
      return
    }
    var verify = token.verify(session['token'])
    if (!verify) {
      var response = {
        success: false,
        message: 'Token de acesso expirado ou inexistente'
      }
      res.status(401).json(response)
      return
    }

    res.status(404).json({
      success: false
      , message: 'Conexão com broker perdida, tente novamente mais tarde'
    })
  })

  router.put('/update/:topic/:key/:value', function (req, res) {
    var session = req.session
    var user = session.user

    if (!user || !session) {
      var response = {
        success: false,
        message: 'Usuário não logado'
      }
      res.status(401).json(response)
      return
    }
    var verify = token.verify(session['token'])
    if (!verify) {
      var response = {
        success: false,
        message: 'Token de acesso expirado ou inexistente'
      }
      res.status(401).json(response)
      return
    }

    res.status(404).json({
      success: false
      , message: 'Conexão com broker perdida, tente novamente mais tarde'
    })
  })
})

client.on('offline', function () {

  router.delete('/delete', function (req, res) {
    var session = req.session
    var user = session.user

    if (!user || !session) {
      var response = {
        success: false,
        message: 'Usuário não logado'
      }
      res.status(401).json(response)
      return
    }
    var verify = token.verify(session['token'])
    if (!verify) {
      var response = {
        success: false,
        message: 'Token de acesso expirado ou inexistente'
      }
      res.status(401).json(response)
      return
    }

    res.status(404).json({
      success: false
      , message: 'Conexão com broker perdida, tente novamente mais tarde'
    })
  })

  router.put('/update/:topic/:key/:value', function (req, res) {
    var session = req.session
    var user = session.user

    if (!user || !session) {
      var response = {
        success: false,
        message: 'Usuário não logado'
      }
      res.status(401).json(response)
      return
    }
    var verify = token.verify(session['token'])
    if (!verify) {
      var response = {
        success: false,
        message: 'Token de acesso expirado ou inexistente'
      }
      res.status(401).json(response)
      return
    }

    res.status(404).json({
      success: false
      , message: 'Conexão com broker perdida, tente novamente mais tarde'
    })
  })
})

client.on('message', function (topic, message) {

  console.log(message.toString())

  try {
    let msg = JSON.parse(message.toString())
    console.log(message.toString(), msg)

    /*
     * {
     *  "onDelay": 10
     *  "offDelay": 2000
     *  "closed": true
     *  "working": true
     * }
     */

     manager.update(msg, topic.replace('_recv',''), function (response) {
       console.log(response)
     })
  } catch (e) {}
})

module.exports = router
