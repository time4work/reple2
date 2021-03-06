const fs = require('fs');
const path = require('path');

const Helper = {
    punctREGEX: /[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-.\/:;<=>?@\[\]^_`{|}~]/g,
     
    punctREGEX2: /[\u2000-\u206F\u2E00-\u2E7F\\"\\/<>\[\]^`{|}]/g,
    
    simpleSort: (a, b) => a > b ? 1 : a < b ? -1 : 0,

    makeid: function (length) {
        const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let text = "";

        if (!length) length = 6

        for (var i = 0; i < length; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    },

    selectDir: (dir, callback) => {
        const result = fs.readdirSync(dir)
            .filter(source =>
                fs.lstatSync(path.join(dir, source)).isDirectory()
            );

        if (callback) callback(result);
        return result;
    },

    isType: function(object, type) {
        if (!object || !type) {
            return false;
        }
        return object.constructor.name === type
    },

    getDataFromLocalJson: function (name, dir) {
        return new Promise((resolve, reject) => {
            const filePath = dir
                ? `${dir}/'${name}`
                : `${__basedir}/json/${name}`;

            fs.readFile(filePath, (err, data) => {
                if (err) reject(err);
                resolve(JSON.parse(data));
            });
        });
    },

    randNumber(from, to) {
        return from + Math.floor(Math.random() * (to + 1 - from));
    },

    randItem(items) {
        const index = Helper.randIndex(items.length);
        return items[index];
    },

    randIndex: function (range) {
        return ~~(Math.random() * range);
    },
};
module.exports = Helper;