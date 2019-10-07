const { myquery } = require('../helper/mysql');

module.exports = {

    selectProject: async (id, callback) => {
        try {
            const query = "SELECT * FROM project WHERE id = ?";
            const result = await myquery(query, [id]);

            if (callback)
                await callback(result[0]);
            return result[0];

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    selectProjectTags: async (id, callback) => {
        try {
            const query = "SELECT t.name, r.tagID, r.type, t.flag FROM relationTagProject r, tag t WHERE projectID = ? AND t.id = r.tagID";
            const result = await myquery(query, [id]);

            if (callback) await callback(result);
            return result;

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    selectProjectDir: async (projectID, callback) => {
        try {
            const query = ""
                + "	select "
                + "	dir "
                + "	from projectDir "
                + "	where projectID = ?";

            const result = await myquery(query, [projectID]);

            if (callback) await callback(result);
            return result;

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    selectProjectJson: async (projectID, callback) => {
        try {
            const query = ""
                + "	SELECT "
                + " j.name "
                + "	FROM relationProjectJson AS r "
                + " INNER JOIN jsonFiles AS j "
                + " ON r.jsonID = j.id "
                + "	WHERE r.projectID = ?";

            const result = await myquery(query, [projectID]);

            if (callback) await callback(result);
            return result;

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    selectAllJsons: async (callback) => {
        try {
            const query = ""
                + "	SELECT "
                + " * "
                + "	FROM jsonFiles ";

            const result = await myquery(query);

            if (callback) await callback(result);
            return result;

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    selectProjectsRelation: async (callback) => {
        try {
            const result = [];
            const query = "SELECT * FROM project";
            const projects = await myquery(query, []);

            for (var i = 0; i < projects.length; i++) {
                const project = {};
                project.id = projects[i].id;
                project.name = projects[i].name;
                project.tags = { assoc: [], stop: [] };

                const query2 = "SELECT count(*) FROM relationProjectObject WHERE projectID = ?";
                const size = await myquery(query2, [projects[i].id]);
                project.size = size[0]['count(*)'];

                const query3 = "SELECT t.name, r.tagID, r.type FROM relationTagProject r, tag t WHERE projectID = ? AND t.id = r.tagID";
                const tags = await myquery(query3, [projects[i].id]);

                for (var j = 0; j < tags.length; j++) {
                    switch (tags[j].type) {
                        case "negative":
                            project.tags.stop.push(tags[j].name);
                            break;
                        case "positive":
                            project.tags.assoc.push(tags[j].name);
                            break;
                        case "hidden":
                            //do nothing
                            break;
                        case "categories":
                            //do nothing
                            break;
                        default:
                            throw Error("-[!]- Bad relationTagProject type");
                    }
                }
                result.push(project);
            }

            if (callback) await callback(result);
            return result;

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    searchProject: async (name, callback) => {
        try {
            const query = "SELECT * FROM project WHERE name like ?";
            const result = await myquery(query, ['%' + name + '%']);

            if (callback) await callback(result);
            return result;

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    createProject: async (name, callback) => {
        try {
            const query = "INSERT INTO project (`name`) VALUES (?)";
            const result = await myquery(query, [name]);

            if (callback) await callback(result);
            return result;

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    saveProjectDB: async (projID, pack, callback) => { // TODO: needs to be refactored
        try {
            const query = "SELECT * FROM projectDB WHERE projectID = ?";
            const projectDB = await myquery(query, [projID]);

            if (!projectDB || !projectDB.length) {
                query = "INSERT INTO projectDB (projectID, flag) VALUES (?,?)";
                let flag = (pack.db_type == 'localhost') ? 0 : 1;

                projectDB = await myquery(query, [projID, flag]);
                let pdbID = projectDB.insertId;

                if (!flag) {
                    query = "INSERT INTO dbhost (host, user, password, name) VALUES (?,?,?,?)";

                    let host = pack.db_adr,
                        user = pack.db_usr,
                        password = pack.db_pass,
                        name = pack.db_name;
                    if (!host || !user || !password || !name) return;

                    let dbhost = await myquery(query, [host, user, password, name]);
                    let dbhID = dbhost.insertId;

                    query = "UPDATE projectDB SET dbhID = ? WHERE projectID = ?";
                    let updatePDB = await myquery(query, [dbhID, projID]);
                } else {
                    let l_host = pack.db_adr,
                        l_port = pack.db_port,
                        l_user = pack.db_usr,
                        l_password = pack.db_pass,
                        l_name = pack.db_name;

                    let f_host = pack.host_adr
                    f_port = pack.host_port,
                        f_user = pack.host_usr,
                        f_password = pack.host_pass;

                    let f_options = [],
                        l_options = [];

                    if (!l_host || !l_user || !l_password || !l_name) return;
                    if (!f_host || !f_user || !f_password) return;

                    /* foreign ssh host */
                    if (f_port) {
                        query = "INSERT INTO sshhost (host, port, user, password) VALUES (?,?,?,?)";
                        f_options = [f_host, f_port, f_user, f_password];
                    } else {
                        query = "INSERT INTO sshhost (host, user, password) VALUES (?,?,?)";
                        f_options = [f_host, f_user, f_password];
                    }
                    let sshhost = await myquery(query, f_options);
                    let sshhID = sshhost.insertId;

                    /* local db host */
                    if (l_port) {
                        query = "INSERT INTO dbhost (host, port, user, password, name) VALUES (?,?,?,?,?)";
                        let l_options = [l_host, l_port, l_user, l_password, l_name];
                    } else {
                        query = "INSERT INTO dbhost (host, user, password, name) VALUES (?,?,?,?)";
                        let l_options = [l_host, l_user, l_password, l_name];
                    }
                    let dbhost = await myquery(query, l_options);
                    let dbhID = dbhost.insertId;

                    /* project DB config */
                    query = "UPDATE projectDB SET dbhID = ?, sshhID = ? WHERE projectID = ?";
                    let updatePDB = await myquery(query, [dbhID, sshhID, projID]);

                }
            } else { // projectDB exist
                let newflag = (pack.db_type == 'localhost') ? 0 : 1;
                let flag = projectDB[0].flag;

                if (flag != newflag) {// new flag
                    let upd_query = "UPDATE projectDB SET flag = ? WHERE projectID = ?";
                    let result = await myquery(upd_query, [newflag, projID]);
                }

                if (flag) { // ssh host
                    // ...
                } else { // local db host 
                    let dbhID = projectDB[0].dbhID;
                    let dbh_query = "SELECT * FROM dbhost WHERE id = ?";
                    let dbh = await myquery(dbh_query, [dbhID]);
                    let host = pack.db_adr,
                        port = pack.db_port,
                        user = pack.db_usr,
                        password = pack.db_pass,
                        name = pack.db_name;

                    if (dbh[0].host != host) {
                        let upd_query = "UPDATE dbhost SET host = ? WHERE id = ?";
                        let result = await myquery(upd_query, [host, dbhID]);
                    }
                    if (dbh[0].port != port) {
                        if (port) { // some port
                            let upd_query = "UPDATE dbhost SET port = ? WHERE id = ?";
                            let result = await myquery(upd_query, [port, dbhID]);
                        } else { // no port ''
                            if (dbh[0].port) { // if there was some port, and now there is no port
                                let upd_query = "UPDATE dbhost SET port = ? WHERE id = ?";
                                let result = await myquery(upd_query, [null, dbhID]);
                            } else { // there was no port, so it will remain stay null
                                console.log('dbh[0].port');
                                console.log(dbh[0].port);
                            }
                        }
                    }
                    if (dbh[0].user !== user) {
                        let upd_query = "UPDATE dbhost SET user = ? WHERE id = ?";
                        let result = await myquery(upd_query, [user, dbhID]);
                    }
                    if (dbh[0].password !== password) {
                        let upd_query = "UPDATE dbhost SET password = ? WHERE id = ?";
                        let result = await myquery(upd_query, [password, dbhID]);
                    }
                    if (dbh[0].name !== name) {
                        let upd_query = "UPDATE dbhost SET name = ? WHERE id = ?";
                        let result = await myquery(upd_query, [name, dbhID]);
                    }
                }
            }

            if (callback) await callback();
            return;

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    selectProjectDBsshhost: async (id, callback) => {
        try {
            let query = "SELECT * FROM sshhost WHERE id = ?";
            let sshhost = await myquery(query, [id]);
            let result = sshhost[0];

            if (callback)
                await callback(result);
            return result;

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    selectProjectDB: async (id, callback) => {
        try {
            let query = "SELECT * FROM projectDB WHERE projectID = ?";
            let projectDB = await myquery(query, [id]);
            let result = projectDB[0];

            if (callback) await callback(result);
            return result;

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    selectExportLogObjects: async (logID, callback) => {
        try {
            let query = " SELECT * FROM object WHERE DataKey2 = ? ";
            let result = await myquery(query, [logID]);

            if (callback) await callback(result);
            return result;

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    selectExportLog: async (logID, callback) => {
        try {
            const query = " SELECT * FROM exportLog WHERE id = ? ";
            const result = await myquery(query, [logID]);

            if (callback) await callback(result[0]);
            return result[0];

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    selectProjectDBlocalhost: async (id, callback) => {
        try {
            const query = "SELECT * FROM dbhost WHERE id = ?";
            const localhost = await myquery(query, [id]);
            const result = localhost[0];

            if (callback) await callback(result);
            return result;

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    selectProjectLogs: async (projectID, callback) => {
        try {
            const query = ""
                + "	select "
                + "	l.projectID, l.type, l.date, l.id, count(o.id) as `length`"
                + "	from projectLog l"
                + "	left join object as o"
                + "	on o.DataKey1 = l.id"
                + "	where projectID = ?"
                + "	group by l.id";
            const result = await myquery(query, [projectID]);

            if (callback) await callback(result);
            return result;

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    selectProjectUnmappedObjects: async (projectID, callback) => {
        try {
            const query = `
                SELECT * FROM object
                WHERE id in
                (
                    SELECT objectID
                    FROM relationProjectObject
                    WHERE projectID = ?
                )
                AND DataFlag1 IS NULL
                AND DataFlag2 IS NULL
            `;
            const result = await myquery(query, [projectID]);

            if (callback) await callback(result);
            return result;

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    selectProjectReadyObjects: async (objects, callback) => {
        const x = [];
        for (var i = 0; i < objects.length; i++) {
            if (
                objects[i].DataLink2 &&
                objects[i].DataLink3 &&
                objects[i].DataLink4 &&
                objects[i].DataText3
            ) {
                x.push(objects[i]);
            }
        }

        if (callback) await callback(x);
        return x;
    },

    selectProjectReadyObjectLength: async (objects, callback) => {
        let x = 0;
        for (let i = 0; i < objects.length; i++) {
            if (objects[i].DataLink2 && objects[i].DataLink3 && objects[i].DataLink4 && objects[i].DataText3)
                x++;
        }

        if (callback) await callback(x);
        return x;
    },

    selectProjectObjects: async (projectID, callback) => {
        try {
            const query = ""
                + " SELECT *"
                + " FROM object"
                + " WHERE id in"
                + " (SELECT objectID"
                + " FROM relationProjectObject"
                + " WHERE projectID = ?)";
            const result = await myquery(query, [projectID]);

            if (callback) await callback(result);
            return result;

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    selectProjects: async (callback) => {
        try {
            const query = "SELECT * FROM project";
            const result = await myquery(query, []);

            if (callback) await callback(result);
            return result;

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    selectProjectSize: async (id, callback) => {
        try {
            const query = "SELECT count(*) FROM relationProjectObject WHERE projectID = ?";
            const size = await myquery(query, [id]);
            const result = size[0]['count(*)'];

            if (callback)
                await callback(result);
            return result;

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    saveProjectDir: async (projectID, dir, callback) => {
        try {
            let result;
            let query = ""
                + "	select "
                + "	dir "
                + "	from projectDir "
                + "	where projectID = ? ";
            const select = await myquery(query, [projectID]);

            if (select.length > 0) {
                query = ""
                    + "	UPDATE projectDir "
                    + "	SET dir = ? "
                    + "	where projectID = ? ";
                result = await myquery(query, [dir, projectID]);
            } else {
                query = ""
                    + "	INSERT INTO projectDir(dir, projectID)"
                    + "	VALUES "
                    + "	(?,?) ";
                result = await myquery(query, [dir, projectID]);
            }

            if (callback) callback(result);
            return result;

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    saveProjectTags: async (projectID, tags, callback) => {
        try {
            let query = '';
            query = ''
                + "	select r.tagID, r.projectID, type, res.flag "
                + "	from replecon.relationTagProject r "
                + "	left join (select id, name, flag from replecon.tag) as res on res.id = r.tagID "
                + "	where r.projectID = ? order by res.id ";

            const p_t = await myquery(query, [projectID]);

            const p_t_p = [],
                p_t_n = [],
                p_t_h = [],
                p_t_c = [];
            for (let i = 0; i < p_t.length; i++) {
                const tag = p_t[i];
                switch (tag.type) {
                    case "positive":
                        p_t_p.push(tag);
                        break;
                    case "negative":
                        p_t_n.push(tag);
                        break;
                    case "hidden":
                        p_t_h.push(tag);
                        break;
                    case "categories":
                        p_t_c.push(tag);
                        break;
                    default:
                        console.log(" - - - - - W R O N G _ T A G _ T Y P E ");
                        console.log(" - - - - - W R O N G _ T A G _ T Y P E ");
                        console.log(" - - - - - W R O N G _ T A G _ T Y P E ");
                }
            }

            const insert_query = 'insert into '
                + 'relationTagProject(projectID, tagID, type) '
                + 'values(?,?,?)';
            const remove_query = 'DELETE FROM relationTagProject '
                + 'WHERE projectID = ? '
                + 'and tagID = ? '
                + 'and type = ? ';

            for (let i = 0; i < tags.categories.length; i++) {

                const tag = tags.categories[i];
                if (p_t_c.map(e => e.tagID).indexOf(tag) == -1) {
                    await myquery(insert_query, [projectID, tag, 'categories']);
                }
            }
            for (let i = 0; i < p_t_c.length; i++) {

                const tag = p_t_c[i].tagID;
                if (tags.categories.indexOf(tag) == -1) {
                    await myquery(remove_query, [projectID, tag, 'categories']);
                }
            }
            for (let i = 0; i < tags.hidden.length; i++) {

                const tag = tags.hidden[i];
                if (p_t_h.map(e => e.tagID).indexOf(tag) == -1) {
                    await myquery(insert_query, [projectID, tag, 'hidden']);
                }
            }
            for (let i = 0; i < p_t_h.length; i++) {

                const tag = p_t_h[i].tagID;
                if (tags.hidden.indexOf(tag) == -1) {
                    await myquery(remove_query, [projectID, tag, 'hidden']);
                }
            }
            for (let i = 0; i < tags.positive.length; i++) {

                const tag = tags.positive[i];
                if (p_t_p.map(e => e.tagID).indexOf(tag) == -1) {
                    await myquery(insert_query, [projectID, tag, 'positive']);
                }
            }
            for (let i = 0; i < p_t_p.length; i++) {
                const tag = p_t_p[i].tagID;
                if (tags.positive.indexOf(tag) == -1) {
                    await myquery(remove_query, [projectID, tag, 'positive']);
                }
            }
            for (let i = 0; i < tags.negative.length; i++) {

                const tag = tags.negative[i];
                if (p_t_n.map(e => e.tagID).indexOf(tag) == -1) {
                    await myquery(insert_query, [projectID, tag, 'negative']);
                }
            }
            for (let i = 0; i < p_t_n.length; i++) {

                const tag = p_t_n[i].tagID;
                if (tags.negative.indexOf(tag) == -1) {
                    await myquery(remove_query, [projectID, tag, 'negative']);
                }
            }
            result = '321';

            if (callback) await callback(result);
            return result;

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    selectProjectTmpls: async (projID, callback) => {
        try {
            const query = "SELECT res.id, res.title, type FROM relationTmplProject left join (select id, title from tmpl)as res on res.id = tmplID WHERE projectID = ?";
            const result = await myquery(query, [projID]);

            if (callback) await callback(result);
            return result;

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    saveProjectChanges: async (id, name, info, t_tmpls, d_tmpls, jsons, db, callback) => {
        try {
            if (!name) return

            let query = '';
            query = "UPDATE project "
                + "SET name=?, description=? "
                + "WHERE id=?;";
            const base_save = await myquery(query, [name, info, id]);

            if (jsons && jsons.length != 0) {
                query = 'DELETE '
                    + ' FROM relationProjectJson '
                    + ' WHERE projectID = ?';
                const deleted_jsons = await myquery(query, [id]);

                query = 'INSERT INTO '
                    + 'relationProjectJson(projectID, jsonID) '
                    + 'VALUES(?,?)';
                for (let i = 0; i < jsons.length; i++) {
                    const jsons_res = await myquery(query, [id, jsons[i]]);
                }
            }

            query = "select tmplID "
                + "from relationTmplProject "
                + "where projectID = ? and type = 'title'"
            const p_tmpls_res = await myquery(query, [id]);

            const p_tmpls = [];
            for (var i = 0; i < p_tmpls_res.length; i++) {
                await p_tmpls.push(p_tmpls_res[i].tmplID);
            }

            const new_tmpls = [];
            const lost_tmpls = [];

            if (!t_tmpls) t_tmpls = [];

            for (let i = 0; i < t_tmpls.length; i++) {
                if (p_tmpls.indexOf(t_tmpls[i]) < 0)
                    await new_tmpls.push(t_tmpls[i])
            }

            for (let i = 0; i < p_tmpls.length; i++) {
                if (t_tmpls.indexOf(p_tmpls[i]) < 0)
                    await lost_tmpls.push(p_tmpls[i])
            }

            query = 'insert into '
                + 'relationTmplProject(tmplID, projectID, type) '
                + 'values(?,?,?)';
            for (let i = 0; i < new_tmpls.length; i++) {
                const tmpl_res = await myquery(query, [new_tmpls[i], id, 'title']);
            }

            query = "DELETE FROM relationTmplProject "
                + "WHERE tmplID = ? "
                + "and projectID = ? and type = 'title'";
            for (let i = 0; i < lost_tmpls.length; i++) {
                const tmpl_res = await myquery(query, [lost_tmpls[i], id]);
            }

            query = "select tmplID "
                + "from relationTmplProject "
                + "where projectID = ? and type = 'description'"
            const _p_tmpls_res = await myquery(query, [id]);

            const _p_tmpls = [];
            for (let i = 0; i < _p_tmpls_res.length; i++) {
                await _p_tmpls.push(_p_tmpls_res[i].tmplID);
            }

            const _new_tmpls = [];
            const _lost_tmpls = [];

            if (!d_tmpls)
                d_tmpls = [];

            for (let i = 0; i < d_tmpls.length; i++) {
                if (_p_tmpls.indexOf(d_tmpls[i]) < 0)
                    await _new_tmpls.push(d_tmpls[i])
            }
            for (let i = 0; i < _p_tmpls.length; i++) {
                if (d_tmpls.indexOf(_p_tmpls[i]) < 0)
                    await _lost_tmpls.push(_p_tmpls[i])
            }

            query = 'insert into '
                + 'relationTmplProject(tmplID, projectID, type) '
                + 'values(?,?,?)';
            for (let i = 0; i < _new_tmpls.length; i++) {
                const tmpl_res = await myquery(query, [_new_tmpls[i], id, 'description']);
            }

            query = "DELETE FROM relationTmplProject "
                + "WHERE tmplID = ? "
                + "and projectID = ? and type = 'description'";
            for (let i = 0; i < _lost_tmpls.length; i++) {
                const tmpl_res = await myquery(query, [_lost_tmpls[i], id]);
            }

            if (callback) await callback();

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    deleteProject: async (projectID, callback) => {
        try {
            const connection = await POOLCON();
            const query = "DELETE FROM project WHERE id = ?";
            const query2 = "DELETE FROM relationTagProject WHERE projectID = ?";
            const query3 = "DELETE FROM relationTmplProject WHERE projectID = ?";
            const query4 = "DELETE FROM relationProjectOriginal WHERE projectID = ?";
            const query5 = "DELETE FROM projectLog WHERE projectID = ?";
            const query6 = "DELETE FROM exportLog WHERE projectID = ?";

            const res1 = await connection.query(query2, [projectID]);
            const res2 = await connection.query(query3, [projectID]);
            const res3 = await connection.query(query4, [projectID]);
            const res4 = await connection.query(query5, [projectID]);
            const res5 = await connection.query(query6, [projectID]);

            const db_query = "SELECT sshhID, dbhID FROM projectDB WHERE projectID = ?";
            let [projectDB, ...stuff] = await connection.query(db_query, [projectID]);

            if (projectDB[0]) {
                projectDB = projectDB[0];
                if (projectDB.sshhID) {
                    const sshhID_query = "DELETE FROM sshhost WHERE id = ?";
                    const sshh = await connection.query(sshhID_query, [projectDB.sshhID]);
                }
                if (projectDB.dbhID) {
                    const dbhID_query = "DELETE FROM sshhost WHERE id = ?";
                    const dbh = await connection.query(sshhID_query, [projectDB.dbhID]);
                }
            }
            const query7 = "DELETE FROM projectDB WHERE projectID = ?";
            const result7 = await connection.query(query7, [projectID]);

            const query8 = "DELETE FROM projectDir WHERE projectID = ?";
            const result8 = await connection.query(query8, [projectID]);

            const objs_query = "SELECT objectID FROM relationProjectObject WHERE projectID = ?";
            const [projectObjs, ...stuff2] = await connection.query(objs_query, [projectID]);

            const objs_relation_query = "DELETE FROM relationProjectObject WHERE projectID = ?";
            const objs_relation = await connection.query(objs_relation_query, [projectID]);

            if (projectObjs) {
                if (projectObjs.length > 0) {
                    const obj_query = "DELETE FROM object WHERE id = ?";
                    for (var i = 0; i < projectObjs.length; i++) {
                        const [obj, ...stuff3] = await connection.query(obj_query, [projectObjs[i].objectID]);
                    }
                }
            }
            const result = await connection.query(query, [projectID]);

            if (callback) await callback();

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

}