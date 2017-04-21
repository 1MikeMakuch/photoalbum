var PAGE = 0;
var DIR = "";

$(document).ready(function() {
    //    DIR = "2009";
    DIR = "";
    photoalbum(DIR, PAGE);
});

function unbindScroll() {
    console.log("scroll unbind");
    $(window).unbind("scroll");
}

function bindScroll() {
    unbindScroll();
    var win = $(window);
    console.log("scroll bind");
    $("#loading").hide();

    // Each time the user scrolls
    win.scroll(function() {
        // End of the document reached?

        if ($(document).height() - win.height() == win.scrollTop()) {
            PAGE++;
            console.log("loading...", DIR, PAGE);
            unbindScroll();

            $("#loading").show();
            photoalbum(DIR, PAGE);
            $("#loading").hide();
        }
    });
}

var opts = { radius: 100, length: 50 };
var spinner;

function busy() {
    if (spinner) spinner.stop();
    spinner = new Spinner(opts).spin();
    $("body").append(spinner.el);
    $(".spinner").css({ position: "fixed" });

    console.log("busy");
}
function unbusy() {
    setTimeout(function() {
        if (spinner) {
            spinner.stop();
        }
        console.log("unbusy");
    }, 500);
}

function createBreadcrumbs(arg) {
    var dirs = arg.split("/");
    var breadcrumbs = `<a class="breadcrumbs" href="#" onclick="photoalbum('',0);">HOME</a>`;
    if (!arg) {
        return breadcrumbs;
    }
    var link = "";
    dirs.forEach(function(dir) {
        link += (link ? "/" : "") + dir;
        breadcrumbs +=
            (breadcrumbs ? " / " : "") +
            `<a href="#" onclick="photoalbum('${link}',0);">${dir}</a>`;
    });

    return breadcrumbs;
}
function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}
function photoAlbumSort(type, namea, nameb) {
    var a = namea["dir"];
    var b = nameb["dir"];
    console.log("paSort", a, b);
    if ("album" == type) {
        var r;
        if (isNumeric(a.substring(0, 1)) && isNumeric(b.substring(0, 1))) {
            r = a < b ? 1 : -1;
        } else if (
            isNumeric(a.substring(0, 1)) && !isNumeric(b.substring(0, 1))
        ) {
            r = -1;
        } else if (
            !isNumeric(a.substring(0, 1)) && isNumeric(b.substring(0, 1))
        ) {
            r = 1;
        } else {
            r = a.toLowerCase() > b.toLowerCase() ? 1 : -1;
        }
        return r;
    } else if ("chapter" == type) {
        var imga = namea.replace(/.*\//, "");
        var imgb = nameb.replace(/.*\//, "");
        return imga.toLowerCase() > imgb.toLowerCase() ? 1 : -1;
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
function emitPhoto(dir, type, img) {
    var path = "";
    var matclass = "";
    var captionText = "";
    var captionClass = "";
    var frameclass = "";
    var onclick = "";

    if ("album" == type) {
        path = (dir ? dir + "/" : "") + img["dir"];
        captionText = captionAlbum(img["dir"]);
        onclick = ` onclick="photoalbum('` + path + `',0);" `;
        img = img["image"];
        matclass = "mat matbutton";
        frameclass = "album-frame";
        shadowclass = "album-shadow";
        captionClass = "album-caption";
    } else if ("chapter" == type) {
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
    var photo = `
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
    return photo;
}

function photoalbum(dir, page) {
    DIR = dir;
    $("#breadcrumbs").html(createBreadcrumbs(dir));
    if (!page) {
        page = 0;
    }
    if (!page) {
        bindScroll();
    }
    PAGE = page;

    var query = config.apiServer + "/query/" + dir + `?page=${page}`;

    busy();

    $.ajax({
        url: query,
        success: function(result) {
            if (!result.results.length) {
                $("#loading").hide();
                unbindScroll();
            }

            var photos = "";

            result.results
                .sort(function(a, b) {
                    return photoAlbumSort(result.type, a, b);
                })
                .forEach(function(img) {
                    photos += emitPhoto(dir, result.type, img);
                });
            if (page) {
                $(".photos").append(photos);
            } else {
                $(".photos").html(photos);
            }
            adjustCSS();
            if (result.results.length) {
                bindScroll();
            }
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
    //    busy();

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
