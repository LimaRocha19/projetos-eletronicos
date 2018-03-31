var bcrypt = require('bcrypt-nodejs')
var path = require('path')
var mkdirp = require('mkdirp')
var fs = require('fs')
var mongoose = require('mongoose')

var request = require('request')

var User = require('../models/user')
exports.password = require("./password")

// criação de novo usuário

exports.signup = function(username, email, password, callback) {

  // verifica se o requerente enviou todos os dados necessários para cadastro
  if (!username || !email || !password || !callback) {
    let response = {
      success: false,
      message: 'Há parâmetros faltando no corpo da requisição.',
      user: null,
      code: 500
    }
    callback(response)
    return
  }

  let hash = bcrypt.hashSync(password)
  var user = new User({
    username: username,
    email: email,
    password: hash,
    reset_id: ''
  })

  user.save(function(error) {
    if (error) {
      let response = {
        success: false,
        message: error.message,
        user: null,
        code: 500
      }
      callback(response)
      return
    }

    user.password = null
    user.reset_id = null

    let response = {
      success: true,
      message: 'Usuário criado com sucesso, bem-vindo à nossa plataforma',
      user: user,
      code: 200
    }
    callback(response)
  })

}

// login de usuário existente

exports.signin = function(username, password, callback) {

  if (!username || !password) {
    let response = {
      success: false,
      message: 'Há parâmetros faltando no corpo da requisição.',
      user: null,
      code: 500
    }
    callback(response)
    return
  }

  User.findOne({
    username: username
  }, function(error, user) {
    if (error) {
      let response = {
        success: false,
        message: error.message,
        user: null,
        code: 500
      }
      callback(response)
      return
    }
    if (!user || user == null || user == undefined) {
      let response = {
        success: false,
        message: 'Usuário não cadastrado, este nome de usuário não foi encontrado em nossa base de dados.',
        user: null,
        code: 500
      }
      callback(response)
      return
    }

    let valid = bcrypt.compareSync(password, user.password)
    if (!valid || valid == false) {
      let response = {
        success: false,
        message: 'Senha incorreta! Se a esqueceu, realize o procedimento de redefinição de senha.',
        user: null,
        code: 500
      }
      callback(response)
      return
    }

    user.password = null
    user.reset_id = null

    let response = {
      success: true,
      message: 'Usuário logado em nossos sistemas, tenha uma boa sessão.',
      user: user,
      code: 200
    }
    callback(response)
  })
}
