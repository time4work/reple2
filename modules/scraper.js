'use strict';

const Nightmare = require("nightmare");

// function _reject(msg){
//     return new Promise(function(resolve, reject) {
//         reject('broken link');
//     });
// }

module.exports.getLink = async function(url) {
    try{

        console.log(' -> start getLink Nightmare');
        if (!url) return;
        var video_link;

        console.log('url');
        console.log(url);
        
        return new Promise((resolve, reject)=>{
            Nightmare({
                'ignore-certificate-errors': true,
                'node-integration': false,
                'web-security': false,
                show: false,
                // show: true,
                // width: 1280,
                // height: 700,
                // waitTimeout: 6000
            })
            // .then(()=>{
            //     console.log('scraper start');
            // })
            .on( 'did-get-redirect-request', function(event, oldUrl, newUrl){
                console.log('did-get-redirect-request');
                console.log(event);
                console.log(oldUrl);
                console.log(newUrl);
            })
            .on('crashed', function(event, url){
                try{
                    console.log('[Nightmare] crashed');
                    // return new Promise(function(resolve, reject) {
                        // reject('[Nightmare] crashed');
                    // });
                } catch (e) {
                    console.log(e);
                    return 0;
                }
            })
            .on('did-fail-load', function(event){
                try{
                    console.log('[Nightmare] did-fail-load');
                    // return new Promise(function(resolve, reject) {
                        // reject('[Nightmare] did-fail-load');
                    // });
                } catch (e) {
                    console.log(e);
                    return 0;
                }
                // reject('did-fail-load');
            })
            .on('new-window', function(event, url){
                console.log('new-window');
                event.preventDefault();
            })
        	// Nightmare({
    	    //     'ignore-certificate-errors': true,
    	    //     // show: true,
    	    // })
        	.goto(url)
            .viewport(1000, 1000)
            .wait(2000)
            .evaluate(function(url) {
                console.log(' ! - ! - ! - evaluate - ! - ! - !');
                var obj,link;

                if (url.search(/pornhub\.com/i) != -1){
                    console.log(' - - - > pornhub');
                    obj = document.querySelector('#player video source');
                    if(!obj)
                        throw new Error('[Nightmare] broken link');

                        // return new Promise(function(resolve, reject) {
                            // reject('[Nightmare] broken link');
                        // })
                    link = obj.src;
                }
                else if (url.search(/xhamster\.com/i) != -1){
                    console.log(' - - - > xhamster');
                    obj = document.querySelector('a.player-container__no-player.xplayer');
                    if(!obj)
                        throw new Error('[Nightmare] broken link');
                        // return new Promise(function(resolve, reject) {
                            // reject('[Nightmare] broken link');
                        // })
                    link = obj.href;
                }
                else if (url.search(/youporn/i) != -1){
                    console.log(' - - - > youporn');
                    
                    let not_found = document.querySelector('video-not-found');
                    if( not_found ) 
                        throw new Error('[Nightmare] broken link');
                        // reject( 'video removed' );
                    obj = document.querySelector('video source');
                    console.log(' - - - > obj');
                    console.log(obj);
                    if(!obj)
                        throw new Error('[Nightmare] broken link');
                        // reject('[Nightmare] broken link');
                    link = obj.src;
                }

                if(!link) 
                        throw new Error('[Nightmare] broken link');
                    // return new Promise(function(resolve, reject) {
                        // reject('[Nightmare] broken link');
                    // })
                return link;
            }, url)
            .end()
    		.then(function(results) {
    		    console.log(" - donor video link - ");
    		    console.log(results);
    		    // return new Promise(function(resolve, reject) {
    		        resolve(results);
    		    // })
    		})
            .catch(err => {
                console.log(" { Nightmare REJECT } ");
                console.error(err);
                reject(err);
            })
        });
        // ;
        // .then((r) => {
    	   //  console.log(" = donor video link = ");
        // 	console.log(r);
        // 	video_link = r;
        //     return r;
        // });

    } catch (e) {
        console.log(e);
        return 0;
    }
    // return video_link;
}


// .then(function(results) {
//     log(results)
//     return new Promise(function(resolve, reject) {
//         var leanLinks = results.map(function(result) {
//             return {
//                 post: {
//                     content: result.content,
//                     productLink: extractLinkFromFb(result.productLink),
//                     photo: result.photo
//                 }
//             }
//         })
//         resolve(leanLinks)
//     })
// })