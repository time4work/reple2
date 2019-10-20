global.__basedir = process.env.BASE_DIR;

const Xvfb = require('xvfb');
//================================================MODELS
const { selectProjectJsonNames } = require('../model/relationProjectJson');
const { getProjectDir } = require('../model/projectDir');
const { 
    getObjectByLinkAndProject,
    createObject,
} = require('../model/object');
//================================================HELPERS
const { getDataFromLocalJson, isType } = require('../helper');
// const Tree = require('./tree');
// const { getLink } = require('./scrapper');
//================================================INIT_VARIABLES
const DEFAULT_DIR = `./screens`;
const projectID = process.env.PROJECT_ID;
const xvfb = new Xvfb();
//================================================PROCESS
// event beforeExit
process.on('beforeExit', () => {
    xvfb.stop();
});

if (!projectID) {
    process.exit('no projectID found');
}

xvfb.start(async function (err, xvfbProcess) {
    if (err) process.exit('xvfb error', err);

    // take project jsons
    const jsonRecordList = await selectProjectJsonNames(projectID);
    if (!jsonRecordList.length) return;

    // get project thumb directory
    const projectScreenDir = await getProjectDir(projectID) || DEFAULT_DIR;

    // manage each json in a loop
    for (let i=0; i<jsonRecordList.length; i++) {
        const jsonRecord = jsonRecordList[i];
        const jsonArray = await getDataFromLocalJson(jsonRecord.name);

        if (isType(jsonArray, 'Array') && jsonArray.length) {

            process.exit();

            // now lets make project objects
            for(let j=0; j<jsonArray.length; j++) {
                const jsonItem = jsonArray[j];

                // lets get page link
                const pageLink = jsonItem.link;

                // create or modify object
                // check if link already exist
                // if yes - check if complite
                // if not - create new one
                let object = getObjectByLinkAndProject(projectID, pageLink)
                if (object.length) {
                    object = object[0];
                } else {
                    object = createObject(projectID, pageLink);
                }

                // TODO:
                // 3.1.4 скрапером - тянем линк видео 
                // 3.1.5 ффмпегом - делаем скрины
                // 3.1.6 дописываем в базу
                // 3.1.7 генерим тайтл и дескрипшин
                // 3.1.8 пишем в базу
            }

        } else  {
            continue;
        }
    }
});
