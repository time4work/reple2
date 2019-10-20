const login = require('./login.controller');
const project = require('./project.controller');
const template = require('./template.controller');
const json = require('./json.controller');
const library = require('./library.controller');

module.exports = {
    login,
    project,
    template,
    json,
    library,
}