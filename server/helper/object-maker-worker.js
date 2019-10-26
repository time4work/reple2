console.log('[worker] - start');

global.__basedir = process.env.BASE_DIR;
const Xvfb = require('xvfb');

//================================================MODELS
const { selectProjectJsonNames } = require('../model/relationProjectJson');
const { getProjectDir } = require('../model/projectDir');
const {
    getObjectByLinkAndProject,
    createObject,
    saveObjectProp,
} = require('../model/object');
const { selectProjectTemplates } = require('../model/template');

//================================================HELPERS
const { getDataFromLocalJson, isType, randItem } = require('../helper');
const {
    makeActionThumbs,
    makeBaseThumb,
    makeBigThumb,
    getDuration
} = require('./thumb-maker');
const { makeText, makeTemplate } = require('./text-maker');
const { getLink: getVideoLink } = require('./scrapper');

//================================================INIT_VARIABLES
const SCREENS_DEFAULT_DIR = `./screens`;
const JSON_VIDEO_ATTRIBUTE = process.env.VIDEO_ATT || 'video';


const projectID = process.env.PROJECT_ID;
if (!projectID) {
    process.exit(1);
}

let inProcess = true;
const xvfb = new Xvfb();

// event beforeExit
process.on('beforeExit', () => {
    console.log('[worker] - beforeExit');
    xvfb.stop();
});

process.on('message', function(msg) {
    console.log('[worker] - got a message', msg);
    switch (msg) {
        case 'stop-process':
            inProcess = false;
            break;
    }
    // const message = JSON.parse(stringified);
    // switch (message) {
    //     case 'process':
    //         break;
    // }
});

xvfb.start(async function (err, xvfbProcess) {
    if (err) process.exit('xvfb error', err);
    console.log("[worker] - xvfb.start");

    // take project jsons
    const jsonRecordList = await selectProjectJsonNames(projectID);
    if (!jsonRecordList.length) return;
    console.log("[worker] - jsonRecordList", { jsonRecordList });


    // manage each json in a loop
    for (let i = 0; i < jsonRecordList.length; i++) {
        if (!inProcess) break;
        const jsonRecord = jsonRecordList[i];
        console.log("[worker] - jsonRecord", { jsonRecord });

        const jsonArray = await getDataFromLocalJson(jsonRecord.name);
        console.log("[worker] - jsonArray");

        if (isType(jsonArray, 'Array') && jsonArray.length) {

            // now lets make project objects
            for (let j = 0; j < jsonArray.length; j++) {
                if (!inProcess) break;
                const jsonItem = jsonArray[j];
                console.log("[worker] - jsonItem", { jsonItem });

                // lets get page link
                const pageLink = jsonItem[JSON_VIDEO_ATTRIBUTE];
                console.log("[worker] - pageLink", { pageLink });

                // create or modify object
                // check if link already exist
                let object = await getObjectByLinkAndProject(projectID, pageLink)
                if (object.length) {
                    object = object[0];
                    console.log("[worker] - object exist", { object });
                } else {
                    const createObjectResult = await createObject(projectID, pageLink);
                    object = {
                        id: createObjectResult.insertId,
                        DataLink1: pageLink,
                        FootPrint1: projectID,
                    };
                    console.log("[worker] - new object", { object });
                }

                // прорабатываем обьект, пока он не будет готов или забраковон
                do {
                    if (!inProcess) break;
                    // проверяем, надо ли делать превьюхи
                    if (!object.DataLink2 ||
                        !object.DataLink3 ||
                        !object.DataLink4 ||
                        !object.DataText3
                    ) {
                        // 3.1.4 скрапером - тянем линк видео 
                        const videoLink = await getVideoLink(objects[i].DataLink1)
                            .catch(e => {
                                console.log("[scrapper] - error", { e });
                                process.exit();

                                // await saveObjectProp(objectID, {
                                //     DataFlag2: true,
                                //     DataFlag3: false,
                                // }).then(() => {});
                            });
                        console.log("[scrapper] - got link", { object });

                        // get project thumb directory
                        const projectScreenDir = await getProjectDir(projectID) || SCREENS_DEFAULT_DIR;
                        console.log("[worker] - projectScreenDir", { projectScreenDir });

                        // 3.1.5 ффмпегом - делаем скрины
                        if (!object.DataLink2) { // TODO: project settings option, DataLink2 can be null
                            const actionThumbs = await makeActionThumbs(videoLink, projectScreenDir);
                            object.DataLink2 = actionThumbs;
                            await saveObjectProp(objectID, {
                                DataLink2: actionThumbs.join(','),
                            });
                        }
                        if (!object.DataLink3) {
                            const baseThumb = await makeBaseThumb(videoLink, projectScreenDir);
                            object.DataLink3 = baseThumb;
                            await saveObjectProp(objectID, {
                                DataLink3: baseThumb,
                            });
                        }
                        if (!object.DataLink4) {
                            const bigThumb = await makeBigThumb(videoLink, projectScreenDir);
                            object.DataLink4 = bigThumb;
                            await saveObjectProp(objectID, {
                                DataLink4: bigThumb,
                            });
                        }
                        // 3.1.6 ффмпегом - тянем duration
                        if (!object.DataText3) {
                            const duration = await getDuration(videoLink);
                            object.DataText3 = duration;
                            await saveObjectProp(objectID, {
                                DataText3: duration,
                            });
                        }
                    }

                    // 3.1.7 генерим тайтл и дескрипшин
                    // если их нет
                    if (!object.DataText1 || !object.DataTitle1) {
                        // ! get text template library
                        const tmplLibrary = await selectLibrary();
                        const lib = makeTemplate(tmplLibrary);
                        if (!object.DataTitle1) {
                            // generate project title tmpl
                            const type = 'title';
                            // !
                            const projectTmpls = await selectProjectTemplates(projectID, type);
                            const projectTmpl = randItem(projectTmpls);
                            // !
                            const tmpl = makeTemplate(projectTmpl);
                            // !
                            const title = makeText(tmpl, lib);
                            object.DataTitle1 = title;
                            await saveObjectProp(objectID, {
                                DataTitle1: title,
                            });
                        }
                        if (!object.DataText1) {
                            // generate project description tmpl
                            const type = 'description';
                            const projectTmpls = await selectProjectTemplates(projectID, type);
                            const projectTmpl = randItem(projectTmpls);
                            const tmpl = makeTemplate(projectTmpl);
                            const description = makeText(tmpl, lib);
                            await saveObjectProp(objectID, options = {
                                DataText1: description,
                            });
                        }
                    }

                    // ставим значение active, если все в порядки
                    if (object.DataLink1 && // video link
                        object.DataTitle1 && // title
                        object.DataText1 && // description
                        object.DataLink2 && // action thumbs
                        object.DataLink3 && // baseThumb
                        object.DataLink4 && // bigThumb
                        object.DataText3 && // duration
                        !object.DataFlag2 // and not broken link
                    ) {
                        await saveObjectProp(objectID, {
                            DataFlag3: true, // active
                        }).thne(() => {
                            object.DataFlag3 = true;
                        });;
                    }
                } while (!object.DataFlag3 || object.DataFlag2);

                console.log("[worker] - Bingo !", {object});
                process.exit();
            }

        } else {
            continue;
        }
    }
});
