

function mybutton (dir, album, imgTag) {
    var path = (dir ? dir+'/' : '') + album['dir'];

    var html = `
        <div class="frame">
            <button class="mat" onclick="photoalbum('` + path + `');">
                ` + imgTag +
               `</button><br>`
               + path +`
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

                tag += mybutton(dir, album, `<img class="photo" src="` + config.assetsUrl + album['image'] + `" >\n`);
            });
        } else if ("chapter" == result.type) {
            result.results.forEach(function(img) {

               tag += `
                <div class="frame">
                    <div class="block">
                        <img class="photo" src="` + config.assetsUrl + img + `" >
                    </div>
                </div>\n`;
            })
        }

        $("#photos").html(tag);
        adjustCSS();
    }});

};

var basewidth=250;
var baseheight=180

function adjustCSS() {

    var width = basewidth+80;
    var height = baseheight+96;

    $(".frame").css("width", width+"px");
    $(".frame").css("height", height+"px");

    width = basewidth+10;
    height = baseheight+20;

    $(".mat").css("width", width+"px");
    $(".mat").css("height", height+"px");

    width = basewidth;
    height = baseheight;

    $("img").css("max-width",  width+"px");
    $("img").css("max-height", height+"px");
}

function enlargeImages() {

    var pct = 1.25;

    basewidth *= pct;
    baseheight *= pct;

    if (basewidth > 1000) {
        basewidth = 1000;
    }
    if (baseheight > 1000) {
        baseheight = 1000;
    }
    adjustCSS();
}

function reduceImages() {

    var pct = .75;

    basewidth *= pct;
    baseheight *= pct;

    if (basewidth < 50) {
        basewidth = 50;
    }
    if (baseheight < 50) {
        baseheight =  50;
    }
    adjustCSS();
}
