const { randNumber } = require('../helper');

const DEFAULT_START_KEY = 'talk';
const TEMPLATE_REGEX = /<\w*>/ig; // <...>
const TEMPLATE_QMARK_REGEX = /[<>]*/g; // <>
const LIBRARY_REGEX = /\[\w*\]/ig; // [...]
const LIBRARY_QMARK_REGEX = /[\[\]]*/g // []

const TextMaker = {
    makeText: function (template, library, start) {
        start = start || DEFAULT_START_KEY
        let result = templateParse(template[start], template);
        if (library, library.length)
            result = libraryKeyParse(result, library);
        return result;

    },

    makeTemplate: function (arr) {
        const tmpl = {};
        for (item of arr) {
            if (tmpl[item.keyword]) {
                tmpl[item.keyword].push(item.val);
            } else {
                tmpl[item.keyword] = [item.val];
            }
        }
        return tmpl;
    },

    makeLibrary(arr) {
        const lib = {};
        for (item of arr) {
            if (lib[item.key]) {
                lib[item.key].push(item.value);
            } else {
                lib[item.key] = [item.value];
            }
        }
        return lib;
    }
};
module.exports = TextMaker;

function templateParse(e, obj) {
    if (Array.isArray(e)) {
        if (e.length == 0)
            return null;
        else {
            let promis = null;
            do {
                const rand = randNumber(0, e.length - 1);
                promis = templateParse(e[rand], obj);
                e.splice(rand, 1);
            } while (!promis && e.length)

            if (!promis) return null;
            return promis;
        }
    }
    else {
        if (/<\w*>/i.test(e)) {
            let result = '';
            let last_pos = 0;
            let foo;
            while (foo = TEMPLATE_REGEX.exec(e)) {
                result += e.substring(last_pos, foo.index);

                const ind = foo[0].replace(TEMPLATE_QMARK_REGEX, '');
                result += templateParse(obj[ind], obj);
                last_pos = TEMPLATE_REGEX.lastIndex;
            }
            result += e.substring(last_pos, e.length);
            return result;
        } else {
            return e;
        }
    }
}


function libraryKeyParse(e, lib) {
    if (Array.isArray(e)) {
        if (e.length == 0) {
            return null;
        } else {
            let promis = null;
            do {
                const rand = randNumber(0, e.length - 1);
                promis = libraryKeyParse(e[rand], lib);
                e.splice(rand, 1);
            } while (!promis && e.length)

            if (!promis) return null;
            return promis;
        }
    } else {
        if (/\[\w*\]/i.test(e)) {
            let result = '';
            let last_pos = 0;
            let foo;
            while (foo = LIBRARY_REGEX.exec(e)) {
                result += e.substring(last_pos, foo.index);

                const ind = foo[0].replace(LIBRARY_QMARK_REGEX, '');
                result += libraryKeyParse(lib[ind], lib);
                last_pos = LIBRARY_REGEX.lastIndex;
            }
            result += e.substring(last_pos, e.length);
            return result;
        } else {
            return e;
        }
    }
}