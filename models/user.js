var mongoose = require('mongoose')
var Schema = mongoose.Schema

var user_schema = new Schema({
  username: {
    type: String
    , unique: true
  }
  , email: {
    type: String
    , unique: true
  }
  , password: String
  , reset_id: String
});

module.exports = mongoose.model('User', user_schema);
