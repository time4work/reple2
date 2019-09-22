const express 		= require('express');
const favicon 		= require('serve-favicon');
const expressLogging= require('express-logging');
const logger 		= require('logops');
const bodyParser 	= require('body-parser');
const cookieSession = require('cookie-session');

const router = require('./router');

module.exports = function(params) {
    const dir 		= params.rootdir;
    const port 		= process.env.port || 5000;
	const server 		= express();


    if (process.env.NODE_ENV === 'dev')
        server.set('env', 'development');
    else 
        server.set('env', 'production');

    server.use( expressLogging(logger)) ;
    server.set('port', (process.env.PORT || port) );
	server.set('views', dir + '/views');
    server.set('view engine', 'ejs');
	server.use( express.static(dir + '/public') );
	server.use( bodyParser.json({limit: '50mb'}) );
	server.use( bodyParser.urlencoded({ extended: false,limit: '50mb', parameterLimit:50000 }) );
	server.use( favicon('public/favicon.ico'));
	server.use( cookieSession({
		name: 'session',
		keys: ['pass', 'test'],
		maxAge: 24 * 60 * 60 * 1000 // 24h
    }));
    
    // SET ROUTING
    router(server);

	return server;
}
