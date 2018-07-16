#!/usr/bin/env nodejs
/////////////////////////////////////////////
const mysql = require('mysql2');
/////////////////////////////////////////////
const connection 	= mysql.createConnection({
	host     : process.env.DB_HOST 		|| 'localhost',
	user     : process.env.DB_USER 		|| 'test',
	password : process.env.DB_PASSWORD 	|| 'test',
});
/////////////////////////////////////////////
var queries = {
	'database': 				"ALTER DATABASE replecon CHARACTER SET utf8 COLLATE utf8_unicode_ci",

	'dbhost': 					"ALTER TABLE replecon.dbhost CONVERT TO CHARACTER SET utf8 COLLATE utf8_unicode_ci",
	'exportLog': 				"ALTER TABLE replecon.exportLog CONVERT TO CHARACTER SET utf8 COLLATE utf8_unicode_ci",
	'jsonFiles': 				"ALTER TABLE replecon.jsonFiles CONVERT TO CHARACTER SET utf8 COLLATE utf8_unicode_ci",
	'libraryKey': 				"ALTER TABLE replecon.libraryKey CONVERT TO CHARACTER SET utf8 COLLATE utf8_unicode_ci",
	'libraryRelation': 			"ALTER TABLE replecon.libraryRelation CONVERT TO CHARACTER SET utf8 COLLATE utf8_unicode_ci",
	'libraryValue': 			"ALTER TABLE replecon.libraryValue CONVERT TO CHARACTER SET utf8 COLLATE utf8_unicode_ci",
	'object': 					"ALTER TABLE replecon.object CONVERT TO CHARACTER SET utf8 COLLATE utf8_unicode_ci",
	'original': 				"ALTER TABLE replecon.original CONVERT TO CHARACTER SET utf8 COLLATE utf8_unicode_ci",
	'project': 					"ALTER TABLE replecon.project CONVERT TO CHARACTER SET utf8 COLLATE utf8_unicode_ci",
	'projectDB': 				"ALTER TABLE replecon.projectDB CONVERT TO CHARACTER SET utf8 COLLATE utf8_unicode_ci",
	'projectLog': 				"ALTER TABLE replecon.projectLog CONVERT TO CHARACTER SET utf8 COLLATE utf8_unicode_ci",
	'relationProjectObject': 	"ALTER TABLE replecon.relationProjectObject CONVERT TO CHARACTER SET utf8 COLLATE utf8_unicode_ci",
	'relationProjectOriginal': 	"ALTER TABLE replecon.relationProjectOriginal CONVERT TO CHARACTER SET utf8 COLLATE utf8_unicode_ci",
	'relationTagObject': 		"ALTER TABLE replecon.relationTagObject CONVERT TO CHARACTER SET utf8 COLLATE utf8_unicode_ci",
	'relationTagOriginal': 		"ALTER TABLE replecon.relationTagOriginal CONVERT TO CHARACTER SET utf8 COLLATE utf8_unicode_ci",
	'relationTagProject': 		"ALTER TABLE replecon.relationTagProject CONVERT TO CHARACTER SET utf8 COLLATE utf8_unicode_ci",
	'relationTmplProject': 		"ALTER TABLE replecon.relationTmplProject CONVERT TO CHARACTER SET utf8 COLLATE utf8_unicode_ci",
	'sshhost': 					"ALTER TABLE replecon.sshhost CONVERT TO CHARACTER SET utf8 COLLATE utf8_unicode_ci",
	'tag': 						"ALTER TABLE replecon.tag CONVERT TO CHARACTER SET utf8 COLLATE utf8_unicode_ci",
	'template': 				"ALTER TABLE replecon.template CONVERT TO CHARACTER SET utf8 COLLATE utf8_unicode_ci",
	'templateCondition': 		"ALTER TABLE replecon.templateCondition CONVERT TO CHARACTER SET utf8 COLLATE utf8_unicode_ci",
	'templateKey': 				"ALTER TABLE replecon.templateKey CONVERT TO CHARACTER SET utf8 COLLATE utf8_unicode_ci",
};
connection.connect(function(err) {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }
});
Object.keys(queries).map(function(key, index) {
	console.log("]["+key);
	var sql_queries = queries[key];
	
	connection.query(sql_queries, function (err, result) {
		if (err) throw err;
	});
});
console.log("DB created");
connection.end();

