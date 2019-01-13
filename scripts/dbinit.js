#!/usr/bin/env nodejs
/////////////////////////////////////////////
const mysql = require('mysql2');
/////////////////////////////////////////////
const conf = {
	host     : process.env.DB_HOST 		|| 'localhost',
	user     : process.env.DB_USER 		|| 'test',
	password : process.env.DB_PASSWORD 	|| 'test'
};
if (process.env.DB_SOCK)
	conf.socketPath = process.env.DB_SOCK
const connection 	= mysql.createConnection(conf);
/////////////////////////////////////////////
var queries = {
	'setting-FK-check': 	'SET foreign_key_checks=0',
	'database': 	'CREATE DATABASE IF NOT EXISTS  replecon CHARACTER SET utf8 COLLATE utf8_general_ci',
	'project': 		'CREATE TABLE IF NOT EXISTS replecon.project (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255),  description VARCHAR(1500), UNIQUE(name))ENGINE = InnoDB',
	'tag': 			'CREATE TABLE IF NOT EXISTS replecon.tag (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), flag INT(4), UNIQUE(name) )ENGINE = InnoDB',
	'original': 	'CREATE TABLE IF NOT EXISTS replecon.original (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), link VARCHAR(600), video VARCHAR(600),  description VARCHAR(1500))ENGINE = InnoDB',
	'template': 	"CREATE TABLE IF NOT EXISTS replecon.template (id INT AUTO_INCREMENT PRIMARY KEY,name VARCHAR(255), UNIQUE(name))ENGINE = InnoDB",
	'jsonFiles': 	'CREATE TABLE IF NOT EXISTS replecon.jsonFiles (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(50) NOT NULL, size INT(10) NOT NULL, date VARCHAR(20) NOT NULL)ENGINE = InnoDB',

	// 'project-db': 	"CREATE TABLE IF NOT EXISTS replecon.projectDB (id INT AUTO_INCREMENT PRIMARY KEY,host VARCHAR(255),port VARCHAR(255),user VARCHAR(255),password VARCHAR(255),dbname VARCHAR(255))ENGINE = InnoDB",
	'project-db':
		"	CREATE TABLE IF NOT EXISTS "+
		"	replecon.projectDB("+
		"	id INT AUTO_INCREMENT PRIMARY KEY NOT NULL," +
		"	projectID INT(4) NOT NULL,  "+
		"	flag BOOLEAN NOT NULL,"+
		"	sshhID INT(4),"+
		"	dbhID INT(4) ,"+
		"	FOREIGN KEY (projectID) REFERENCES replecon.project(id),"+
		"	FOREIGN KEY (sshhID) REFERENCES replecon.sshhost(id),"+
		"	FOREIGN KEY (dbhID) REFERENCES replecon.dbhost(id),"+
		"	UNIQUE(projectID)"+
		"	)ENGINE = InnoDB",

	'project-dir':
		"	CREATE TABLE IF NOT EXISTS "+
		"	replecon.projectDir("+
		"	id INT AUTO_INCREMENT PRIMARY KEY NOT NULL," +
		"	projectID INT(4) NOT NULL,  "+
		"	dir VARCHAR(200) ,"+
		"	FOREIGN KEY (projectID) REFERENCES replecon.project(id),"+
		"	UNIQUE(projectID)"+
		"	)ENGINE = InnoDB",

	'project-db-sshhost':
		"	CREATE TABLE IF NOT EXISTS "+
		"	replecon.sshhost("+
		"	id INT AUTO_INCREMENT PRIMARY KEY NOT NULL," +
		"	host VARCHAR(20) NOT NULL,"+
		"	port int(5)  DEFAULT null,"+
		"	user VARCHAR(20) NOT NULL,"+
		"	password VARCHAR(20) NOT NULL"+
		"	)ENGINE = InnoDB",

	'project-db-dbhost':
		"	CREATE TABLE IF NOT EXISTS "+
		"	replecon.dbhost("+
		"	id INT AUTO_INCREMENT PRIMARY KEY NOT NULL, "+
		"	host VARCHAR(20) NOT NULL,"+
		"	port int(5)  DEFAULT null,"+
		"	user VARCHAR(20) NOT NULL,"+
		"	password VARCHAR(20) NOT NULL,"+
		"	name VARCHAR(20) NOT NULL"+
		"	)ENGINE = InnoDB",

	'project-import-log':
		"	CREATE TABLE IF NOT EXISTS "+
		"	replecon.projectLog ("+
		"	id INT AUTO_INCREMENT PRIMARY KEY NOT NULL," +
		"	projectID INT(4) NOT NULL,  "+
		"	type varchar(10),"+
		"	date DATETIME NOT NULL,"+
		"	FOREIGN KEY (projectID) REFERENCES replecon.project(id)"+
		"	)ENGINE = InnoDB",

	'project-export-log':
		"	CREATE TABLE IF NOT EXISTS "+
		"	replecon.exportLog ("+
		"	id INT AUTO_INCREMENT PRIMARY KEY NOT NULL, "+
		"	projectID INT(4) NOT NULL,"+
		"	date DATETIME NOT NULL,"+
		"	FOREIGN KEY (projectID) REFERENCES replecon.project(id)"+
		"	)ENGINE = InnoDB"
	,

'tmpl' : `		
	CREATE TABLE IF NOT EXISTS 
	replecon.tmpl( 
		id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
		title VARCHAR(255)   NOT NULL
	)ENGINE = InnoDB
`,
'tmpl-key' : `		
	CREATE TABLE IF NOT EXISTS 
	replecon.tmplKey( 
		id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
		keyword VARCHAR(255)  NOT NULL
	)ENGINE = InnoDB
`,
'tmpl-val' : `		
	CREATE TABLE IF NOT EXISTS 
	replecon.tmplValue( 
		id INT  AUTO_INCREMENT PRIMARY KEY, 
		value VARCHAR(255)  NOT NULL,
		keyID int(4) NOT NULL, 
		FOREIGN KEY (keyID) REFERENCES replecon.tmplKey(id)
	)ENGINE = InnoDB
`,
'tmpl-relation' : `		
	CREATE TABLE IF NOT EXISTS 
	replecon.tmplRelation( 
		id INT AUTO_INCREMENT PRIMARY KEY, 
		tmplID int(4) NOT NULL, 
		keyID int(4) NOT NULL, 
		FOREIGN KEY (tmplID) REFERENCES replecon.tmpl(id), 
		FOREIGN KEY (keyID) REFERENCES replecon.tmplKey(id) 
	)ENGINE = InnoDB
`,
'tmpl-cond': `		
	CREATE TABLE IF NOT EXISTS 
	replecon.tmplCondition( 
		tagID int(4) NOT NULL, 
		positive BOOLEAN NOT NULL, 
		relationID int(4) NOT NULL, 
		FOREIGN KEY (relationID) REFERENCES replecon.tmplRelation(id)
	)ENGINE = InnoDB
`,

	// 'template-key': 		"CREATE TABLE IF NOT EXISTS replecon.templateKey(id INT AUTO_INCREMENT PRIMARY KEY, keyword VARCHAR(255),val VARCHAR(255),tmplID int(4) NOT NULL,FOREIGN KEY (tmplID) REFERENCES replecon.template(id))ENGINE = InnoDB",
	// 'template-condition': 	"CREATE TABLE IF NOT EXISTS replecon.templateCondition(id INT AUTO_INCREMENT PRIMARY KEY, tagID int(4) NOT NULL,tmplKeyID int(4) NOT NULL,positive BOOLEAN NOT NULL,FOREIGN KEY (tagID) REFERENCES replecon.tag(id),FOREIGN KEY (tmplKeyID) REFERENCES replecon.templateKey(id))ENGINE = InnoDB",
	// 'tag-template': 'CREATE TABLE IF NOT EXISTS replecon.tagTemplates (id INT AUTO_INCREMENT PRIMARY KEY, keyword VARCHAR(255), val VARCHAR(600), flag INT(4) )ENGINE = InnoDB',

	'library-key': "CREATE TABLE IF NOT EXISTS replecon.libraryKey(id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(25) NOT NULL, UNIQUE(name))ENGINE = InnoDB",
	'library-value': "CREATE TABLE IF NOT EXISTS replecon.libraryValue(id INT AUTO_INCREMENT PRIMARY KEY, value VARCHAR(255) NOT NULL)ENGINE = InnoDB",
	'library-relation': "CREATE TABLE IF NOT EXISTS replecon.libraryRelation(id INT AUTO_INCREMENT PRIMARY KEY, keyID int(4) NOT NULL, valueID int(4) NOT NULL, FOREIGN KEY (keyID) REFERENCES replecon.libraryKey(id),FOREIGN KEY (valueID) REFERENCES replecon.libraryValue(id))ENGINE = InnoDB",
	// 'relation-library-template': "CREATE TABLE IF NOT EXISTS replecon.relationLibraryTmpl(id INT AUTO_INCREMENT PRIMARY KEY,  )ENGINE = InnoDB",

	'relation-tag-original': 	'CREATE TABLE IF NOT EXISTS replecon.relationTagOriginal (id INT AUTO_INCREMENT PRIMARY KEY, tagID INT(4) NOT NULL,  originalID INT(4) NOT NULL, FOREIGN KEY (tagID) REFERENCES replecon.tag(id), FOREIGN KEY (originalID) REFERENCES replecon.original(id))ENGINE = InnoDB',
	'relation-tag-project': 	'CREATE TABLE IF NOT EXISTS replecon.relationTagProject (id INT AUTO_INCREMENT PRIMARY KEY, tagID INT(4) NOT NULL,  projectID INT(4) NOT NULL, type VARCHAR(255) NOT NULL , FOREIGN KEY (projectID) REFERENCES replecon.project(id), FOREIGN KEY (tagID) REFERENCES replecon.tag(id))ENGINE = InnoDB',
	'relation-template-project': 	'CREATE TABLE IF NOT EXISTS replecon.relationTmplProject (id INT AUTO_INCREMENT PRIMARY KEY, projectID INT(4) NOT NULL,  tmplID INT(4) NOT NULL, type VARCHAR(20) NOT NULL, FOREIGN KEY (projectID) REFERENCES replecon.project(id), FOREIGN KEY (tmplID) REFERENCES replecon.tmpl(id))ENGINE = InnoDB',
	'relation-project-object': 		'CREATE TABLE IF NOT EXISTS replecon.relationProjectObject (id INT AUTO_INCREMENT PRIMARY KEY, projectID INT(4) NOT NULL,  objectID INT(4) NOT NULL, FOREIGN KEY (projectID) REFERENCES replecon.project(id), FOREIGN KEY (objectID) REFERENCES replecon.object(id))ENGINE = InnoDB',
	'relation-project-original': 	'CREATE TABLE IF NOT EXISTS replecon.relationProjectOriginal (id INT AUTO_INCREMENT PRIMARY KEY, projectID INT(4) NOT NULL,  originalID INT(4) NOT NULL, FOREIGN KEY (projectID) REFERENCES replecon.project(id), FOREIGN KEY (originalID) REFERENCES replecon.original(id))ENGINE = InnoDB',
	'relation-tag-object': 			'CREATE TABLE IF NOT EXISTS replecon.relationTagObject (id INT AUTO_INCREMENT PRIMARY KEY, tagID INT(4) NOT NULL,  objectID INT(4) NOT NULL, FOREIGN KEY (tagID) REFERENCES replecon.tag(id), FOREIGN KEY (objectID) REFERENCES replecon.object(id))ENGINE = InnoDB',

	// 'object': 		'CREATE TABLE IF NOT EXISTS replecon.object (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255) NOT NULL, description VARCHAR(1500) NOT NULL, originID INT(4) NOT NULL, FOREIGN KEY (originID) REFERENCES replecon.original(id))ENGINE = InnoDB',
	'object': " CREATE TABLE "
			+ " IF NOT EXISTS "
			+ " replecon.object ("

			+ " id INT AUTO_INCREMENT PRIMARY KEY, "
			+ " DataTitle1 VARCHAR(100) , " // title
			+ " DataTitle2 VARCHAR(200) , " 
			// + " DataTitle3 VARCHAR(300) , "

			+ " DataFlag1 BOOLEAN , " // exported
			+ " DataFlag2 BOOLEAN , " // deleted
			+ " DataFlag3 BOOLEAN , " 

			+ " DataKey1 INT(5) ,  " //import log
			+ " DataKey2 INT(5) , " // export log

			+ " DataDate1 DATETIME , " //
			+ " DataDate2 DATETIME , "
			+ " DataDate3 DATETIME , "
			+ " DataDate4 DATETIME , "

			+ " DataLink1 VARCHAR(500) , " // video link
			+ " DataLink2 VARCHAR(550) , " // thumbs
			+ " DataLink3 VARCHAR(500) , " // baseThumb
			+ " DataLink4 VARCHAR(500) , " // bigThumb

			+ " DataContext VARCHAR(500) , "

			+ " DataText1 VARCHAR(1000) , " // description
			+ " DataText2 VARCHAR(2000) , " 
			+ " DataText3 VARCHAR(500) , " // duration
			+ " DataText4 VARCHAR(500) , " 

			+ " FootPrint1 INT(5) ," // originalID
			+ " FootPrint2 VARCHAR(100) " // donor link

			+ " )ENGINE = InnoDB"
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

