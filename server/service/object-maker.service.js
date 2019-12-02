const cluster = require('cluster');

const { selectProjectJsonSize } = require('../model/json');
const {
    selectProjectTitleTmplSize,
    selectProjectDescriptionTmplSize,
} = require('../model/template');


const processFile = `${__basedir}/server/helper/object-maker-worker.js`;
const processArr = {};


module.exports = {

    createProcess: async projectID => {
        if (processArr.hasOwnProperty(projectID)) {
            return;
        }
        const isValid = await canMakeObjects(projectID)
        console.log(isValid);
        if (!isValid) return;

        // create new cluster node
        const node = initFork(projectID);

        // save it
        processArr[projectID] = {
            start: new Date().getTime(),
            node,
            step: 0,
        };
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

async function canMakeObjects(projectID) {
    return true;
    return selectProjectJsonSize(projectID) >= 1 &&
        selectProjectTitleTmplSize(projectID) >= 1 &&
        selectProjectDescriptionTmplSize(projectID) >= 1;
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