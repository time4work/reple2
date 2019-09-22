// TODO: LoginService with normal authentication
// const LoginService = require('../service/login.service');

module.exports = {

    getPage: (request, response) => { 
		response.render('pages/login', {});
    },
    
    postLogin: (request, response) => { 
		let login = request.body.login;
		let password = request.body.password;

		if (login == "root" && password == "morehyip") {
			request.session.pass = '2abh1y235kiu.bvcew32def';
			response.send({ redirect:'/' });
		} else response.send({ error:'wrong login or password' })
	},

}