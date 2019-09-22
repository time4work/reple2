////////////////////////////////////////////////////////
//////////////////thumbMaker///////////////////////////
//////////////////////////////////////////////////////
const scraperModule = require('./scraper');
// const scraperModule     = require('./scraper-light');
const ffmpegModule = require('./ffmpeg');
const ASYNSQL = require('./mysql').asynccon;
const Xvfb = require('xvfb');
let thumbManager = class {
    constructor(io) {
        this.io = io;
        // this.dir = dir;
        // this.idArr = [];
        this.processArr = {};
        // this.timer = new Date().toString(); 
        // console.log(this.timer);
        // this.io.emit('notify', data);
    }
    async createProcess(projectID, dir, objects) {
        // if(time)
        this.timer = new Date().getTime();
        if (this.processArr.hasOwnProperty(projectID))
            return 'TM alredy busy with process[' + projectID + ']'
        let process = await new thumbMaker(dir, this.io);
        this.processArr[projectID] = {
            id: projectID,
            tm: process,
        };
        this.processArr[projectID].tm.make(objects, async () => {
            delete this.processArr[projectID];
        });
        return 'TM process was created';
    }
    test(projectID) {
        return this.processArr;
    }
    async getStatus(projectID) {
        if (!this.processArr.hasOwnProperty(projectID))
            return 'no process[' + projectID + '] in TM'
        let status = await this.processArr[projectID].tm.getStatus()
        let step = await this.processArr[projectID].tm.getIterator()
        if (!status) await this.stopProcess(projectID);
        return {
            status: status,
            step: step,
            time: this.timer - new Date().getTime(),
        }
    }
    async stopProcess(projectID) {
        if (!this.processArr.hasOwnProperty(projectID))
            return 'no process[' + projectID + '] in TM'
        await this.processArr[projectID].tm.kill();
        // remove process
        delete this.processArr[projectID];
        return 'the process[' + projectID + '] was terminated'
    }
}
///////////////////////////////////////////
var thumbMaker = class {
    constructor(dir, io) {
        this.io = io;
        this.dir = dir;
        this.process = false;
        this.xvfb = new Xvfb();
        this.iterator = 0;
    }
    kill() {
        this.process = false;
    }
    getStatus() {
        return this.process;
    }
    getIterator() {
        return this.iterator;
    }
    // main
    async make(objects, callback) {
        try {
            if (this.process)
                return;
            this.process = true;
            this.xvfb.startSync();
            console.log('._._._.');
            for (var i = 0; i < objects.length; i++) {
                this.iterator = i;
                //  simpleThumbsNames
                // 	baseThumbName
                // 	bigThumbName
                // 	duration
                var namePrefix = makeid(8);

                console.log('catch obj [' + i + ']');

                if (!this.process) {
                    break;
                    if (callback) await callback();
                }
                console.log(objects[i]);

                if (!objects[i].DataLink2 || !objects[i].DataLink3 || !objects[i].DataLink4) {
                    const that = this;
                    await scraperModule.getLink(objects[i].DataLink1)
                        .then((result) => {
                            console.log(' -> result video link');
                            console.log(result);
                            this.io.emit('notify', {
                                title: 'nightmare video link',
                                messages: result
                            });
                            if (result) this.videolink = result;

                        }, function (e) {
                            console.error('TM reject ' + e);
                            that.io.emit('notify', {
                                title: "TM reject",
                                messages: e
                            });
                            return;
                        })
                        .then(async () => { // do makeBaseThumb
                            console.log(' --> do baseThumb');
                            if (this.videolink && !objects[i].DataLink3) {
                                let res = await this.makeBaseThumb(namePrefix);
                                if (res) {
                                    this.duration = res.duration;
                                    this.baseThumbName = res.name;
                                    return res;
                                }
                            }
                            return 0;
                        })
                        .then(async (params) => { // save makeBaseThumb,duration
                            console.log(' ---> save baseThumb');
                            if (params) {
                                await this.saveBaseThumb(objects[i].id);

                                if (!objects[i].DataText3)
                                    await this.saveDuration(objects[i].id);
                            }
                        })
                        .then(async () => {  // do bigThumbName
                            console.log(' --> do bigThumb');
                            if (this.videolink && !objects[i].DataLink4) {
                                let res = await this.makeBigThumb(namePrefix);
                                if (res) {
                                    this.duration = res.duration;
                                    this.bigThumbName = res.name;
                                    return res;
                                }
                            }
                            return 0;
                        })
                        .then(async (params) => {  // save bigThumbName,
                            console.log(' ---> save bigThumb');
                            if (params) {
                                await this.saveBigThumb(objects[i].id);

                                // if(!objects[i].DataText3)
                                //     await this.saveDuration(objects[i].id);
                            }
                        })
                        .then(async () => { // do makeSimpleThumbs
                            console.log(' --> do simpleThumbs');
                            if (this.videolink) {
                                let res = await this.makeSimpleThumbs(namePrefix);
                                if (res) {
                                    this.duration = res.duration;
                                    this.simpleThumbNames = res.names;
                                    return res;
                                }
                                // return [simpleThumbsNames,duration] = await this.makeThumbs();
                                // return await this.makeSimpleThumbs();
                            }
                            return 0;
                        })
                        .then(async (params) => { // save simpleThumbsNames,
                            console.log(' ---> save simpleThumbs');
                            if (params) {
                                await this.saveSimpleThumbs(objects[i].id);
                                // if(!objects[i].DataText3)
                                //     await this.saveDuration(objects[i].id);
                            }
                        })
                        .catch(err => {
                            console.error("TM reject ");
                            console.log(err);
                            this.io.emit('notify', {
                                title: "Thumb-Maker Error",
                                messages: err
                            });
                        });
                }

            }
            this.xvfb.stopSync();
            this.process = false;
            if (callback) await callback();
        } catch (e) {
            console.log(e);
            this.io.emit('notify', {
                title: "thumb-maker catch",
                messages: e
            });
            return 0;
        }
    }
    // save duration
    async saveDuration(objectID) {
        return await addDurationToObject(objectID, this.duration);
    }
    // save Thumbs
    async saveSimpleThumbs(objectID) {
        let text = this.simpleThumbNames.join(',');
        return await addSimpleThumbsToObject(objectID, text);
    }
    async saveBaseThumb(objectID) {
        return await addBaseThumbToObject(objectID, this.baseThumbName);
    }
    async saveBigThumb(objectID) {
        return await addBigThumbToObject(objectID, this.bigThumbName);
    }
    // make Thumbs
    async makeSimpleThumbs(namePrefix) {
        return await ffmpegModule.makeSimpleThumbs(this.videolink, namePrefix, this.dir);
    }
    async makeBaseThumb(namePrefix) {
        return await ffmpegModule.makeBaseThumb(this.videolink, namePrefix, this.dir);
    }
    async makeBigThumb(namePrefix) {
        return await ffmpegModule.makeBigThumb(this.videolink, namePrefix, this.dir);
    }
};
async function myquery(query, params, callback) { // !
    try {
        const connection = await ASYNSQL(); // !
        let result = await connection.execute(query, params); // !
        connection.end();

        if (callback)
            await callback(result, params); // !
        return result[0];

    } catch (e) {
        console.log(e);
        return 0;
    }
};
async function addDurationToObject(objectID, text) {
    try {
        let query = "UPDATE object"
            + " SET DataText3 = ?"
            + " WHERE id = ? ";
        let result = await myquery(query, [text, objectID]);
        console.log('addDurationToObject');
        console.log(result);

        return result;
    } catch (e) {
        console.log(e);
        return 0;
    }
}
async function addSimpleThumbsToObject(objectID, text) {
    try {
        let query = "UPDATE object"
            + " SET DataLink2 = ?"
            + " WHERE id = ? ";
        let result = await myquery(query, [text, objectID]);
        console.log('addSimpleThumbsToObject');
        console.log(result);

        return result;
    } catch (e) {
        console.log(e);
        return 0;
    }
}
async function addBaseThumbToObject(objectID, text) {
    try {
        let query = "UPDATE object"
            + " SET DataLink3 = ?"
            + " WHERE id = ? ";
        let result = await myquery(query, [text, objectID]);
        console.log('addBaseThumbToObject');
        console.log(result);

        return result;
    } catch (e) {
        console.log(e);
        return 0;
    }
}
async function addBigThumbToObject(objectID, text) {
    try {
        let query = "UPDATE object"
            + " SET DataLink4 = ?"
            + " WHERE id = ? ";
        let result = await myquery(query, [text, objectID]);
        console.log('addBigThumbToObject');
        console.log(result);

        return result;
    } catch (e) {
        console.log(e);
        return 0;
    }
}
function makeid(length) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    if (!length) length = 6

    for (var i = 0; i < length; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}
module.exports = thumbManager;

// module.exports.thumbManager = thumbManager;