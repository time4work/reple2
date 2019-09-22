'use strict';


const needle  = require('needle');
const cheerio = require('cheerio');
const resolve = require('url').resolve;


var options = {
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
        "Accept": "*/*",
        "Connection": "keep-alive",
        "follow_max": 0,    // follow up to five redirects
        "User-Agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/34.0.1847.132 Safari/537.36"
    },
    "timeout": 0,
    "rejectUnauthorized" : true,  // verify SSL certificate
    "connection": 'Keep-Alive'
};

module.exports.getLink = async function(url) {
    try{

        console.log(' -> start getLink Needle');
        if (!url) return;
        var video_link;

        console.log('url');
        console.log(url);
        
        return new Promise((resolve, reject)=>{

            var resp = needle.get(url, options, function(err, res){
                if (err || res.statusCode !== 200){
                    console.log(' + error ' + url);
                    reject('needle err');
                }
                else{
                    let link;
                    // var $ = cheerio.load(res.body);
                    // link = $('#videoContainer video source').href;
                    // if(!link)
                    //     link = $('#video.videoPlayer').src;
                    var regex = /<video.*src="(.*?)"/i;
                    var res = regex.exec(res.body);
                    if(res)
                        link = res[1];

                    console.log('link');
                    console.log(link);
                    resolve(link);
                }
            });

            resp.on('redirect', function(location) {
                console.log('redirect');
                console.log(location);
            });
            resp.on('done', function(err) {
                if (err) {
                    console.log('An error ocurred: ' + err.message);
                    reject('done err');
                }
            });
            resp.on('timeout', function(type) {
                console.log(type);
                reject('time out');
            });
        });
    } catch (e) {
        console.log(e);
        return 0;
    }
}

//         	.goto(url)
//             .viewport(1000, 1000)
//             .wait(2000)
//             .evaluate(function(url) {
//                 console.log(' ! - ! - ! - evaluate - ! - ! - !');
//                 var obj,link;

//                 if (url.search(/pornhub\.com/i) != -1){
//                     console.log(' - - - > pornhub');
//                     obj = document.querySelector('#player video source');
//                     if(!obj)
//                         // return new Promise(function(resolve, reject) {
//                             reject('broken link');
//                         // })
//                     link = obj.src;
//                 }
//                 else if (url.search(/xhamster\.com/i) != -1){
//                     console.log(' - - - > xhamster');
//                     obj = document.querySelector('a.player-container__no-player.xplayer');
//                     if(!obj)
//                         // return new Promise(function(resolve, reject) {
//                             reject('broken link');
//                         // })
//                     link = obj.href;
//                 }
//                 else if (url.search(/youporn/i) != -1){
//                     console.log(' - - - > youporn');
//                     obj = document.querySelector('#videoContainer video source');
//                     console.log(' - - - > obj');
//                     console.log(obj);
//                     if(!obj)
//                         // return new Promise(function(resolve, reject) {
//                             reject('broken link');
//                         // })
//                     link = obj.href;
//                 }

//                 if(!link) 
//                     // return new Promise(function(resolve, reject) {
//                         reject('broken link');
//                     // })
//                 return link;
//             }, url)
//             .end()
//     		.then(function(results) {
//     		    console.log(" - donor video link - ");
//     		        resolve(results);
//     		})
//             .catch(err => {
//                 console.log(" { Nightmare REJECT } ");
//                 console.error(err);
//             })
//         });

//     } catch (e) {
//         console.log(e);
//         return 0;
//     }
// }