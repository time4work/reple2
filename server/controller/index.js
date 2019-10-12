const login = require('./login.controller');
const project = require('./project.controller');
const template = require('./template.controller');
const tag = require('./tag.controller');
const json = require('./json.controller');
const library = require('./library.controller');

module.exports = {
    login,
    project,
    template,
    tag,
    json,
    library,
}