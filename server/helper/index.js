const fs = require('fs');
const path = require('path');

module.exports = {

    makeid: function (length) {
        const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let text = "";

        if (!length) length = 6

        for (var i = 0; i < length; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    },

    selectDir: (dir, callback) => {
        try {
            const result = fs
                .readdirSync(dir)
                .filter(source =>
                    fs.lstatSync(path.join(dir, source)).isDirectory()
                );

            if (callback) callback(result);
            return result;

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    isType: function(object, type) {
        if (!object || !type) {
            return false;
        }
        return object.constructor.name === type
    },

    getDataFromLocalJson: function (name) {
        return new Promise((resolve, reject) => {
            const filePath = `./json/'${name}`;

            fs.readFile(filePath, (err, data) => {
                if (err) reject(err);
                resolve(JSON.parse(data));
            });
        });
    }
}