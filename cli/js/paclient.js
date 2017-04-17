$(document).ready(function() {
    var dir = "2009";
    dir = "";
    photoalbum(dir);
});

var opts = { radius: 100, length: 50 };
var spinner;

function busy() {
    if (spinner) spinner.stop();
    spinner = new Spinner(opts).spin();
    $("body").append(spinner.el);

    console.log("busy");
}
function unbusy() {
    setTimeout(function() {
        spinner.stop();
        console.log("unbusy");
    }, 500);
}

function createBreadcrumbs(arg) {
    var dirs = arg.split("/");
    var breadcrumbs = `<a class="breadcrumbs" href="#" onclick="photoalbum('');">HOME</a>`;
    if (!arg) {
        return breadcrumbs;
    }
    var link = "";
    dirs.forEach(function(dir) {
        link += (link ? "/" : "") + dir;
        breadcrumbs +=
            (breadcrumbs ? " / " : "") +
            `<a href="#" onclick="photoalbum('${link}');">${dir}</a>`;
    });

    return breadcrumbs;
}

function photoAlbumSort(type, a, b) {
    if ("album" == type) {
        return a["dir"] > b["dir"] ? 1 : -1;
    } else if ("chapter" == type) {
        var imga = a.replace(/.*\//, "");
        var imgb = b.replace(/.*\//, "");
        return imga > imgb ? 1 : -1;
    }
    return 0;
}

function captionAlbum(img) {
    var desc = img;
    if (img.match(/[0-9]{8}-.*/)) {
        desc =
            img.substring(0, 4) +
            "/" +
            img.substring(4, 6) +
            "/" +
            img.substring(6, 8);
        desc += " " + img.substring(9);
    }
    return desc;
}

function photoalbum(dir) {
    $("#breadcrumbs").html(createBreadcrumbs(dir));

    var query = config.apiServer + "/query/" + dir;

    busy();

    $.ajax({
        url: query,
        success: function(result) {
            var photos = "";
            var onclick = "";

            var counter = 0;
            result.results
                .sort(function(a, b) {
                    return photoAlbumSort(result.type, a, b);
                })
                .forEach(function(img) {
                    if (counter++ > 10) {
                        return;
                    }

                    var path = "";
                    var matclass = "";
                    var captionText = "";
                    var captionClass = "";
                    var frameclass = "";
                    if ("album" == result.type) {
                        path = (dir ? dir + "/" : "") + img["dir"];
                        captionText = captionAlbum(img["dir"]);
                        onclick = ` onclick="photoalbum('` + path + `');" `;
                        img = img["image"];
                        matclass = "mat matbutton";
                        frameclass = "album-frame";
                        shadowclass = "album-shadow";
                        captionClass = "album-caption";
                    } else if ("chapter" == result.type) {
                        onclick = "";
                        matclass = "mat";
                        frameclass = "polaroid-frame";
                        captionText = img.replace(/.*\//, "");
                        shadowclass = "polaroid-shadow";
                        captionClass = "polaroid-caption";
                    } else {
                        console.log("epic fail");
                        alert("epic fail");
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
                });

            $(".photos").html(photos);
            adjustCSS();
        }
    });
}

var basewidth = 150;
var baseheight = 150;
var perspective = basewidth / baseheight;

function adjustHeight(height) {
    console.log("adjustHeight");
    $(".photo").height(height);
}

function adjustCSS() {
    busy();

    width = basewidth;
    height = width / perspective;
    width = width.toFixed(0);
    height = height.toFixed(0);

    //    $(".photo").height(height);

    var dfd = $.Deferred();
    dfd.done(adjustHeight(height));
    dfd.done(function() {
        unbusy();
    });
    dfd.resolve();
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
    var pct = 0.5;

    basewidth *= pct;

    if (basewidth < 50) {
        basewidth = 50;
    }

    baseheight = basewidth / perspective;
    adjustCSS();
}
