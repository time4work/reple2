const ASYNSQL 	= require('../helper/mysql').asynccon;
const fs = require('fs');


let JsonImportProgress = false;
let JsonImportId = -1;

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

async function getJsons (callback){
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

async function importJson (json, callback){ // !
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
}

async function saveJson1(name,date,size,callback){
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

async function saveJson (json, name, callback){
	try {
		let length = json.length;
		let data = JSON.stringify(json);  
		var date = new Date();
		var _name = "./json/"+name;

		await fs.writeFileSync(_name, data); 
		await saveJson1(name,date,length);

		console.log(' Json Saaved ! ');
		if(callback)
			await callback();
	} catch (e) {
		console.log(e);
	}
}

module.exports = {

    getPage: async (request, response) => {
		await getJsons(async files => {
            response.render('pages/json',{
                scope:{
                    jsons: files
                }
            });
		});
    },
    
	postJson: async (request, response) => {
		switch (request.body.type) {
			case "json.file.download":
				const jsonId = request.body.id;

				await getJson(jsonId, async obj => {
					if (obj) {
						response.send({ resp: obj });
					} else response.send({ err: "bad obj id" });
				});
				break;
			case "json.file.save":
				const obj = await JSON.parse(request.body.data);
				const name = request.body.name;
				await saveJson(obj, name, async () => {
					response.send({ resp: 'json loaded' });
				});
				break;
			case "json.file.import":
				if (!JsonImportProgress) { // TODO: via service
					const jsonId = request.body.id;
					await getJson(jsonId, async (obj, file_name) => {
						JsonImportProgress = true;
						JsonImportId = jsonId;

						response.send({ resp: 'import started', id: JsonImportId });
						
						await importJson(obj, file_name, async (result) => {
							JsonImportProgress = false;
							JsonImportId = -1;
						});
					});
				} else {
					response.send({resp: 'process busy', id:JsonImportId});
				}

				break;
			case "json.import.process.check":
				if (!JsonImportProgress) {
					response.send({ resp: {'id': -1} });
				} else {
					response.send({ resp: {'id': JsonImportId} });
				}
				break;
			case "json.file.del":
				break;
			default:
				console.log(" O O O P S . . . ");
                response.send({err:'o o o p s'});
		}
    },

}