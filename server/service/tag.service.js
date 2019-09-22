const { myquery } = require('../helper/mysql');

module.exports = {

    selectTags: async (callback) => {
        try {
            const query = "SELECT * FROM tag order by name";
            const result = await myquery(query, []);

            if (callback) await callback(result);
            return result;

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    selectTag: async (id, callback) => {
        try {
            let query = "SELECT * FROM tag WHERE id = ?";
            let result = await myquery(query, [id]);

            if (callback)
                await callback(result);
            return result;

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    createTag: async (name, callback) => {
        try {
            console.log(name);
            let query = "INSERT INTO tag(`name`) VALUES(?)";
            let result = await myquery(query, [name]);

            if (callback)
                await callback(result);
            return result;

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    selectTagsEx: async (callback) => {
        try {
            let query = ""
                + " select r.id, r.name, r.flag, res.syns "
                + " from tag r"
                + " left join"
                + " ("
                + " 	SELECT flag, count(*) as syns"
                + " 	FROM tag"
                + " 	group by flag"
                + " ) as res on r.flag = res.flag"
                + " order by name";
            let result = await myquery(query, []);

            if (callback)
                await callback(result);
            return result;
        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    searchTag: async (name, callback) => {
        try {
            console.log(name);

            let query = "SELECT * FROM tag WHERE name like ?";
            let result = await myquery(query, ['%' + name + '%']);

            if (callback)
                await callback(result);
            return result;

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    deleteTag: async (tagID, callback) => {
        try {
            var query = "DELETE FROM tag WHERE id = ?";
            var query2 = "DELETE FROM relationTagObject WHERE tagID = ?";
            var query3 = "DELETE FROM relationTagOriginal WHERE tagID = ?";
            var query4 = "DELETE FROM relationTagProject WHERE tagID = ?";
            var query5 = "DELETE FROM templateCondition WHERE tagID = ?";

            var result1 = await myquery(query2, [tagID]);
            var result2 = await myquery(query3, [tagID]);
            var result3 = await myquery(query4, [tagID]);
            var result4 = await myquery(query5, [tagID]);
            var result5 = await myquery(query, [tagID]);

            if (callback) await callback();

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    selectNullTags: async (callback) => {
        try {

            let query = ""
                + " select r.id, r.name, r.flag, res.syns"
                + " from tag r"
                + " left join"
                + " ("
                + " 	SELECT flag, count(*) as syns"
                + " 	FROM tag r2"
                + " 	group by flag"
                + " ) as res on r.flag = res.flag "
                + " where res.syns < 2 OR r.flag is null "
                + " order by name";
            let result = await myquery(query, []);

            if (callback)
                await callback(result);
            return result;
        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    selectTagSyns: selectTagSyns = async (id, callback) => {
        try {
            let query = ""
                + " select r.id, r.name "
                + " from tag r "
                + " where r.flag = "
                + " ( "
                + " 	select flag "
                + " 	from tag "
                + " 	where id = ? "
                + " ) "
                + " GROUP BY r.id ";

            let result = await myquery(query, [id]);

            if (callback)
                await callback(result);
            return result;

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    saveTagChanges: async (tagID, name, newsyns, callback) => {
        try {
            await tagNameCheck(tagID, name, async (res) => {
                if (!res)
                    await tagNameUpdate(tagID, name);
            });
            await selectTagSyns(tagID, async (arr) => {
                var newTag = [];
                var lostTag = [];
                for (var i = 0; i < newsyns.length; i++) {
                    if (arr.indexOf(newsyns[i]) < 0)
                        await newTag.push(newsyns[i])
                }
                for (var i = 0; i < arr.length; i++) {
                    if (newsyns.indexOf(arr[i]) < 0)
                        if (arr[i] != tagID)
                            await lostTag.push(arr[i])
                }
                var flag;
                await selectTagFlag(tagID, async (_flag) => {
                    console.log("flag:" + _flag.flag);
                    flag = _flag.flag
                    if (flag == null)
                        await setTagFlag(tagID, async (newflag) => {
                            flag = tagID;
                        });
                    await saveTagSyns({ new: newTag, lost: lostTag }, flag);
                });
            });

            if (callback)
                await callback();
        } catch (e) {
            console.log(e);
            return 0;
        }
    },

}



async function tagNameCheck(tagID, name, callback) {
    try {
        let query = 'SELECT name FROM tag WHERE id = ?';
        let result = await myquery(query, [tagID]);

        var resp = result.name == name;
        if (callback)
            await callback(resp);
        return resp;
    } catch (e) {
        console.log(e);
        return 0;
    }
}


async function tagNameUpdate(tagID, name, callback) {
    try {
        let query = 'UPDATE tag SET name = ? WHERE id = ?';
        let result = await myquery(query, [name, tagID]);

        if (callback)
            await callback(result[0]);
        return result[0];
    } catch (e) {
        console.log(e);
        return 0;
    }
}


async function saveTagSyns(obj, flag, callback) {
    try {
        var newTag = obj.new;
        var lostTag = obj.lost;

        for (var i = 0; i < newTag.length; i++) {
            let query = 'UPDATE tag SET flag = ? WHERE id = ?';
            let result = await myquery(query, [flag, newTag[i]]);
        }
        for (var i = 0; i < lostTag.length; i++) {
            let query = 'UPDATE tag SET flag = null WHERE id = ?';
            let result = await myquery(query, [lostTag[i]]);
        }

        if (callback)
            await callback();
    } catch (e) {
        console.log(e);
        return 0;
    }
}

async function selectTagFlag(tagID, callback) {
    try {
        let query = 'SELECT flag FROM tag WHERE id = ?';
        let result = await myquery(query, [tagID]);

        if (callback)
            await callback(result[0]);
        return result[0];
    } catch (e) {
        console.log(e);
        return 0;
    }
}

async function setTagFlag(tagID, callback) {
    try {
        let query = 'UPDATE tag SET flag = id WHERE id = ?';
        let result = await myquery(query, [tagID]);

        if (callback)
            await callback(result[0]);
        return result[0];
    } catch (e) {
        console.log(e);
        return 0;
    }
}


async function saveTagSyns(obj, flag, callback) {
    try {
        var newTag = obj.new;
        var lostTag = obj.lost;

        for (var i = 0; i < newTag.length; i++) {
            let query = 'UPDATE tag SET flag = ? WHERE id = ?';
            let result = await myquery(query, [flag, newTag[i]]);
        }
        for (var i = 0; i < lostTag.length; i++) {
            let query = 'UPDATE tag SET flag = null WHERE id = ?';
            let result = await myquery(query, [lostTag[i]]);
        }

        if (callback)
            await callback();
    } catch (e) {
        console.log(e);
        return 0;
    }
}