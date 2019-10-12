const cluster = require('cluster');

const { selectProjectJsonSize } = require('../model/relationProjectJson');
const { 
    getProjectTitleTmplSize,
    getProjectDescriptionTmplSize,
} = require('../model/relationTmplProject');


const processFile = `${__dirname}/server/helper/object-maker.js`;
const processArr = {};


module.exports = {

    createProcess: async projectID => {
        if (processArr.hasOwnProperty(projectID) ||
            canMakeObjects(projectID)
        ) {
            return;
        }
        // create new cluster node
        const node = initFork(projectID);

        // save it
        processArr[projectID] = {
            start: new Date().getTime(),
            node,
            step: 0,
        };
    },

    stopProcess: async projectID => {
        if (!processArr.hasOwnProperty(projectID)) {
            return;
        }
        processArr[projectID].node.kill('force close');
    },

    getStatus: async projectID => {
        if (!processArr.hasOwnProperty(projectID)) {
            return null;
        }
        const p = processArr[projectID];
        const status = {
            inProcess: true,
            time: p.start - new Date().getTime(),
            step: p.step,
        };
        return status;
    },

};

function canMakeObjects(projectID) {
    return selectProjectJsonSize(projectID) >= 1
        && getProjectTitleTmplSize(projectID) >=1 
        && getProjectDescriptionTmplSize(projectID) >= 1;
}

function initFork(projectID) {
    const node_env = {
        PROJECT_ID: projectID,
    };
    const node = cluster.fork(processFile, null, node_env);

    node.on('message', msg => {
        console.log('[ object-maker node ] : sent a message :', msg);

        const message = JSON.parse(msg);

        switch (message.type) {
            case 'step':
                processArr[projectID].step = message.step;
                break;
            case 'closed':
                node.kill('message closed');
                break;
                
        }
    });

    node.on('error', error => {
        console.log('[ object-maker node ] : There was an error : ', error);
    });

    node.on('exit', (worker, code, signal) => {
        console.log('[ object-maker node ] : exit');
        delete processArr[projectID];
    });

    return node;
}
