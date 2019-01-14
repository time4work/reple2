/////////////////////////////////////////////
// const url 			= require('url');
const querystring 	= require('querystring');
const path 			= require('path');
const http 			= require('http');
const express 		= require('express');
const favicon 		= require('serve-favicon');
const expressLogging= require('express-logging');
const logger 		= require('logops');
const bodyParser 	= require('body-parser');
const helpers 		= require('./helpers');
const thumbManager 	= require('./thumb-maker');
const cookieSession = require('cookie-session');
const socketIo		= require('socket.io');
/////////////////////////////////////////////
const punctREGEX = /[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-.\/:;<=>?@\[\]^`{|}~]/g;
const punctREGEX2 = /[\u2000-\u206F\u2E00-\u2E7F\\"\\/<>\[\]^`{|}]/g;
var JsonImportProgress = false;
var JsonImportId = -1;
var GeneratorProgress = false;
var ExportProgress = false;
/////////////////////////////////////////////
module.exports = function(params){
	const dir 		= params.rootdir;
	const port 		= process.env.port || 5000;
	const app 		= express();
    const server 	= http.createServer(app);
	const io 		= socketIo(server);
	io.on('connection', function(client){ // client = socket
		console.log('client connect');
		client.on('event', function(data){
			console.log('client event');
		});
		client.on('disconnect', function(){
			console.log('client disconnect');
			// do nothing
		});
		client.on('reply', function(data){
			console.log('client reply');
        	console.log(data);
		}); // listen to the event
	    client.on('join', function(data) {
			console.log('client join');
        	console.log(data);
    	});
	});
/////////////////////////////////////////////
	const TM = new thumbManager(io);
	// const TM = new thumbManager('./screens/');
/////////////////////////////////////////////
	app.set('port', (process.env.PORT || port) );
	app.set('views', dir + '/views');
	app.set('view engine', 'ejs');
	app.set('env', 'development');
	app.use( expressLogging(logger)) ;
	app.use( express.static(dir + '/public') );
	app.use( bodyParser.json({limit: '50mb'}) );
	app.use( bodyParser.urlencoded({ extended: false,limit: '50mb', parameterLimit:50000 }) );
	app.use( favicon('public/favicon.ico'));
	app.use( cookieSession({
		name: 'session',
		// secret: '2abh1y235kiu.bvcew32def',
		keys: ['pass', 'test'],
		maxAge: 24 * 60 * 60 * 1000 // 24h
	}));
	app.use( (request, response, next) => {
		var ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
		console.log('________');
		console.log('Client IP:', ip);
		console.log(request.method);
		console.log(request.url);
		console.log(request.body);
		console.log(request.session);
		if(request.url == '/login') next();
		else{
			request.session.test ='test';

			if(request.session.pass == '2abh1y235kiu.bvcew32def'){
				next();
			}else{
				response.redirect('/login');
			}
		}

	});	

	app.get('/login', (request, response) => { 
		response.render('pages/login',{});
	}); 
	app.post('/login', (request, response) => { 
		let login = request.body.login;
		let password = request.body.password;

		if(login == "root" && password == "morehyip"){
			request.session.pass = '2abh1y235kiu.bvcew32def';
			response.send({redirect:'/'});
		}else response.send({error:'wrong login or password'})
	}); 

	app.get('/', (request, response) => { 
		response.render('pages/index',{title : 'Happy ejs' });
	}); 
	app.post('/', async (request, response) => { 
		switch(request.body.type){
			case "scraper":
				let page = request.body.page;
				await helpers.pageScraper(page, async (info)=>{
					response.send(info);
				});
				break;
			default:
				console.log(2);
				response.send({err: "switch type err"});
		}		
	}); 

	app.get('/projects', async (request, response) => {
		await helpers.selectProjectsRelation( (result) => {
			console.log(result);
			response.render('pages/projects',{scope : result});
		});
	});
	app.post('/projects', async (request, response) => {
		let name = request.body.name.toLowerCase();

		switch(request.body.type){
			case "search":
				await helpers.searchProject(name, (result) => {
					response.send(result);
				});
				break;
			case "add":
				await helpers.createProject(name, (result) => {
					response.redirect('/projects');
				});
				break;
			default:
				console.log("WRONG type: "+request.body.type);
		}
	});


	app.get('/project/:id', async (request, response)=>{ 
		let project_id = request.params.id;

		await helpers.selectProject(project_id, async (result) => {
			// await helpers.selectTags( async (result2) => {
			// 	await helpers.selectProjectTags(project_id, async (result3) => {
					await helpers.selectProjectSize(project_id, async (result4) => {
						await helpers.selectTmpls( async (result5)=>{
							await helpers.selectProjectTmpls(project_id, async (result6)=>{
								console.log( { 
									project:result, 
									// tags:result2, 
									// tagRelation: result3, 
									size: result4, 
									tmpls: result5 , 
									tmplRelation: result6
								});
								response.render('pages/project', { 
									scope : { 
										project:result, 
										// tags:result2, 
										// tagRelation: result3, 
										size: result4, 
										tmpls: result5, 
										tmplRelation: result6
									} 
								});
							});
						});
						
					});
			// 	});
			// });
		});
	});
	app.post('/project/:id', async (request, response) => {
		let project_id = request.params.id;

		switch(request.body.type){
			case "project.showDir":
				await helpers.selectProjectDir(project_id, (select_dir_result)=>{
					console.log(select_dir_result);
					var fullpath;
					if(select_dir_result.length == 0) 
						fullpath = path.resolve("./screens") ;
					else 
						fullpath = select_dir_result[0].dir;
					// var fullpath = path.resolve(dir);

					console.log('fullpath');
					console.log(fullpath);
					helpers.selectDir(fullpath, (list)=>{
						if(fullpath != '/')
							list.push('..');
						list.sort((a,b)=> a>b?1:a<b?-1:0);
						response.send({list: list, path: fullpath});
					});
				});
				break;
			case "project.navigate":
				let curpath = request.body.path;
				let way = request.body.way;
				var fullpath = path.join(curpath, way);

				console.log('fullpath');
				console.log(fullpath);
				await helpers.selectDir(fullpath, (list)=>{
					if(fullpath != '/')
						list.push('..');
					list.sort((a,b)=> a>b?1:a<b?-1:0);
					response.send({list: list, path: fullpath});
				});
				break;
			case "project.dir.save":
				let selectedpath = request.body.path;

				console.log('selectedpath');
				console.log(selectedpath);
				await helpers.selectDir(selectedpath, async (list)=>{
					if(list) await helpers.saveDir(project_id, selectedpath, (r)=>{
						if(r) response.send({result: "ok"});
					});
				});
				break;
			case "project.save":
				console.log("project.save");

				let name = request.body.name.toLowerCase();
				let info = request.body.info;
				let d_tmpls = request.body.d_tmpls;
				let t_tmpls = request.body.t_tmpls;
				let db = request.body.db;
				if(!name)
					return;

				await helpers.saveProjectChanges(
					project_id, 
					name, 
					info, 
					// tags, 
					t_tmpls,
					d_tmpls, 
					db, 
					()=>{
						response.send({result:'saved'});
					}
				);
				break;
			case "project.delete":
				console.log("project.delete");
				await helpers.deleteProject(project_id,()=>{
					response.send({redirect:'/projects/'});
				});
				break;
			default:
				console.log("project.error");
				console.log(" O O O P S . . . ");
				response.send({err:'o o o p s'});
		}
	});


	app.get('/project/:id/objects', async (request, response)=>{ 
		let project_id = request.params.id;
		await helpers.selectProject(project_id, async (result) => {
			await helpers.selectProjectSize(project_id, async (result2) => {
				await helpers.selectProjectObjects(project_id, async (result3) => {
					await helpers.selectProjectReadyObjectLength(result3, async (result4)=>{
						response.render('pages/objects', {scope: {project: result, size:result2,size2: result4, objects:result3} });
					});
				});
			});
		});
	});
	app.post('/project/:id/objects', async (request, response)=>{ 
		let project_id = request.params.id;
		let result;
		switch(request.body.type){
			case 'objects.thumbs.make':
				// response.send({status: "ok"});
				let time = request.body.time;

				await helpers.selectProjectDir(project_id, async (select_dir_result)=>{
					console.log(select_dir_result);
					var fullpath;
					if(select_dir_result.length == 0) 
						fullpath = path.resolve("./screens") ;
					else 
						fullpath = select_dir_result[0].dir;

					await helpers.selectProjectObjects(project_id, async (objects) => {
						result = await TM.createProcess(project_id, fullpath, objects);
						response.send({status: result});
					});
				});

				break;
			case 'process.thumbs.terminate':
				result = await TM.stopProcess(project_id);
				response.send({status: result});
				break;
			case 'objects.thumbs.check':
				result = await TM.getStatus(project_id);
				console.log(result);
				if(!result.status) 
					response.send({msg:'no process'});
				else
					response.send({
						status: result.status,
						step: result.step,
						time: result.time,
					});
				break;
			default:
				response.send({err: "opps, wrong type"});
		}
	});


	app.get('/project/:id/tags', async (request, response)=>{ 
		let project_id = request.params.id;
		await helpers.selectTags( async (alltags) => {
			await helpers.selectProjectTags(project_id, async (relation) => {
				console.log(relation);
				var assocT = [],
					stopT = [],
					hideT = [],
					catT = [];

				relation.map( e => {
					if( e.type == "positive" ) assocT.push(e);
					else if( e.type == "negative" ) {
						// let flag = e.flag;
						// let copy = relation.filter(item => {
						// 	return item.type == "positive" &&
						// 	item.flag == flag
						// });
						// if( copy.length == 0 ) {
							stopT.push(e);
						// }
					}
					else if( e.type == "hidden" ) hideT.push(e);
					else if( e.type == "categories" ) catT.push(e); 	
				});

				response.render('pages/projecttags',{
					scope: {
						project: {id:project_id},
						tags: {
							all: alltags,
							assoc: assocT,
							stop: stopT,
							unshow: hideT,
							categories: catT,
						}
					}
				});

			});
		});
	});
	app.post('/project/:id/tags', async (request, response)=>{ 
		let project_id = request.params.id;

		let assocTags = request.body.tags.positive ? request.body.tags.positive : [];
		let stopTags = request.body.tags.negative ? request.body.tags.negative : [];
		let hideTags = request.body.tags.hidden ? request.body.tags.hidden : [];
		let categoryTags = request.body.tags.categories ? request.body.tags.categories : [];
		let tags = {
			positive: assocTags,
			negative: stopTags,
			hidden: hideTags,
			categories: categoryTags
		}
		console.log(tags);

		await helpers.saveProjectTags(project_id, tags, async result => {
			response.send({status: result});
		});
	});


	app.get('/project/:id/export', async (request, response)=>{ 
		let project_id = request.params.id;
		await helpers.selectProject(project_id, async (project) => {
			await helpers.selectProjectDB(project_id, async (db) => {
				await helpers.selectProjectLogs(project_id, async (logs) => {

					await helpers.selectProjectUnmappedObjects(project_id, async(um_objects)=>{
						await helpers.selectProjectReadyObjects(um_objects, async (objects)=>{
							
							await helpers.selectExportLogs(project_id, async(exportlogs)=>{
								response.render('pages/export',{scope: {
									project: project, 
									db: db, 
									logs: logs, 
									objs: objects,
									exportlogs: exportlogs
								}});
							});

							// response.render('pages/objects', {scope: {project: project, size:result2,size2: result4, objects:result3} });
						});
					});

				});
			});	
		});	
	});
	app.post('/project/:id/export', async (request, response)=>{ 
		let project_id = request.params.id;

		switch(request.body.type){
			case "project.export.check":
				if( ExportProgress )
					response.send({status: true});
				else
					response.send({status: false});
				break;
			case "project.export.push":
				if( ExportProgress ){
					response.send({process: true});
					break;
				}
				ExportProgress = true;
				await helpers.selectProjectDB(project_id, async (projectDB) => {
					console.log(projectDB);

					if(projectDB.flag == 0){
						await helpers.selectProjectDBlocalhost(projectDB.dbhID, async(db_params)=>{
							console.log(db_params);
							
							await helpers.selectProjectUnmappedObjects(project_id, async(um_objects)=>{
								await helpers.selectProjectReadyObjects(um_objects, async (objects)=>{	
									await helpers.exportObjects(project_id, db_params, objects, async (result)=>{
										console.log(result);
										ExportProgress = false;
										// response.send("ok");
										// response.redirect('/project/'+project_id+'/export');
										response.send({status:"finish"});
									});
								});
							});
							
						});
					}else{
						// foreign db host
						response.send({err:"oops"});
					}
				});
				break;
			default:
				response.send("oops");
		}

		

	});


	app.get('/project/:id/export/:log/', async (request, response)=>{ 
		let project_id = request.params.id;
		let export_log_id = request.params.log;
		await helpers.selectProject(project_id, async (result) => {
			await helpers.selectExportLog(export_log_id, async (result2)=>{
				await helpers.selectExportLogObjects(export_log_id, async (result3)=>{
					response.render('pages/log_objects', {scope: {
						project: result,
						log: result2,
						objects: result3
					}});
				});
			});
		});
	});


	app.get('/project/:id/database', async (request, response)=>{ 
		let project_id = request.params.id;
		await helpers.selectProject(project_id, async (result) => {
			await helpers.selectProjectDB(project_id, async (result2) => {
				if(!result2){
					result2 = [];
					response.render('pages/db',{scope: {project: result ,db:result2}});
				}else{
					await helpers.selectProjectDBlocalhost(result2.dbhID, async(result3)=>{
						if(result2.sshhID){
							await helpers.selectProjectDBsshhost(result2.sshhID, async (result4)=>{
								response.render('pages/db',{scope: {project: result ,db:result2, dbhost: result3, ssh: result4}});
							});
						}else{
							response.render('pages/db',{scope: {project: result ,db:result2, dbhost: result3}});
						}
					});
				}
			});		
		});
	});
	app.post('/project/:id/database', async (request, response) => {
		let project_id = request.params.id;
		let pack =  request.body.pack;
		console.log(pack);
		switch(pack.db_type){
			case "localhost":
				await helpers.saveProjectDB(project_id,pack, () => {
					response.send("ok");
				});
				// break;
			case "foreignhost":
				// await helpers.createTmpl(name, (result) => {
				// 	response.redirect('/templates');
				// });
				// break;
			default:
				response.send("oops");
		}
	});

	app.get('/templates', async (request, response) => {
		await helpers.selectTmpls( async (result) => {
			response.render('pages/templates', {array: result });
		});
	});
	app.post('/templates', async (request, response) => {
		let name = request.body.name.toLowerCase();
		if(!name)
			response.send("oops");
		else
			switch(request.body.type){
				case "search":
					await helpers.searchTmpl(name, (result) => {
						response.send(result);
					});
					break;
				case "import.template":
					var data = await JSON.parse(request.body.data.toString('utf8'));
					if(data){
						console.log(data);
						await helpers.importTemplate(name, data, (result) => {
							response.send(result);
						});
						break;
					}
				case "add":
					await helpers.createTmpl(name, (result) => {
						response.redirect('/templates');
					});
					break;
				default:
					response.send("oops");
			} 
	});

	app.get('/template/:id', async (request, response) => {
		let template_id = request.params.id;

		await helpers.selectTmpl(template_id, async(tmpl)=>{
			// console.log(tmpl);
			// await helpers.selectTags( async (tags) => {
				await helpers.selectTmplKeys(template_id, async (template)=>{
					let formatTemplates = await helpers.formatTMPL(template);
					console.log(formatTemplates);
					console.log(">_____________formatTemplates");
					await helpers.selectLibraryItems(async (library)=>{
						response.render('pages/template', {scope: {
							tmpl: tmpl[0], 
							template: formatTemplates,
							// oldtemplate: template, 
							library: library
							// tags: tags, 
							// templates_old: templates,  
						}});
					});
				});
			// });
		});
	});
	app.post('/template/:id', async function(request, response){ 
		let tmpl_id = request.params.id;

		switch(request.body.type){
			case "saveTmpl":
				console.log("save");
				let name = request.body.name.toLowerCase();
				if(!name)
					return;
				await helpers.saveTmplChanges(tmpl_id, name, ()=>{
					response.redirect('/template/'+tmpl_id);
				});
				break;
			case "delTmpl":
				console.log("del");
				await helpers.deleteTmpl(tmpl_id, ( result )=>{
					console.log(result);
					response.send({answer:result});
					// response.redirect('/templates');
				});
				break;
			case "newKey":
				console.log("newKey");
				let key = request.body.key
					// .toLowerCase()
					.replace(punctREGEX,'');
				if(!key) return

				// let assoctags = JSON.parse(request.body.assoctags);
				// let stoptags = JSON.parse(request.body.stoptags);
				// let tags = {assocs: assoctags, stops: stoptags} ;
				let tags = {} ;

				await helpers.createTmplKey(tmpl_id, key, tags, (result) => {
					response.send({answer:result});
				});
				break;
			case "delKey":
				let key_id = request.body.keyID;
				if(!key_id)
					response.send({err:'oops'});

				await helpers.deleteTmplKey(key_id, (result) => {
					response.send({answer:result});
				});
				break;
			case "newVal":
				console.log("newVal");
				let val_key_id = request.body.keyID;
				let value = request.body.value;
				console.log({val_key_id ,value});
				if(!val_key_id || !value){
					response.send({answer:false});
					break;
				}
				await helpers.createTmplValue(val_key_id, value, (result) => {
					if(result)
						response.send({answer:true, id: result});
					else
						response.send({answer:false});
				});
				break;
			case "delVal":
				console.log("delVal");
				let val_id = request.body.valID;
				
				await helpers.deleteTmplValue(val_id, (result) => {
					console.log("p1");
					response.send({answer:result});
				});
				break;
			default:
				console.log(" O O O P S . . . ");
				response.send({err:'o o o p s'});
		}
	});

	app.get('/tags', async (request, response) => {
		await helpers.selectTagsEx((result) => {
			console.log(result);
			response.render('pages/tags',{array : result});
		});
	});
	app.post('/tags', async (request, response) => {
		let name;

		switch(request.body.type){
			case "search":
				name = request.body.name.toLowerCase();
				if(!name)
					response.send("oops");
				else
					await helpers.searchTag(name, (result) => {
						response.send(result);
					});
				break;
			case "add":
				name = request.body.name.toLowerCase();
				if(!name)
					response.send("oops");
				else
					await helpers.createTag(name, (result) => {
						response.redirect('/tags');
					});
				break;
			case "del":
				await helpers.createTag(name, (result) => {
					response.redirect('/tags');
				});
				break;
			default:
		}
	});

	app.get('/tag/:id', async (request, response) => {
		let tag_id = request.params.id;

		await helpers.selectTag(tag_id, async (result) => {
			console.log(result);
			await helpers.selectNullTags( async (result2) => {
				console.log(result2);
				await helpers.selectTagSyns(tag_id, async (result3) => {
					console.log(result3);
					response.render('pages/tag',{ scope : { tag:result[0], tags:result2, syns: result3} } );
				});
			});
		});
	});
	app.post('/tag/:id', async function(request, response){ 
		let tag_id = request.params.id;

		switch(request.body.type){
			case "save":
				console.log("save");
				let name = request.body.name.toLowerCase();
				let syns = request.body.syns;
				let syn_arr = syns.split(',').map((x)=>{ return parseInt(x)});

				await helpers.saveTagChanges(tag_id, name, syn_arr, ()=>{
					response.redirect('/tag/'+tag_id);
				});
				break;
			case "tag.del":
				await helpers.deleteTag(tag_id, (result) => {
					response.send({redirect:'/tags/'});
				});
				break;
			default:
				console.log(" O O O P S . . . ");
				response.send({err:'o o o p s'});
		}
	});

	app.get('/json', async (request, response) => {
		await helpers.getJsons( async (files) => {
		response.render('pages/json',{scope:{jsons: files}});
		});
		
	});
	app.post('/json', async (request, response) => {
		switch(request.body.type){
			case "json.file.download":
				let jsonId = request.body.id;

				await helpers.getJson(jsonId, async (obj) => {
					if(obj) {
						response.send({resp: obj});
					}else response.send({err: "bad obj id"});
				});
				break;
			case "json.file.save":
				let obj = await JSON.parse(request.body.data);
				let name = request.body.name;
				await helpers.saveJson(obj, name, async () => {
					response.send({resp: 'json loaded'});
				});
				break;
			case "json.file.import":
				if(!JsonImportProgress){
					let jsonId = request.body.id;
					await helpers.getJson(jsonId, async (obj, file_name) => {
						JsonImportProgress = true;
						JsonImportId = jsonId;

						response.send({resp: 'import started', id:JsonImportId});
						
						await helpers.importJson(obj, file_name, async (result) => {
							JsonImportProgress = false;
							JsonImportId = -1;
						});
					});
				}else{
					response.send({resp: 'process busy', id:JsonImportId});
				}

				break;
			case "json.import.process.check":
				if(!JsonImportProgress){
					response.send({resp: {'id': -1}});
				} else {
					response.send({resp: {'id': JsonImportId}});
				}
				break;
			case "json.file.del":
				break;
			default:
				console.log(" O O O P S . . . ");
				response.send({err:'o o o p s'});
		}
	});

	app.get('/generator', async (request, response) => {
		await helpers.selectOriginalAllSize( async(result) => {
			await helpers.selectProjects((result2)=>{
				response.render('pages/generator', {scope:
					{size:result, projects:result2}} );
			});
		});
	});
	app.post('/generator', async (request, response) => {
		console.log(' < generator >');
		let project_id,size;

		switch(request.body.type){
			case "original.size":
				console.log("original.size");
				project_id = request.body.id;

				await helpers.selectProjectOriginalSize(project_id, (result)=>{
					response.send({res:result});
					console.log(result);
				})
				break;
			case "generator.check":
				console.log("generator.check");
				if( GeneratorProgress )
					response.send({status:true});
				else
					response.send({status:false});
				break;
			case "object.transfiguration":
				console.log("object.transfiguration");
				if( GeneratorProgress ){
					response.send({process:true});
					break;
				}
				project_id = request.body.id;
				size = request.body.size;
				GeneratorProgress = true;
				await helpers.createProjectObjects(project_id, size, (result)=>{
					response.send({res:result});
					console.log(result);
					GeneratorProgress = false;
				})
				break;
			default:
				console.log(" O O O P S . . . ");
				response.send({err:'o o o p s'});
		}
		console.log(' < generator >');
	});

	app.get('/library', async (request, response) => {
		await helpers.selectLibraryItems(async (result)=>{
			console.log(result);
			response.render('pages/library', {scope:{
				library: result
			}});
		});
	});
	app.post('/library', async (request, response) => {
		switch(request.body.type){
			case "library.key.create":
				if(request.body.name){
					let keyName = request.body.name
						.toLowerCase()
						.replace(punctREGEX,'');
					await helpers.createLibraryKey(keyName, async (result)=>{
						response.send({status:'ok'});
					});
				}else response.send({err:'new key name err'});
				break;
			case "library.export":
				await helpers.selectLibraryItems(list => {
					response.send(list);
				});
				break;
			case "import.library":
				var data = await JSON.parse(request.body.data.toString('utf8'));
				if(data){
					console.log(data);
					await helpers.importLibrary(data, (result) => {
						response.send(result);
					});
					break;
				}
			case "library.key.delete":
				if(request.body.id){
					let keyID = request.body.id;
					await helpers.deleteLibraryKey(keyID, async (result)=>{
						response.send({status:'ok'});
					});
				}else response.send({err:'new key name err'});
				break;
			case "library.key.value.add":
				if(request.body.id && request.body.value){
					let keyID = request.body.id;
					let keyValue = request.body.value
						.toLowerCase()
						.replace(punctREGEX2,'');
					await helpers.addLibraryKeyValue(keyValue, async(valueID)=>{
						await helpers.createRelationLibraryKeyValue(keyID, valueID, async()=>{
							response.send({status:'ok', id:valueID});
						});
					});
				}else response.send({err:'new key name err'});
				break;
			case "library.key.value.delete":
				if(request.body.value_id){
					let valueID = request.body.value_id;
					await helpers.deleteLibraryKeyValue(valueID, async()=>{
						response.send({status:'ok'});
					});
				}else response.send({err:'new key name err'});
				break;
			default:
				console.log(" O O O P S . . . ");
				response.send({err:'o o o p s'});
		}
	});

	app.get('/query', async (request, response) => {
		response.render('pages/query');
	});
	app.post('/query', async (request, response) => {
		console.log(request.body);
		await helpers.sshQuery(request.body, async (result)=>{
			response.send(result);
		});
	});

	// 404, 500
    app.use( (error, request, response, next) => {
		console.log('error' + error);
        // response.status(error.status || 500);
        response.render('error', {
            message: error.message,
            error: error
        });
    });

	server.listen(app.get('port'), () => {
	  console.log('Node app is running on port', app.get('port'));
	});
	return server;

	///////// app.listen('8080', '127.0.0.1');
	// app.listen(app.get('port'), () => {
	//   console.log('Node app is running on port', app.get('port'));
	// });
	// return app;
}


	// app.get('/rewrite', async (request, response) => {
	// 	await helpers.selectProjects( (result) => {
	// 		response.render('pages/rewrite',{array : result});
	// 	});
	// });
	// app.post('/rewrite', async (request, response) => {
	// 	let query = await querystring.stringify({
	// 		project: request.body.project
	// 	});
	// 	response.redirect('/rewriter?' + query);
	// });
	
	// app.get('/rewriter', async (request, response) => {
	// 	let project_id = request.query.project;
	// 	await helpers.selectRandomOriginal(project_id, async (data) => {	
	// 		console.log({object: data});
	// 		response.render('pages/rewriter', {object: data, project:{id:request.query.project}});
	// 	});
	// });
	// app.post('/rewriter', async (request, response) => {
	// 	console.log(request.body);
	// 	await helpers.saveObject(request.body, async (result)=>{
	// 		console.log('Object saved');
	// 		response.status(200);

	// 		let query = await querystring.stringify({
	// 			project: request.body.project_id
	// 		});
	// 		response.redirect('/rewriter?' + query);
	// 	});
	// });

	// app.get('/newproject', async (request, response) => {
	// 	await helpers.selectTags((result) => {
	// 		response.render('pages/newproject',{scope : {tags:result }});
	// 	});
	// });
	// app.post('/newproject', async (request, response) => {
	// 	await helpers.createProject(request.body, () => {
	// 		response.redirect('/projects');
	// 	});		
	// });