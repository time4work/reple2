
const ffmpeg = require('fluent-ffmpeg');
const { makeid } = require('../helper');

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

const Ffmaeg = {

	makeActionThumbs: async (link, dir) => {
		const timemarks = ['15%', '30%', '45%', '60%', '75%'];
		console.log(1);
		const screens = [];
		for (let i=0; i<timemarks.length; i++) {
			console.log(12);
			const options = {
				dir,
				resolution: '240x180',
				timemark: timemarks[i],
			};
			screenName = await takeScreen(link, options);
			console.log(123);
			screens.push(screenName);
		}
		return screens;
	},

    makeBaseThumb: async (link, dir) => {
		const options = {
			dir,
			resolution: '240x180',
			timemark: '50%',
		};
		return takeScreen(link, options);
	},
	
	makeBigThumb: async (link, dir) => {
		const options = {
			dir,
			resolution: '432x324',
			timemark: '50%',
		};
		return takeScreen(link, options);
	},
	
	getDuration: async (link) => {
		return takeDuration(link);
	},
	
};
module.exports = Ffmaeg;

async function takeScreen(link, options) {
	return new Promise((resolve, reject) => {
		options.fileName = options.fileName || makeid(8);

		console.log('options', {options});
		
		let fileName = null;
		
		ffmpeg(link)
			.videoBitrate('800k')
			.on('filenames', function(filenames) {
			    console.log(`[ffmpeg] - filenames: ${filenames.join(',')}`);
				// resolve(filenames[0]);
				fileName = filenames[0];
			})
			.on('end', function() {
				console.log('[ffmpeg] - end');
				resolve(fileName);
			})
			.on('error', function(err, stdout, stderr) {
				console.log("[ffmpeg] - err:\n" + err);
				console.log("[ffmpeg] - stdout:\n" + stdout);
				console.log("[ffmpeg] - stderr:\n" + stderr);
				reject("ffmpeg-failed");
			})
			.takeScreenshots({
				count: 1,
				size: options.resolution,
				filename: options.fileName,
				timemarks: options.timemarks || [ options.timemark ]
			}, options.dir);
	});
}

async function takeDuration(link) {
	return new Promise((resolve, reject) => {
		let duration = null;

		ffmpeg(link)
			.videoBitrate('800k')
			.on('codecData', function(data) {
				console.log(`[ffmpeg] - duration : ${data.duration} video : ${data.video}`);
				// resolve(data.duration);
				duration = data.duration;
			})
			.on('end', function() {
				console.log('[ffmpeg] - end');
				resolve(duration);
			})
			.on('error', function(err, stdout, stderr) {
				console.log("[ffmpeg] - err:\n" + err);
				console.log("[ffmpeg] - stdout:\n" + stdout);
				console.log("[ffmpeg] - stderr:\n" + stderr);
				reject("ffmpeg-failed");
			});
	});
}