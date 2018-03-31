var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var device_schema = new Schema({
  name: String // exemplo: Televisão da Sala
  , topic: {
    type: String
    , unique: true
  }
  , closed: { // status do chaveamento do dispositivo
    type: Boolean
    , default: false
  }
  , working: { // status do funcionamento do dispositivo em si
    type: Boolean
    , default: false
  }
  , onDelay: {
    type: Number
    , default: 5 // 5 segundos
  }
  , offDelay: {
    type: Number
    , default: 20*60 // 20 minutos, mas deve ser colocado em segundos
  }
  , owner: String
  , last_updated: Date
});

module.exports = mongoose.model('Device', device_schema);
