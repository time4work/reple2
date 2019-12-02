const Nightmare = require("nightmare");

const Srcapper = {

    getVideoLink: async(url, type) => {
        return new Promise((resolve, reject) => {
            getNightmare()
                .goto(url)
                .viewport(1000, 1000)
                .wait(2000)
                .evaluate(evaluateFunction(type), type)
                .evaluate(function(type) {
                    let selecter;
                    let key;
                    switch (type) {
                        case 'youporn':
                            selecter = 'video source';
                            key = 'src';
                            break;
                        case 'xhamster':
                            selecter = 'a.player-container__no-player.xplayer';
                            key = 'href';
                            break;
                        case 'pornhub':
                            selecter = '#player video source';
                            key = 'src';
                    }
                    const element = document.querySelector(selecter);
                    if (!element) {
                        throw new Error('null-element');
                    }
                    return element[key];
                }, type)
                .end()
                .then(function(results) {
                    console.log("[Nightmare] results - ", results);
                    resolve(results);
                })
                .catch(err => {
                    console.log("[Nightmare] rejected - ", err);
                    console.error(err);
                    reject(err);
                });
        });
    },

};
module.exports = Srcapper;

function getNightmare() {
    return Nightmare({
            'ignore-certificate-errors': true,
            'node-integration': false,
            'web-security': false,
            'show': false,
        })
        .on('did-get-redirect-request', function(event, oldUrl, newUrl) {
            console.log('did-get-redirect-request', { event, oldUrl, newUrl });
        })
        .on('crashed', function(event, url) {
            console.log('[Nightmare] crashed', { event, url });
        })
        .on('did-fail-load', function(event) {
            console.log('[Nightmare] did-fail-load', { event });
        })
        .on('new-window', function(event, url) {
            event.preventDefault();
        });
}

function evaluateFunction(type) {
    type = type || 'pornhub';
    let selecter;
    let key;
    switch (type) {
        case 'youporn':
            selecter = 'video source';
            key = 'src';
            break;
        case 'xhamster':
            selecter = 'a.player-container__no-player.xplayer';
            key = 'href';
            break;
        case 'pornhub':
            selecter = '#player video source';
            key = 'src';
    }
    const element = document.querySelector(selecter);
    if (!element) {
        throw new Error('null-element');
    }
    return element[key];
}