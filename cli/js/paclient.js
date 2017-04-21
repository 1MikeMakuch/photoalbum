// TODO get rid of these globals

var PAGE = 0;
var DIR = "";

$(document).ready(function() {
    photoalbum(DIR, PAGE);
});

// main entry point, render markup for all photos in page N of dir
function photoalbum(dir, page) {
    function handleApiResponse(result) {
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
        resize.apply();
        if (result.results.length) {
            bindScroll();
        }
    }

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

    //    busy();
    spinner("busy");

    $.ajax({
        url: query,
        success: handleApiResponse
    });
}

////////////////////////////////////////////
// Infinite scroll
////////////////////////////////////////////

function unbindScroll() {
    //    console.log("scroll unbind");
    $(window).unbind("scroll");
}

function bindScroll() {
    unbindScroll();
    var win = $(window);
    //    console.log("scroll bind");
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

////////////////////////////////////////////
// busy/wait spinner
////////////////////////////////////////////
function BusySpinner() {
    var opts = { radius: 100, length: 50 };
    var spinner = new Spinner(opts);
    return function(state) {
        if ("busy" == state) {
            spinner.spin();
            $("body").append(spinner.el);
            $(".spinner").css({ position: "fixed" });
        } else {
            // 'unbusy' == state
            setTimeout(function() {
                if (spinner) {
                    spinner.stop();
                }
            }, 500);
        }
    };
}
var spinner = BusySpinner();

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

// Rather complicated sorting algo, but this is how I want it:
// Dated albums first, in reverse chrono order, followed by alphabetized alphabetically
// named albums

function photoAlbumSort(type, namea, nameb) {
    var a = namea["dir"];
    var b = nameb["dir"];

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

// Derive a legible caption from album dir name
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

// emit markup for a single photo
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
        onclick = ` onclick="photoalbum('${path}',0);" `;
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

///////////////////////////////////////////////
// Dynamic resizing of images
///////////////////////////////////////////////

var resize = (function() {
    var height = 150;
    function apply() {
        height = Number(height).toFixed(0);

        // Kill the spinner after jquery is done
        var dfd = $.Deferred();
        dfd.done(() => {
            $(".photo").height(height);
        });
        dfd.done(function() {
            spinner("unbusy");
        });
        dfd.resolve();
    }

    return {
        apply: function() {
            apply();
        },
        enlarge: function() {
            spinner("busy");
            var pct = 2;
            height *= pct;
            if (height > 700) {
                height = 700;
            }
            apply();
        },
        reduce: function() {
            spinner("busy");
            var pct = 0.5;
            height *= pct;
            if (height < 100) {
                height = 100;
            }
            apply();
        }
    };
})();
