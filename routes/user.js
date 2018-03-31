var express = require('express')
var multer = require('multer')
var path = require('path')
var fs = require('fs')
var merge = require('merge')

var router = express.Router()

var manager = require('../managers/user')
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

router.post('/signup', function(req, res) {
  var session = req.session
  // var user = session.user

  // if (!user || !session) {
  //   var response = {
  //     success: false,
  //     message: 'Usuário não logado'
  //   }
  //   res.status(401).json(response)
  //   return
  // }
  // var verify = token.verify(session['token'])
  // if (!verify) {
  //   var response = {
  //     success: false,
  //     message: 'Token de acesso expirado ou inexistente'
  //   }
  //   res.status(401).json(response)
  //   return
  // }

  var data = req.body
  manager.signup(data.username, data.email, data.password, function(response) {
    if (response.success) {
      session.cookie.expires = new Date(Date.now() + 365 * 24 * 3600000)
      session.cookie.maxAge = 365 * 24 * 3600000
      session.token = token.generate(response.user)
      session.user = response.user
    }
    res.status(response.code).json(response)
  })
})

router.post('/signin', function(req, res) {
  var session = req.session
  // var user = session.user

  // if (!user || !session) {
  //   var response = {
  //     success: false,
  //     message: 'Usuário não logado'
  //   }
  //   res.status(401).json(response)
  //   return
  // }
  // var verify = token.verify(session['token'])
  // if (!verify) {
  //   var response = {
  //     success: false,
  //     message: 'Token de acesso expirado ou inexistente'
  //   }
  //   res.status(401).json(response)
  //   return
  // }

  var data = req.body
  manager.signin(data.username, data.password, function(response) {
    if (response.success) {
      session.cookie.expires = new Date(Date.now() + 365 * 24 * 3600000)
      session.cookie.maxAge = 365 * 24 * 3600000
      session.token = token.generate(response.user)
      session.user = response.user
    }
    res.status(response.code).json(response)
  })
})

router.get('/profile', function(req, res) {
  var session = req.session
  var user = session.user

  if (!user || !session) {
    var response = {
      success: false,
      message: 'Usuário não logado',
      user: null
    }
    res.status(401).json(response)
    return
  }
  var verify = token.verify(session['token'])
  if (!verify) {
    var response = {
      success: false,
      message: 'Token de acesso expirado ou inexistente',
      user: null
    }
    res.status(401).json(response)
    return
  }

  let resp = {
    success: true,
    message: 'Perfil de usuário logado encontrado.',
    user: user
  }

  res.status(200).json(resp)
})

router.post('/password_reset', function (req, res) {
  // user email
  manager.password.forgot(req.body, function (response) {
    res.status(response.code).json(response)
  })
});

module.exports = router
