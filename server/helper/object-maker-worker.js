console.log('[worker] - start');

global.__basedir = process.env.BASE_DIR;
const Xvfb = require('xvfb');

//================================================MODELS
const { selectProjectJsons } = require('../model/json');
const { selectProjectDir } = require('../model/project');
const {
    selectObjectByLinkAndProject,
    createObject,
    updateObjectProp,
} = require('../model/object');
const { 
    selectProjectTemplatesRelation, 
    selectTemplateById,
} = require('../model/template');
const { selectLibrary } = require('../model/library');

//================================================HELPERS
const { getDataFromLocalJson, isType, randItem } = require('../helper');
const {
    makeActionThumbs,
    makeBaseThumb,
    makeBigThumb,
    getDuration
} = require('./ffmpeg');
const { makeText, makeTemplate, makeLibrary } = require('./text-maker');
const { getVideoLink } = require('./scrapper');

//================================================INIT_VARIABLES
const SCREENS_DEFAULT_DIR = `./screens`;
const JSON_VIDEO_ATTRIBUTE = process.env.VIDEO_ATT || 'video';
const JSON_TAGS_ATTRIBUTE = process.env.TAGS_ATT || 'tags';


const projectID = process.env.PROJECT_ID;
if (!projectID) {
    process.exit(1);
}

let inProcess = true;
const xvfb = new Xvfb();

// event beforeExit
process.on('beforeExit', () => {
    console.log('[worker] - beforeExit');
    process.send({
        type: 'exit',
        projectId: projectID,
    })
    xvfb.stop();
});

process.on('message', function (msg) {
    console.log('[worker] - got a message', msg);
    switch (msg) {
        case 'stop-process':
            inProcess = false;
            break;
    }
});

xvfb.start(async function (err, xvfbProcess) {
    if (err) {
        process.exit('xvfb error', err);
    }
    console.log("[worker] - xvfb.start");
    await __startProcess(projectID); // START
});


async function __startProcess(projectID) {
    // take project jsons
    const jsonRecordList = await selectProjectJsons(projectID);
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

                const object = await __getObject(projectID, pageLink);

                // save tags
                if (!object.DataText4) {
                    const tags = jsonItem[JSON_TAGS_ATTRIBUTE].join(',');
                    await updateObjectProp(object.id, {
                        DataText4: tags,
                    }).then(() => {
                        object.DataText4 = tags;
                    });
                }

                // прорабатываем обьект, пока он не будет готов или забраковон
                let iter = 0;
                do {
                    if (!inProcess) break;
                    if (iter === 6) break; // TODO: mark object as unresolveble
                    if (object.DataFlag2) break;
                    await __updateObject(object);
                    iter++;
                } while (!object.DataFlag3 || object.DataFlag2);
            }

        } else {
            continue;
        }
    }
}

async function __getObject(projectID, pageLink) {
    // create or modify object
    // check if link already exist
    let object = await selectObjectByLinkAndProject(projectID, pageLink)
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
    return object;
}

async function __updateObject(object) {
    // проверяем, надо ли делать превьюхи
    if (!object.DataLink2 ||
        !object.DataLink3 ||
        !object.DataLink4 ||
        !object.DataText3
    ) {
        // 3.1.4 скрапером - тянем линк видео 
        const videoLink = await getVideoLink(object.DataLink1, 'pornhub')
            .catch(async error => {
                console.log("[scrapper] - ", { error });
                if (error === 'null-element') {
                    await updateObjectProp(object.id, {
                        DataFlag2: true,
                    }).then(() => {
                        object.DataFlag2 = true;
                    });
                }
                return;
            });
        console.log("[scrapper] - got link", { videoLink });
        if (!videoLink) return;

        // get project thumb directory
        let projectScreenDir = await selectProjectDir(projectID);
        if (projectScreenDir || !projectScreenDir.length) {
            projectScreenDir = projectScreenDir[0].dir;
        } else {
            projectScreenDir = SCREENS_DEFAULT_DIR;
        }
        console.log("[worker] - projectScreenDir", { projectScreenDir });

        // 3.1.5 ффмпегом - делаем скрины
        if (!object.DataLink2) { // TODO: project settings option, DataLink2 can be null
            console.log('!object.DataLink2');
            const actionThumbs = await makeActionThumbs(videoLink, projectScreenDir);
            await updateObjectProp(object.id, {
                DataLink2: actionThumbs.join(','),
            }).then(() => {
                object.DataLink2 = actionThumbs;
            });
        }

        if (!object.DataLink3) {
            console.log('!object.DataLink3');
            const baseThumb = await makeBaseThumb(videoLink, projectScreenDir);
            await updateObjectProp(object.id, {
                DataLink3: baseThumb,
            }).then(() => {
                object.DataLink3 = baseThumb;
            });
        }

        if (!object.DataLink4) {
            console.log('!object.DataLink4');
            const bigThumb = await makeBigThumb(videoLink, projectScreenDir);
            await updateObjectProp(object.id, {
                DataLink4: bigThumb,
            }).then(() => {
                object.DataLink4 = bigThumb;
            });
        }

        if (!object.DataText3) {
            console.log('!object.DataText3');
            const duration = await getDuration(videoLink);
            await updateObjectProp(object.id, {
                DataText3: duration,
            }).then(() => {
                object.DataText3 = duration;
            });
        }
    }

    // 3.1.7 генерим тайтл и дескрипшин
    // если их нет
    if (!object.DataText1 || !object.DataTitle1) {
        // get text template library
        const tmplLibrary = await selectLibrary();
        console.log("[worker] - selectLibrary", { tmplLibrary });

        const lib = makeLibrary(tmplLibrary);
        console.log("[worker] - makeLibrary", { lib });
        
        if (!object.DataTitle1) {
            console.log('!object.DataTitle1');
            // generate project title tmpl
            const type = 'title';
            const projectTmpl = await __getProjectTmpl(projectID, type);
            console.log("[worker] - ", { projectTmpl });

            const tmpl = makeTemplate(projectTmpl);
            console.log("[worker] - makeTemplate", { tmpl });
            
            const title = makeText(tmpl, lib, 'talk');
            if (!title) {
                console.log("[text-maker] - null title");;
                process.exit();
            }
            console.log("[worker] - makeText", { title });

            await updateObjectProp(object.id, {
                DataTitle1: title,
            }).then(() => {
                object.DataTitle1 = title;
            });
        }
        if (!object.DataText1) {
            // generate project description tmpl
            const type = 'description';
            const projectTmpl = await __getProjectTmpl(projectID, type);
            console.log("[worker] - ", { projectTmpl });

            const tmpl = makeTemplate(projectTmpl);
            const description = makeText(tmpl, lib, 'talk'); // TODO: 'talk' - make it dinamic
            if (!description) {
                console.log("[text-maker] - null description");;
                process.exit();
            }

            await updateObjectProp(object.id, {
                DataText1: description,
            }).then(() => {
                object.DataText1 = description;
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
        console.log('[!] save object - active');

        await updateObjectProp(object.id, {
            DataFlag3: true, // active
        }).then(() => {
            object.DataFlag3 = true;
        });
    }
}

async function __getProjectTmpl(projectID, type) {
    return selectProjectTemplatesRelation(projectID, type)
        .then(async tmpls => await selectTemplateById(randItem(tmpls).tmplID));
} 