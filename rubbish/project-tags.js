	console.log("< project_tags >");
	query = "select r.id, res.id as `tagID`, r.positive from relationTagProject r left join (select id, name from tag) as res on res.id = r.tagID where r.projectID = ? order by res.id";
	let p_t = await myquery(query, [ id ]);
	console.log(p_t);

	var p_t_a = [],
		p_t_s = [];

	for(var i=0; i<p_t.length; i++){
		if(p_t[i].positive == 1)
			await p_t_a.push(p_t[i].tagID);
		else 
			await p_t_s.push(p_t[i].tagID);
	}
	console.log("< p_t_a >");
	console.log(p_t_a);
	console.log("< p_t_s >");
	console.log(p_t_s);
	///////////////////////////////////////////
		var new_p_t_a = [];
		var lost_p_t_a = [];

		for(var i=0;i<tags.assoc.length; i++){
		    if( p_t_a.indexOf(tags.assoc[i]) < 0 )
		        await new_p_t_a.push(tags.assoc[i]);
		}
		for(var i=0;i<p_t_a.length; i++){
		    if( tags.assoc.indexOf(p_t_a[i]) < 0 )
	        	await lost_p_t_a.push(p_t_a[i]);
		}
		console.log("< new_p_t_a >");
		console.log(new_p_t_a);
		console.log("< lost_p_t_a >");
		console.log(lost_p_t_a);
		///////////////////////////////////////////
			var new_p_t_s = [];
			var lost_p_t_s = [];

			for(var i=0;i<tags.stop.length; i++){
			    if( p_t_s.indexOf(tags.stop[i]) < 0 )
			        await new_p_t_s.push(tags.stop[i]);
			}
			for(var i=0;i<p_t_s.length; i++){
			    if( tags.stop.indexOf(p_t_s[i]) < 0 )
		        	await lost_p_t_s.push(p_t_s[i]);
			}
			console.log("< new_p_t_s >");
			console.log(new_p_t_s);
			console.log("< lost_p_t_s >");
			console.log(lost_p_t_s);


			console.log("< tag_res >");
			query = 'insert into '
				+	'relationTagProject(tagID, projectID, positive) '
				+	'values(?,?,?)';
			// for(var a_t in new_p_t_a){
			// 	console.log(a_t);
			// 	positive = 1;
			// 	let tag_res = await myquery(query, [ a_t, id, positive ]);
			// 	console.log(tag_res);
			// }
			for(var i=0; i<new_p_t_a.length;i++){
				console.log(new_p_t_a[i]);
				positive = 1;
				let tag_res = await myquery(query, [ new_p_t_a[i], id, positive ]);
				console.log(tag_res);
			}
			for(var i=0; i<new_p_t_s.length;i++){
				console.log(new_p_t_s[i]);
				positive = 0;
				let tag_res = await myquery(query, [ new_p_t_s[i], id, positive ]);
				console.log(tag_res);
			}
			query = 'DELETE FROM relationTagProject '
				+	'WHERE tagID = ? '
				+	'and projectID = ? '
				+	'and positive = ? ';
			for(var i=0; i<lost_p_t_a.length;i++){
				console.log(lost_p_t_a[i]);
				positive = 1;
				let tag_res = await myquery(query, [ lost_p_t_a[i], id, positive ]);
				console.log(tag_res);
			}
			for(var i=0; i<lost_p_t_s.length;i++){
				console.log(lost_p_t_s[i]);
				positive = 0;
				let tag_res = await myquery(query, [ lost_p_t_s[i], id, positive ]);
				console.log(tag_res);
			}