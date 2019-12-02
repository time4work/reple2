const connection = module.exports.connection = function(params) {
    const mysql = require('mysql2');
    const conf = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'test',
        password: process.env.DB_PASSWORD || 'test',
        database: process.env.DB_DATABASE || 'replecon'
    };
    if (process.env.DB_SOCK)
        conf.socketPath = process.env.DB_SOCK
    return mysql.createConnection(conf);
};

const asynccon = module.exports.asynccon = async function() {
    const mysql = require('mysql2/promise');
    const conf = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'test',
        password: process.env.DB_PASSWORD || 'test',
        database: process.env.DB_DATABASE || 'replecon'
    };
    if (process.env.DB_SOCK)
        conf.socketPath = process.env.DB_SOCK
    return await mysql.createConnection(conf);
};

const pool = module.exports.pool = async function() {
    const mysql = require('mysql2/promise');
    const conf = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'test',
        password: process.env.DB_PASSWORD || 'test',
        database: process.env.DB_DATABASE || 'replecon',
        connectionLimit: 500000, //important
        debug: false
    };
    if (process.env.DB_SOCK)
        conf.socketPath = process.env.DB_SOCK
    return await mysql.createPool(conf);
};

const childcon = module.exports.childcon = function(params) {
    const mysql = require('mysql2/promise');
    const conf = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'test',
        password: process.env.DB_PASSWORD || 'test',
        database: process.env.DB_DATABASE || 'wpchild'
    };
    if (process.env.DB_SOCK)
        conf.socketPath = process.env.DB_SOCK
    return mysql.createConnection(conf);
};

const chilpool = module.exports.chilpool = async function(params) {
    const mysql = require('mysql2/promise');
    const conf = {
        host: params.host || 'localhost',
        user: params.user || 'test',
        password: params.password || 'test',
        database: params.name || 'wpchild',
        connectionLimit: 500000, //important
        multipleStatements: true,
        debug: false
    };
    if (process.env.DB_SOCK)
        conf.socketPath = process.env.DB_SOCK
    return await mysql.createPool(conf);
};

const sshcon = module.exports.sshcon = function(params) {
    const mysql = require('mysql-ssh');
    var ssh = {
        host: params['ssh[host]'],
        user: params['ssh[user]'],
        password: params['ssh[password]'],
    };
    if (params['ssh[port]']) ssh.port = params['ssh[port]'];

    var db = {
        host: params['db[host]'],
        user: params['db[user]'],
        password: params['db[password]'],
        database: params['db[name]'],
    };
    if (params['db[name]']) db.name = params['db[name]'];
    if (params['db[port]']) db.port = params['db[port]'];

    return mysql.connect(ssh, db);
};

module.exports.myquery = async function(query, params, callback) {
    try {
        const connection = await asynccon();
        const result = await connection.execute(query, params);
        connection.end();

        if (callback)
            await callback(result, params);
        return result[0];

    } catch (e) {
        console.log(e);
        return 0;
    }
};