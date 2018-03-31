var express = require('express');
var multer = require('multer');
var path = require('path');
var fs = require('fs');
var user_manager = require('../managers/user.js');

var router = express.Router();

router.get("/user/reset", function (req, res) {
	var email = req.param('email');
	var reset_id = req.param('reset_id');

	if (!email || !reset_id ) {
		res.render('error', {
			title: 'Recuperar Senha'
			, message: 'Dados inválidos. Em caso de dúvida entre em contato com o suporte técnico'});
		return;
	}

	res.render('user/password_reset', {
		title: 'Recuperar Senha'
		, message: 'Informe uma nova senha'
		, email: email
		, reset_id: reset_id
	});
});

router.post("/user/reset", function (req, res) {
	user_manager.password.reset(req.body, function (response) {
		if (response.success) {
			res.render('success', {
				title: 'Recuperação de Senha'
				, message: 'A senha de ' + response.user.email + ' foi alterada com sucesso'});
			return;
		}

		res.render('error', {
			title: 'Recuperação de Senha'
			, message: 'Ocorreu um erro ao tentar alterar a senha. Entre em contato com o suporte ('+response.message+')'});
	});
});

module.exports = router;
