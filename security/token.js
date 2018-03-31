var jwt = require('jsonwebtoken');
var key = 'projetosiquedahoraseria';

exports.generate = function (user) {
  var token = jwt.sign(user, key, {
    expiresIn: 7 * 24 * 60 * 60
  });
  return token;
};

exports.verify = function (token) {
  var decoded = jwt.verify(token, key);
  if (decoded) {
    return true;
  } else {
    return false;
  }
};
