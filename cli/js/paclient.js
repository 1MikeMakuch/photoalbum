
$(document).ready(function(){
    var dir='2009';
    dir='';
    photoalbum(dir);

});

function createBreadcrumbs(arg) {
    console.log('cB',arg);
    var dirs = arg.split('/');
    var breadcrumbs = `<a href="#" onclick="photoalbum('');">HOME</a>`;
    if (!arg) {
        return breadcrumbs;
    }
    var link = '';
    dirs.forEach(function(dir) {
        console.log('dir',dir);
        link += (link ? '/' : '') + dir;
        breadcrumbs += (breadcrumbs ? ' / ' : '') + `<a href="#" onclick="photoalbum('` + link + `');">` + dir + `</a>`;
    });

    return breadcrumbs;
}

function photoalbum(dir) {

    $("#breadcrumbs").html(createBreadcrumbs(dir));

    var query = config.apiServer + '/query/' + dir;

    $.ajax({url: query, success: function(result) {
        var photos="";
        var onclick="";

        result.results.forEach(function(img) {
            var path = '';
            var matclass = '';
            var caption = '';
            if ("album" == result.type) {
                path = (dir ? dir+'/' : '') + img['dir'];
                caption = img['dir'];
                onclick = ` onclick="photoalbum('` + path + `');" `;
                img = img['image'];
                matclass = 'mat matbutton';

            } else if ("chapter" == result.type) {
                onclick = "";
                matclass = 'mat';
                caption = img.replace(/.*\//, '');
            }
            photos += `
            <div class="matframe">
                <div class="buffer">
                    <div class="${matclass}">
                        <img class="photo" ${onclick} src="${config.assetsUrl + img}" />
                    </div>
                </div>
                <div class="caption">${caption}</div>
            </div>`;
        });

        $(".photos").html(photos);
        adjustCSS();

    }});
};

var basewidth=150;
var baseheight=150;
var perspective = basewidth / baseheight;

function adjustCSS() {


    width = basewidth;
    height = width / perspective;
    width = width.toFixed(0);
    height = height.toFixed(0);

    $(".photo").height(height);
}

function enlargeImages() {

    var pct = 1.5;

    basewidth *= pct;

    if (basewidth > 1000) {
        basewidth = 1000;
    }

    baseheight = basewidth / perspective;
    adjustCSS();
}

function reduceImages() {

    var pct = .5;

    basewidth *= pct;

    if (basewidth < 50) {
        basewidth = 50;
    }

    baseheight = basewidth / perspective;
    adjustCSS();
}
