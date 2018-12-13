/////////////////////////////////////////////
/////////////////////////////////////////////
module.exports.connection = function(params){
	const  mysql = require('mysql2');
	return mysql.createConnection({
		host     : process.env.DB_HOST 		|| 'localhost',
		user     : process.env.DB_USER 		|| 'test',
		password : process.env.DB_PASSWORD 	|| 'test',
		database : process.env.DB_DATABASE 	|| 'replecon'
	});
};
/////////////////////////////////////////////
module.exports.asynccon = async function(){
	// const connection = await mysql.createConnection(/* ... */) or mysql.createConnection(/* ... */).then( connection => { /* .... */ })
	const  mysql = require('mysql2/promise');
	return await mysql.createConnection({
		host     : process.env.DB_HOST 		|| 'localhost',
		user     : process.env.DB_USER 		|| 'test',
		password : process.env.DB_PASSWORD 	|| 'test',
		database : process.env.DB_DATABASE 	|| 'replecon'
	});
};
/////////////////////////////////////////////
module.exports.pool = async function(){
	const  mysql = require('mysql2/promise');
	return  await mysql.createPool({
		host     : process.env.DB_HOST || 'localhost',
		user     : process.env.DB_USER || 'test',
		password : process.env.DB_PASSWORD || 'test',
		database : process.env.DB_DATABASE || 'replecon',
	    connectionLimit : 500000, //important
	    debug    : false
	});
};
module.exports.childcon = function(params){
	const  mysql = require('mysql2/promise');
	return mysql.createConnection({
		host     : params.host 		|| 'localhost',
		user     : params.user 		|| 'test',
		password : params.password 	|| 'test',
		database : params.name 		|| 'wpchild'
	});
};
module.exports.chilpool = async function(params){
	const  mysql = require('mysql2/promise');
	return  await mysql.createPool({
		host     : params.host 		|| 'localhost',
		user     : params.user 		|| 'test',
		password : params.password 	|| 'test',
		database : params.name 		|| 'wpchild',
	    connectionLimit : 500000, //important
	    multipleStatements: true,
	    debug    : false
	    // debug    : true
	});
};
/////////////////////////////////////////////
module.exports.sshcon = function(params){
	const mysql = require('mysql-ssh');
    var ssh = {
        host: params['ssh[host]']
        ,user: params['ssh[user]']
        ,password: params['ssh[password]']
    };
    if(params['ssh[port]']) ssh.port = params['ssh[port]'];

    var db = {
        host: params['db[host]']
        ,user: params['db[user]']
        ,password: params['db[password]']
        ,database: params['db[name]']
    };
    if(params['db[name]']) db.name = params['db[name]'];
    if(params['db[port]']) db.port = params['db[port]'];

	return mysql.connect(ssh,db);
};

// module.exports.sshcon = async function(params){
// 	const mysql = require('mysql-ssh');
// 	mysqlssh.connect(
// 	    {
// 	        host: '198.16.108.21'
// 	        ,user: 'root'
// 	        ,password: 'T9z8T0a2'
// 	        ,port: 321
// 	        // ,privateKey: fs.readFileSync(process.env.HOME + '/.ssh/id_rsa')
// 	    },
// 	    {
// 	        host: '127.0.0.1'
// 	        ,user: 'root'
// 	        ,password: '3J6eOYvA'
// 	        ,database: 'wp_test'
// 	    }
// 	)
// 	.then(client => {
// 	    client.query(params.query, function (err, results, fields) {
// 	        if (err) throw err
// 	        console.log(results);
// 	        mysqlssh.close()
// 	    })
// 	})
// 	.catch(err => {
// 	    console.log(err)
// 	})
// };
/////////////////////////////////////////////
// const mysql = require('mysql');
// const mysql = require('mysql-pool');
// module.exports.pool = function(params){
// 	var pool 	= mysql.createPool({
// 	    // connectionLimit : 100, //important
// 		host     : params.host || 'localhost',
// 		user     : params.user || 'test',
// 		password : params.password || 'test',
// 		database : 'replecon',
// 	    debug    :  false
// 	});
// 	return pool;
// };



