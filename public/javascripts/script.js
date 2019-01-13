'use strict'
console.log('script');
///////////////////////////////////////////////////////////
window.onload = function() {
    // var projs    = document.getElementById('projects-form');
    var proj    = document.getElementById('project-form');
    var newproj    = document.getElementById('new-project-form');
    var tag     = document.getElementById('tag-info-form');
    var key     = document.getElementById('key-form');
    var json    = document.getElementById('json-form');
    var rewrite = document.getElementById('rewrite-form');
    var rewriter = document.getElementById('rewriter-form');
    var query = document.getElementById('query-form');
    var tmpl = document.getElementById('template-form');
    // var imprt = document.getElementById('template-import-form');

    // if(projs) projs.addEventListener("submit", projsForm); else
    if(newproj) newproj.addEventListener("submit", newprojProjForm); else
    if(proj) proj.addEventListener("submit", projForm); else
    if(tag) tag.addEventListener("submit", tagForm); else
    // if(key) key.addEventListener("submit", keyForm); else
    if(json) json.addEventListener("submit", jsonForm); else
    if(rewrite) rewrite.addEventListener("submit", rewriteForm); else
    if(rewriter) rewriter.addEventListener("submit", rewriterForm); else
    if(tmpl) tmpl.addEventListener("submit", tmplForm); else
    // if(imprt) imprt.addEventListener("submit", importForm); else
    if(query) query.addEventListener("submit", queryForm);
}
///////////////////////////////////////////////////////////
function projForm(e) {
    if (e.preventDefault) e.preventDefault();
    console.log(e);

    var project_id = e.target.getAttribute('proj-id');
    // var select = e.target.getElementsByTagName("select")[0];
    // var tag_id = select.options[select.selectedIndex].getAttribute('proj-id');

    var name = $('#name-input').val();
    var info = $('#description-textarea').val();
    var d_tmpls = $('#d-tmpls').val();
    var t_tmpls = $('#t-tmpls').val();

    // var assocTags = $('#assoc-tag').val();
    // var stopTags = $('#stop-tag').val();
    // if( assocTags )
    //     assocTags = assocTags.map((e)=>{ return parseInt(e, 10); });
    // if( stopTags )
    //     stopTags = stopTags.map((e)=>{ return parseInt(e, 10); });
    if( d_tmpls )
        d_tmpls = d_tmpls.map((e)=>{ return parseInt(e, 10); });
    if( t_tmpls )
        t_tmpls = t_tmpls.map((e)=>{ return parseInt(e, 10); });

    var data = {};
    data.type = 'project.save';

    data.name = name;
    data.info = info;
    // data.assocTags = assocTags;
    // data.stopTags = stopTags;
    data.d_tmpls = d_tmpls;
    data.t_tmpls = t_tmpls;

    var xhr = new XMLHttpRequest();
    xhr.open("POST", '/project/'+project_id, true);
    xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
    xhr.onreadystatechange = function (){
        console.log(xhr);
        if(xhr.readyState == 4)
            window.location.replace(xhr.responseURL);
    };
    xhr.send(JSON.stringify(data));
    return false;

}
function tmplForm (e) {
    if (e.preventDefault) e.preventDefault();
    console.log(e);

    var tmpl_name = document.getElementById('name-input').value;
    var tmpl_id = document.getElementById('id-input').value;
    if(!tmpl_name || !tmpl_id)
        return false;

    var data = {};
    data.name = tmpl_name;
    data.type = 'saveTmpl';

    console.log(tmpl_name);  

    var xhr = new XMLHttpRequest();

    xhr.open("POST", '/template/'+tmpl_id, true);
    xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
    xhr.onreadystatechange = function (){
        console.log(xhr);
        if(xhr.readyState == 4)
            window.location.replace(xhr.responseURL);
    };
    xhr.send(JSON.stringify(data));
    return false;
}
function tagForm(e) {    
    if (e.preventDefault) e.preventDefault();
    if ( !confirm("are you sure") )
        return
    // var name = document.getElementById("name-input");
    var syns = $('#syns-tag').val()
    var tag_id = document.getElementById('tag-details').getAttribute('tag-id');
    var x = e.target.getElementsByTagName("input")[0];
    var name = x.value;
    var data = {name:name, syns:syns, type:'save'};

    var body = 'name=' + encodeURIComponent(name)
        // +"&syns=" + encodeURIComponent(syns)
        +"&syns=" + syns
        +'&type=save';
    var xhr = new XMLHttpRequest();
    xhr.open("POST", '/tag/'+tag_id, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.onreadystatechange = function (){
        console.log(xhr);
        if(xhr.readyState == 4)
            window.location.replace(xhr.responseURL);
    };
    xhr.send(body);
    // xhr.send(JSON.stringify({name:name, syns:syns, type:'save'}));
    // xhr.send( JSON.stringify({name:name, syns:syns, type:'save'}) );
    return false;
}


function onReaderLoad(e){
    console.log(e.target.result);
    // var obj = JSON.parse(e.target.result);
    // alert_data(obj.name, obj.family);
}
function jsonForm(e) {
    if (e.preventDefault) e.preventDefault();
    // console.log(e);
    blockTheKraken("<span>loading . . .</span>");

    var file = e.target.getElementsByTagName("input")[0].files[0];
    console.log(file.name);
    var reader = new FileReader();
    var xhr = new XMLHttpRequest();
    if (file.type == "application/json" ) {
        reader.readAsText(file);
        reader.onload = (e) => {
                var body = 'data=' + encodeURIComponent(e.target.result);
                body += '&type=json.file.save';
                body += '&name='+file.name;
                xhr.open("POST", '/json', true);
                xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                xhr.onprogress = function (e) {
                    if (e.lengthComputable) {
                        console.log(e.loaded+  " / " + e.total)
                    }
                }
                xhr.onloadstart = function (e) {
                    console.log("start");
                }
                xhr.onloadend = function (e) {
                    console.log("end");
                    releaseTheKraken();
                    alert('finish');
                }
                xhr.onreadystatechange = function (){
                    console.log(xhr);
                    // if(xhr.readyState == 4)
                    //     window.location.replace(xhr.responseURL);
                };
                xhr.send(body); 
        };
    }else console.log('error'); 
    return false;
}

function rewriteForm(e) {
    if (e.preventDefault) e.preventDefault();
    // console.log(e);

    var y = e.target.getElementsByTagName("select")[0];
    var id = y.options[y.selectedIndex].getAttribute('proj-id');
    
    var xhr = new XMLHttpRequest();
    var body = 'project=' + encodeURIComponent(id);

    xhr.open("POST", '/rewrite', true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.onreadystatechange = function (){
        console.log(xhr);
        if(xhr.readyState == 4)
            window.location.replace(xhr.responseURL);
    };
    xhr.send(body);

    return false;
}

function rewriterForm(e) {
    if (e.preventDefault) e.preventDefault();
    console.log(e);

    var original_id  = document.getElementById('original-id').value;
    var project_id  = document.getElementById('project-id').value;
    var description = document.getElementById('object-desc').value;
    var title       = document.getElementById('object-title').value;

    if(!title || !description || !project_id)
        return;

    var data = {
        title: title,
        description: description,
        project_id: project_id,
        original_id: original_id
    };

    console.log(data);    

    var xhr = new XMLHttpRequest();

    xhr.open("POST", '/rewriter', true);
    xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
    xhr.onreadystatechange = function (){
        console.log(xhr);
        if(xhr.readyState == 4)
            window.location.replace(xhr.responseURL);
    };
    xhr.send(JSON.stringify(data));
    return false;
}


function queryForm(e) {
    if (e.preventDefault) e.preventDefault();
    console.log(e);

    var ssh_host     = document.getElementById('host-ssh-input').value;
    var ssh_user     = document.getElementById('user-ssh-input').value;
    var ssh_password = document.getElementById('password-ssh-input').value;
    var ssh_port     = document.getElementById('port-ssh-input').value;
    
    var db_host     = document.getElementById('host-db-input').value;
    var db_port     = document.getElementById('port-db-input').value;
    var db_user     = document.getElementById('user-db-input').value;
    var db_password = document.getElementById('password-db-input').value;
    var db_name     = document.getElementById('name-db-input').value;
    var db_query    = document.getElementById('query-db-textarea').value;

    if(!ssh_host || !ssh_user || !ssh_password || 
        !db_host || !db_user || !db_password || 
        !db_query)
        return;

    var ssh = {
        'host': ssh_host
        // ,port: ssh_port
        ,'user': ssh_user
        ,'password': ssh_password
    };
    if(ssh_port) ssh.port = ssh_port;

    var db = {
        'host': db_host
        // ,port: db_port
        ,'user': db_user
        ,'password': db_password
        // ,name: db_name
        ,'query': db_query
    };
    if(db_name) db.name = db_name;
    if(db_port) db.port = db_port;

    var data = {
        ssh:ssh
        ,db:db
    };
    // var data = [ssh, db];
    console.log(data);  

    ajax('/query', data, (result)=>{
        console.log(result);

        var output = '';
        for(var i=0; i<result.length; i++){
            output += JSON.stringify(result[i], null, 4);
        }
        $('#response-textarea').val(output);
    });
}

function ajax(url, data, callback){
    return $.ajax({
      type: "POST"
      ,url: url
      ,data: data
      ,dataType: 'json'
      ,success: function(response){
        if(callback)
            callback(response);
      },
    });
}
function blockTheKraken(text){
    var div = document.createElement('div');
    div.className = "p-kraken";
    if(!text)
        div.innerHTML = "<strong>W8!</strong>";
    else
        div.innerHTML = text;
    document.body.appendChild(div);
};
function releaseTheKraken(){
    var div = document.getElementsByClassName("p-kraken");
    for(var i=0; i<div.length; i++){
        document.body.removeChild(div[i]);
    }
    
}
function makeid(length) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    if(!length) length = 6

    for (var i = 0; i < length; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}
function snackbox(text = 'oops', time = 2000){
    var id = 'msg-'+makeid(7);
    var obj = document.createElement("div");
    obj.setAttribute('class', `snack-box ${id}`);
    obj.innerHTML = `
        <span class='snack-msg'>
            ${text}
        </span>    
    `;
    document.body.appendChild(obj);

    $(`.snack-box.${id}`).animate({
        top: '20px'
    }, 500, function() {
        setTimeout(function(){
            $(`.snack-box.${id}`).animate({
                top: '-400px'
            }, 500, function(){
                document.body.removeChild(obj);
            });
        }, time);
    });
}
function throwJsonFile(json, name){
    var jsonse = JSON.stringify(json, null, 4);
    var blob = new Blob([jsonse], {type: "application/json"});
    // var blob = new Blob([json], {type: "application/json"});
    var downloadLink = document.createElement("a");
    downloadLink.href = window.URL.createObjectURL(blob);
    downloadLink.download = `${name}.json`;

    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}
function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}