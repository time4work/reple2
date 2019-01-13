function templateParse(e, obj){
	var regexp = /<\w*>/ig;
	li = document.createElement('li');
	li.appendChild(document.createTextNode(' - element:  '));
	li.appendChild(document.createTextNode(e));
	$('section.p-console ul.output').append( li );
	console.log('- e: '+e);

	if ( Array.isArray(e) ){
		return templateParse( rand(e), obj);
	}
	else{
		if( /<\w*>/i.test(e) ){
			var result = '';
			var last_pos = 0;
			while ( foo = regexp.exec(e)) {
				result += e.substring(last_pos,foo.index);
				
				var ind = foo[0].replace(/[<>]*/g,'');
				result += templateParse( obj[ind], obj);
				last_pos = regexp.lastIndex;
				console.log('[ result ]: '+result);
			}
			result += e.substring(last_pos,e.length);
			return result;
		}else{
			return e;
		}
	}
}
function libraryKeyParse(e, lib){
	var regexp = /\[\w*\]/ig;
	li = document.createElement('li');
	li.appendChild(document.createTextNode(' - element:  '));
	li.appendChild(document.createTextNode(e));
	$('section.p-console ul.output').append( li );
	console.log('- e: '+e);

	if ( Array.isArray(e) ){
		return libraryKeyParse( rand(e), lib);
	}
	else{
		if( /\[\w*\]/i.test(e) ){
			var result = '';
			var last_pos = 0;
			while ( foo = regexp.exec(e)) {
				result += e.substring(last_pos,foo.index);
				
				var ind = foo[0].replace(/[\[\]]*/g,'');
				result += libraryKeyParse( lib[ind], lib );
				last_pos = regexp.lastIndex;
				console.log('[ result ]: '+result);
			}
			result += e.substring(last_pos,e.length);
			return result;
		}else{
			return e;
		}
	}
}
// calculate number of tmpl probabilities 
function tmplProbabilities(e, obj, lib){
	var regexp = /<\w*>/ig;

	if ( Array.isArray(e) ){ // if e - array
		var probability = 0;
		for(var i=0;i<e.length;i++){
			probability += tmplProbabilities( e[i], obj, lib);
		}
		return probability;
	}
	else{	
		if( /<\w*>/i.test(e) ){ // if e - string with keys
			var arr = [];
			while ( foo = regexp.exec(e)) {
				var key = foo[0].replace(/[<>]*/g,'');
				arr.push( tmplProbabilities(obj[key], obj, lib) );
			}
			return arr.reduce(function(prev, next) {
				return prev * next;
			});
		}else{ // if e - string
			return 1;
		}
	}
}
// calculate number of lib probabilities 
function libProbabilities(e, obj, lib){
	var regexp = /\[\w*\]/ig;

	if ( Array.isArray(e) ){ // if e - array
		// var probability = 0;
		// for(var i=0;i<e.length;i++){
		// 	probability += tmplProbabilities( e[i], obj, lib);
		// }
		// return probability;
		return e.length;
	}
	else{	
		if( /\[\w*\]/i.test(e) ){
			var arr = [];
			while ( foo = regexp.exec(e)) {
				var key = foo[0].replace(/[\[\]]*/g,'');
				arr.push( tmplProbabilities(obj[key], obj, lib) );
			}
			return arr.reduce(function(prev, next) {
				return prev * next;
			});
		}else{ // if e - string
			return 0;
		}
	}
}
function rand(items){
    return items[~~(Math.random() * items.length)];
}
function parseTmplObj(json){
	var tmpl = {};

	Object.keys(json).forEach( function(key){
		tmpl[key] = [];

		let values = json[key].values;
		for(var i=0; i<values.length; i++){
			tmpl[key].push(values[i].value);
		}
	} );
	// var tmpl_arr= json.map((item)=>{
	// 	var obj = {};
	// 	obj[item['keyword']] = [];
	// 	return obj;
	// });
	// var tmpl = {};
	// Array.prototype.forEach.call(tmpl_arr,function(elem) {
	//    var keys = Object.keys(elem);
	//    tmpl[keys[0]] = elem[keys[0]];
	// });
	// for(var i=0; i<json.length; i++){
	// 	var key = json[i]['keyword'];
	// 	var val = json[i]['val'];
	// 	// console.log(key);
	// 	// console.log(val);
	// 	tmpl[key].push(val);
	// }
	// console.log('tmpl');
	// console.log(tmpl);
	return tmpl;
}

// function parseTmplObj(json){
// 	var tmpl_arr= json.map((item)=>{
// 		var obj = {};
// 		obj[item['keyword']] = [];
// 		return obj;
// 	});
// 	var tmpl = {};
// 	Array.prototype.forEach.call(tmpl_arr,function(elem) {
// 	   var keys = Object.keys(elem);
// 	   tmpl[keys[0]] = elem[keys[0]];
// 	});
// 	for(var i=0; i<json.length; i++){
// 		var key = json[i]['keyword'];
// 		var val = json[i]['val'];
// 		// console.log(key);
// 		// console.log(val);
// 		tmpl[key].push(val);
// 	}
// 	console.log('tmpl');
// 	console.log(tmpl);
// 	return tmpl;
// }
function parseLibObj(json){
	var lib_arr= json.map((item)=>{
		var obj = {};
		obj[item['key']] = [];
		return obj;
	});
	var lib = {};
	Array.prototype.forEach.call(lib_arr,function(elem) {
	   var keys = Object.keys(elem);
	   lib[keys[0]] = elem[keys[0]];
	});
	for(var i=0; i<json.length; i++){
		var key = json[i]['key'];
		var val_arr = json[i]['values'];
		console.log(key);
		console.log(val_arr);
		for(var j=0; j<val_arr.length; j++){
			lib[key].push(val_arr[j].value);
		}
	}
	return lib;
}
function openConsole(){
	$('#p-console-id').addClass('focused');
}
function closeConsole(){
	$('#p-console-id').removeClass('focused');
}
function scrollBottom(){
	var element = document.getElementById('p-console-id').querySelector('.f-output');
	element.scrollTop = element.scrollHeight - element.clientHeight;
}
$(function(){
	var _console = $('section.p-console');
	if(_console){
		$('section.p-console input').on('keypress', function(event){
			console.log(event);
			if(event.keyCode == 13){
				var msg = $('section.p-console input').val();
				var tmpl_result = templateParse(msg,tmpl);
				var result = libraryKeyParse(tmpl_result,lib);

				var tmpl_probability = tmplProbabilities(msg,tmpl);
				var lib_probability = libProbabilities(tmpl_result ,lib )
				var prob_result = tmpl_probability
				if(lib_probability > 0 )
					prob_result = prob_result * lib_probability;

				$('section.p-console ul.output').append( "<hr>" );
				// $().append(  );
				$('section.p-console ul.output').append( "<li>= number of probabilities: "+prob_result+"</li>" );
				$('section.p-console ul.output').append( "<li>= result: "+result+"</li>" );
				$('section.p-console ul.output').append( "<hr>" );
				
				scrollBottom();
			}

		});
	}
});
