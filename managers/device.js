var bcrypt = require('bcrypt-nodejs')
var path = require('path')
var mkdirp = require('mkdirp')
var fs = require('fs')
var mongoose = require('mongoose')

var request = require('request')

var Device = require('../models/device')

exports.add = function(name, topic, user_id, callback) {

  if (!name || !topic || !user_id) {
    let response = {
      success: false,
      message: 'Há parâmetros faltando no corpo da requisição',
      device: null,
      code: 500
    }
    callback(response)
    return
  }

  var device = new Device({
    name: name,
    topic: topic,
    closed: false,
    working: false,
    onDelay: 5,
    offDelay: 20 * 60,
    owner: user_id,
    last_updated: new Date()
  })

  device.save(function(error) {
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

    let response = {
      success: true,
      message: 'Novo dispositivo adicionado com sucesso.',
      device: device,
      code: 200
    }
    callback(response)
  })
}

exports.verify_ownership = function(topic, user_id, callback) {
  Device.findOne({
    topic: topic,
    owner: user_id
  }, function(error, device) {
    if (error || !device || device == null || device == undefined) {
      callback(false, null)
    } else {
      callback(true, device)
    }
  })
}

exports.update = function(body, topic, callback) {
    var params = {
      closed: body['closed'],
      onDelay: body['onDelay'],
      offDelay: body['offDelay'],
      working: body['working']
    }
    console.log(params)
    var data = {}
    for (var param in params) {
      if (params[param]) {
        data[param] = params[param]
      }
    }
    if (!data || data == {}) {
      var response = {
        success: false,
        message: 'Nada foi enviado para edição',
        code: 500
      }
      callback(response)
      return
    }

    Device.findOne({
      topic: topic
    }, function (error, device) {
      if (error || !device || device == null || device == undefined) {
        let response = {
          success: false
          , message: 'Este dispositivo não foi encontrado para esta conta.'
          , code: 404
        }
        callback(response)
        return
      }

      if (params || params.closed != null || params.closed != undefined) {
        device.closed = params.closed
      }
      if (params || params.onDelay != null || params.onDelay != undefined) {
        device.onDelay = params.onDelay
      }
      if (params || params.offDelay != null || params.offDelay != undefined) {
        device.offDelay = params.offDelay
      }
      if (params || params.working != null || params.working != undefined) {
        device.working = params.working
      }

      device.last_updated = new Date()
      console.log('Last update: ', device.last_updated)
      device.save(function (err) {
        if (err) {
          let response = {
            success: false
            , message: err.message
            , code: 500
          }
          callback(response)
          return
        }

        console.log('atualizado', device)

        let response = {
          success: true
          , message: 'Dispositivo atualizado com sucesso'
          , code: 200
        }
        callback(response)
      })

    })
}

exports.delete = function (topic, user_id, callback) {
  Device.findOneAndRemove({
    owner: user_id
    , topic: topic
  }, function (error, device) {
    if (error) {
      let response = {
        success: true
        , message: error.message
        , code: 500
      }
      callback(response)
      return
    }
    let response = {
      success: true
      , message: 'Dispositivo deletado com sucesso'
      , code: 200
    }
    callback(response)
  })
}

exports.user_devices = function (user_id, callback) {
  Device.find({
    owner: user_id
  }, function (error, devs) {
    if (error || !devs || devs == null || devs == undefined || devs == []) {
      let response = {
        success: true
        , message: 'Dispositivos cadastrados para o usuário: '
        , devices: []
      }
      callback(response)
    } else {
      let response = {
        success: true
        , message: 'Dispositivos cadastrados para o usuário: '
        , devices: devs
      }
      callback(response)
    }
  })
}

exports.device = function (user_id, device_id, callback) {
  Device.findOne({
    topic: device_id
    , owner: user_id
  }, function (error, dev) {
    if (error || !dev || dev == null || dev == undefined) {
      callback(null)
    } else {
      callback(dev)
    }
  })
}
