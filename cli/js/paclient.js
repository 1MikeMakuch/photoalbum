

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

var maxwidth=250;
var maxheight=180

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

               tag += `
                <div class="outerblock">
                    <div class="block">
                        <img src="` + config.assetsUrl + img + `" >
                    </div>
                </div>\n`;
            })
        }

        $("#photos").html(tag);
        adjustCSS();
    }});

};

function adjustCSS() {

    var width = maxwidth+30;
    var height = maxheight+30;

    $(".outerblock").css("width", width+"px");
    $(".outerblock").css("height", height+"px");

    width = maxwidth+20;
    height = maxheight+20;

    $(".photo").css("width", width+"px");
    $(".photo").css("height", height+"px");

    width = maxwidth+10;
    height = maxheight+10;

    $(".block").css("width", width+"px");
    $(".block").css("height", height+"px");

    width = maxwidth;
    height = maxheight;

    $("img").css("max-width",  width+"px");
    $("img").css("max-height", height+"px");
}

function enlargeImages() {
    maxwidth += 50;
    maxheight += 50;

    if (maxwidth > 1000) {
        maxwidth = 1000;
    }
    if (maxheight > 1000) {
        maxheight = 1000;
    }
    adjustCSS();
}

function reduceImages() {
    maxwidth -= 50;
    maxheight -= 50;

    if (maxwidth < 50) {
        maxwidth = 50;
    }
    if (maxheight < 50) {
        maxheight =  50;
    }
    adjustCSS();
}
