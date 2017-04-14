
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

function photoAlbumSort(type, a, b) {
    if ("album" == type) {
        return (a['dir'] >  b['dir']) ? 1 : -1;
    } else if ("chapter" == type) {
        var imga = a.replace(/.*\//, '');
        var imgb = b.replace(/.*\//, '');
        return (imga > imgb) ? 1 : -1;
    }
    return 0;
}

function photoalbum(dir) {

    $("#breadcrumbs").html(createBreadcrumbs(dir));

    var query = config.apiServer + '/query/' + dir;

    $.ajax({url: query, success: function(result) {
        var photos="";
        var onclick="";

        var counter = 0;
        result.results.sort(function(a,b) {
            return photoAlbumSort(result.type,a,b);
        }).forEach(function(img) {
            if (counter++ > 10) {
                return;
            }
            var path = '';
            var matclass = '';
            var captionText = '';
            var captionClass = '';
            var frameclass = '';
            if ("album" == result.type) {
                path = (dir ? dir+'/' : '') + img['dir'];
                captionText = img['dir'];
                onclick = ` onclick="photoalbum('` + path + `');" `;
                img = img['image'];
                matclass = 'mat matbutton';
                frameclass = 'album-frame';
                shadowclass = 'album-shadow';
                captionClass = 'album-caption';

            } else if ("chapter" == result.type) {
                onclick = "";
                matclass = 'mat';
                frameclass = 'polaroid-frame'
                captionText = img.replace(/.*\//, '');
                shadowclass = 'polaroid-shadow';
                captionClass = 'polaroid-caption';
            } else {
                console.log('epic fail');
                alert('epic fail');
            }
            var one = `
            <div class="${frameclass}">
                <div class="${shadowclass}" >
                    <div class="buffer">
                        <div class="${matclass}">
                            <img class="photo" ${onclick} src="${config.assetsUrl + img}" />
                        </div>
                    </div>
                    <div class="${captionClass}">${captionText}</div>
                </div>
            </div>`;
            photos += one;
            console.log(one);
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
