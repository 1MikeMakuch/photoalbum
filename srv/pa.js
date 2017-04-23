// This is the api for the photoalbum client. Here's how it works:
//
// Photos exist in a directory structure on disk. There's a root dir. In the root dir are a
// number of Album dirs. In each Album dir are a combination of more Albums and/or Chapters
// which contain only pictures. Each Chapter has a raw dir containing the images (largest size).
//
// A request queries the root with /query/ and receives the list of dirs in the root dir along
// with one image for a thumbnail to represent the Album.
//
// A /query/<dirX> is requesting either the Albums in that dir if it's an Album or the images
// in that dir if it's a Chapter. Albums are indicated with the presense of a file "album" in
// the dir. Chapters are indicated with the presence of the "raw" dir.
//
// A request with no page parameter as above will return all elements. A page N is requested
// with /query/<dirX>?page=N where N = 0,1,2...
//
// Example:
//
// ./1977/SixtyNine-Firebird/raw/Firebird06.jpg
// ./1977/SixtyNine-Firebird/raw/Firebird07.jpg
// ./1977/Skiing/raw/1200.jpg
// ./1977/Skiing/raw/MeSkiing1978.jpg
// ./1977/ZZTop/raw/img_3243.jpg
// ./1977/ZZTop/raw/img_3244.jpg
// ./1977/album
// ./2000/20000601-BreakAtTheLake/raw/2P6020001.jpg
// ./2000/20000601-BreakAtTheLake/raw/2P6020002.jpg
// ./2000/20000601-BreakAtTheLake/raw/2P6020003.jpg
// ./2000/album

var express = require("express");
var app = express();
var cors = require("cors");
var sleep = require("sleep");
var querystring = require("querystring");

var config = require("../config");

console.log("config", config);

app.use(cors());

var Promise = require("bluebird");
var promisify = require("promisify-node");
var fs = promisify("fs");
//var _ = require('lodash');

process.chdir(config.apiDocroot);

app.set("query parser", true);

app.get("/", function(req, res) {
    res.send("Hello, world!\n");
});

// Handle just /query/
app.get("/query/", function(req, res) {
    console.log(req.url);
    console.log("query", req.query);

    return verifyDir(".", req.query)
        .then(function(vres) {
            return photoAlbum(".", req.query["page"]);
        })
        .then(function(dirs) {
            console.log(dirs);
            res.send(dirs);
        });
});

// Handle arbitrary paths following /query/
app.get(/^\/query\/((?:[^\/]+\/?)+)\/*/, function(req, res) {
    console.log(req.url);
    var dir = req.params[0].split("/");
    dir = dir.join("/");
    console.log("query", req.query);

    return verifyDir(dir, req.query)
        .then(function(vres) {
            return photoAlbum(dir, req.query["page"]);
        })
        .then(function(dirs) {
            console.log(dirs);
            res.send(dirs);
        })
        .catch(function(e) {
            console.log("caught", e);
            res.status(404).send("not found");
        });
});

app.use(express.static("./"));

// error handler to emit errors as a json string
app.use(function(err, req, res, next) {
    console.log("error!", err);
    if (typeof err !== "object") {
        // If the object is not an Error, create a representation that appears to be
        err = {
            message: String(err) // Coerce to string
        };
    } else {
        // Ensure that err.message is enumerable (It is not by default)
        Object.defineProperty(err, "message", { enumerable: true });
    }

    // Return a JSON representation of #/definitions/ErrorResponse
    res.set("Content-Type", "application/json");
    res.end(JSON.stringify(err));
});

// 404 is not an express.js error, just the last route
app.use(function(req, res, next) {
    console.log("404");
    res.status(404).send("Sorry can't find that!");
});

var port = process.env.PORT || 10101;

app.listen(port);

console.log("listening on " + port);

function pathExists(path) {
    return fs
        .access(path)
        .then(function() {
            //console.log('file exists:         ', path);
            return true;
        })
        .catch(function(e) {
            //console.log('file does not exist: ', path);
            return false;
        });
}

function readDir(path) {
    return fs
        .readdir(path)
        .then(function(files) {
            //console.log('readdir files ', files);
            return files;
        })
        .catch(function(e) {
            //console.log('readdir error', e);
            return [];
        });
}

function isDirectory(path) {
    //console.log('isDirectory',path);
    return fs
        .stat(path)
        .then(function(stats) {
            //console.log('isDirectory()',stats.isDirectory());
            return stats.isDirectory();
        })
        .catch(function(e) {
            //console.log('isDirectory()',e);
            return false;
        });
}

function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

function verifyDir(dir, queryString) {
    var path = /*docRoot + '/' + */ dir;

    if (path.includes("..")) {
        return Promise.reject(new Error("bad path"));
    }
    console.log("verifyDir", queryString);
    if (
        !queryString ||
        ("page" in queryString && !isNumeric(queryString["page"]))
    ) {
        return Promise.reject(new Error("bad query string"));
    }

    return pathExists(path)
        .then(function(result) {
            return result;
        })
        .catch(function(e) {
            //console.log(e);
        });

    // will never get here
    //console.log('end verifyDirP');
    throw "should never get here";
    return false;
}

function hasAlbumSemaphore(dir) {
    var path = dir + "/album";
    return pathExists(path);
}

function hasChapterSemaphore(dir) {
    var path = dir + "/raw";
    return pathExists(path);
}

function getThumb(dir) {
    //console.log('getThumb',dir);
    return readDir(dir).then(function(files) {
        if ([] == files) {
            return [];
        }
        var i = 0;

        return (function next() {
            var file = files[i++];

            if (!file) {
                return "";
            }
            file = dir + "/" + file;
            //console.log('next', file);

            return isDirectory(file).then(function(isDir) {
                if (isDir) {
                    //console.log('isDir', file);
                    return getThumb(file);
                } else {
                    //console.log('!isDir', file);
                    if (file.match(/jpg$/i)) {
                        return file;
                    } else {
                        return next();
                    }
                }
            });
        })();
    });
}
function getPics(dir, page) {
    dir += "/raw";
    return readDir(dir)
        .then(function(pics) {
            console.log("getPics", pics);
            return pics.sort(imgSort);
        })
        .then(function(pics) {
            paths = [];
            pics.forEach(function(file) {
                if (file.match(/jpg$/i)) {
                    paths.push(dir + "/" + file);
                }
            });
            return paths;
        })
        .then(function(pics) {
            return pageSelector(pics, page);
        });
}

function getDirs(dir) {
    console.log("getDirs0", dir);

    function checkAlbumOrChapter(path) {
        //console.log('checkAlbumOrChapter',path);
        return isDirectory(path).then(function(isDir) {
            //console.log('isDir:',path, isDir);
            if (!isDir) {
                return false;
            } else {
                var semaphores = [];
                semaphores.push(hasChapterSemaphore(path));
                semaphores.push(hasAlbumSemaphore(path));
                return Promise.all(semaphores).then(function(result) {
                    //console.log('semaphores',semaphores);
                    //console.log('result',result);
                    return result;
                });
            }
        });
    }

    // some of these dirs will be chapters and some will be albums
    var list = [];

    return readDir(dir).then(function(files) {
        files.forEach(function(file) {
            list.push(checkAlbumOrChapter(dir + "/" + file));
        });
        var dirList = [];
        return Promise.all(list)
            .then(function(results) {
                for (var i = 0; i < results.length; i++) {
                    if (results[i][0] || results[i][1]) {
                        dirList.push(files[i]);
                    }
                }
                return dirList.sort(function(a, b) {
                    return b - a;
                });
            })
            .catch(function(e) {
                //console.log('readDir Promise e', e);
            });
    });
}
function dirSort(a, b) {
    var r;
    if (isNumeric(a.substring(0, 1)) && isNumeric(b.substring(0, 1))) {
        r = a < b ? 1 : -1;
    } else if (isNumeric(a.substring(0, 1)) && !isNumeric(b.substring(0, 1))) {
        r = -1;
    } else if (!isNumeric(a.substring(0, 1)) && isNumeric(b.substring(0, 1))) {
        r = 1;
    } else {
        r = a.toLowerCase() > b.toLowerCase() ? 1 : -1;
    }
    return r;
}
function imgSort(a, b) {
    var r = a.toLowerCase() > b.toLowerCase() ? 1 : -1;
    return r;
}
function pageSelector(list, page) {
    if (!isNumeric(page)) {
        return list;
    }
    return list.splice(page * config.pageSize, config.pageSize);
}

function getDirsAndThumbs(dir, page) {
    console.log("getDirsAndThumbs", dir);
    return getDirs(dir)
        .then(function(dirs) {
            return dirs.sort(dirSort);
        })
        .then(function(dirs) {
            return pageSelector(dirs, page);
        })
        .then(function(dirs) {
            var promises = [];
            dirs.forEach(function(subdir) {
                if (dir && "." != dir) {
                    promises.push(getThumb(dir + "/" + subdir));
                } else {
                    promises.push(getThumb(subdir));
                }
            });

            return Promise.all(promises).then(function(thumbs) {
                //console.log('Promise.all.then',thumbs);
                var results = [];
                for (var i = 0; i < dirs.length; i++) {
                    results.push({ dir: dirs[i], image: thumbs[i] });
                }
                return results;
            });
        });
}

function photoAlbum(dir, page) {
    console.log("dirList", dir);
    console.log("cwd", process.cwd());

    //    dir = /* docRoot +*/ ('' != dir ? '/' + dir : '');
    console.log("dirList", dir);

    var isAlbum;
    var isChapter;
    var semaphores = [];

    semaphores.push(hasAlbumSemaphore(dir));
    semaphores.push(hasChapterSemaphore(dir));

    return Promise.all(semaphores).then(function(results) {
        isAlbum = results[0];
        isChapter = results[1];
        console.log("semaphores", results);

        if (isAlbum) {
            return getDirsAndThumbs(dir, page).then(function(results) {
                //console.log('getDirs.then',results);
                return { type: "album", results: results };
            });
        } else if (isChapter) {
            return getPics(dir, page).then(function(pics) {
                return { type: "chapter", results: pics };
            });
        } else {
            return [];
        }
    });
}

//var arg = process.argv[2];
//
//pathExists('albums')
//.then(function(x) {
//    console.log('\npathExists',x)
//});
//
//
//readDir('albums')
//    .then(function(x) {
//        console.log('readDir',x);
//    });
//
//
//isDirectory('albums')
//    .then(function(x) {
//        console.log('\nisDirectory', x);
//    });
//
//
//verifyDir('hobbies')
//    .then(function(x) {
//        console.log('\nverifyDir', x);
//    });
//
//hasAlbumSemaphore('albums')
//    .then(function(x) {
//        console.log('\nhasAlbumSemaphore', x);
//    });
//
//hasChapterSemaphore('albums/hobbies')
//    .then(function(x) {
//        console.log('\nhasChapterSemaphore', x);
//    });
//
//getThumb('albums')
//    .then(function(x) {
//        console.log('\ngetThumb:', x);
//    });
//
//getPics('albums/hobbies/scuba')
//    .then(function(x) {
//        console.log('\ngetPics', x);
//    });
//
//getDirs(arg)
//  .then(function(x) {
//      console.log('getDirs',x);
//  });
//
//getDirsAndThumbs(arg)
//  .then(function(x) {
//      console.log('getDirsAndThumbs',x);
//  });
//
//dirList(arg)
//    .then(function(x) {
//        console.log('dirList', x);
//    });
