
const ffmpeg = require('fluent-ffmpeg');

// var dir = './screens/';
var _dir;

module.exports.makeBaseThumb = async function(url, namePrefix, dir, callback) {
	console.log(' - makeBaseThumb -');
	_dir = dir;
    var filename,
    	duration;

    return await new Promise(async function(resolve, reject) {
    	await takeScreen(url, namePrefix+'_base', '240x180', '50%' , async (screen)=>{
    		if(!screen) reject('makeBaseThumb failed');
    		
			if(callback){
				await callback({
					name: screen.name,
					duration: screen.duration
				});
			}
			// return new Promise(function(resolve, reject) {
		        resolve({
					name: screen.name,
					duration: screen.duration
				});
		    // })
    	});
	}).then((r)=>{
	    console.log(" = makeBaseThumb = ");
    	console.log(r);
        return r;
	});
}
module.exports.makeBigThumb = async function(url, namePrefix, dir, callback) {
	console.log(' - makeBigThumb -');
	_dir = dir;
    var filename,
    	duration;

    return await new Promise(async function(resolve, reject) {
    	await takeScreen(url, namePrefix+'_big', '432x324', '50%' , async (screen)=>{
    		if(!screen) reject('makeBigThumb failed');
    		
			if(callback){
				await callback({
					name: screen.name,
					duration: screen.duration
				});
			}
			// return new Promise(function(resolve, reject) {
		        resolve({
					name: screen.name,
					duration: screen.duration
				});
		    // });
    	});
	}).then((r)=>{
	    console.log(" = makeBigThumb = ");
    	console.log(r);
        return r;
	});
}
module.exports.makeSimpleThumbs = async function(url, nameprefix, dir, callback) {
    console.log(' - makeSimpleThumbs - ');
	_dir = dir;
    var filenames,
    	duration;

    // return await Promise.resolve(
    return new Promise(async function(resolve, reject) {
	    await takeScreen(url, nameprefix+"_1", '240x180', '15%' , async (screen1)=>{
	    	await takeScreen(url, nameprefix+"_2", '240x180', '30%' , async (screen2)=>{
		    	await takeScreen(url, nameprefix+"_3", '240x180', '45%' , async (screen3)=>{
			    	await takeScreen(url, nameprefix+"_4", '240x180', '60%' , async (screen4)=>{
			    		await takeScreen(url, nameprefix+"_5", '240x180', '75%' , async (screen5)=>{

			    			if(!screen1 || !screen2 || !screen3 || !screen4 || !screen5)
			    				reject('makeSimpleThumbs failed');

							let names = [
								screen1.name, 
								screen2.name, 
								screen3.name, 
								screen4.name, 
								screen5.name,
							];
							console.log('names');
							console.log(names);

							if(callback){
								await callback({
									names: names,
									duration: screen1.duration
								});
							}
							// return new Promise(function(resolve, reject) {
						        resolve({
									names: names,
									duration: screen1.duration
								});
						    // });
			    		});
			    	});
			    });
	    	});
		});
	})
	.then((r)=>{
	    console.log(" = makeSimpleThumbs = ");
    	console.log(r);
        return r;
	});
}
function makeid(length) {
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	if(!length) length = 6

	for (var i = 0; i < length; i++)
		text += possible.charAt(Math.floor(Math.random() * possible.length));

	return text;
}
async function takeScreen(url, prefix, size, timemark, callback){
	var duration;
	var name;

	return await new Promise((resolve, reject) => {
		ffmpeg(url)
			.videoBitrate('800k')
			.on('codecData', function(data) {
				console.log('Input duration is [' + data.duration + '] with ' + data.video + ' video');
				duration = data.duration;
			})
			.on('filenames', function(filenames) {
			    console.log(' - Will generate ' + filenames.join(', ') + ' into tempfiles.');
			    name = filenames[0];
			})
			.on('end', function() {
			    console.log('Screenshots successfully taken');
			    resolve({duration,name});
			})
			.on('error', function(err, stdout, stderr) {
				console.log(" [*] ffmpeg err:\n" + err);
				console.log(" [*] ffmpeg stdout:\n" + stdout);
				console.log(" [*] ffmpeg stderr:\n" + stderr);
				reject( new Error("screen failed 2 create") );
			})
			.takeScreenshots({
				count: 1,
				size: size,
				filename: 'thumb_'+prefix,
				timemarks: [ timemark ]
			}, _dir);
	}).then(
		async result => {
			// первая функция-обработчик - запустится при вызове resolve
			console.log("Fulfilled: " ); // result - аргумент resolve
			console.log(result);

			if(callback)
				await callback(result);
			return result;
		},
		async error => {
			// вторая функция - запустится при вызове reject
			console.log("Rejected ffmpeg Promise: " + error.message); // error - аргумент reject

			if(callback)
				await callback(null);
			return null;
	    }
	);
}
// filename
// %s - offset in seconds
// %w - screenshot width
// %h - screenshot height
// %r - screenshot resolution ( widthxheight )
// %f - input filename
// %b - input basename ( filename w/o extension )
// %i - number of screenshot in timemark array ( can be zeropadded by using it like %000i )

// .screenshots({
//     filename: filename,
//     timemarks: ['20:50.123'],
//     size: '320x240',
//     folder: dir
// })