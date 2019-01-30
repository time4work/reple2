/////////////////////////////////////////////
const fs = require('fs');
const path = require('path')
const async = require('async');
const PythonShell = require('python-shell');

const MYSQL 	= require('./mysql').connection;
const MYSQL_SSH	= require('./mysql').sshcon;
const ASYNSQL 	= require('./mysql').asynccon;
const POOLCON 	= require('./mysql').pool;
const CHILDCON 	= require('./mysql').childcon;
const CHILDPOOL = require('./mysql').chilpool;

const scraperModule = require('./scraper');
const ffmpegModule 	= require('./ffmpeg');
const Tree	= require('./tree');

const punctREGEX = /[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-.\/:;<=>?@\[\]^_`{|}~]/g;

PythonShell.defaultOptions = {
    scriptPath: './modules/py/',
  	mode: 'text',
    pythonPath: 'python3'
};
/////////////////////////////////////////////
function makeid(length) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    if(!length) length = 6

    for (var i = 0; i < length; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}
function arrayUniq(a) {
   return Array.from(new Set(a));
}
function arrayLowerCase(a) {
	var tmp = [];
	for(var i=0; i<a.length; i++){
		tmp.push( a[i].toLowerCase() )
	}
	return tmp;
}
function rand(items){
    return items[~~(Math.random() * items.length)];
}
async function myquery(query, params, callback){ // !
	try {
		const connection 	= await ASYNSQL(); // !
		let result = await connection.execute( query, params ); // !
		connection.end();

		if(callback)
			await  callback( result, params ); // !
		return result[0];

	} catch (e) {
		console.log(e);
		return 0;
	}
};
/////////////////////////////////////////////
module.exports.query = async function(query, params, callback){ // !
	try {
		const connection 	= await ASYNSQL(); // !
		let result = await connection.execute( query, params ); // !

		await  callback( result, params ); // !
		return result;
	} catch (e) {
		console.log(e);
		return 0;
	}
}
/////////////////////////////////////////////
module.exports.sshQuery = async function(params, callback){
	try {
		const connection = await MYSQL_SSH(params); // !
		await connection.query(params['db[query]'], async (err, results, fields) => {
	        let result;
	        if (err) result = [err]; else
	        	result = [results,fields];

	        console.log(result);
	    	await callback( result );
	        await connection.close();
	    });
	} catch (e){
		console.log(e);
		return 0;
	}
}
/////////////////////////////////////////////

module.exports.selectProjectOriginalSize = async (projectID, callback) => {
	const connection 	= await ASYNSQL(); // !
	try {
		let positiveArr = [];
		let negetiveArr = [];
		await selectProjectTags(connection, projectID, async (result) => {
			console.log(result);
			for(var i=0; i < result.length; i++){
				if(result[i].positive == 0){
					await negetiveArr.push(result[i].tagID);
				}else{
					await positiveArr.push(result[i].tagID);
				}
			}
		});
		console.log(positiveArr);
		console.log(negetiveArr);

		let originalIDarr = await findFilteredOriginal(connection, projectID,  {positive:positiveArr, negetive:negetiveArr});
		console.log(originalIDarr);

		if(callback)
			await callback(originalIDarr.length);
		// 	})
		// });
	} catch (e) {
		console.log(e);
		return 0;
	}
}
module.exports.createProjectObjects = async (projectID, size, callback) => {
	const connection 	= await ASYNSQL(); // !
	try {
		let positiveArr = [];
		let negetiveArr = [];
		await selectProjectTags(connection, projectID, async (result) => {
			console.log(result);
			for(var i=0; i < result.length; i++){
				if(result[i].positive == 0){
					await negetiveArr.push(result[i].tagID);
				}else{
					await positiveArr.push(result[i].tagID);
				}
			}
		});
		console.log(positiveArr);
		console.log(negetiveArr);

		// let originalIDarr = await findFilteredOriginal(connection, {positive:positiveArr, negetive:negetiveArr});
		let originalIDarr = await findFilteredOriginal(connection, projectID, {positive:positiveArr, negetive:negetiveArr});
		console.log(originalIDarr);

		if(size>originalIDarr.length)
			size = originalIDarr.length;

		console.log(" < logID > ");
		var logID = await createObjectLog(projectID);
		console.log(logID);

		for(var j=0; j<size; j++){
			var originalID = originalIDarr[j].originalID;

			await selectOriginal(connection, originalID, async (original) => {	
				console.log(original);

				let video_link = original.video;
				console.log(' < video_link >');
				console.log(video_link);

				let donor_link = original.link;
				console.log(' < donor_link >');
				console.log(donor_link);

				let originalTags = await selectOriginalTags(connection, originalID);
				console.log(' < originalTags >');
				console.log(originalTags);
				let synTags = [];
				for(var q=0; q<originalTags.length; q++){
					console.log(' < originalTags[i].tagID >');
					console.log(originalTags[q].tagID);
					let syns = await selectTagSyns(originalTags[q].tagID);
					
					if(syns.length > 0)
						for(var k=0; k<syns.length; k++){
							synTags.push(syns[k]);
						}
					else	
						synTags.push(originalTags[q].tagID);				
				}
				console.log(' < synTags >');
				console.log(synTags);

				// template key lib 
				let tmpl_lib_pack = await selectLibraryItems();

				// description tmpls 
				let d_tmpl_packs = await selectProjectTemplates('description', projectID,synTags);
				console.log(d_tmpl_packs);
				console.log('___________d_tmpl_packs');

				if(d_tmpl_packs[0].length == 0)
					return null;

				let description = null;
				do{
					console.log('do text');
					let min = 0,
						max = d_tmpl_packs.length-1;
					var rand = min + Math.floor(Math.random() * (max + 1 - min));
					let d_tmpl_pack = d_tmpl_packs[rand];
					
					d_tmpl_packs.splice(rand,1);

					let tree = await new Tree('talk', d_tmpl_pack, tmpl_lib_pack);
					description = await tree.createText();
					description = ( description.length > 1000 ) 
						? description.slice(0,1000) 
						: description;
				}while(!description && d_tmpl_packs.length);
				// }while(!description);
				console.log(' < description >');
				console.log(description);	

				if(!description) return null;

				// @point3
				let t_tmpl_packs = await selectProjectTemplates('title', projectID,synTags);

				if(t_tmpl_packs[0].length == 0)
					return null;

				// let t_tmpl = await Tree.parseTmplObj(t_tmpl_pack);
				// console.log(' < tmpl >');
				// console.log(tmpl);

				// let title = await Tree.libraryKeyParse( Tree.templateParse(t_tmpl['talk'], t_tmpl), tmpl_lib);
				// console.log(' < title >');
				// console.log(title);

				let title = null;
				do{
					console.log('do text');
					let min = 0,
						max = t_tmpl_packs.length-1;
					var rand = min + Math.floor(Math.random() * (max + 1 - min));
					let t_tmpl_pack = t_tmpl_packs[rand];
					
					t_tmpl_packs.splice(rand,1);

					let tree = await new Tree('talk', t_tmpl_pack, tmpl_lib_pack);
					title = await tree.createText();
				}while(!title && t_tmpl_packs.length);
				title = ( title.length > 100 ) 
					? title.slice(0,100) 
					: title;
				// }while(!title);
				console.log(' < title >');
				console.log(title);	

				if(!title) return null;




				console.log(' < createObject >');
				let objID = await createObject(projectID,originalID,title, description, video_link,donor_link,logID);
				console.log(' < createRelationTagObj >');
				await createRelationTagObj(objID, originalTags);
			});
		}
		result = originalIDarr;
		if(callback)
			await callback(result);
		return result;
	} catch (e) {
		console.log(e);
		return 0;
	}
};
async function createRelationTagObj(objID, tags){
	try {
		var query = ""
				+ " Insert Into"
				+ " relationTagObject "
				+ " (tagID, objectID)"
				+ " values (?,?)";
		for(var i=0; i<tags.length; i++){
			let tagID = tags[i].tagID;
			console.log({tag: tagID, obj: objID});
			await myquery(query, [ tagID, objID ]);
		}
		return;

	} catch (e) {
		console.log(e);
		return 0;
	}	
}
async function createObjectLog(projectID ){
	try {
		var type = 'import'
		var query = ""
				+ " Insert Into"
				+ " projectLog "
				+ " (projectID, type, date)"
				+ " values (?,?,NOW())";
		var log = await myquery(query, [ projectID, type ]);
		return log.insertId;
	} catch (e) {
		console.log(e);
		return 0;
	}	
}
async function createObject(projectID,originalID,title, description, videolink, donorlink, logID){
	try {
		console.log([projectID,originalID,title, description, videolink, donorlink, logID]);
		var query = ""
				+ " Insert Into"
				+ " object "
				+ " (DataTitle1, DataLink1, DataText1, FootPrint1, FootPrint2, DataKey1)"
				+ " values (?,?,?,?,?,?)";
		let object = await myquery(query, 
			[ title, videolink, description, originalID, donorlink, logID ]);
		console.log(object);
		let objectID = object.insertId;

		query = ""
			+ " Insert Into"
			+ " relationProjectObject"
			+ " (projectID, objectID)"
			+ " values (?,?)";
		let relation = await myquery(query, [ projectID,objectID ]);
		console.log(relation);

		query = ""
				+ " Insert Into"
				+ " relationProjectOriginal"
				+ " (projectID, originalID)"
				+ " values (?,?)";
		let relation2 = await myquery(query, [ projectID,originalID ]);
		console.log(relation2);

		return objectID;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
async function selectLibraryItems (callback) {
	try {
		var query = `
			SELECT r.id as 'keyID', r.name as 'key', res2.id as 'valueID', res2.value 
			FROM libraryKey r 
			left join 
				( 
					select * 
					from  libraryRelation 
				) as res on res.keyID = r.id  
			left join 
			( 
				select * 
				from  libraryValue 
			) as res2 on res2.id = res.valueID 
		`;
		let result = await myquery(query, []);
		// console.log(result);

		let list = [...new Set(result.map(item => item.key))]
		.map((key)=>{
			return {key: key, values: []}
		});
		// console.log(list);

		result.forEach((item,i,arr)=>{
			let _key = result[i].key;

			for(var j=0; j<list.length; j++){
				if( list[j].key==_key ){
					list[j].id = item.keyID;
					if(item.value!=null)
						list[j].values.push( {
							id:item.valueID,
							value:item.value,
						});
				}
			}
		});
		console.log(list);

		if(callback)
			await callback(list);
		return list;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
// @point2
async function selectProjectTemplates (type, projectID, tagIDs, callback)  {
	try {
		var query = `
			SELECT *
			FROM relationTmplProject
			WHERE projectID = ? and type = ?
		`;
			// + " ORDER BY RAND() LIMIT 1 ";
		let relation = await myquery(query, [ projectID,type ]);
		console.log(" < tmpl relation >");
		console.log(relation);

		if(!relation[0]){
			console.log("oops");
			return null;
		}

		let result = [];
		let tmplIDs = relation;
		// result = tmplIDs;

		for(let x=0; x<tmplIDs.length; x++){
			let tmplID = tmplIDs[x].tmplID;
			console.log(tmplID);

			// let key_query = `
			// 	SELECT *
			// 	FROM tmplKey
			// 	WHERE tmplID = ?
			// `;
			// let keys = await myquery(key_query, [ tmplID ]);
			// console.log(" < tmpl keys >");
			// console.log(keys);
			let tmpl_query = `
				SELECT res.keyID, a.keyword, b.id, b.value as 'val'
				FROM replecon.tmplRelation res 
				left join ( 
					select * 
					from  replecon.tmplKey 
				) as a on a.id = res.keyID
				left join ( 
					select * 
					from  replecon.tmplValue 
				) as b on b.keyID = a.id 
				WHERE res.tmplID = ?
				ORDER BY a.keyword
			`; 
			let tmpl_result = await myquery(tmpl_query, [ tmplID ]); 
			console.log(" < tmpl_result >");
			console.log(tmpl_result);

			result.push(tmpl_result);
			// _____ condition ___________
			// let condition_query = `
			// 	SELECT *
			// 	FROM templateCondition
			// 	WHERE tmplKeyID in 
			// 	(
			// 		SELECT id 
			// 		FROM templateKey
			// 		WHERE tmplID = ?
			// 	)
			// `;
			// // let condition = await myquery(condition_query, [ tmplID ]);
			// // console.log(" < tmpl condition >");
			// // console.log(condition);

			// var result_keys = [];

			// if(!condition)
			// 	result_keys = keys;
			// else{
			// 	var n_condition = [],
			// 		p_condition = [];
			// 	for(var j=0; j<condition.length; j++){
			// 		if(condition[j].positive)
			// 			p_condition.push(condition[j]);
			// 		else
			// 			n_condition.push(condition[j]);
			// 	}
			// 	console.log(" < p_condition >");
			// 	console.log(p_condition);
			// 	console.log(" < n_condition >");
			// 	console.log(n_condition);
				

			// 	console.log(" < tmpl condition check >");
			// 	for(var i=0; i<keys.length; i++){
			// 		var bool = true;

			// 		for(var j=0; j<p_condition.length; j++){
			// 			if( p_condition[j].tmplKeyID == keys[i].id ){ // есть положительное условие для ключа

			// 				bool = false;
			// 				if( tagIDs.indexOf(p_condition[j].tagID) ){
			// 					bool = true;
			// 					break;
			// 				} 
			// 			}
			// 		}

			// 		for(var j=0; j<n_condition.length; j++){
			// 			if( n_condition[j].tmplKeyID == keys[i].id ){

			// 				bool = true;
			// 				if( tagIDs.indexOf(n_condition[j].tagID) ){
			// 					bool = false;
			// 					break;
			// 				} 
			// 			}
			// 		}
			// 		if( bool ) result_keys.push(keys[i]);
			// 	}
			// }
			// result.push(result_keys);
		}

		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}

 async function selectFlagTemplates (tagID, callback)  {
	try {
		var query = ""
			+ " SELECT *"
			+ " FROM tagTemplates"
			+ " WHERE flag ="
			+ " ("
			+ " SELECT flag"
			+ " FROM tag"
			+ " WHERE id = ?"
			+ " )"
		let result = await myquery(query, [ tagID ]);

		console.log(result);
		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
async function findFilteredOriginal(connection, projectID, tagIDs){
	try {
		let query = " SELECT originalID " +
					" FROM relationTagOriginal ";
		if(tagIDs.positive.length > 0){
			query += " WHERE tagID in ( "

			for(var j=0; j<tagIDs.positive.length; j++){
				if(j == tagIDs.positive.length-1)
					query += " " + tagIDs.positive[j] + " ";
				else
					query += " " + tagIDs.positive[j] + ", ";
			}
			query += " ) ";	
		}

		if(tagIDs.negetive.length > 0){
			if( !tagIDs.positive.length )
				query += " WHERE ";
			else
				query += " AND ";

			query += " originalID not in " +
					" ( " +
					" SELECT originalID " +
					" FROM relationTagOriginal ";
			for(var j=0; j<tagIDs.negetive.length; j++){
				if(j==0)
					query += " WHERE tagID = " + tagIDs.negetive[j];
				else
					query += " OR tagID = " + tagIDs.negetive[j];
			}
			query += " ) ";
		}
		query += ""
			+	"AND originalID not in ("
			+	"select originalID "
			+	"from relationProjectOriginal "
			+	"where projectID = "+projectID
			+	")";
		query += "GROUP BY originalID";
		// query += " ORDER BY RAND() LIMIT 1 ";
		console.log(query);

		let fields = await connection.execute( query ); // !
		let result = fields[0];

		console.log(result);
		return result;
		// await callback(results);
	} catch (e) {
		console.log(e);
		return -1;
	}
}
module.exports.createProject = async (name, callback) => {
	try {
		var query = "INSERT INTO project (`name`) VALUES (?)";
		let result = await myquery(query, [ name ]);

		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
module.exports.createLibraryKey = async (name, callback) => {
	try {
		var query = "INSERT INTO libraryKey (`name`) VALUES (?)";
		let result = await myquery(query, [ name ]);

		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
module.exports.deleteLibraryKey = async (keyID, callback) => {
	try {
		await new Promise(async(resolve, reject)=>{
			
			var query = 'SELECT valueID FROM libraryRelation '
					+	'WHERE keyID = ? ';
			let result = await myquery(query, [ keyID ]);
			console.log('result');
			console.log(result);
			resolve(result);

		}).then(async(values)=>{

			for(var i=0; i<values.length; i++){
				var query = 'DELETE FROM libraryValue '
						+	'WHERE id = ? ';
						console.log(values[i]);
				let result2 = await myquery(query, [ values[i].valueID ]);
				console.log('result2');
				console.log(result2);
			}
			return;

		}).then(async()=>{

			var query = 'DELETE FROM libraryRelation '
					+	'WHERE keyID = ? ';
			let result3 = await myquery(query, [ keyID ]);
			console.log('result3');
			console.log(result3);
			return;

		}).then(async()=>{

			var query = 'DELETE FROM libraryKey '
					+	'WHERE id = ? ';
			let result4 = await myquery(query, [ keyID ]);
			console.log('result4');
			console.log(result4);
			
		}).catch((e)=>{
			console.log('my promis error');
			console.log(e);
		})

		if(callback)
			await callback();
		return;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
module.exports.deleteLibraryKeyValue = async (valueID, callback) => {
	try {
		await new Promise(async(resolve, reject)=>{

			var query = 'DELETE FROM libraryRelation '
					+	'WHERE valueID = ? ';
			let result3 = await myquery(query, [ valueID ]);
			console.log('result3');
			console.log(result3);
			resolve();

		}).then(async()=>{

			var query = 'DELETE FROM libraryValue '
					+	'WHERE id = ? ';
			let result2 = await myquery(query, [ valueID ]);
			console.log('result2');
			console.log(result2);
			return;

		}).catch((e)=>{
			console.log('my promis error');
			console.log(e);
		})

		if(callback)
			await callback();
		return;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
module.exports.addLibraryKeyValue = async (value, callback) => {
	try {
		var query = "INSERT INTO libraryValue (`value`) VALUES (?)";
		let result = await myquery(query, [ value ]);

		if(callback)
			await callback(result.insertId);
		return result.insertId;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
module.exports.createRelationLibraryKeyValue = async (keyID, valueID, callback) => {
	try {
		var query = "INSERT INTO libraryRelation (`keyID`,`valueID`) VALUES (?,?)";
		let result = await myquery(query, [ keyID, valueID ]);

		if(callback)
			await callback(result.insertId);
		return result.insertId;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
module.exports.selectLibraryItems = async (callback) => {
	console.log(' - ', 'selectLibraryItems start');
	try {
		var query = ""
			+ " SELECT r.id as `keyID`, r.name as `key`, res2.id as `valueID`, res2.value "
			+ " FROM replecon.libraryKey r "
			+ " left join "
			+ " 	( "
			+ " 		select * "
			+ " 		from  replecon.libraryRelation "
			+ " 	) as res on res.keyID = r.id  "
			+ " left join "
			+ " ( "
			+ " 	select * "
			+ " 	from  replecon.libraryValue "
			+ " ) as res2 on res2.id = res.valueID ";
		let result = await myquery(query, []);
		// console.log(result);
		let list = [...new Set(result.map(item => item.key))]
			.map((key)=>{
				return {key: key, values: []}
			});
		// console.log(list);
		result.forEach((item,i,arr)=>{
			let _key = result[i].key;

			for(var j=0; j<list.length; j++){
				if( list[j].key==_key ){
					list[j].id = item.keyID;
					if(item.value!=null)
						list[j].values.push( {id:item.valueID,value:item.value});
				}
			}
		});
		console.log(list);


		if(callback)
			await callback(list);
		return list;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
module.exports.selectProjectReadyObjectLength = async (objects, callback) => {
	var x = 0;
	for(var i=0; i<objects.length; i++){
		if( objects[i].DataLink2 && objects[i].DataLink3 && objects[i].DataLink4 && objects[i].DataText3 ) 
			x++;
	}
	if(callback)
		await callback(x);
	return x;
}
module.exports.selectProjectReadyObjects = async (objects, callback) => {
	var x = [];
	for(var i=0; i<objects.length; i++){
		if( objects[i].DataLink2 && objects[i].DataLink3 && objects[i].DataLink4 && objects[i].DataText3 ) 
			x.push( objects[i] );
	}
	if(callback)
		await callback(x);
	return x;
}
module.exports.selectProjectDir = async (projectID, callback) => {
	try {
		var query = ""
				+	"	select "
				+	"	dir "
				+	"	from projectDir "
				+	"	where projectID = ?";
		
		let result = await myquery(query, [ projectID ]);

		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
module.exports.selectDir = (dir, callback) => {
	try {

		var result = fs.readdirSync(dir)
			// .map(name => path.join(dir, name))
			.filter(source => fs.lstatSync(path.join(dir, source)).isDirectory())

		if(callback)
			callback(result);
		return result;
	} catch (e) {
		console.log(e);
		return 0;
	}
}
module.exports.saveDir = async (projectID, dir, callback) => {
	try {
		var result;
		var query = ""
				+	"	select "
				+	"	dir "
				+	"	from projectDir "
				+	"	where projectID = ? ";
		let select = await myquery(query, [ projectID ]);

		if( select.length>0 ){
			query = ""
				+	"	UPDATE projectDir "
				+	"	SET dir = ? "
				+	"	where projectID = ? ";		
			result = await myquery(query, [ dir, projectID ]);
		}else{
			query = ""
				+	"	INSERT INTO projectDir(dir, projectID)"
				+	"	VALUES "
				+	"	(?,?) ";		
			result = await myquery(query, [ dir, projectID ]);
		}

		if(callback)
			callback(result);
		return result;
	} catch (e) {
		console.log(e);
		return 0;
	}
}
module.exports.pageScraper = async (page, callback) => {
	try {
		console.log('pageScraper');
		var link = await scraperModule.getLink(page);
		console.log('link');
		console.log(link);
		console.log();
		if(!link) return;
		
		var result = await ffmpegModule.makeThumbs(link, async (res)=>{
			console.log("filenames");
			console.log(res);
			if(callback)
				await callback(res);
		});
		console.log();
		// return result;
	} catch (e) {
		console.log(e);
		return 0;
	}
}
module.exports.makeObjectThumbs = async (objects, callback) => {
	for(var i=0; i<objects.length; i++){
		if( !objects[i].DataLink2 ) {
			await pageScraper(objects[i].DataLink1, async (res)=>{
				var text = res.names.join(',');
				console.log("text");
				console.log(text);
				console.log("objects[i].id");
				console.log(objects[i].id);
				await addThumbsToObject(objects[i].id, text);
			});
		}
	}
	if(callback)
		await callback();
}
module.exports.selectProjectObjects = async (projectID, callback) => {
	try {
		var query = ""
				+	" SELECT *" 
				+	" FROM object"
				+	" WHERE id in"
				+	" (SELECT objectID"
				+	" FROM relationProjectObject"
				+	" WHERE projectID = ?)";
		let result = await myquery(query, [ projectID ]);

		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
module.exports.selectProjectUnmappedObjects = async (projectID, callback) => {
	try {
		var query = ""
				+	" SELECT *" 
				+	" FROM object"
				+	" WHERE id in"
				+	" (SELECT objectID"
				+	" FROM relationProjectObject"
				+	" WHERE projectID = ?)"
				+	" AND DataFlag1 IS NULL"
				+	" AND DataFlag2 IS NULL";
		let result = await myquery(query, [ projectID ]);

		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
async function selectProjectUnmappedObjects(projectID, callback) {
	try {
		var query = ""
				+	" SELECT *" 
				+	" FROM object"
				+	" WHERE id in"
				+	" (SELECT objectID"
				+	" FROM relationProjectObject"
				+	" WHERE projectID = ?)"
				+	" AND DataFlag1 IS NULL"
				+	" AND DataFlag2 IS NULL";
		let result = await myquery(query, [ projectID ]);

		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
module.exports.selectProjectLogs = async (projectID, callback) => {
	try {
		var query = ""
				// +	" SELECT *" 
				// +	" FROM exportLog"
				// +	" WHERE projectID = ?";
				+	"	select "
				+	"	l.projectID, l.type, l.date, l.id, count(o.id) as `length`"
				+	"	from projectLog l"
				+	"	left join object as o"
				+	"	on o.DataKey1 = l.id"
				+	"	where projectID = ?"
				+	"	group by l.id";
		let result = await myquery(query, [ projectID ]);

		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
/////////////////////////////////////////////
async function postmetaInsert(connection, postID, key, value, callback){
	try {
		var query = ""
				+	" INSERT INTO wp_postmeta("
				+	" post_id, "
				+	" meta_key, "
				+	" meta_value "
				+	" ) VALUES (?,?,?); "

		let result = await connection.query(query, [ postID, key, value ]);

		if(callback)
			await callback(result[0]);
		return result[0];

	} catch (e) {
		console.log(e);
		return 0;
	}
}
/////////////////////////////////////////////
module.exports.exportObjects = async (projectID, db_params, objects, callback) => {
	try {
		const connection = await CHILDPOOL(db_params); // !

		var query = ""
				+	" INSERT INTO wp_posts("

				+	" post_author, "
				+	" post_status, "
				+	" comment_status, "
				+	" ping_status, "

				+	" menu_order, "
				+	" post_type, "
				+	" comment_count,"
				+	" post_parent,"

				+	" post_date, "
				+	" post_date_gmt, "
				+	" post_modified, "
				+	" post_modified_gmt, "

				+	" post_content,"
				+	" post_title, "
				+	" post_name, "
				+	" guid, " 

				+	" to_ping,"
				+	" post_excerpt,"
				+	" pinged,"
				+	" post_content_filtered,"
				+	" post_password "
				+	" ) VALUES ("
				+	" '1','publish','open','open', "
				+	" '0', 'post', '0', '0', " 

				+	" (now() - INTERVAL ? MINUTE),"//date
				+	" (now() - INTERVAL ? MINUTE),"//date
				+	" (now() - INTERVAL ? MINUTE),"//date
				+	" (now() - INTERVAL ? MINUTE),"//date

				+	" ?," //'descr'
				+	" ?, "//'title'
				+	" ?,"//'convert title'
				+	" ?, "//link

				+	" '','','','','' "
				+	" ) ";
		var query2 = ""
				+	" UPDATE object SET "
				+	" DataFlag1=1, "
				+	" DataKey2=? "
				+	" WHERE id=? ";
		var query3 = ""
				+	" UPDATE object SET "
				+	" DataTitle2=? "
				+	" WHERE id=? ";


			console.log(" < logID > ");
			var logID = await createExportLog(projectID);
			console.log( logID );

		for(var i=0; i<objects.length; i++){
			let nameID = makeid(8)+objects[i].id;
			await myquery(query3,[ nameID,objects[i].id ]); // save foreign nameID | DataTitle2

			let objResult = await connection.query( query, 
				[
					(5*i+i),
					(5*i+i),
					(5*i+i),
					(5*i+i),

					objects[i].DataText1,
					objects[i].DataTitle1,
					nameID,
						// .toLowerCase()
						// .replace(punctREGEX, '')
						// .replace(/(^\s*)|(\s*)$/g, '')
						// .replace(/\s+/g,'-'),
					"no link"
				] ); // !
			console.log(" < objResult > ");
			console.log(objResult[0]);
			// objResult[0].insertId

			console.log(" < postmetaInsert > ");
			console.log(objResult[0]);
			let duration = objects[i].DataText3,
				thumbs = objects[i].DataLink2,
				base_thumb = objects[i].DataLink3,
				big_thumb = objects[i].DataLink4,
				donor_id = 111,
				link = objects[i].DataLink1,
				focuskw = objects[i].DataTitle1.toLowerCase(),
				title = objects[i].DataTitle1.replace(/\b\w/g, l => l.toUpperCase()),
				metadesc = objects[i].DataTitle1.replace(/\b\w/g, l => l.toUpperCase());
			await postmetaInsert(connection, objResult[0].insertId, 'duration', duration);
			await postmetaInsert(connection, objResult[0].insertId, "thumbs", thumbs);
			await postmetaInsert(connection, objResult[0].insertId, "base_thumb", base_thumb);
			await postmetaInsert(connection, objResult[0].insertId, "big_thumb", big_thumb);
			await postmetaInsert(connection, objResult[0].insertId, "donor_id", donor_id);
			await postmetaInsert(connection, objResult[0].insertId, "link", link);
			await postmetaInsert(connection, objResult[0].insertId, "_yoast_wpseo_focuskw", focuskw);
			await postmetaInsert(connection, objResult[0].insertId, "_yoast_wpseo_title", title);
			await postmetaInsert(connection, objResult[0].insertId, "_yoast_wpseo_metadesc", metadesc);


			let tags = await selectObjectTags(objects[i].id);
			let hidden_tags = await selectProjectHiddenTags(projectID);
			let categories = await selectProjectCategoriesTags(projectID);

			console.log("hidden_tags");
			console.log(hidden_tags);
			console.log("categories");
			console.log(categories);

			for(var j=0; j<categories.length; j++){
				var tag = categories[j];
				await mapTheTagToObject(connection, tag, 'category');
			}

			for(var j=0; j<tags.length; j++){
				var tag = tags[j];

				for(var f=0; f<categories.length; f++){
					if(tag.tagID == categories[f].tagID)
						await bindTheTagToObject(connection, tag, 'category', objResult[0].insertId);
				}

				// hide hidden tags
				var flag = false; 
				for(var t=0; t<hidden_tags.length; t++){
					if(tag.tagID == hidden_tags[t].tagID) {
						flag = true;
						break;
					}
				}
				if(flag) continue;
				
				await mapTheTagToObject(connection, tag, 'post_tag', objResult[0].insertId);

			}

			let mapTheObjRes = await myquery( query2, [logID, objects[i].id]);
			console.log(" < mapTheObjRes > ");
			console.log(mapTheObjRes);
		}

		connection.end();
		result = '';
		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return ;
	}
}

async function bindTheTagToObject(connection, tag, type, objectID){

	let tag_query = "SELECT term_id FROM wp_terms WHERE name = ?";
	let search_taxonomy_query = ""
		+	"	SELECT * FROM wp_term_taxonomy "
		+	"	WHERE term_id = ? AND taxonomy = ?";
	let taxonomy_max_id = ""
		+	"	SELECT MAX(term_taxonomy_id) as `max` "
		+	"	FROM wp_term_taxonomy ";
	let increment_taxonomy_query = ""
		+	"	UPDATE wp_term_taxonomy "
		+	"	SET count = ? "
		+	"	WHERE term_taxonomy_id = ? ";	
	let relation_query = ""
		+	"	INSERT into wp_term_relationships"
		+	"	(object_id, term_taxonomy_id, term_order) "
		+	"	VALUES (?, ?, 0) ";

	let foreignTagId = await connection.query( tag_query, [
		tag.name
	]);
	if( foreignTagId[0] != 0 ){ // we catched the foreign Tag 
		let taxonomy = await connection.query(search_taxonomy_query, [
				foreignTagId[0][0].term_id,
				type
			]);
		if( taxonomy[0].length == 0 ){
			console.log(" ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! !");
			console.log(" !    The is no wp_term_taxonomy     !");
			console.log(" ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! !");
		}else{
			let taxonomyID = taxonomy[0][0].term_taxonomy_id; 
			let taxonomyCount = taxonomy[0][0].count; 
			let res = await connection.query(relation_query, [
					objectID ,
					taxonomyID
				]);
			console.log(" < search and create relation foreignTag > ");
			console.log(res[0]);
			let increment_query = await connection.query(increment_taxonomy_query, [
					taxonomyCount+1,
					taxonomyID
				]);
			console.log(" < increment_query > ");
			console.log(increment_query);
		}
	}
	else{
		console.log(" ! ! ! ! ! ! ! ! ! ! ! ! ! !");
		console.log(" !    The is no term_id    !");
		console.log(" ! ! ! ! ! ! ! ! ! ! ! ! ! !");
	}
}
async function mapTheTagToObject(connection, tag, type, objectID){

	let tag_query = "select term_id from wp_terms where name = ?";
	// let new_taxonomy_query = 'select term_id from wp_terms where name = ?'

	let new_tag_query = "insert into wp_terms"
	+ " (name, slug, term_group) "
	+ " VALUES (?, ?, 0) ";
	
	let search_taxonomy_query = "select * from wp_term_taxonomy where term_id = ? AND taxonomy = ?";
// INSERT INTO wp_term_taxonomy (term_taxonomy_id, term_id, taxonomy, description, parent, count) VALUES (?,?,?,0,?)
	let taxonomy_query = "insert into wp_term_taxonomy"
		+ " (term_taxonomy_id, term_id, taxonomy, description, parent, count) "
		+ " VALUES (?,?,?,?,0,?) ";
	let increment_taxonomy_query = ""
		+	"	UPDATE wp_term_taxonomy "
		+	"	SET count = ? "
		+	"	where term_taxonomy_id = ? ";	
	let taxonomy_max_id = ''
		+	"	SELECT MAX(term_taxonomy_id) as `max` FROM wp_term_taxonomy ";

	let relation_query = "insert into wp_term_relationships"
	+ " (object_id, term_taxonomy_id, term_order) "
	+ " VALUES (?, ?, 0) ";


	let foreignTagId = await connection.query( tag_query, [
		tag.name
	]);
	console.log(" < foreign Tag Id > ");
	console.log(foreignTagId[0]);

	if( foreignTagId[0] != 0 ){ // we catched the foreign Tag
		let taxonomy = await connection.query(search_taxonomy_query, [
				foreignTagId[0][0].term_id,
				type
			]);
		console.log(" < taxonomy > ");
		console.log(taxonomy[0]);

		if( taxonomy[0].length == 0 ){
			let taxon__last_max = await connection.query(taxonomy_max_id, []);
			console.log("< taxon__last_max >");
			console.log(taxon__last_max);
			let taxon_max = taxon__last_max[0][0].max+1;
			console.log("< taxon_max >");
			console.log(taxon_max);

			//, term_taxonomy_id, term_id, taxonomy, description, count
			let new_taxonomy = await connection.query(taxonomy_query,[
				taxon_max,
				foreignTagId[0][0].term_id,
				type, //'post_tag',
				'',
				1
			]);
			console.log(" < new taxonomy > ");
			console.log(new_taxonomy[0]);

			if(objectID){
				let taxonomyID = new_taxonomy[0].insertId;
				let res = await connection.query(relation_query, [
					objectID ,
					taxonomyID
				]); 
				console.log(" < insert relation foreignTag > ");
				console.log(res[0]);
			}
		}else{
			if(objectID){
				let taxonomyID = taxonomy[0][0].term_taxonomy_id; 
				let taxonomyCount = taxonomy[0][0].count; 
				let res = await connection.query(relation_query, [
						objectID ,
						taxonomyID
					]);
				console.log(" < search and create relation foreignTag > ");
				console.log(res[0]);
				let increment_query = await connection.query(increment_taxonomy_query, [
						taxonomyCount+1,
						taxonomyID
					]);
				console.log(" < increment_query > ");
				console.log(increment_query);
			}
		}

	}else{
		let res2 = await connection.query(new_tag_query,[
			tag.name,
			tag.name
				.toLowerCase()
				.replace(punctREGEX, '')
				.replace(/(^\s*)|(\s*)$/g, '')
				.replace(/\s+/g,'_')
		]);
		console.log(" < new foreign Tag Id > ");
		console.log(res2[0]);

		let taxon__last_max = await connection.query(taxonomy_max_id, []);
		let taxon_max = taxon__last_max[0][0].max+1;

		foreignTagId = res2[0].insertId;
		console.log("< foreignTagId >");
		console.log(foreignTagId);
		//, term_taxonomy_id, term_id, taxonomy, description, count
		let taxonomy = await connection.query(taxonomy_query,[
			taxon_max,
			foreignTagId,
			'post_tag',
			'',
			1
		]);
		console.log(" < new taxonomy > ");
		console.log(taxonomy[0]);

		if(objectID){
			let taxonomyID = taxonomy[0].insertId;
			let res = await connection.query(relation_query, [
				objectID ,
				taxonomyID
			]);
			console.log(" < insert relation foreignTag > ");
			console.log(res[0]);
		}
	}
}

async function selectProjectHiddenTags(projectID,callback){
	try {
		let query = ""
		+	"	Select r.id, r.tagID, r.projectID, r.type, res.name FROM "
		+	"	relationTagProject r"
		+	"	left join("
		+	"	select name, id from"
		+	"	replecon.tag"
		+	"	)as res on res.id = r.tagID"
		+	"	where r.projectID = ?"
		+	"	AND type = 'hidden'"
		+	"	order by r.id ";

		let result = await myquery( query, [projectID] );
		console.log(result);

		if(callback)
			await callback(result);
		return result;
	} catch (e) {
		console.log(e);
		return 0;
	}
}
async function selectProjectCategoriesTags(projectID,callback){
	try {
		let query = ""
		+	"	Select r.id, r.tagID, r.projectID, r.type, res.name FROM "
		+	"	relationTagProject r"
		+	"	left join("
		+	"	select name, id from"
		+	"	replecon.tag"
		+	"	)as res on res.id = r.tagID"
		+	"	where r.projectID = ?"
		+	"	AND type = 'categories'"
		+	"	order by r.id ";

		let result = await myquery( query, [projectID] );
		console.log(result);

		if(callback)
			await callback(result);
		return result;
	} catch (e) {
		console.log(e);
		return 0;
	}
}
async function selectObjectTags(objectID,callback){
	try {
		let query = ""
		+	"	Select r.id, r.tagID, r.objectID, res.name FROM "
		+	"	replecon.relationTagObject r"
		+	"	left join("
		+	"	select name, id from"
		+	"	replecon.tag"
		+	"	)as res on res.id = r.tagID"
		+	"	where objectID = ?"
		+	"	order by r.id "

		let result = await myquery( query, [objectID] );
		console.log(result);

		if(callback)
			await callback(result);
		return result;
	} catch (e) {
		console.log(e);
		return 0;
	}
}
async function createExportLog(projectID,callback){
	try {
		let query = ""
				+	" insert into "
				+	" exportLog(projectID, date) "
				+	" values( ?, NOW() ) ";

		let result = await myquery( query, [projectID] );
		
		console.log(result);
		result = result.insertId;

		if(callback)
			await callback(result);
		return result;
	} catch (e) {
		console.log(e);
		return 0;
	}
}
/////////////////////////////////////////////SELECT * FROM replecon.exportLog;

module.exports.selectExportLogs = async (projectID, callback) => {
	try {

		// let query = "SELECT * FROM tag WHERE MATCH(name) AGAINST(?);";
		let query = " SELECT * FROM exportLog WHERE projectID = ? ";
		let result = await myquery(query, [projectID]);

		// console.log(result);
		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}/////////////////////////////////////////////
module.exports.selectExportLog = async (logID, callback) => {
	try {

		// let query = "SELECT * FROM tag WHERE MATCH(name) AGAINST(?);";
		let query = " SELECT * FROM exportLog WHERE id = ? ";
		let result = await myquery(query, [logID]);

		// console.log(result);
		if(callback)
			await callback(result[0]);
		return result[0];

	} catch (e) {
		console.log(e);
		return 0;
	}
}/////////////////////////////////////////////
module.exports.selectExportLogObjects = async (logID, callback) => {
	try {

		// let query = "SELECT * FROM tag WHERE MATCH(name) AGAINST(?);";
		let query = " SELECT * FROM object WHERE DataKey2 = ? ";
		let result = await myquery(query, [logID]);

		// console.log(result);
		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}/////////////////////////////////////////////

module.exports.searchProject = async (name, callback) => {
	try {
		console.log(name);

		// let query = "SELECT * FROM tag WHERE MATCH(name) AGAINST(?);";
		let query = "SELECT * FROM project WHERE name like ?";
		let result = await myquery(query, [ '%'+name+'%' ]);

		// console.log(result);
		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
/////////////////////////////////////////////

module.exports.searchTag = async (name, callback) => {
	try {
		console.log(name);

		// let query = "SELECT * FROM tag WHERE MATCH(name) AGAINST(?);";
		let query = "SELECT * FROM tag WHERE name like ?";
		let result = await myquery(query, [ '%'+name+'%' ]);

		// console.log(result);
		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
module.exports.searchTmpl = async (name, callback) => {
	try {
		console.log(name);

		// let query = "SELECT * FROM tag WHERE MATCH(name) AGAINST(?);";
		let query = "SELECT * FROM tmpl WHERE title like ?";
		let result = await myquery(query, [ '%'+name+'%' ]);

		// console.log(result);
		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
/////////////////////////////////////////////

module.exports.createTag = async (name, callback) => {
	try {
		console.log(name);
		let query = "INSERT INTO tag(`name`) VALUES(?)";
		let result = await myquery(query, [ name ]);

		// console.log(result);
		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
module.exports.createTmpl = async (name, callback) => {
	try {
		console.log(name);
		let query = "INSERT INTO tmpl(`title`) VALUES(?)";
		let result = await myquery(query, [ name ]);

		// console.log(result);
		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
/////////////////////////////////////////////
module.exports.saveProjectTags = async (projectID, tags, callback) => {
	try {
		var query = '';
		
		console.log("< project_tags >");
		// TYPE - new db field col
		// query = "select r.tagID, r.projectID, r.type, res.flag from relationTagProject r left join (select id, name, flag from tag) as res on res.id = r.tagID where r.projectID = ? order by res.id";
		query = ''
		+ "	select r.tagID, r.projectID, type, res.flag "
		+ "	from replecon.relationTagProject r "
		+ "	left join (select id, name, flag from replecon.tag) as res on res.id = r.tagID "
		+ "	where r.projectID = ? order by res.id ";

		let p_t = await myquery(query, [ projectID ]);
		console.log( 'p_t' );
		console.log( p_t );

		var p_t_p = [],
			p_t_n = [],
			p_t_h = [],
			p_t_c = [];
		for( var i=0; i<p_t.length; i++ ){
			let tag = p_t[i];
			switch(tag.type){
				case "positive":
					p_t_p.push(tag);
					break;
				case "negative":
					p_t_n.push(tag);
					break;
				case "hidden":
					p_t_h.push(tag);
					break;
				case "categories":
					p_t_c.push(tag);
					break;
				default:
					console.log(" - - - - - W R O N G _ T A G _ T Y P E ");
					console.log(" - - - - - W R O N G _ T A G _ T Y P E ");
					console.log(" - - - - - W R O N G _ T A G _ T Y P E ");
			}
		}
		console.log( 'p_t_p' );
		console.log( p_t_p );
		console.log( 'p_t_n' );
		console.log( p_t_n );
		console.log( 'p_t_h' );
		console.log( p_t_h );
		console.log( 'p_t_c' );
		console.log( p_t_c );

		var insert_query = 'insert into '
		+	'relationTagProject(projectID, tagID, type) '
		+	'values(?,?,?)';
		var remove_query = 'DELETE FROM relationTagProject '
			+	'WHERE projectID = ? '
			+	'and tagID = ? '
			+	'and type = ? ';

		// console.log('tags.categories');
		// console.log(tags.categories);
		for( var i=0; i<tags.categories.length; i++){
			let tag = tags.categories[i];
			if( p_t_c.map(e => e.tagID).indexOf(tag) == -1 ){
				await myquery(insert_query, [projectID, tag, 'categories']);
			}
		}
		for( var i=0; i<p_t_c.length; i++){
			let tag = p_t_c[i].tagID;
			if( tags.categories.indexOf(tag) == -1 ){
				await myquery(remove_query, [projectID, tag, 'categories']);
			}
		}
		// console.log('tags.hidden');
		// console.log(tags.hidden);
		for( var i=0; i<tags.hidden.length; i++){
			let tag = tags.hidden[i];
			if( p_t_h.map(e => e.tagID).indexOf(tag) == -1 ){
				await myquery(insert_query, [projectID, tag, 'hidden']);
			}
		}
		for( var i=0; i<p_t_h.length; i++){
			let tag = p_t_h[i].tagID;
			if( tags.hidden.indexOf(tag) == -1 ){
				await myquery(remove_query, [projectID, tag, 'hidden']);
			}
		}
		// console.log('tags.positive');
		// console.log(tags.positive);
		for( var i=0; i<tags.positive.length; i++){
			let tag = tags.positive[i];
			if( p_t_p.map(e => e.tagID).indexOf(tag) == -1 ){
				await myquery(insert_query, [projectID, tag, 'positive']);
			}
		}
		for( var i=0; i<p_t_p.length; i++){
			let tag = p_t_p[i].tagID;
			if( tags.positive.indexOf(tag) == -1 ){
				await myquery(remove_query, [projectID, tag, 'positive']);
			}
		}
		console.log('tags.negative');
		console.log(tags.negative);
		for( var i=0; i<tags.negative.length; i++){

			let tag = tags.negative[i];
		console.log('______________');
		console.log(tag);
			if( p_t_n.map(e => e.tagID).indexOf(tag) == -1 ){
		console.log('_____________+');
				await myquery(insert_query, [projectID, tag, 'negative']);
			}
		}
		for( var i=0; i<p_t_n.length; i++){
			let tag = p_t_n[i].tagID;
			if( tags.negative.indexOf(tag) == -1 ){
				await myquery(remove_query, [projectID, tag, 'negative']);
			}
		}



/*
		// for(var i=0; i<p_t.length; i++){
		// 	if(p_t[i].type == 1)
		// 		await p_t_a.push(p_t[i].tagID);
		// 	else 
		// 		await p_t_s.push(p_t[i].tagID);
		// }
		console.log("< p_t_a >");
		console.log(p_t_a);
		console.log("< p_t_s >");
		console.log(p_t_s);
		///////////////////////////////////////////
		var new_p_t_a = [];
		var lost_p_t_a = [];

		for(var i=0;i<tags.assoc.length; i++){
		    if( p_t_a.indexOf(tags.assoc[i]) < 0 )
		        await new_p_t_a.push(tags.assoc[i]);
		}
		for(var i=0;i<p_t_a.length; i++){
		    if( tags.assoc.indexOf(p_t_a[i]) < 0 )
		    	await lost_p_t_a.push(p_t_a[i]);
		}
		console.log("< new_p_t_a >");
		console.log(new_p_t_a);
		console.log("< lost_p_t_a >");
		console.log(lost_p_t_a);
		///////////////////////////////////////////
		var new_p_t_s = [];
		var lost_p_t_s = [];

		for(var i=0;i<tags.stop.length; i++){
		    if( p_t_s.indexOf(tags.stop[i]) < 0 )
		        await new_p_t_s.push(tags.stop[i]);
		}
		for(var i=0;i<p_t_s.length; i++){
		    if( tags.stop.indexOf(p_t_s[i]) < 0 )
	        	await lost_p_t_s.push(p_t_s[i]);
		}
		console.log("< new_p_t_s >");
		console.log(new_p_t_s);
		console.log("< lost_p_t_s >");
		console.log(lost_p_t_s);


		console.log("< tag_res >");
		query = 'insert into ' // type - new db field col
			+	'relationTagProject(tagID, projectID, type) '
			+	'values(?,?,?)';
		// for(var a_t in new_p_t_a){
		// 	console.log(a_t);
		// 	type = 1;
		// 	let tag_res = await myquery(query, [ a_t, id, type ]);
		// 	console.log(tag_res);
		// }
		for(var i=0; i<new_p_t_a.length;i++){
			console.log(new_p_t_a[i]);
			type = 1;
			let tag_res = await myquery(query, [ new_p_t_a[i], id, type ]);
			console.log(tag_res);
		}
		for(var i=0; i<new_p_t_s.length;i++){
			console.log(new_p_t_s[i]);
			type = 0;
			let tag_res = await myquery(query, [ new_p_t_s[i], id, type ]);
			console.log(tag_res);
		}
		query = 'DELETE FROM relationTagProject ' // TYPE - new db field col
			+	'WHERE tagID = ? '
			+	'and projectID = ? '
			+	'and type = ? ';
		for(var i=0; i<lost_p_t_a.length;i++){
			console.log(lost_p_t_a[i]);
			type = 1;
			let tag_res = await myquery(query, [ lost_p_t_a[i], id, type ]);
			console.log(tag_res);
		}
		for(var i=0; i<lost_p_t_s.length;i++){
			console.log(lost_p_t_s[i]);
			type = 0;
			let tag_res = await myquery(query, [ lost_p_t_s[i], id, type ]);
			console.log(tag_res);
		}
*/
result = '321';
		// console.log(result);
		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
/////////////////////////////////////////////
// TYPE - new db field col
module.exports.setProjectTags = async (tagID, projID, type, callback) => {
	try {
		console.log(name);
		var query = "INSERT INTO relationTagProject (`tagID`, `projectID`, `type`) VALUES (?, ?, ?);";
		let result = await myquery(query, [ tagID, projectID, type ]);

		// console.log(result);
		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
/////////////////////////////////////////////
module.exports.saveProjectChanges = async (id, name, info, t_tmpls, d_tmpls, db, callback) => {
	try {
		console.log({name, info, t_tmpls, d_tmpls, db, callback});
		if(!name )
			return
		let query;
		///////////////////////////////////////////
				console.log("< base_save >");
				query = "UPDATE project "
					+	"SET name=?, description=? "
					+	"WHERE id=?;";
				let base_save = await myquery(query, [ name, info, id ]);
				console.log(base_save);
	///////////////////////////////////////////

		///////////////////////////////////////////
		console.log('< p_tmpls_res >');

		query = "select tmplID "
			+	"from relationTmplProject "
			+	"where projectID = ? and type = 'title'"
		let p_tmpls_res = await myquery(query, [ id ]);
		console.log(p_tmpls_res);

		var p_tmpls = [];
		for(var i=0; i<p_tmpls_res.length;i++){
			await p_tmpls.push(p_tmpls_res[i].tmplID);
		}
		console.log(" < p_tmpls >");
		console.log(p_tmpls);

		var new_tmpls = [];
		var lost_tmpls = [];

		if(!t_tmpls)
			t_tmpls = [];

		for(var i=0;i<t_tmpls.length; i++){

		    if( p_tmpls.indexOf(t_tmpls[i]) < 0 )
		
		        await new_tmpls.push(t_tmpls[i])
		
		}
		for(var i=0;i<p_tmpls.length; i++){
		
		    if( t_tmpls.indexOf(p_tmpls[i]) < 0 )
	    
	        	await lost_tmpls.push(p_tmpls[i])
		
		}
		console.log('< new_tmpls >');
		console.log(new_tmpls);
		console.log('< lost_tmpls >');
		console.log(lost_tmpls);

		console.log('< tmpl_res >');
		query = 'insert into '
			+	'relationTmplProject(tmplID, projectID, type) '
			+	'values(?,?,?)';
		for(var i=0; i<new_tmpls.length; i++){
			let tmpl_res = await myquery(query, [ new_tmpls[i], id, 'title' ]);
			console.log(tmpl_res);
		}
		query = "DELETE FROM relationTmplProject "
			+	"WHERE tmplID = ? "
			+	"and projectID = ? and type = 'title'";
		for(var i=0; i<lost_tmpls.length; i++){
			let tmpl_res = await myquery(query, [ lost_tmpls[i], id ]);
			console.log(tmpl_res);
		}
		////////////////////////////////////////////
		query = "select tmplID "
			+	"from relationTmplProject "
			+	"where projectID = ? and type = 'description'"
		let _p_tmpls_res = await myquery(query, [ id ]);
		console.log(_p_tmpls_res);

		var _p_tmpls = [];
		for(var i=0; i<_p_tmpls_res.length;i++){
			await _p_tmpls.push(_p_tmpls_res[i].tmplID);
		}

		var _new_tmpls = [];
		var _lost_tmpls = [];

		if(!d_tmpls)
			d_tmpls = [];

		for(var i=0;i<d_tmpls.length; i++){
		    if( _p_tmpls.indexOf(d_tmpls[i]) < 0 )
		        await _new_tmpls.push(d_tmpls[i])
		}
		for(var i=0;i<_p_tmpls.length; i++){
		    if( d_tmpls.indexOf(_p_tmpls[i]) < 0 )
	        	await _lost_tmpls.push(_p_tmpls[i])
		}
		console.log('< new_tmpls >');
		console.log(_new_tmpls);
		console.log('< lost_tmpls >');
		console.log(_lost_tmpls);

		console.log('< tmpl_res >');
		query = 'insert into '
			+	'relationTmplProject(tmplID, projectID, type) '
			+	'values(?,?,?)';
		for(var i=0; i<_new_tmpls.length; i++){
			let tmpl_res = await myquery(query, [ _new_tmpls[i], id, 'description' ]);
			console.log(tmpl_res);
		}
		query = "DELETE FROM relationTmplProject "
			+	"WHERE tmplID = ? "
			+	"and projectID = ? and type = 'description'";
		for(var i=0; i<_lost_tmpls.length; i++){
			let tmpl_res = await myquery(query, [ _lost_tmpls[i], id ]);
			console.log(tmpl_res);
		}
		if (callback)
			await callback();
	} catch (e) {
		console.log(e);
		return 0;
	}
}
async function segregateProjectTags(projectID, income_tags, callback){
	try {


		if(callback)
			await callback();
	} catch (e) {
		console.log(e);
		return 0;
	}
}
/////////////////////////////////////////////
module.exports.saveTmplChanges = async (tagID, name, callback) => {
	try {
		let query = "UPDATE tmpl SET title=? WHERE id=?;";
		let result = await myquery(query, [ name, tagID ]);
		if(callback)
			await callback();
	} catch (e) {
		console.log(e);
		return 0;
	}
}
/////////////////////////////////////////////
module.exports.saveTagChanges = async (tagID, name, newsyns, callback) => {
	try {
		await tagNameCheck(tagID, name, async (res)=>{
			if(!res)
				await tagNameUpdate(tagID, name);
		});
		await selectTagSyns(tagID, async (arr)=>{
			var newTag = [];
			var lostTag = [];
			for(var i=0;i<newsyns.length; i++){
			    if( arr.indexOf(newsyns[i]) < 0 )
			        await newTag.push(newsyns[i])
			}
			for(var i=0;i<arr.length; i++){
			    if( newsyns.indexOf(arr[i]) < 0 )
			    	if(arr[i] != tagID)
			        	await lostTag.push(arr[i])
			}
			var flag;
			await selectTagFlag(tagID, async (_flag)=>{
				console.log("flag:"+_flag.flag);
				flag = _flag.flag
				if(flag == null)
					await setTagFlag(tagID, async (newflag)=>{
						flag = tagID;
					});
				await saveTagSyns({new:newTag,lost:lostTag},flag);
			});
		});

		if(callback)
			await callback();
		// return result;
	} catch (e) {
		console.log(e);
		return 0;
	}
}
async function tagNameCheck(tagID,name,callback){
	try {
		let query = 'SELECT name FROM tag WHERE id = ?';
		let result = await myquery( query, [tagID] );
		
		console.log(result);
		var resp = result.name == name;
		if(callback)
			await callback(resp);
		return resp;
	} catch (e) {
		console.log(e);
		return 0;
	}
}
async function tagNameUpdate(tagID,name,callback){
	try {
		console.log(" - tagNameUpdate");
		let query = 'UPDATE tag SET name = ? WHERE id = ?';
		let result = await myquery( query, [name,tagID] );
		console.log(result);

		if(callback)
			await callback(result[0]);
		return result[0];
	} catch (e) {
		console.log(e);
		return 0;
	}
}
async function saveTagSyns(obj, flag, callback){
	try {
		var newTag = obj.new;
		var lostTag = obj.lost;
		console.log(" - saveTagSyns");
		console.log(flag);
		console.log(newTag);
		console.log(lostTag);

		for(var i=0; i<newTag.length; i++){
			let query = 'UPDATE tag SET flag = ? WHERE id = ?';
			let result = await myquery( query, [flag, newTag[i]] );
			console.log(result);
		}
		for(var i=0; i<lostTag.length; i++){
			let query = 'UPDATE tag SET flag = null WHERE id = ?';
			let result = await myquery( query, [lostTag[i]] );
			console.log(result);
		}

		if(callback)
			await callback();
	} catch (e) {
		console.log(e);
		return 0;
	}
}
async function selectTagSyns(tagID,callback){
	try {
		let query = ""	
			+ " select r.id "
			+ " from tag r "
			+ " where r.flag = "
			+ " ( "
			+ " 	select flag "
			+ " 	from tag "
			+ " 	where id = ? "
			+ " ) "
			+ " GROUP BY r.id ";
		let result = await myquery( query, [tagID] );

		console.log('selectTagSyns result');
		console.log(result);
		var arr = [];
		for(var i=0; i<result.length; i++){
			arr.push(result[i].id);		
		}
		console.log(arr);

		if(callback)
			await callback(arr);
		return arr;
	} catch (e) {
		console.log(e);
		return 0;
	}
}
/////////////////////////////////////////////
module.exports.selectFlagTemplates = async (tagID, callback) => {
	try {
		var query = ""
			+ " SELECT *"
			+ " FROM tagTemplates"
			+ " WHERE flag ="
			+ " ("
			+ " SELECT flag"
			+ " FROM tag"
			+ " WHERE id = ?"
			+ " )"
		let result = await myquery(query, [ tagID ]);

		console.log(result);
		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
module.exports.formatTMPL = async (list) => {
	var tmpl = {};

	await list.map((item)=>{
		// var obj = {};
		tmpl[item['keyword']] = {
			id : item.keyID,
			values : item.values 
				? item.values
				: []
		};
		// return obj;
	});
	console.log(tmpl);
	console.log(">_____________tmpl_first");

	// var tmpl = {};
	// await Array.prototype.forEach.call(tmpl_arr,function(elem) {
	// 	console.log(elem);
	// 	console.log(">_____________elem");
	// 	var keys = Object.keys(elem);
	// 	tmpl[keys[0]] = elem[keys[0]];
	// });
	// console.log(tmpl);

	// for(var i=0; i<list.length; i++){
	// 	var key = list[i]['keyword'];
	// 	var val = list[i]['value'];
	// 	var keyID = list[i]['keyID'];
	// 	var valueID = list[i]['valueID'];
	// 	// console.log(key);
	// 	// console.log(val);
	// 	await tmpl[key].values.push({
	// 		id : valueID,
	// 		value : val
	// 	});
	// }
	console.log(tmpl);
	console.log(">_____________tmpl_second");
	return tmpl;
}
module.exports.selectTmplKeys = async (tmplID, callback) => {
	try {
		// console.log("< selectTmplTemplates >");
		console.log("< selectTmplKeys >");
		console.log(tmplID);
		let result = await selectTmplKeys(tmplID);

		//
		// ...
		// tmpl key-value relation condition
		// ...
		//
		// for(var i in result){
		// 	result[i].tags = {assocs:[], stops:[]};
		// 	let conditions = await selectTmplCondition(result[i].id);
		// 	for(var j in conditions){
		// 		let tag = {id:conditions[j].tagID, name:conditions[j].name}
		// 		if( conditions[j].positive == 1 ){
		// 			result[i].tags.assocs.push(tag);
		// 		}else{
		// 			result[i].tags.stops.push(tag);
		// 		}
		// 	}
		// }

		// console.log(result);
		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
async function selectTmplKeys(tmplID){
	try {
		console.log("< selectTmplKey >");
		console.log(tmplID);

		// `
		// 	select rel.id as 'relID', rel.keyID, rel.tmplID, val.id as 'valID', val.value, k.keyword
		// 	from replecon.tmplRelation rel
		// 	inner join(
		// 		select *
		// 	    from replecon.tmplValue
		// 	) as val on val.keyID = rel.keyID
		// 	inner join(
		// 		select *
		// 	    from replecon.tmplKey
		// 	) as k on k.id = rel.keyID
		// 	where rel.tmplID = ?
		// 	order by k.keyword;
		// `;
		var result = await myquery( `
			SELECT 
			rel.tmplID, 
			rel.id AS 'relID', 
			rel.keyID, 
			k.keyword
			FROM replecon.tmplRelation rel
			INNER JOIN(
				SELECT *
				FROM replecon.tmplKey
			) AS k ON k.id = rel.keyID
			WHERE rel.tmplID = ?
			ORDER BY k.keyword
		`, [tmplID] );

		for(var i=0; i<result.length; i++ ){
			var key = result[i];
			var values = await myquery( `
				SELECT id, value
				FROM replecon.tmplValue
				WHERE keyID = ?
			`, [key.keyID] );
			if(values.length != 0){
				result[i].values = values;
			}
		}
		// let relation_query = "select id,keyID from tmplRelation where tmplID = ?";
		// let key_query = "select keyword from tmplKey where id = ?";
		// let val_query = "select value from tmplValue where keyID = ?";

		// let relation_result = await myquery( relation_query, [tmplID] );

		// // console.log( relation_result );
		// for(var i=0; i<relation_result.length; i++){
		// 	let item = relation_result[i];
			
		// 	let key_id = item.keyID;
		// 	let key = await myquery( key_query, [key_id] );
		// 	item.keyword = key[0].keyword;

		// 	let val_id = item.valueID;
		// 	let val = await myquery( val_query, [key_id] );
		// 	item.value = val[0].value;
			
		// 	await result.push(item);
		// }
		// return true;
		console.log(result);
		return result;
	} catch (e) {
		console.log(e);
		return 0;
	}
}
async function selectTmplCondition(tmplKeyID){
	try {
		console.log("< selectTmplCondition >");
		console.log(tmplKeyID);
		var query = ""
		+ " select * from templateCondition tc "
		+ " left join"
		+ " (select id, name from tag)as res "
		+ " on res.id = tc.tagID"
		+ " where tc.tmplKeyID = ?"
		+ " order by tc.id";
		let result = await myquery( query, [tmplKeyID] );

		console.log(result);
		return result;
	} catch (e) {
		console.log(e);
		return 0;
	}
}
/////////////////////////////////////////////
module.exports.createTmplKey = async (tmplID, keyword, tags, callback) => {
	try {
		console.log('< createTmplKey >');
		console.log({tmplID, keyword, tags});

		var tmplKeyID = await createTmplKey(tmplID, keyword);
		if(!tmplKeyID) return false;
		// var tagID,
		// 	positive;
		// if(tags.assocs)
		// 	for(var i in tags.assocs){
		// 		tagID = tags.assocs[i];
		// 		positive = 1;
		// 		await insertTmplCondition(tagID, tmplKeyID, positive);
		// 	}
		// if(tags.stops)
		// 	for(var i in tags.stops){
		// 		tagID = tags.stops[i];
		// 		positive = 0;
		// 		await insertTmplCondition(tagID, tmplKeyID, positive);
		// 	}
		if(callback)
			await callback(true);
		return true
	} catch (e) {
		console.log(e);
		return 0;
	}
}
async function createTmplKey(tmplID, key){
	try {
		var key_query = "INSERT INTO tmplKey (keyword) values (?)";
		var rel_query = "INSERT INTO tmplRelation (tmplID, keyID) values (? ,?)";
		let key_result = await myquery( key_query, [key] );
		let key_id = key_result.insertId;
		let rel_result = await myquery( rel_query, [tmplID, key_id] );

		console.log(rel_result);
		return rel_result.insertId;
	} catch (e) {
		console.log(e);
		return 0;
	}
}
async function insertTmplCondition(tagID, tmplKeyID, positive){
	try {
		console.log('< insertTmplCondition >');
		console.log({tagID, tmplKeyID, positive});
		var query = "INSERT INTO templateCondition (tagID, tmplKeyID, positive) values (? ,?, ?)";
		let result = await myquery( query, [tagID, tmplKeyID, positive] );

		console.log(result);
		return result.insertId;
	} catch (e) {
		console.log(e);
		return 0;
	}
}
module.exports.createTagTemplate = async (tagID,keyword,val, callback) => {
	try {
		var query = "INSERT INTO tagTemplates (flag, keyword, val) values (? ,?, ?)";
		var flag = await selectTagFlag(tagID).flag;
		console.log(flag);
		if(!flag){				
			await setTagFlag(tagID);
			flag = tagID;
		}
		let result = await myquery(query, [ flag, keyword, val ]);
		console.log(result);
		if(callback)
			await callback(result[0]);
		return result[0];

	} catch (e) {
		console.log(e);
		return 0;
	}
}
		// await new Promise( async (resolve, reject)=>{
		// 	let val_result = await myquery(
		// 		"DELETE FROM tmplValue WHERE keyID = ?", [ 
		// 			keyID
		// 		]);
		// 	console.log("val_result");
		// 	console.log(val_result);
		// 	resolve();
		// }).then( async ()=>{
		// 	let rel_result = await myquery(
		// 		"DELETE FROM tmplRelation WHERE keyID = ?"
		// 		, [ keyID ]);
		// 	console.log("rel_result");
		// 	console.log(rel_result);
		// }).then( async ()=>{
		// 	let key_result = await myquery(
		// 		"DELETE FROM tmplKey WHERE id = ?"
		// 		, [ keyID ]);
		// 	console.log("key_result");
		// 	console.log(key_result);
		// });
module.exports.deleteTmpl = async (tmplID, callback) => {
	try {
		let proj_rel_result = await myquery(`
			DELETE FROM relationTmplProject WHERE tmplID = ?
			`, [ tmplID ]);
			console.log("proj_rel_result");
			console.log(proj_rel_result);

		let rel_select_result = await myquery(`
			SELECT keyID FROM tmplRelation WHERE tmplID = ?
			`, [ tmplID ]);
			console.log("rel_select_result");
			console.log(rel_select_result);

		let rel_delete_result = await myquery(`
			DELETE FROM tmplRelation WHERE tmplID = ?
			`, [ tmplID ]);
			console.log("rel_delete_result");
			console.log(rel_delete_result);

		for(var i=0; i<rel_select_result.length; i++){
			let keyID = rel_select_result[i].keyID;
			console.log("keyID");
			console.log(keyID);

			let key_result = await myquery(`
				DELETE FROM tmplKey WHERE id = ?
				`, [keyID]);
			console.log("key_result");
			console.log(key_result);

			let val_result = await myquery(`
				DELETE FROM tmplValue WHERE keyID = ?
				`, [keyID]);
			console.log("val_result");
			console.log(val_result);
		}

		let tmpl_result = await myquery(`
			DELETE FROM tmpl WHERE id = ?
			`, [ tmplID ]);
			console.log("tmpl_result");
			console.log(tmpl_result);

		result = true;

		if(callback)
			await callback(result);
	} catch (e) {
		console.log(e);
		return 0;
	}
}
module.exports.deleteTmplKey = async (keyID, callback) => {
	try{
		let val_result = await myquery(
			"DELETE FROM tmplValue WHERE keyID = ?", [ 
				keyID
			]);
		console.log(val_result);

		let rel_result = await myquery(
			"DELETE FROM tmplRelation WHERE keyID = ?"
			, [ keyID ]);
		console.log(rel_result);

		let key_result = await myquery(
			"DELETE FROM tmplKey WHERE id = ?"
			, [ keyID ]);
		console.log(key_result);

		if(callback)
			await callback(key_result);
		return key_result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
module.exports.createTmplValue = async (keyID, value, callback) => {
	try {
		// var key_query = "INSERT INTO tmplKey (keyword) values (?)";
		console.log({keyID, value})
		let val_result = await myquery(`
				INSERT INTO 
				tmplValue (keyID, value) 
				values (?,?)
			`,[ keyID, value ]);

		console.log(val_result);
		if(val_result){
			if(callback)
				await callback(val_result.insertId);
			return val_result.insertId;
		}else{
			if(callback)
				await callback(null);
			return null;
		}
	} catch (e) {
		console.log(e);
		return 0;
	}
}
module.exports.deleteTmplValue = async (valID, callback) => {
	try{
		let val_result = await myquery(
			"DELETE FROM tmplValue WHERE id = ?"
			, [ valID ]);
		console.log(val_result);
		let result = val_result
			? true
			: false;
		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
module.exports.deleteTagTemplate = async (tagID,tmplID, callback) => {
	try {
		var query = "DELETE FROM tagTemplates WHERE id = ?";
		var flag = await selectTagFlag(tagID).flag;
		console.log(flag);
		// if(!flag){				
		// 	await createTagFlag(tagID);
		// 	flag = tagID;
		// }
		let result = await myquery(query, [ tmplID ]);
		console.log(result);
		if(callback)
			await callback(result[0]);
		return result[0];

	} catch (e) {
		console.log(e);
		return 0;
	}
}
module.exports.deleteTag = async (tagID, callback) => {
	try {
		var query = "DELETE FROM tag WHERE id = ?";
		var query2 = "DELETE FROM relationTagObject WHERE tagID = ?";
		var query3 = "DELETE FROM relationTagOriginal WHERE tagID = ?";
		var query4 = "DELETE FROM relationTagProject WHERE tagID = ?";
		var query5 = "DELETE FROM templateCondition WHERE tagID = ?";

		var result1 = await myquery(query2, [ tagID ]);
		var result2 = await myquery(query3, [ tagID ]);
		var result3 = await myquery(query4, [ tagID ]);
		var result4 = await myquery(query5, [ tagID ]);
		var result5 = await myquery(query, [ tagID ]);
		// console.log(result);
		if(callback)
			await callback();
		// return result[0];

	} catch (e) {
		console.log(e);
		return 0;
	}
}
module.exports.deleteProject = async (projectID, callback) => {
	try {
		const connection = await POOLCON();
		const myquery = connection.query;
		const query = "DELETE FROM project WHERE id = ?";
		const query2 = "DELETE FROM relationTagProject WHERE projectID = ?";
		const query3 = "DELETE FROM relationTmplProject WHERE projectID = ?";
		const query4 = "DELETE FROM relationProjectOriginal WHERE projectID = ?";
		const query5 = "DELETE FROM projectLog WHERE projectID = ?";
		const query6 = "DELETE FROM exportLog WHERE projectID = ?";

		// var result1 = await myquery(query2, [ projectID ]);
		// var result2 = await myquery(query3, [ projectID ]);
		// var result3 = await myquery(query4, [ projectID ]);
		// var result4 = await myquery(query5, [ projectID ]);
		// var result5 = await myquery(query6, [ projectID ]);
		const res1 = await connection.query(query2, [ projectID ]);
		const res2 = await connection.query(query3, [ projectID ]);
		const res3 = await connection.query(query4, [ projectID ]);
		const res4 = await connection.query(query5, [ projectID ]);
		const res5 = await connection.query(query6, [ projectID ]);
		
		const db_query = "SELECT sshhID, dbhID FROM projectDB WHERE projectID = ?";
		let [projectDB, ...stuff] = await connection.query(db_query, [ projectID ]);
		console.log('select projectDB', projectDB);

		if (projectDB[0]) {
			projectDB = projectDB[0];
			if (projectDB.sshhID) {
				var sshhID_query = "DELETE FROM sshhost WHERE id = ?";
				var sshh = await connection.query(sshhID_query, [ projectDB.sshhID ]);
			}
			if (projectDB.dbhID) {
				var dbhID_query = "DELETE FROM sshhost WHERE id = ?";
				var dbh = await connection.query(sshhID_query, [ projectDB.dbhID ]);
			}
		}
		var query7 = "DELETE FROM projectDB WHERE projectID = ?";
		var result6 = await connection.query(query7, [ projectID ]);
		console.log('del projectDB', result6);
	
		var query8 = "DELETE FROM projectDir WHERE projectID = ?";
		var result7 = await connection.query(query8, [ projectID ]);
		console.log('del projectDir', result7);
	
		
		var objs_query = "SELECT objectID FROM relationProjectObject WHERE projectID = ?";
		let [projectObjs, ...stuff2] = await connection.query(objs_query, [ projectID ]);
		console.log('select relationProjectObject', projectObjs);
		if (projectObjs) {

			if(projectObjs.length > 0){
				var obj_query = "DELETE FROM object WHERE id = ?";
				for(var i=0; i<projectObjs.length; i++){
					let [obj, ...stuff3] = await connection.query(obj_query, [ projectObjs[i].objectID ]);
					console.log('del object', obj);
				}
			}
		}

		var objs_relation_query = "DELETE FROM relationProjectObject WHERE projectID = ?";
		var objs_relation = await connection.query(objs_relation_query, [ projectID ]);
		console.log('del relationProjectObject', objs_relation);



		var result = await connection.query(query, [ projectID ]);

		// console.log(result);
		if(callback)
			await callback();
		// return result[0];

	} catch (e) {
		console.log(e);
		return 0;
	}
}
async function selectTagFlag(tagID, callback){
	try {
		let query = 'SELECT flag FROM tag WHERE id = ?';
		let result = await myquery( query, [tagID] );

		console.log(result);
		if(callback)
			await callback(result[0]);
		return result[0];
	} catch (e) {
		console.log(e);
		return 0;
	}
}
async function setTagFlag(tagID, callback){
	try {
		let query = 'UPDATE tag SET flag = id WHERE id = ?';
		let result = await myquery( query, [tagID] );

		console.log(result);
		if(callback)
			await callback(result[0]);
		return result[0];
	} catch (e) {
		console.log(e);
		return 0;
	}
}
module.exports.selectProject = async (id, callback) => {
	try {
		let query = "SELECT * FROM project WHERE id = ?";
		let result = await myquery(query, [id]);

		if(callback)
			await callback(result[0]);
		return result[0];

	} catch (e) {
		console.log(e);
		return 0;
	}
}
/////////////////////////////////////////////

module.exports.selectTag = async (id, callback) => {
	try {
		let query = "SELECT * FROM tag WHERE id = ?";
		let result = await myquery(query, [id]);

		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
/////////////////////////////////////////////

module.exports.selectProjectTags = async (id, callback) => {
	try {		
		console.log(" < selectProjectTags > ");
		let query = "SELECT t.name, r.tagID, r.type, t.flag FROM relationTagProject r, tag t WHERE projectID = ? AND t.id = r.tagID";
		let result = await myquery(query, [id]);

		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
/////////////////////////////////////////////
module.exports.selectProjectTmpls = async (projID, callback) => {
	try {		
		let query = "SELECT res.id, res.title, type FROM relationTmplProject left join (select id, title from tmpl)as res on res.id = tmplID WHERE projectID = ?";
		let result = await myquery(query, [projID]);
		console.log(result);

		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
/////////////////////////////////////////////

module.exports.selectTagSyns = async (id, callback) => {
	try {	
		let query = ""	
			+ " select r.id, r.name "
			+ " from tag r "
			+ " where r.flag = "
			+ " ( "
			+ " 	select flag "
			+ " 	from tag "
			+ " 	where id = ? "
			+ " ) "
			+ " GROUP BY r.id ";

		// let query = ""
		// 	+ " select r.tagID as `id`, res2.name "
		// 	+ " from replecon.relationTagSyn r "
		// 	+ " left join "
		// 	+ " ( "
		// 	+	" select * "
		// 	+	" from  replecon.tag "
		// 	+ " ) as res2 on r.tagID = res2.id "
		// 	+ " where r.flag = "
		// 	+ " ( "
		// 	+	" select flag "
		// 	+	" from replecon.relationTagSyn "
		// 	+	" where tagID = ? "
		// 	+ " ) " 
		// 	+ " GROUP BY tagID ";
		// let query = " select tagID as `id` "
		// 	+ " from replecon.relationTagSyn "
		// 	+ " where flag = "
		// 	// + " where flagID = "
		// 	+ " ( "
		// 	+ " select flag "
		// 	// + " select flagID "
		// 	+ " from replecon.relationTagSyn "
		// 	+ " where tagID = ? "
		// 	+ " ) ;"
		let result = await myquery(query, [id]);

		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
/////////////////////////////////////////////

module.exports.selectOriginalAllSize = async (callback) => {
	try {		
		let query = "SELECT count(*) FROM original";
		let size = await myquery(query, []);
		let result = size[0]['count(*)'];

		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}/////////////////////////////////////////////

module.exports.selectProjectSize = async (id, callback) => {
	try {		
		let query = "SELECT count(*) FROM relationProjectObject WHERE projectID = ?";
		let size = await myquery(query, [id]);
		let result = size[0]['count(*)'];

		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
module.exports.selectProjectDB = async (id, callback) => {
	try {		
		let query = "SELECT * FROM projectDB WHERE projectID = ?";
		let projectDB = await myquery(query, [id]);
		let result = projectDB[0];

		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}

module.exports.selectProjectDBlocalhost = async (id, callback) => {
	try {		
		let query = "SELECT * FROM dbhost WHERE id = ?";
		let localhost = await myquery(query, [id]);
		let result = localhost[0];

		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
module.exports.selectProjectDBsshhost = async (id, callback) => {
	try {		
		let query = "SELECT * FROM sshhost WHERE id = ?";
		let sshhost = await myquery(query, [id]);
		let result = sshhost[0];

		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
module.exports.saveProjectDB = async (projID, pack, callback) => {
	try {		
		let query = "SELECT * FROM projectDB WHERE projectID = ?";
		let projectDB = await myquery(query, [projID]);
			console.log(17);
			console.log(projectDB);
			console.log(16);
		// if()

		if(!projectDB || projectDB.length == 0){
			console.log(15);
			query = "INSERT INTO projectDB (projectID, flag) VALUES (?,?)";
			let flag = ( pack.db_type == 'localhost' ) ? 0 : 1;

			console.log(14);
			projectDB = await myquery(query, [projID, flag]);
			let pdbID = projectDB.insertId;

			console.log(13);
			if(!flag){
				console.log(12);
				query = "INSERT INTO dbhost (host, user, password, name) VALUES (?,?,?,?)";
				
				let host = pack.db_adr,
					user = pack.db_usr,
					password = pack.db_pass,
					name = pack.db_name;
				if( !host || !user || !password || !name) return;

				let dbhost = await myquery(query, [host, user, password, name]);
				let dbhID = dbhost.insertId;

				query = "UPDATE projectDB SET dbhID = ? WHERE projectID = ?";
				let updatePDB = await myquery(query, [dbhID, projID]);
			}else{
			console.log(11);

				let l_host = pack.db_adr,
					l_port = pack.db_port,
					l_user = pack.db_usr,
					l_password = pack.db_pass,
					l_name = pack.db_name;

				let f_host = pack.host_adr
					f_port = pack.host_port,
					f_user = pack.host_usr,
					f_password =pack.host_pass;

				let f_options = [],
					l_options = [];

				if( !l_host || !l_user || !l_password || !l_name ) return;
				if( !f_host || !f_user || !f_password ) return;

				/* foreign ssh host */
				if(f_port){
					query = "INSERT INTO sshhost (host, port, user, password) VALUES (?,?,?,?)";
					f_options = [f_host, f_port, f_user, f_password];				
				}else{
					query = "INSERT INTO sshhost (host, user, password) VALUES (?,?,?)";
					f_options = [f_host, f_user, f_password];
				}
				let sshhost = await myquery(query, f_options);
				let sshhID = sshhost.insertId;

				/* local db host */
				if(l_port){
					query = "INSERT INTO dbhost (host, port, user, password, name) VALUES (?,?,?,?,?)";
					let l_options = [l_host, l_port, l_user, l_password, l_name];
				}else{
					query = "INSERT INTO dbhost (host, user, password, name) VALUES (?,?,?,?)";
					let l_options = [l_host, l_user, l_password, l_name];
				}
				let dbhost = await myquery(query, l_options);
				let dbhID = dbhost.insertId;

				/* project DB config */
				query = "UPDATE projectDB SET dbhID = ?, sshhID = ? WHERE projectID = ?";
				let updatePDB = await myquery(query, [dbhID, sshhID, projID]);

			}
		}else{ // projectDB exist
			let newflag = ( pack.db_type == 'localhost' ) ? 0 : 1;
			let flag = projectDB[0].flag;

			if( flag != newflag ){// new flag
				let upd_query = "UPDATE projectDB SET flag = ? WHERE projectID = ?";
				let result = await myquery(upd_query, [newflag, projID]);
					console.log('update flag');
					console.log(result);
			}

			if(flag){ // ssh host
				// ...
			}else{ // local db host 
				let dbhID = projectDB[0].dbhID;
				let dbh_query = "SELECT * FROM dbhost WHERE id = ?";
				let dbh = await myquery(dbh_query, [dbhID]);
				console.log(dbh);
				let host = pack.db_adr,
					port = pack.db_port,
					user = pack.db_usr,
					password = pack.db_pass,
					name = pack.db_name;

				if( dbh[0].host != host ){
					let upd_query = "UPDATE dbhost SET host = ? WHERE id = ?";
					let result = await myquery(upd_query, [host, dbhID]);
					console.log('update host');
					console.log(result);
				}
				if( dbh[0].port != port ){
					if(port){ // some port
						let upd_query = "UPDATE dbhost SET port = ? WHERE id = ?";
						let result = await myquery(upd_query, [port, dbhID]);
						console.log('update port');
						console.log(result);
					}else{ // no port ''
						if(dbh[0].port){ // if there was some port, and now there is no port
							let upd_query = "UPDATE dbhost SET port = ? WHERE id = ?";
							let result = await myquery(upd_query, [null, dbhID]);
							console.log('update port');
							console.log(result);
						}else{ // there was no port, so it will remain stay null
							console.log('dbh[0].port');
							console.log(dbh[0].port);
						}
					}
				}
				console.log(-7);
				if( dbh[0].user != user ){
					let upd_query = "UPDATE dbhost SET user = ? WHERE id = ?";
					let result = await myquery(upd_query, [user, dbhID]);
					console.log('update user');
					console.log(result);
				}
				console.log(-8);
				if( dbh[0].password != password ){
					let upd_query = "UPDATE dbhost SET password = ? WHERE id = ?";
					let result = await myquery(upd_query, [password, dbhID]);
					console.log('update password');
					console.log(result);
				}
				console.log(-9);
				if( dbh[0].name != name ){
					let upd_query = "UPDATE dbhost SET name = ? WHERE id = ?";
					let result = await myquery(upd_query, [name, dbhID]);
					console.log('update name');
					console.log(result);
				}
			}
		}

		if(callback)
			await callback();
		return ;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
/////////////////////////////////////////////

module.exports.selectProjects = async (callback) => {
	try {
		let query = "SELECT * FROM project";
		let result = await myquery(query, []);

		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
/////////////////////////////////////////////

module.exports.selectProjectsRelation = async (callback) => {
	try {
		let result = [];
		let query = "SELECT * FROM project";
		let projects = await myquery(query, []);
		for(var i=0; i<projects.length; i++){
			let project = {};
			project.id = projects[i].id;
			project.name = projects[i].name;
			project.tags = {assoc:[], stop:[]};

			let query2 	= "SELECT count(*) FROM relationProjectObject WHERE projectID = ?";
			let size = await myquery(query2, [ projects[i].id ] );
			project.size = size[0]['count(*)'];

			let query3 	= "SELECT t.name, r.tagID, r.type FROM relationTagProject r, tag t WHERE projectID = ? AND t.id = r.tagID";
			let tags = await myquery(query3, [ projects[i].id ] );
			for(var j=0; j<tags.length; j++){
				switch(tags[j].type){
					case "negative":
						await project.tags.stop.push(tags[j].name);
						break;
					case "positive":
						await project.tags.assoc.push(tags[j].name);
						break;
					case "hidden":
						//do nothing
						break;
					case "categories":
						//do nothing
						break;
					default:
						throw Error("-[!]- Bad relationTagProject type");
				}
				// if( tags[j].type == 'negative' ){
				// 	await project.tags.stop.push(tags[j].name);
				// }else if( tags[j].type == 'positive' ){
				// 	await project.tags.assoc.push(tags[j].name);
				// }
			}
			await result.push(project);
		}

		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
/////////////////////////////////////////////
module.exports.selectTags = async (callback) => {
	try {
		let query = "SELECT * FROM tag order by name";
		let result = await myquery(query, []);

		if(callback)
			await callback(result);
		return result;
	} catch (e) {
		console.log(e);
		return 0;
	}
}
module.exports.importLibrary = async ( json ,callback ) => {
	try{
		console.log(json);

		let query = "SELECT * FROM libraryKey WHERE name = ? ";
		let query2 = "SELECT * FROM libraryValue WHERE id = ? ";
		let query3 = "SELECT * FROM libraryRelation WHERE keyID = ?";
		let query4 = "INSERT INTO libraryKey(`name`) VALUES (?)";
		let query5 = "INSERT INTO libraryValue(`value`) VALUES (?)";
		let query6 = "INSERT INTO libraryRelation(`keyID`, `valueID`) VALUES (?,?)";
		for ( key in json ) {
			console.log('-key');
			console.log(key);

			let keyResult = await myquery(query, [ key ]);
			console.log('-keyResult');
			console.log(keyResult);
			// let keyId;
			if( keyResult.length == 0 ){
				let keyResult2 = await myquery(query4, [ key ]);
				keyId = keyResult2.insertId;
			}else{
				keyId = keyResult[0].id;
			}
			console.log('-keyId');
			console.log(keyId);

			let values = json[key];
			console.log('-values');
			console.log(values);
			for(var i=0;i<values.length;i++){
				console.log('[0] iteration: '+i);
				let value = values[i];
				console.log(' =value');
				console.log(value);
				let relationResult = await myquery(query3, [keyId]);
				// let valueId;
				console.log(' =relationResult');
				console.log(relationResult);
				if( relationResult.length == 0 ){
					console.log('[1] relationResult.length == 0');
					let valueResult = await myquery(query5, [value]);
					console.log(' =valueResult');
					console.log(valueResult);
					let valueId = valueResult.insertId;
					console.log(' =valueId');
					console.log(valueId);
					await myquery(query6, [keyId, valueId]);
				}else{
					console.log('[2] relationResult.length != 0');
					var flag = true;
					for(var j=0;j<relationResult.length; j++){
						if(!flag){
							console.log('[2.4] !flag ');
							continue;
						} 
						let tmpId = relationResult[j].valueID;
						let relationValueResult = await myquery(query2, [ tmpId ]);
						if( relationValueResult.length == 0 ){
							console.log('[2.1] relationValueResult.length != 0');
							continue;
						}else if( relationValueResult[0].value == value ){
							console.log('[2.2] relationValueResult[0].value == value');
							console.log(' =relationValueResult[0].value');
							console.log(relationValueResult[0].value);
							flag = false;
							// break;
						}else{
							console.log('[2.3] relationValueResult[0].value != value');
							continue;
						}
					}
					if(flag){
						console.log('[2.5] flag ');
						let valueResult = await myquery(query5, [value]);
						console.log(' =valueResult');
						console.log(valueResult);
						let valueId = valueResult.insertId;
						await myquery(query6, [keyId, valueId]);
					}
				}
				// await myquery(query6, [keyId, valueId]);
				// let keyResult = await myquery(query2, [ value ]);
				// ... no need 2 check 4 the value

			}
		}
		let result = 'finished'; 
		if(callback)
			await callback(result);
		return result;
	}catch(e){
		console.log(e);
		return 0;
	}
}
module.exports.importTemplate = async ( name, json ,callback ) => {
	try {
		let tmpl_name;
		let check_query = " SELECT * FROM tmpl WHERE title = ? ";
		let tmpl_search_result = await myquery(check_query, [name]);

		if( !tmpl_search_result.length == 0 ){
			let i = 1;
			while(true){
				let tmp_name = `${name}(${i})`;
				let name_search_result = await myquery(check_query, [ tmp_name ]);
				if( name_search_result.length == 0 ){
					tmpl_name = tmp_name;
					break;
				}else{
					i++;
				}
			}	
		}else{
			tmpl_name = name;
		}

		let tmpl_query = "INSERT INTO tmpl(`title`) VALUES(?)";
		let tmpl_result = await myquery(tmpl_query, [ tmpl_name ]);
		let tmpl_id = tmpl_result.insertId;

		let key_query = "INSERT INTO tmplKey(`keyword`) VALUES (?)";
		let val_query = "INSERT INTO tmplValue(`value`, keyID) VALUES (?, ?)";
		let rel_query = "INSERT INTO tmplRelation(`tmplID`, `keyID`) VALUES (?,?)";
		// let cond_query = "INSERT INTO tmplCondition(`tagID`, `positive`, `relationID`) VALUES (?,?,?)";
		
		for ( key in json ) {
			let key_result = await myquery(key_query, [ key ]);
			let key_id = key_result.insertId;

			let rel_result = await myquery(rel_query, [ 
				tmpl_id,
				key_id,
				// val_id
			]);
			let values = json[key];
			for(var i=0;i<values.length;i++){
				let val_result = await myquery(val_query, [ values[i], key_id ]);
				let val_id = val_result.insertId;

				// let rel_id = rel_result.insertId;

				// ...point
				// tmpl key-value relation conditions
				// ...

				// let state = tag.state ? true : false;
				// let rel_result = await myquery(rel_query, [ tagID, state, rel_id ]);
			}
		}

		let result = `template ${tmpl_name} imported`; 
		if(callback)
			await callback(result);
		return result;
	} catch (e) {
		console.log(e);
		return 0;
	}
}
// module.exports.importTemplate = async ( name, json ,callback ) => {
// 	try {
// 		let tmpl_name;
// 		let query = " SELECT * FROM template WHERE name = ? ";
// 		let tmpl_search_result = await myquery(query, [name]);

// 		if( !tmpl_search_result.length == 0 ){
// 			let i = 1;
// 			while(true){
// 				let tmp_name = `${name}(${i})`;
// 				let name_search_result = await myquery(query, [ tmp_name ]);
// 				if( name_search_result.length == 0 ){
// 					tmpl_name = tmp_name;
// 					break;
// 				}else{
// 					i++;
// 				}
// 			}	
// 		}else{
// 			tmpl_name = name;
// 		}

// 		let query2 = "INSERT INTO template(`name`) VALUES(?)";
// 		let tmpl_result = await myquery(query2, [ tmpl_name ]);
// 		let tmpl_id = tmpl_result.insertId;

// 		let query3 = "INSERT INTO templateKey(`keyword`, `val`, `tmplID`) VALUES (?,?,?)";
// 		for ( key in json ) {
// 			let values = json[key];
// 			for(var i=0;i<values.length;i++){
// 				await myquery(query3, [ key, values[i], tmpl_id ]);
// 			}
// 		}
// 		let result = `template ${tmpl_name} imported`; 
// 		if(callback)
// 			await callback(result);
// 		return result;
// 	} catch (e) {
// 		console.log(e);
// 		return 0;
// 	}
// }
module.exports.selectTmpls = async (callback) => {
	try {
		let query = "SELECT * FROM tmpl";
		let result = await myquery(query, []);

		if(callback)
			await callback(result);
		return result;
	} catch (e) {
		console.log(e);
		return 0;
	}
}
module.exports.selectTmpl = async (tmplID, callback) => {
	try {
		let query = "SELECT * FROM tmpl WHERE id = ?";
		let result = await myquery(query, [tmplID]);

		if(callback)
			await callback(result);
		return result;
	} catch (e) {
		console.log(e);
		return 0;
	}
}
/////////////////////////////////////////////
module.exports.selectNullTags = async (callback) => {
	try {
		// let query = "SELECT * FROM tag WHERE flag is null";

		let query = ""
			+ " select r.id, r.name, r.flag, res.syns"
			+ " from tag r"
			+ " left join"
			+ " ("
			+ " 	SELECT flag, count(*) as syns"
			+ " 	FROM tag r2"
			+ " 	group by flag"
			+ " ) as res on r.flag = res.flag "
			+ " where res.syns < 2 OR r.flag is null "
			+ " order by name";
		let result = await myquery(query, []);

		if(callback)
			await callback(result);
		return result;
	} catch (e) {
		console.log(e);
		return 0;
	}
}
/////////////////////////////////////////////
module.exports.selectTagsEx = async (callback) => {
	try {
		// let query = ""
		// 	+ " select r.id, r.name, r.flag, res.size"
		// 	+ " from tag r"
		// 	+ " left join"
		// 	+ " ("
		// 	+ " 	SELECT flag, count(*) as size"
		// 	+ " 	FROM tag r2"
		// 	+ " 	group by flag"
		// 	+ " ) as res on r.flag = res.flag "
		// 	+ " order by id";
		let query = ""
			+ " select r.id, r.name, r.flag, res.syns "
			// + " ,res2.tmpls"
			+ " from tag r"
			+ " left join"
			+ " ("
			+ " 	SELECT flag, count(*) as syns"
			+ " 	FROM tag"
			+ " 	group by flag"
			+ " ) as res on r.flag = res.flag" 
			// + " left join"
			// + " ("
			// + " 	SELECT flag, count(*) as tmpls"
			// + " 	FROM replecon.tagTemplates"
			// + " 	group by flag"
			// + " ) as res2 on r.flag = res2.flag "
			+ " order by name";
		let result = await myquery(query, []);

		if(callback)
			await callback(result);
		return result;
	} catch (e) {
		console.log(e);
		return 0;
	}
}
// module.exports.saveObject = async (data, callback)=>{
// 	console.log(' - objectCreate');

// 	let query = 'INSERT INTO object (`title`,`description`,`originID`) VALUES (?,?,?)';
// 	let result = await myquery(query, [ data.title, data.description, data.original_id] ); // !

// 	let query2 = 'INSERT INTO relationProjectObject (`projectID`, `objectID`) VALUES (?, ?);';
// 	await myquery(query2, [ data.project_id, result.insertId ] ); // !

// 	console.log(' = objectCreate result f()');
// 	console.log(result);
// 	await callback(result[0]);
// 	return result[0];
// }
/////////////////////////////////////////////
// module.exports.selectRandomOriginal = async (projectID, callback) => {
// 	const connection 	= await ASYNSQL(); // !
// 	try {
// 		let positiveArr = [];
// 		let negetiveArr = [];
// 		await selectProjectTags(connection, projectID, async (result) => {
// 			console.log(result);
// 			for(var i=0; i < result.length; i++){
// 				if(result[i].positive == 0){
// 					await negetiveArr.push(result[i].tagID);
// 				}else{
// 					await positiveArr.push(result[i].tagID);
// 				}
// 			}
// 		});
// 		console.log(positiveArr);
// 		console.log(negetiveArr);

// 		let originalID = await findOriginal(connection, {positive:positiveArr, negetive:negetiveArr});
// 		await selectOriginal(connection, originalID, async (result) => {
// 			await selectOriginalTags(connection, originalID, async (tags) => {
// 				console.log(tags);
// 				console.log(result);
// 				result.tags = tags;

// 				var obj = JSON.parse(fs.readFileSync('./modules/template2.json', 'utf8'));
// 				result.description = await templateParse( obj['start'], obj );

// 				await callback(result);
// 			})
// 		});
// 	} catch (e) {
// 		console.log(e);
// 		return 0;
// 	}
// };
async function selectOriginal(connection, originalID, callback){
	try {
		let query = 'SELECT * FROM original WHERE id = ?';
		let fields = await connection.execute( query, [originalID] ); // !
		let result = fields[0][0];

		console.log('/__T_H_E_P_L_A_C_E__');
		// console.log(result);
		// await spinText(result.title, async (title)=>{
		// 	console.log(title);
		// 	result.title = title;
		// 	await spinText(result.description, async (description)=>{
		// 		console.log(description);
		// 		result.description = description;
		// 		await callback(result);
		// 		return result;
		// 	});
		// });
		console.log('\\__T_H_E_P_L_A_C_E__');
		await callback(result);
	} catch (e) {
		console.log(e);
		return 0;
	}
}
async function selectProjectTags(connection, projectID, callback){
	try {
		var tags = [];
		console.log(" < selectProjectTags > ");
		let query = 'SELECT r.tagID, r.type, t.flag, t.name FROM relationTagProject r, tag t WHERE projectID = ? AND t.id = r.tagID';
		let fields = await connection.execute( query, [projectID] ); // !

		let results = fields[0].filter(e => e.type == "positive" || e.type == "negative");
		
		console.log("---------results 1");
		console.log(results);

		query = " select id as tagID, name"
			+	" from tag"
			+	" where flag = "
			+	" ("
			+	" 	select flag"
			+	" 	from tag"
			+	" 	where id = ?"
			+	" )"
			+	" and id not in (?)";
		for(var i=0; i<results.length; i++){
			let _copy = tags.filter(e => e.tagID == results[i].tagID);
			console.log("---------copy 1 | "+results[i].tagID);
			console.log(_copy);
			if( _copy.length != 0 ) continue;

			if( results[i].type == "positive" )
				results[i].positive = 1;
			else 
				results[i].positive = 0;

			await tags.push(results[i]); // PUSH

			if( results[i].flag != null ){
				let id = results[i].tagID;
				let more_result = await myquery(query, [id,id]);
				for(var j=0; j<more_result.length; j++){
					let copy = tags.filter(e => e.tagID == more_result[j].tagID);
					console.log("---------copy 2 | "+more_result[j].tagID);
					console.log(copy);

					if( copy.length == 0 ) {
						more_result[j].type = results[i].type;
						more_result[j].positive = results[i].positive;
						await tags.push(more_result[j]); // PUSH
					}
				}
			}
		}
		console.log("---------tags");
		console.log(tags);

		await callback(tags);
	} catch (e) {
		console.log(e);
		return 0;
	}
}
async function selectOriginalTags(connection, originalID, callback){
	try {
		let query = 'SELECT t.name, r.tagID FROM relationTagOriginal r, tag t  WHERE t.id = r.tagID AND r.originalID = ?';
		let fields = await connection.execute( query, [originalID] ); // !
		let results = fields[0];

		// console.log(results);
		if(callback)
			await callback(results);
		return results;
	} catch (e) {
		console.log(e);
		return 0;
	}
}
async function findOriginal(connection, tagIDs){
	try {
		let query = " SELECT originalID " +
					" FROM relationTagOriginal ";
		if(tagIDs.positive.length > 0){
			for(var j=0; j<tagIDs.positive.length; j++){
				if(j==0)
					query += " WHERE tagID = " + tagIDs.positive[j];
				else
					query += " OR tagID = " + tagIDs.positive[j];
			}
		}
		if(tagIDs.negetive.length > 0){
			query += " AND originalID not in " +
					" ( " +
					" SELECT originalID " +
					" FROM relationTagOriginal ";
			for(var j=0; j<tagIDs.negetive.length; j++){
				if(j==0)
					query += " WHERE tagID = " + tagIDs.negetive[j];
				else
					query += " OR tagID = " + tagIDs.negetive[j];
			}
			query += " ) ";
		}
		// query += " ORDER BY RAND() LIMIT 1 ";
		console.log(query);

		let fields = await connection.execute( query ); // !
		let result = fields[0];

		console.log(result);
		console.log(result.originalID);
		return result.originalID;
		// await callback(results);
	} catch (e) {
		console.log(e);
		return -1;
	}
}
/////////////////////////////////////////////
async function spinText(text, callback){ // !
	try {
		var pyshell = await new PythonShell('spinner.py'); // !
		var result;
		console.log('<<'+text);
		await pyshell.send(text); // !
		
		console.log(0);
		await pyshell.on('message', function (msg) { // !
			console.log('> text: ' + msg);
			result = msg;
		});

		console.log(1);
		await pyshell.end(function (err) { // !
			if (err) throw err;
			console.log('> spinner done his do');
			callback(result);	
		});

		console.log(2);
		// if(callback)
		// 		callback(msg);
		// return msg;
	} catch (e) {
		console.log(e);
		return 0;
	}
}
/////////////////////////////////////////////
module.exports.getJsons = async function(callback){
	try {
		let query = "SELECT * FROM jsonFiles";
		let result = await myquery( query, [] );

		console.log(result);
		if(callback)
			await callback(result);
		return result;
	} catch (e) {
		console.log(e);
		return 0;
	}
}
/////////////////////////////////////////////
module.exports.getJson = async function(id, callback){
	try {
		await getJsonName(id, async (obj)=>{
			fs.readFile('./json/'+obj[0].name, async (err, data) => {  
		    	if (err) throw err;

    			if(callback)
					await callback( JSON.parse(data) );
			});
		});

	} catch (e) {
		console.log(e);
		return 0;
	}
}
/////////////////////////////////////////////
async function getJsonName(id, callback){
	try {
		let query = "SELECT name FROM jsonFiles WHERE id = ?";
		let result = await myquery( query, [id] );

		console.log(result);
		if(callback)
			await callback(result);
		return result;
	} catch (e) {
		console.log(e);
		return 0;
	}
}
/////////////////////////////////////////////
async function saveJson(name,date,size,callback){
	try {
		let query = "INSERT INTO jsonFiles (`name`,`date`,`size`) VALUES (?,?,?)";
		let result = await myquery( query, [name,date,size] );

		console.log(result);
		if(callback)
			await callback(result);
		return result;
	} catch (e) {
		console.log(e);
		return 0;
	}
}
/////////////////////////////////////////////
module.exports.saveJson = async function(json, name, callback){
	try {
		let length = json.length;
		let data = JSON.stringify(json);  
		var date = new Date();
		var _name = "./json/"+name;

		await fs.writeFileSync(_name, data); 
		await saveJson(name,date,length);

		console.log(' Json Saaved ! ');
		if(callback)
			await callback();
	} catch (e) {
		console.log(e);
	}
}
/////////////////////////////////////////////
module.exports.importJson = async function(json, callback){ // !
	// var connection 	= await ASYNSQL(); // !
	try {
		// console.log(json.length);
		var connection 		= await POOLCON();
		for (var iter=0; iter<json.length; iter++) {
			
			await new Promise( async(res, rej)=>{

				let item = json[iter];
				console.log(" - - - - - - - - - - - - JSON ");
				console.log(" -[ "+iter+" ] - - - - - JSON ");
				console.log(" - - - - - - - - - - - - JSON ");
					let bool = await uniqItem(connection,item);
					if( bool ){
						await magic(connection,item)
							.then(async function(ids){
								console.log('------------- ids >');
								console.log(ids);
								await originalRelation(connection,ids);
							})
						return res( connection );
					}else return res( connection );

			})

			// let item = json[iter];
			// console.log(" - - - - - - - - - - - - JSON ");
			// console.log(" -[ "+iter+" ] - - - - - JSON ");
			// console.log(" - - - - - - - - - - - - JSON ");
			// 	if(await uniqItem(connection,item)){
			// 		( magic(connection,item) )
			// 			.then(function(ids){
			// 				console.log('-------------ids');
			// 				console.log(ids);
			// 				originalRelation(connection,ids);
			// 			})
			// 			.then(function(){
			// 				connection.end();
			// 			});
			// 	}


					// let ids = await magic(connection,item); // !
					// console.log(ids);
					// await originalRelation(connection,ids); // !

		// await connection.end();

		}
		console.log(' Json Loaded ! ');
		connection.end();
		console.log('x x x x x x x - connection.end');

		// await connection.end();
		if(callback)
			await callback();
	} catch (e) {
		console.log(e);
	}
};
async function uniqItem(connection, item){
	try{
		console.log(' - uniqItem');
		let query 	= "SELECT * FROM original WHERE `video` = ?";

		let result = await connection.query(query, [item.video] ); // !

		console.log(result[0]);
		console.log(' = uniqItem');
		return result[0].length ? false : true;
	}catch(e){
		console.log(" { originalCreate ERROR } ")
		console.log(e);
	}
}
async function tagInsert(connection, tag){ // !
	try{
		console.log(' - tagInsert');
		let query 	= "INSERT INTO tag (`name`) VALUES (?)";
		let result = await connection.query(query, [tag] ); // !

		console.log(' = tagInsert result f()');
		console.log({result: result});
		return result[0];
	}catch(e){
		console.log(" { originalCreate ERROR } ")
		console.log(e);
	}
}
async function tagSearch(connection, tag){ // !
	try{
		console.log(' - tagSearch');
		let query = 'SELECT * FROM tag WHERE `name` = ?';
		let [rows, fields] = await connection.query(query, [tag] ); // !

		console.log(' = tagSearch result f()');
		console.log({rows: rows, fields: fields});
		return {rows: rows, fields: fields};
	}catch(e){
		console.log(" { originalCreate ERROR } ")
		console.log(e);
	}
}
async function originalCreate(connection, item){ // !
	try{
		console.log(' - originalCreate');
		console.log(item);

		let query = 'INSERT INTO original (`title`,`link`,`video`,`description`) VALUES (?,?,?,?)';
		let result = await connection.query(query, [ item.title, item.href, item.video, item.desc] ); // !

		console.log(' = originalCreate result f()');
		console.log(result);
		return result[0];
	}catch(e){
		console.log(" { originalCreate ERROR } ")
		console.log(e);
	}
}
async function originalRelation(connection, ids){
	try{
		console.log(' - originalRelation');

		let query = 'INSERT INTO relationTagOriginal (`tagID`,`originalID`) VALUES (?,?)';
		for(let i=0; i<ids.tags.length; i++){
			let [row] = await connection.query( query, [ ids.tags[i], ids.original] );
			console.log(' = originalRelation result f()');
			console.log(row);
		}
		return;
	}catch(e){
		console.log(" { originalCreate ERROR } ")
		console.log(e);
	}
}
async function tagInit(connection, tag){
	try{
		console.log(' - tagInit');
		console.log(tag);

		// let id = -1;
		let result = await tagSearch(connection, tag); // !

		if(result.rows.length != 0){
			console.log('old tag');
			return result.rows[0].id;
		}else{
			console.log('new tag');
			var tmp = await tagInsert(connection, tag); // !
			console.log(tmp);
			return  tmp.insertId;
		}
	}catch(e){
		console.log(" { originalCreate ERROR } ")
		console.log(e);
	}
}
async function tagsParse(connection, tags){
	try{
		console.log(' - tagsParse');
		console.log(tags);
		
		tags = arrayLowerCase(tags);
		tags = arrayUniq(tags);
		
		let tagIds = [];
		await Promise.all(tags.map( async (tag) => {  // !

			var id = await tagInit(connection,tag);

			console.log('tag id: '+id);

			if( !tagIds.includes(id) )
				await tagIds.push( id );
			
			console.log('tags id:');
			console.log(tagIds);
		}));
		return tagIds;
	}catch(e){
		console.log(" { originalCreate ERROR } ")
		console.log(e);
	}
}
async function magic(connection, item){
	try{
		let ids = {};
		let tags;
		console.log(item.tags);
		if( typeof item.tags == "string" )
			tags = item.tags.split(/,/g);
		else if( Array.isArray(item.tags) )
			tags = item.tags;
		else console.log("wrong type of tags");

		if( item.href ) tags.push( item.href );

		ids.tags = await tagsParse(connection, tags);

		original = await originalCreate(connection, item); // !
		console.log( 'original id: ' + original.insertId );
		ids.original = original.insertId;

		// return ids;
		return Promise.resolve(ids)
	}catch(e){
		console.log(" { originalCreate ERROR } ")
		console.log(e);
	}
}
// function libraryKeyParse(e, lib){
// 	var regexp = /\[\w*\]/ig;

// 	if ( Array.isArray(e) ){
// 		return libraryKeyParse( rand(e), lib);
// 	}
// 	else{
// 		if( /\[\w*\]/i.test(e) ){
// 			var result = '';
// 			var last_pos = 0;
// 			while ( foo = regexp.exec(e)) {
// 				result += e.substring(last_pos,foo.index);
				
// 				var ind = foo[0].replace(/[\[\]]*/g,'');
// 				result += libraryKeyParse( lib[ind], lib );
// 				last_pos = regexp.lastIndex;
// 			}
// 			result += e.substring(last_pos,e.length);
// 			return result;
// 		}else{
// 			return e;
// 		}
// 	}
// }
// function templateParse(e, obj){
// 	var regexp = /<\w*>/ig;

// 	if ( Array.isArray(e) ){
// 		return templateParse( rand(e), obj );
// 	}
// 	else{
// 		if( /<\w*>/i.test(e) ){
// 			var result = '';
// 			var last_pos = 0;
// 			while ( foo = regexp.exec(e)) {
// 				result += e.substring(last_pos,foo.index);
				
// 				var ind = foo[0].replace(/[<>]*/g,'');
// 				result += templateParse( obj[ind], obj );
// 				last_pos = regexp.lastIndex;
// 			}
// 			result += e.substring(last_pos,e.length);
// 			return result;
// 		}else{
// 			return e;
// 		}
// 	}
// }
/////////////////////////////////////////////
// module.exports.sqlPush = (query, callback) => {
// 	var connection 		= new MYSQL();
// 	connection.query(query, (error, result) => {
// 		if (error) {
// 			console.error('query error: ' + err.stack);
// 			return;
// 		}
// 		console.log("Data pushed in 2 DB");
// 		callback();
// 	});
// 	connection.end();
// }
/////////////////////////////////////////////
// module.exports.sqlPull = (query, callback) => {
// 	var connection 		= new MYSQL();
// 	connection.query(query, (error, results, fields) => {
// 		if (error) {
// 			console.error('query error: ' + error.stack);
// 			return;
// 		}
// 		var response = JSON.stringify(results);
//         var json =  JSON.parse(response);
// 		console.log("Data pulled from DB");
// 		callback(json);
// 	});
// 	connection.end();
// }
/////////////////////////////////////////////
// module.exports.saveJson = function(filename, obj){
    // $file = 'form2.txt';

    // $postdata = file_get_contents("php://input");
    // $data = json_decode($postdata, true);


    // $data_insert = "Name: " . $data['firstname'] .
    //         ", Email: " . $data['emailaddress'] . 
    //         ", Description: " . $data['textareacontent'] . 
    //         ", Gender: " . $data['gender'] . 
    //         ", Is a member: " . $data['member'];


    // //print $data_insert;

    // file_put_contents($file, $data_insert, FILE_APPEND | LOCK_EX);
// };

// module.exports.sqlPush = (query, callback) => {
// 	var connection 	= new sqlConnection({});
// 	connection.connect(function(err) {
// 		if (err) {
// 			console.error('error connecting: ' + err.stack);
// 			return;
// 		}
// 	});
// 	var connection 		= new SQL();
// 	connection.query(query, (error, result) => {
// 		if (error) {
// 			console.error('query error: ' + err.stack);
// 			return;
// 		}
// 		console.log("Data pushed in 2 DB");
// 		callback();
// 	});
// 	connection.end();
// };

// module.exports.loadJson = function(json, callback){
// 	var pool 	= new sqlPool({});

// 	pool.getConnection(function(err, connection){
//         if (err) {
//           console.log({"code" : 100, "status" : "Error in connection database"});
//           return;
//         }

//         console.log('connected as id ' + connection.threadId);
//         var item = json[0]; 
// 		// json.forEach( (item, i, json) => {
// 			var tags = item.tags.split(',');
// 			// var tags = item.tags;
// 			// console.log(tags);

// 			var tag = tags[0];
// 			// tags.forEach( (tag, j, tags) => {

// 				var search_query = 'SELECT * FROM replecon.tag WHERE ?';
// 				var id = -1;
// 				connection.query(search_query,{name: tag}, (error, results, fields) => {
// 					if (error) {
// 						console.log( error ); 
// 						// return;
// 						return connection.release();
// 					}
// 					else {
// // ---------------------------------------------------------------
// 						if(results.length > 0){
// 							console.log('old');
// 							console.log(results[0].id); 
// 						}else{
// 							console.log('new');
// 							var query 	= "INSERT INTO tag SET ?";
// 							connection.query(query,{name: tag},(error, results, fields)=>{
// 								return connection.release();
// 								if (error) {
// 									console.log( error ); 
// 									return;
// 								}
// 								console.log(results[0].id); 
// 								console.log(results); 
// 							});
// 						}
// // ---------------------------------------------------------------
// 						// console.log(results);
// 						// console.log(results.length);
// 						// console.log(results[0]);
// 						// var row = results[0].user_id
// 					}
// 				});
// 				console.log(id);
// 			// });

// 			// break;

// 			var query 	= "INSERT INTO original SET ?";
// 			var table_data =  { title: item.title,
// 								link: item.href,
// 								video: item.video,
// 								description: item.desc};

// 			// console.log("[ "+table_data.title+" ]");

// 			// connection.query(query, table_data, (error, results, fields) => {
// 			// 	// pool.on('release', function (connection) {
// 			// 	// 	console.log('Connection %d released', connection.threadId);
// 			// 	// });
// 			// 	// connection.release();
// 			// 	// Handle error after the release.
// 			// 	if (error) 
// 			// 		console.log( error ); 
// 			// 	else 
// 			// 		console.log("[ "+table_data.title+" ]: "+results.insertId );
// 			// });
// 		// });
// 		pool.end();
// 		callback();
//     });

// };
/////////////////////////////////////////////
// module.exports.newQuery = async function(params, callback){ // !
// 	try {
// 		const mysqlssh = require('mysql-ssh');
// 		const fs = require('fs');
// 		const mysql = require('mysql2/promise');
// 		const connection = await mysql.createConnection({
// 			host     : params.host,
// 			user     : params.user,
// 			password : params.password,
// 			database : params.name
// 		    ,multipleStatements: true
// 		    ,waitForConnections : true
// 		    ,debug    :  false
// 		    ,wait_timeout : 28800
// 		});
// 		if(!params.arguments) params.arguments = [];
// 		let result = await connection.execute( params.query, params.arguments, (err, results, fields) => {
// 		    console.log(results); // results contains rows returned by server
// 		    console.log(fields); // fields contains extra meta data about results, if available
// 	  	}); // !
// 		console.log(result);
// 		console.log(" - DonE >");
// 		await connection.end();

// 		await  callback( result ); // !
// 		return result;
// 	} catch (e) {
// 		console.log(e);
// 		return 0;
// 	}
// }