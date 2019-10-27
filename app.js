const http = require('http');

global.__basedir = __dirname;
const server = require('./server')({
	'rootdir':__dirname
});

http.createServer(server).listen(server.get('port'), () => {
	console.log('Node app is running on port', server.get('port'));
});