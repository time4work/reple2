const { myquery, chilpool } = require('../helper/mysql');
const { makeid } = require('../helper');

async function createExportLog(projectID, callback) {
    try {
        const query = ""
            + " insert into "
            + " exportLog(projectID, date) "
            + " values( ?, NOW() ) ";

        let result = await myquery(query, [projectID]);
        result = result.insertId;

        if (callback) await callback(result);
        return result;

    } catch (e) {
        console.log(e);
        return 0;
    }
}

async function postmetaInsert(connection, postID, key, value, callback) {
    try {
        const query = ""
            + " INSERT INTO wp_postmeta("
            + " post_id, "
            + " meta_key, "
            + " meta_value "
            + " ) VALUES (?,?,?); "

        const result = await connection.query(query, [postID, key, value]);

        if (callback) await callback(result[0]);
        return result[0];

    } catch (e) {
        console.log(e);
        return 0;
    }
}

module.exports = {

    selectExportLogs: async (projectID, callback) => {
        try {
            const query = " SELECT * FROM exportLog WHERE projectID = ? ";
            const result = await myquery(query, [projectID]);

            if (callback) await callback(result);
            return result;

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    exportObjects: async (projectID, db_params, objects, callback) => {
        try {
            const connection = await chilpool(db_params);
            var query = ""
                + " INSERT INTO wp_posts("

                + " post_author, "
                + " post_status, "
                + " comment_status, "
                + " ping_status, "

                + " menu_order, "
                + " post_type, "
                + " comment_count,"
                + " post_parent,"

                + " post_date, "
                + " post_date_gmt, "
                + " post_modified, "
                + " post_modified_gmt, "

                + " post_content,"
                + " post_title, "
                + " post_name, "
                + " guid, "

                + " to_ping,"
                + " post_excerpt,"
                + " pinged,"
                + " post_content_filtered,"
                + " post_password "
                + " ) VALUES ("
                + " '1','publish','open','open', "
                + " '0', 'post', '0', '0', "

                + " (now() - INTERVAL ? MINUTE),"//date
                + " (now() - INTERVAL ? MINUTE),"//date
                + " (now() - INTERVAL ? MINUTE),"//date
                + " (now() - INTERVAL ? MINUTE),"//date

                + " ?," //'descr'
                + " ?, "//'title'
                + " ?,"//'convert title'
                + " ?, "//link

                + " '','','','','' "
                + " ) ";
            var query2 = ""
                + " UPDATE object SET "
                + " DataFlag1=1, "
                + " DataKey2=? "
                + " WHERE id=? ";
            var query3 = ""
                + " UPDATE object SET "
                + " DataTitle2=? "
                + " WHERE id=? ";

            var logID = await createExportLog(projectID);

            for (var i = 0; i < objects.length; i++) {
                const nameID = makeid(8) + objects[i].id;
                await myquery(query3, [nameID, objects[i].id]); // save foreign nameID | DataTitle2

                const objResult = await connection.query(query, [
                    (5 * i + i),
                    (5 * i + i),
                    (5 * i + i),
                    (5 * i + i),
                    objects[i].DataText1,
                    objects[i].DataTitle1,
                    nameID,
                    // .toLowerCase()
                    // .replace(punctREGEX, '')
                    // .replace(/(^\s*)|(\s*)$/g, '')
                    // .replace(/\s+/g,'-'),
                    "no link"
                ]);

                const duration = objects[i].DataText3,
                    thumbs = objects[i].DataLink2,
                    base_thumb = objects[i].DataLink3,
                    big_thumb = objects[i].DataLink4,
                    donor_id = 111,
                    link = objects[i].DataLink1,
                    focuskw = objects[i].DataTitle1.toLowerCase(),
                    title = objects[i].DataTitle1.replace(/\b\w/g, l => l.toUpperCase()),
                    metadesc = objects[i].DataTitle1.replace(/\b\w/g, l => l.toUpperCase());

                await postmetaInsert(connection, objResult[0].insertId, 'duration', duration);
                await postmetaInsert(connection, objResult[0].insertId, "thumbs", thumbs);
                await postmetaInsert(connection, objResult[0].insertId, "base_thumb", base_thumb);
                await postmetaInsert(connection, objResult[0].insertId, "big_thumb", big_thumb);
                await postmetaInsert(connection, objResult[0].insertId, "donor_id", donor_id);
                await postmetaInsert(connection, objResult[0].insertId, "link", link);
                await postmetaInsert(connection, objResult[0].insertId, "_yoast_wpseo_focuskw", focuskw);
                await postmetaInsert(connection, objResult[0].insertId, "_yoast_wpseo_title", title);
                await postmetaInsert(connection, objResult[0].insertId, "_yoast_wpseo_metadesc", metadesc);

                await myquery(query2, [logID, objects[i].id]);
            }
            connection.end();
            result = '';

            if (callback) await callback(result);
            return result;

        } catch (e) {
            console.log(e);
            return;
        }
    },

}


async function mapTheTagToObject(connection, tag, type, objectID) {

    const tag_query = "select term_id from wp_terms where name = ?";
    // let new_taxonomy_query = 'select term_id from wp_terms where name = ?'

    const new_tag_query = "insert into wp_terms"
        + " (name, slug, term_group) "
        + " VALUES (?, ?, 0) ";

    const search_taxonomy_query = "select * from wp_term_taxonomy where term_id = ? AND taxonomy = ?";
    // INSERT INTO wp_term_taxonomy (term_taxonomy_id, term_id, taxonomy, description, parent, count) VALUES (?,?,?,0,?)
    const taxonomy_query = "insert into wp_term_taxonomy"
        + " (term_taxonomy_id, term_id, taxonomy, description, parent, count) "
        + " VALUES (?,?,?,?,0,?) ";
    const increment_taxonomy_query = ""
        + "	UPDATE wp_term_taxonomy "
        + "	SET count = ? "
        + "	where term_taxonomy_id = ? ";
    const taxonomy_max_id = ''
        + "	SELECT MAX(term_taxonomy_id) as `max` FROM wp_term_taxonomy ";

    const relation_query = "insert into wp_term_relationships"
        + " (object_id, term_taxonomy_id, term_order) "
        + " VALUES (?, ?, 0) ";


    let foreignTagId = await connection.query(tag_query, [
        tag.name
    ]);

    if (foreignTagId[0] != 0) { // we catched the foreign Tag
        const taxonomy = await connection.query(search_taxonomy_query, [
            foreignTagId[0][0].term_id,
            type
        ]);

        if (taxonomy[0].length === 0) {
            const taxon__last_max = await connection.query(taxonomy_max_id, []);
            const taxon_max = taxon__last_max[0][0].max + 1;

            //, term_taxonomy_id, term_id, taxonomy, description, count
            const new_taxonomy = await connection.query(taxonomy_query, [
                taxon_max,
                foreignTagId[0][0].term_id,
                type, //'post_tag',
                '',
                1
            ]);

            if (objectID) {
                const taxonomyID = new_taxonomy[0].insertId;
                const res = await connection.query(relation_query, [
                    objectID,
                    taxonomyID
                ]);
            }
        } else {
            if (objectID) {
                const taxonomyID = taxonomy[0][0].term_taxonomy_id;
                const taxonomyCount = taxonomy[0][0].count;
                const res = await connection.query(relation_query, [
                    objectID,
                    taxonomyID
                ]);
                const increment_query = await connection.query(increment_taxonomy_query, [
                    taxonomyCount + 1,
                    taxonomyID
                ]);
            }
        }

    } else {
        const res2 = await connection.query(new_tag_query, [
            tag.name,
            tag.name
                .toLowerCase()
                .replace(punctREGEX, '')
                .replace(/(^\s*)|(\s*)$/g, '')
                .replace(/\s+/g, '_')
        ]);

        const taxon__last_max = await connection.query(taxonomy_max_id, []);
        const taxon_max = taxon__last_max[0][0].max + 1;

        foreignTagId = res2[0].insertId;
        //, term_taxonomy_id, term_id, taxonomy, description, count
        const taxonomy = await connection.query(taxonomy_query, [
            taxon_max,
            foreignTagId,
            'post_tag',
            '',
            1
        ]);

        if (objectID) {
            const taxonomyID = taxonomy[0].insertId;
            const res = await connection.query(relation_query, [
                objectID,
                taxonomyID
            ]);
        }
    }
}

async function bindTheTagToObject(connection, tag, type, objectID) {
    const tag_query = "SELECT term_id FROM wp_terms WHERE name = ?";
    const search_taxonomy_query = ""
        + "	SELECT * FROM wp_term_taxonomy "
        + "	WHERE term_id = ? AND taxonomy = ?";
    const taxonomy_max_id = ""
        + "	SELECT MAX(term_taxonomy_id) as `max` "
        + "	FROM wp_term_taxonomy ";
    const increment_taxonomy_query = ""
        + "	UPDATE wp_term_taxonomy "
        + "	SET count = ? "
        + "	WHERE term_taxonomy_id = ? ";
    const relation_query = ""
        + "	INSERT into wp_term_relationships"
        + "	(object_id, term_taxonomy_id, term_order) "
        + "	VALUES (?, ?, 0) ";

    const foreignTagId = await connection.query(tag_query, [
        tag.name
    ]);
    if (foreignTagId[0] != 0) { // we catched the foreign Tag 
        const taxonomy = await connection.query(search_taxonomy_query, [
            foreignTagId[0][0].term_id,
            type
        ]);
        if (taxonomy[0].length == 0) {
            console.log(" ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! !");
            console.log(" !    The is no wp_term_taxonomy     !");
            console.log(" ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! !");
        } else {
            const taxonomyID = taxonomy[0][0].term_taxonomy_id;
            const taxonomyCount = taxonomy[0][0].count;
            const res = await connection.query(relation_query, [
                objectID,
                taxonomyID
            ]);
            const increment_query = await connection.query(increment_taxonomy_query, [
                taxonomyCount + 1,
                taxonomyID
            ]);
        }
    }
    else {
        console.log(" ! ! ! ! ! ! ! ! ! ! ! ! ! !");
        console.log(" !    The is no term_id    !");
        console.log(" ! ! ! ! ! ! ! ! ! ! ! ! ! !");
    }
}