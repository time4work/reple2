'use strict';

const Nightmare = require("nightmare");

function _reject(msg){
    return new Promise(function(resolve, reject) {
        reject('broken link');
    });
}

module.exports.getLink = async function(url) {
    // try{

        console.log(' -> start getLink Nightmare');
        if (!url) return;
        var video_link;

        console.log('url');
        console.log(url);
        
        return await Promise.resolve(
            Nightmare({
                'ignore-certificate-errors': true,
                'node-integration': false,
                'web-security': false,
                show: true,
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
                    return new Promise(function(resolve, reject) {
                        reject('crashed');
                    });
                } catch (e) {
                    console.log(e);
                    return 0;
                }
            })
            .on('did-fail-load', function(event){
                try{
                    console.log('[Nightmare] did-fail-load');
                    return new Promise(function(resolve, reject) {
                        reject('did-fail-load');
                    });
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
                console.log('lets get the link');
                var obj,link;

                if (url.search(/pornhub\.com/i) != -1){
                    obj = document.querySelector('#player video source');
                    if(!obj)
                        return new Promise(function(resolve, reject) {
                            reject('broken link');
                        })
                    link = obj.src;
                }
                else if (url.search(/xhamster\.com/i) != -1){
                    obj = document.querySelector('a.player-container__no-player.xplayer');
                    if(!obj)
                        return new Promise(function(resolve, reject) {
                            reject('broken link');
                        })
                    link = obj.href;
                }

                if(!link) 
                    return new Promise(function(resolve, reject) {
                        reject('broken link');
                    })
                return link;
            }, url)
            .end()
    		.then(function(results) {
    		    console.log(" - donor video link - ");
    		    console.log(results);
    		    return new Promise(function(resolve, reject) {
    		        resolve(results);
    		    })
    		})
            .catch(err => {
                console.log(" { Nightmare REJECT } ");
                console.error(err);
            })
        )

    // } catch (e) {
    //     console.log(e);
    //     return 0;
    // }
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