// const sad = require('./modules/sadman');

// const fs 		= require('fs');
// const path 		= require('path');
// const session 	= require('express-session')
// const cookieParser = require('cookie-parser');

// const helpers = require('./module/helpers');

// const Mysql = require('./module/mysql');
// const sql = new Mysql({});

const Express = require('./modules/server');
const server = new Express({
		'rootdir':__dirname
	});

// const router	= require('express-router');
// const exphbs 	= require('express-handlebars');//view engine



// app.dynamicHelpers(helpers);



// var mymodule = require('./module/test');
// var mymodule2 = require('./module/test2');
// mymodule.printone();
// mymodule2.show();


/////////////////////////////////////////////////
// app.use(function (req, res, next) {
//   var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
//   console.log('Client IP:', ip);
//   next();
// });
//////////////////////////////////////////////////
