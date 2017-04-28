//  How this works
//
//  Query api for dirs in root
//  Response contains list of dirs and a an image to use for thumbnail
//  Each element represents an Album containing either more Albums or
//   just images if a Chapter. Click on an Album to drill in. Use
//   breadcrumbs to back up.

//////////////////////////////////////////////////////////////////
// main entry point, render markup for all photos in page N of dir
//////////////////////////////////////////////////////////////////

var photoalbum = (function() {
    // Just a little private data
    var DIR = "";
    var page = -1;
    var lastdir = "";

    return function(dir) {
        if (undefined === dir) {
            dir = DIR;
        } else {
            DIR = dir;
        }
        $("#breadcrumbs").html(createBreadcrumbs(dir));

        if (dir == lastdir) {
            page++;
        } else {
            page = 0;
        }
        lastdir = dir;

        if (!page) {
            page = 0;
        }
        if (!page) {
            bindScroll();
        }

        var query = config.apiServer + "/query/" + dir + `?page=${page}`;

        spinner("busy");

        $.ajax({
            url: query,
            success: handleApiResponse
        });

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
    };
})();

////////////////////////////////////////////
// Infinite scroll
////////////////////////////////////////////

function unbindScroll() {
    $(window).unbind("scroll");
}

function bindScroll() {
    unbindScroll();
    var win = $(window);
    $("#loading").hide();

    // Each time the user scrolls
    win.scroll(function() {
        // End of the document reached?
        if ($(document).height() - win.height() == win.scrollTop()) {
            unbindScroll();
            $("#loading").show();
            photoalbum();
            $("#loading").hide();
        }
    });
}

////////////////////////////////////////////
// busy/wait spinner
////////////////////////////////////////////

var spinner = (function() {
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
})();

/////////////////////////////////////////////
// breadcrumbs
/////////////////////////////////////////////

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
///////////////////////////////////////////////////////////////////////////
// Rather complicated sorting algo, but this is how I want it:
// Dated albums first, in reverse chrono order, followed by alphabetically
// named albums in alpha order
///////////////////////////////////////////////////////////////////////////

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

//
// Derive a legible caption from album dir name
//
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

//
// emit markup for a single photo
//
function emitPhoto(dir, type, img) {
    console.log("img", img);
    var path = "";
    var matclass = "";
    var captionText = "";
    var captionClass = "";
    var frameclass = "";
    var onclick = "";
    var hrefClass = "";
    var photo = "";

    var mq = window.matchMedia("(max-width: 640px)");
    var largeSize = "/raw/";
    if (mq.matches) {
        largeSize = "/1000/";
    }
    var imgSmall = String(config.assetsUrl + img).replace("/raw/", "/1000/");
    var imgLarge = String(config.assetsUrl + img).replace("/raw/", largeSize);

    if ("album" == type) {
        path = (dir ? dir + "/" : "") + img["dir"];
        captionText = captionAlbum(img["dir"]);
        onclick = ` onclick="photoalbum('${path}',0);" `;
        img = img["image"];
        imgSmall = String(config.assetsUrl + img).replace("/raw/", "/1000/");
        imgLarge = String(config.assetsUrl + img).replace("/raw/", largeSize);
        matclass = "mat matbutton";
        frameclass = "album-frame";
        shadowclass = "album-shadow";
        captionClass = "album-caption";
        hrefClass = "";

        photo = `
            <div class="${frameclass}">
                <div class="${shadowclass}" >
                    <div class="buffer">
                        <div class="${matclass}">
<picture ${onclick} >
    <source srcset="${imgLarge}" media=" (min-width: 641)">
    <source srcset="${imgSmall}" media=" (max-width: 640px)">
    <img class="photo" src="${imgLarge}" />
</picture>
                        </div>
                    </div>
                    <div class="${captionClass}">${captionText}</div>
                </div>
            </div>
        `;
    } else if ("chapter" == type) {
        onclick = "";
        matclass = "mat";
        frameclass = "polaroid-frame";
        captionText = img.replace(/.*\//, "");
        shadowclass = "polaroid-shadow";
        captionClass = "polaroid-caption";
        hrefClass = "swipebox";

        // <img src="${imgSmall}" class="photo " />
        photo = `
            <div class="${frameclass}">
                <div class="${shadowclass}" >
                    <div class="buffer">
                        <div class="${matclass}">
                           <a href="${imgLarge}" class="${hrefClass}" title="${captionText}" >
<picture ${onclick}>
    <source srcset="${imgLarge}" media=" (min-width: 641)">
    <source srcset="${imgSmall}" media=" (max-width: 640px)">
    <img class="photo" src="${imgLarge}" />
</picture>
                           </a>
                        </div>
                    </div>
                    <div class="${captionClass}">${captionText}</div>
                </div>
            </div>
        `;
    } else {
        console.log("epic fail");
        alert("epic fail");
    }
    //    console.log("image:", imgLarge, imgSmall);

    return photo;

    //    photo = `
    //            <div class="${frameclass}">
    //                <div class="${shadowclass}" >
    //                    <div class="buffer">
    //                        <div class="${matclass}">
    //                            <img class="photo" ${onclick} src="${config.assetsUrl + img}" />
    //                        </div>
    //                    </div>
    //                    <div class="${captionClass}">${captionText}</div>
    //                </div>
    //            </div>`;
}

///////////////////////////////////////////////
// Dynamic resizing of images
///////////////////////////////////////////////

var resize = (function() {
    // 100, 200, 400, 800

    const maxHeight = 800;
    const minHeight = 100;
    var height = 200;
    var mq = window.matchMedia("(max-width: 640px)");

    function apply() {
        if (mq.matches) {
            // don't resize mobile
            spinner("unbusy");
            return;
        }

        height = Number(height).toFixed(0);
        console.log("resize", height);

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
    function enlargeEnable() {
        $(".resize-enlarge").prop("disabled", false);
        $(".resize-enlarge").css({
            "border-bottom": "10px solid black"
        });
    }
    function enlargeDisable() {
        $(".resize-enlarge").prop("disabled", true);
        $(".resize-enlarge").css({
            "border-bottom": "10px solid gray"
        });
    }
    function reduceDisable() {
        $(".resize-reduce").prop("disabled", true);
        $(".resize-reduce").css({
            "border-top": "10px solid gray"
        });
    }
    function reduceEnable() {
        $(".resize-reduce").prop("disabled", false);
        $(".resize-reduce").css({
            "border-top": "10px solid black"
        });
    }

    // enlarge & reduce are called by the buttons
    return {
        apply: function() {
            apply();
        },
        enlarge: function() {
            console.log("enlarge");
            var save = height;
            var pct = 2;
            height *= pct;
            if (height >= maxHeight) {
                height = maxHeight;
                enlargeDisable();
            } else {
                enlargeEnable();
            }
            if (save != height) {
                spinner("busy");
                apply();
            }
            reduceEnable();
        },
        reduce: function() {
            console.log("reduce");
            var save = height;
            var pct = 0.5;
            height *= pct;
            if (height <= minHeight) {
                height = minHeight;
                reduceDisable();
            } else {
                reduceEnable();
            }
            if (save != height) {
                spinner("busy");
                apply();
            }
            enlargeEnable();
        }
    };
})();

function swipeboxInit() {
    (function($) {
        $(".swipebox").swipebox();
    })(jQuery);
}

$(document).ready(function() {
    photoalbum();
    //    var html = "";
    //    html += "screen.availLeft " + screen.availLeft + "\n";
    //    html += "screen.availTop " + screen.availTop + "\n";
    //    html += "screen.availWidth " + screen.availWidth + "\n";
    //    html += "screen.availHeight " + screen.availHeight + "\n";
    //    html += "screen.width " + screen.width + "\n";
    //    html += "screen.height " + screen.height + "\n";
    //    html += "screen.colorDepth " + screen.colorDepth + "\n";
    //    html += "screen.orientation.angle " + screen.orientation.angle + "\n";
    //    html += "screen.orientation.onchange " + screen.orientation.onchange + "\n";
    //    html += "screen.orientation.type " + screen.orientation.type + "\n";
    //    html += "screen.pixelDepth " + screen.pixelDepth + "\n";
    //    html += "screen.width " + screen.width + "\n";

    //   console.log(html);
    //    $(".photos").html(html);
    swipeboxInit();
});
