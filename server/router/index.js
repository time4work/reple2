
const controller = require('../controller');
const projectRouter = require('./project.router');

module.exports = function(app) {
    app.use((request, response, next) => {
		if (request.url !== '/login') {
			request.session.test = 'test';

			if (request.session.pass === '2abh1y235kiu.bvcew32def') {
				next();
			} else {
				response.redirect('/login');
			}
		} else next();
    });	

	// 404, 500
    app.use((error, request, response, next) => {
        response.status(error.status || 500);
        response.render('error', {
            message: error.message,
            error: error
        });
    });

    // GET home page
    app.get('/', (request, response) => { 
        response.render('pages/index',{title : 'Happy ejs' });
    });
    
    // LOGIN ROUT
    app.get('/login', controller.login.getPage);
    app.post('/login', controller.login.postLogin);

	// PORJECTS ROUT
    app.get('/projects', controller.project.getPage);
	app.post('/projects', controller.project.postProjects); // TODO: refactor
	
	// PORJECT ROUT
	app.use('/project', projectRouter);

    // TEMPLATES ROUT
	app.get('/templates', controller.template.getPage);
	app.post('/templates', controller.template.postTemplates); // TODO: refactor

	app.get('/template/:id', controller.template.getTemplate);
    app.post('/template/:id', controller.template.postTemplate); // TODO: refactor
    
	// JSON ROUT
	app.get('/json', controller.json.getPage);
	app.post('/json', controller.json.postJson); // TODO: refactor

	// LIBRARY ROUT
	app.get('/library', controller.library.getPage);
	app.post('/library', controller.library.postLibrary); // TODO: refactor
}