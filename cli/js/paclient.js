

function mybutton (dir, album, buttonLabel) {
    var link = (dir ? dir+'/' : '') + album['dir'];

    var html = `
        <div class="outerblock">
            <button class="photo" onclick="photoalbum('` + link + `');">
                <div class="block">` + buttonLabel + `</div>
                <br>` + link + `
            </button>
        </div>`;
    return html;
}

$(document).ready(function(){
    var dir='';
    photoalbum(dir);
});

function createBreadcrumbs(arg) {
    var dirs = arg.split('/');
    var breadcrumbs = '';
    var link = '';
    dirs.forEach(function(dir) {
        link += (link ? '/' : '') + dir;
        breadcrumbs += (breadcrumbs ? ' / ' : '') + `<a href="#" onclick="photoalbum('` + link + `');">` + dir + `</a>`;
    });

    return breadcrumbs;
}

function photoalbum(dir) {

    $("#breadcrumbs").html(createBreadcrumbs(dir));

    var query = config.apiServer + '/query/' + dir;

    $.ajax({url: query, success: function(result) {
        var tag="";
        if ("album" == result.type) {
            result.results.forEach(function(album) {

                tag += mybutton(dir, album, `<img src="` + config.assetsUrl + album['image'] + `" >\n`);
            });
        } else if ("chapter" == result.type) {
            result.results.forEach(function(img) {

               tag += `<div class="outerblock"><div class="block"><img src="` + config.assetsUrl + img + `" ></div></div>\n`;
            })
        }

        $("#photos").html(tag);
    }});

};
