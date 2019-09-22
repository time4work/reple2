const Nightmare = require("nightmare");

module.exports.getLink = async function(url) {
    try{
        if (!url) return;
        let video_link;

        return new Promise((resolve, reject)=>{
            Nightmare({
                'ignore-certificate-errors': true,
                'node-integration': false,
                'web-security': false,
                show: false,
            })
            .on( 'did-get-redirect-request', function(event, oldUrl, newUrl){
                console.log('did-get-redirect-request');
                console.log(event);
                console.log(oldUrl);
                console.log(newUrl);
            })
            .on('crashed', function(event, url){
                try{
                    console.log('[Nightmare] crashed');
                } catch (e) {
                    console.log(e);
                    return 0;
                }
            })
            .on('did-fail-load', function(event){
                try{
                    console.log('[Nightmare] did-fail-load');
                } catch (e) {
                    console.log(e);
                    return 0;
                }
            })
            .on('new-window', function(event, url){
                event.preventDefault();
            })
        	.goto(url)
            .viewport(1000, 1000)
            .wait(2000)
            .evaluate(function(url) {
                let obj,link;

                if (url.search(/pornhub\.com/i) != -1){
                    obj = document.querySelector('#player video source');
                    if (!obj) throw new Error('[Nightmare] broken link');

                    link = obj.src;
                }
                else if (url.search(/xhamster\.com/i) != -1){
                    obj = document.querySelector('a.player-container__no-player.xplayer');
                    if (!obj) throw new Error('[Nightmare] broken link');
                    
                    link = obj.href;
                }
                else if (url.search(/youporn/i) != -1){
                    let not_found = document.querySelector('video-not-found');
                    if (not_found) throw new Error('[Nightmare] broken link');

                    obj = document.querySelector('video source');
                    if(!obj) throw new Error('[Nightmare] broken link');

                    link = obj.src;
                }

                if(!link) throw new Error('[Nightmare] broken link');
                return link;
            }, url)
            .end()
    		.then(function(results) {
    		    console.log(" - donor video link - ");
    		    console.log(results);
                resolve(results);
    		})
            .catch(err => {
                console.log(" { Nightmare REJECT } ");
                console.error(err);
                reject(err);
            })
        });
    } catch (e) {
        console.log(e);
        return 0;
    }
}
