var bcrypt = require('bcrypt-nodejs');
var path = require('path');
var mkdirp = require('mkdirp');
var fs = require('fs');
var uuid = require('uuid');

var User = require('../models/user');

var email   = require("emailjs");
var server  = email.server.connect({
									user:			"isaiahlima18@gmail.com",
									password:	"jxzdpcqqbhwvhrnd",
									host:			"smtp.gmail.com",
									ssl:			true
							});


exports.reset = function(body, callback) {
	if (!body.email || !body.new_password || !body.reset_id) {
		var response = {
			sucess: false
			, message: 'Há parâmetros faltando no corpo da requisição.'
			, user: null
			, code: 500
		};
		callback(response);
		return;
	}

	if (body.reset_id == "") {
		var response = {
			sucess: false
			, message: 'Accesso negado'
			, user: null
			, code: 401
		};
		callback(response);
		return;
	}

	User.findOne({
		email: body.email
		, reset_id: body.reset_id
	}, function (error, user) {
		if (error) {
			var response = {
				success: false
				, message: error.message
				, user: null
				, code: 500
			};
			callback(response);
			return;
		}

		if (!user) {
			var response = {
				success: false
				, message: 'Usuário não encontrado'
				, user: null
				, code: 404
			};
			callback(response);
			return;
		}

		// if (!user.avaliable) {
		// 	var response = {
		// 		success: false
		// 		, message: 'Esta conta está desativada. Realize o procedimento de reativação'
		// 		, user: null
		// 		, code: 500
		// 	};
		// 	callback(response);
		// 	return;
		// }

		var hash = bcrypt.hashSync(body.new_password);
		user.password = hash
		user.reset_id = "";

		user.save( function (error) {
			if (error) {
				var response = {
					success: false
					, message: error.message
					, user: user
					, code: 500
				};
				callback(response);
				return;
			}
			var response = {
				success: true
				, message: 'Senha modificada com sucesso'
				, user: user
				, code: 200
			};
			callback(response);
		});
	});
}

exports.forgot = function(body, callback) {
	if (!body.email) {
		var response = {
			sucess: false
			, message: 'Há parâmetros faltando no corpo da requisição'
			, user: null
			, code: 500
		};
		callback(response);
		return;
	}

	User.findOne({
		email: body.email,
	}, function (error, user) {
		if (error) {
			var response = {
				success: false
				, message: error.message
				, user: null
				, code: 500
			};
			callback(response);
			return;
		}

		if (!user) {
			var response = {
				success: false
				, message: 'Usuário não encontrado'
				, user: null
				, code: 404
			};
			callback(response);
			return;
		}

		// if (!user.avaliable) {
		// 	var response = {
		// 		success: false
		// 		, message: 'Esta conta está desativada. Realize o procedimento de reativação'
		// 		, user: null
		// 		, code: 500
		// 	};
		// 	callback(response);
		// 	return;
		// }

		user.reset_id = uuid.v1();

		user.save( function (error) {
			if (error) {
				var response = {
					success: false
					, message: error.message
					, code: 500
				};
				callback(response);
				return;
			}

			// send the message and get a callback with an error or details of the message that was sent
			server.send({
				text:				"Para alterar sua senha, clique no link: https://projetos-eletronicos.herokuapp.com/web/user/reset?"+
										"email="+ user.email +
										"&reset_id="+ user.reset_id
				, from:			"isaiahlima18@gmail.com"
				, to:				user.email
				, subject:	"Redefinição de senha Projetos I"
			}, function(error, message) {
				if (error) {
					var response = {
						success: false
						, message: error
						, user: null
						, code: 500
					};
					callback(response);
					return;
				}

				user.password = null
				user.reset_id = null

				var response = {
					success: true
					, message: message.text
					, user: user
					, code: 200
				};
				callback(response);
			});
		});
	});
}
