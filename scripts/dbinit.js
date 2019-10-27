#!/usr/bin/env nodejs
const mysql = require('mysql2');

const conf = {
	host: process.env.DB_HOST || 'localhost',
	user: process.env.DB_USER || 'test',
	password: process.env.DB_PASSWORD || 'test'
};

if (process.env.DB_SOCK) conf.socketPath = process.env.DB_SOCK

const connection = mysql.createConnection(conf);

connection.connect(function (err) {
	if (err) throw err;

	for (const [index, key] of Object.keys(quereList).entries()) {
		const query = quereList[key];

		connection.query(query, function (err, result) {
			if (err) throw err;
			console.log(`] ${index} [ ${key} +`);
		});
	}

	connection.end();
});

const quereList = {
	'setting-FK-check': `
		SET foreign_key_checks=0
	`,

	'database': `
		CREATE DATABASE 
		IF NOT EXISTS replecon 
		CHARACTER SET utf8 
		COLLATE utf8_general_ci
	`,

	'project': `
		CREATE TABLE 
		IF NOT EXISTS replecon.project 
		(
			id INT AUTO_INCREMENT PRIMARY KEY, 
			name VARCHAR(255),  
			description VARCHAR(1500), 
			UNIQUE(name)
		) ENGINE = InnoDB
	`,

	'jsonFiles': `
		CREATE TABLE 
		IF NOT EXISTS replecon.jsonFiles 
		(
			id INT AUTO_INCREMENT PRIMARY KEY, 
			name VARCHAR(50) NOT NULL, 
			size INT(10) NOT NULL, 
			date VARCHAR(20) NOT NULL, 
			UNIQUE(name)
		) ENGINE = InnoDB
	`,

	'project-db': `
		CREATE TABLE 
		IF NOT EXISTS replecon.projectDB
		(
			id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
			projectID INT(4) NOT NULL,
			type VARCHAR(20),
			host VARCHAR(20),
			port int(5),
			user VARCHAR(20),
			password VARCHAR(20),
			name VARCHAR(20),
			UNIQUE(projectID)
		) ENGINE = InnoDB
	`,

	'project-dir': `
		CREATE TABLE 
		IF NOT EXISTS replecon.projectDir
		(
			id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
			projectID INT(4) NOT NULL,
			dir VARCHAR(200) ,
			FOREIGN KEY (projectID) REFERENCES replecon.project(id),
			UNIQUE(projectID)
		) ENGINE = InnoDB
	`,

	'project-db-sshhost': `
		CREATE TABLE 
		IF NOT EXISTS replecon.sshhost
		(
			id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
			host VARCHAR(20) NOT NULL,
			port int(5)  DEFAULT null,
			user VARCHAR(20) NOT NULL,
			password VARCHAR(20) NOT NULL
		) ENGINE = InnoDB
	`,

	'project-import-log': `
		CREATE TABLE 
		IF NOT EXISTS replecon.projectLog
		(
			id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
			projectID INT(4) NOT NULL,
			type varchar(10),
			date DATETIME NOT NULL,
			FOREIGN KEY (projectID) REFERENCES replecon.project(id)
		) ENGINE = InnoDB
	`,

	'project-export-log': `
		CREATE TABLE 
		IF NOT EXISTS replecon.exportLog 
		(
			id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
			projectID INT(4) NOT NULL,
			date DATETIME NOT NULL,
			FOREIGN KEY (projectID) REFERENCES replecon.project(id)
		) ENGINE = InnoDB
	`,

	'tmpl': `		
		CREATE TABLE 
		IF NOT EXISTS replecon.tmpl
		( 
			id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
			title VARCHAR(255) NOT NULL
		) ENGINE = InnoDB
	`,

	'tmpl-key': `		
		CREATE TABLE 
		IF NOT EXISTS replecon.tmplKey
		( 
			id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
			keyword VARCHAR(255) NOT NULL
		) ENGINE = InnoDB
	`,

	'tmpl-val': `		
		CREATE TABLE IF NOT EXISTS 
		replecon.tmplValue( 
		id INT  AUTO_INCREMENT PRIMARY KEY, 
		value VARCHAR(255)  NOT NULL,
		keyID int(4) NOT NULL, 
		FOREIGN KEY (keyID) REFERENCES replecon.tmplKey(id)
	)ENGINE = InnoDB
`,
	'tmpl-relation': `
		CREATE TABLE 
		IF NOT EXISTS replecon.tmplRelation
		( 
			id INT AUTO_INCREMENT PRIMARY KEY, 
			tmplID int(4) NOT NULL, 
			keyID int(4) NOT NULL, 
			FOREIGN KEY (tmplID) REFERENCES replecon.tmpl(id), 
			FOREIGN KEY (keyID) REFERENCES replecon.tmplKey(id) 
		) ENGINE = InnoDB
	`,
	
	'library-key': `
		CREATE TABLE 
		IF NOT EXISTS replecon.libraryKey
		(
			id INT AUTO_INCREMENT PRIMARY KEY, 
			name VARCHAR(25) NOT NULL, 
			UNIQUE(name)
		) ENGINE = InnoDB
	`,

	'library-value': `
		CREATE TABLE 
		IF NOT EXISTS replecon.libraryValue
		(
			id INT AUTO_INCREMENT PRIMARY KEY, 
			value VARCHAR(255) NOT NULL
		) ENGINE = InnoDB
	`,

	'library-relation': `
		CREATE TABLE 
		IF NOT EXISTS replecon.libraryRelation
		(
			id INT AUTO_INCREMENT PRIMARY KEY, 
			keyID int(4) NOT NULL, 
			valueID int(4) NOT NULL, 
			FOREIGN KEY (keyID) REFERENCES replecon.libraryKey(id),
			FOREIGN KEY (valueID) REFERENCES replecon.libraryValue(id)
		) ENGINE = InnoDB
	`,

	'relation-template-project': `
		CREATE TABLE 
		IF NOT EXISTS replecon.relationTmplProject 
		(
			id INT AUTO_INCREMENT PRIMARY KEY, 
			projectID INT(4) NOT NULL,
			tmplID INT(4) NOT NULL, 
			type VARCHAR(20) NOT NULL, 
			FOREIGN KEY (projectID) REFERENCES replecon.project(id), 
			FOREIGN KEY (tmplID) REFERENCES replecon.tmpl(id)
		) ENGINE = InnoDB
	`,

	'relation-project-json': `
		CREATE TABLE 
		IF NOT EXISTS replecon.relationProjectJson
		(
			id INT AUTO_INCREMENT PRIMARY KEY,
			projectID int(11) NOT NULL,
			jsonID int(11) NOT NULL
		) ENGINE = InnoDB
	`,

	/**
	 * @table : object
	 * @properties :
	 * DataTitle1 [VARCHAR(100)] - title
	 * DataTitle2 [VARCHAR(200)]
	 * DataFlag1 [BOOLEAN] - published
	 * DataFlag2 [BOOLEAN] - broken link
	 * DataFlag3 [BOOLEAN] - active
	 * DataKey1 [INT(5)] - import log id
	 * DataKey2 [INT(5)] - export log id
	 * DataDate1 [DATETIME] - create data
	 * DataDate2 [DATETIME] - 
	 * DataDate3 [DATETIME]
	 * DataDate4 [DATETIME]
	 * DataLink1 [VARCHAR(500)] - video link
	 * DataLink2 [VARCHAR(550)] - action thumbs
	 * DataLink3 [VARCHAR(500)] - baseThumb
	 * DataLink4 [VARCHAR(500)] - bigThumb
	 * DataContext [VARCHAR(500)]
	 * DataText1 [VARCHAR(1000)] - description
	 * DataText2 [VARCHAR(2000)]
	 * DataText3 [VARCHAR(500)] - duration
	 * DataText4 [VARCHAR(500)] - tags
	 * FootPrint1 [INT(5)] - projectID
	 * FootPrint2 [VARCHAR(100)] - donor type
	 */
	'object': `
		CREATE TABLE
		IF NOT EXISTS replecon.object 
		(
			id INT AUTO_INCREMENT PRIMARY KEY,
  			id_proj_link int(11) DEFAULT NULL,
			DataTitle1 VARCHAR(100),
			DataTitle2 VARCHAR(200),
			DataTitle3 VARCHAR(300),
			DataFlag1 BOOLEAN,
			DataFlag2 BOOLEAN,
			DataFlag3 BOOLEAN,
			DataKey1 INT(5),
			DataKey2 INT(5),
			DataDate1 DATETIME,
			DataDate2 DATETIME,
			DataDate3 DATETIME,
			DataDate4 DATETIME,
			DataLink1 VARCHAR(500),
			DataLink2 VARCHAR(550),
			DataLink3 VARCHAR(500),
			DataLink4 VARCHAR(500) , 
			DataContext VARCHAR(500),
			DataText1 VARCHAR(1000),
			DataText2 VARCHAR(2000),
			DataText3 VARCHAR(500),
			DataText4 VARCHAR(500),
			FootPrint1 INT(5),
			FootPrint2 VARCHAR(100),
			UNIQUE KEY id_proj_link (FootPrint1, DataLink1)
		) ENGINE = InnoDB
	`,
};
