const cluster = require('cluster');

const { selectProjectJsonSize } = require('../model/relationProjectJson');
const {
    getProjectTitleTmplSize,
    getProjectDescriptionTmplSize,
} = require('../model/relationTmplProject');


const processFile = `${__basedir}/server/helper/object-maker.js`;
// const processFile = `./server/helper/test.js`;
const processArr = {};


module.exports = {

    createProcess: projectID => {
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
        return node;
    },

    stopProcess: projectID => {
        if (!processArr.hasOwnProperty(projectID)) {
            return;
        }
        processArr[projectID].node.kill('force close');
    },

    getStatus: projectID => {
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
        && getProjectTitleTmplSize(projectID) >= 1
        && getProjectDescriptionTmplSize(projectID) >= 1;
}

function initFork(projectID) {
    cluster.setupMaster({
        exec: processFile,
    });
    const worker = cluster.fork({
        PROJECT_ID: projectID,
        BASE_DIR: __basedir
    });

    worker.on('message', msg => {
        console.log('[ object-maker node ] : sent a message :', msg);
        // const message = JSON.parse(msg);
        // switch (message.type) {
        //     case 'step':
        //         processArr[projectID].step = message.step;
        //         break;
        //     case 'closed':
        //         worker.kill('message closed');
        //         break;
        // }
    });

    worker.on('error', error => {
        console.log('[ object-maker node ] : There was an error : ', error);
    });

    worker.on('exit', (worker, code, signal) => {
        console.log('[ object-maker node ] : exit');
        delete processArr[projectID];
    });

    return worker;
}
