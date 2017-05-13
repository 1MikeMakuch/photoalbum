// This is the api for the photoalbum client. Here's how it works:
//
// Photos exist in a directory structure on disk. There's a root dir. In the root dir are a
// number of dirs. In each Album dir are a combination of more Albums and/or Chapters
// which contain only pictures. Each Chapter contains the raw images.
//
// The client queries the root with /query/ and receives the list of dirs in the root dir along
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

var express = require('express')
var app = express()
var cors = require('cors')
var sleep = require('sleep')
var querystring = require('querystring')
var moment = require('moment')

var config = require('../../config/index.js')

function dlog(msgin) {
    var stamp = moment().format('YYMMDD-HHMMSS')
    var msg = stamp + ' ' + msgin

    for (
        var _len = arguments.length,
            restArgs = Array(_len > 1 ? _len - 1 : 0),
            _key = 1;
        _key < _len;
        _key++
    ) {
        restArgs[_key - 1] = arguments[_key]
    }

    var a = [msg].concat(restArgs)
    console.log.apply(console, a)
}

dlog('config', config)

app.use(cors())

var Promise = require('bluebird')
var promisify = require('promisify-node')
var fs = promisify('fs')
//var _ = require('lodash');

process.chdir(config.apiDocroot)

app.set('query parser', true)

app.get('/', function(req, res) {
    dlog('Hello, world!')
    res.send('Hello, world!\n')
})

// Handle just /query/
app.get('/query/', function(req, res) {
    dlog('/query/', req.url, req.query)

    return verifyDir('.', req.query)
        .then(function(vres) {
            return photoAlbum('.', req.query['page'])
        })
        .then(function(dirs) {
            dlog('/query/.then', dirs)
            res.send(dirs)
        })
})

// Handle arbitrary paths following /query/
app.get(/^\/query\/((?:[^\/]+\/?)+)\/*/, function(req, res) {
    dlog('/query/', req.url, req.query)

    var dir = req.params[0].split('/')
    dir = dir.join('/')
    dir = dir.replace(/\/$/, '')

    return verifyDir(dir, req.query)
        .then(function(vres) {
            return photoAlbum(dir, req.query['page'])
        })
        .then(function(dirs) {
            dlog('/query/.then', dirs)
            res.send(dirs)
        })
        .catch(function(e) {
            dlog('caught', e)
            res.status(404).send('not found')
        })
})

app.use(express.static('./'))

// error handler to emit errors as a json string
app.use(function(err, req, res, next) {
    dlog('error!', err)
    if (typeof err !== 'object') {
        // If the object is not an Error, create a representation that appears to be
        err = {
            message: String(err), // Coerce to string
        }
    } else {
        // Ensure that err.message is enumerable (It is not by default)
        Object.defineProperty(err, 'message', {enumerable: true})
    }

    // Return a JSON representation of #/definitions/ErrorResponse
    res.set('Content-Type', 'application/json')
    res.end(JSON.stringify(err))
})

// 404 is not an express.js error, just the last route
app.use(function(req, res, next) {
    dlog('404')
    res.status(404).send("Sorry can't find that!")
})

var port = process.env.PORT || 10101

app.listen(port)

dlog('listening on ' + port)

function pathExists(path) {
    return fs
        .access(path)
        .then(function() {
            return true
        })
        .catch(function(e) {
            return false
        })
}

function readDir(path) {
    return fs
        .readdir(path)
        .then(function(files) {
            return files
        })
        .catch(function(e) {
            dlog('readdir error', e)
            return []
        })
}
function readFile(path) {
    return fs
        .readFile(path, 'utf8')
        .then(function(file) {
            return file
        })
        .catch(function(err) {
            //            dlog(err);
            throw err
        })
}

function isDirectory(path) {
    return fs
        .stat(path)
        .then(function(stats) {
            return stats.isDirectory()
        })
        .catch(function(e) {
            dlog('isDirectory()', e)
            return false
        })
}

function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n)
}

function verifyDir(dir, queryString) {
    var path = /*docRoot + '/' + */ dir

    if (path.includes('..')) {
        return Promise.reject(new Error('bad path'))
    }

    if (
        !queryString ||
        ('page' in queryString && !isNumeric(queryString['page']))
    ) {
        return Promise.reject(new Error('bad query string'))
    }

    return pathExists(path)
        .then(function(result) {
            return result
        })
        .catch(function(e) {
            dlog(e)
        })
}

function hasAlbumSemaphore(dir) {
    var path = dir + '/album'
    return pathExists(path)
}

function hasChapterSemaphore(dir) {
    var path = dir + '/raw'
    return pathExists(path)
}

function validImage(file) {
    return file.match(/jpg$|gif$|bmp$|png$/i)
}
function getThumbFromRawDir(raw) {
    dlog('getThumbFromRawDir', raw)
    // TODO need to optimize here instead of reading all files in dir should iterate 1 at a time
    return readDir(raw).then(function(files) {
        for (var i = 0; i < files.length; i++) {
            if (validImage(files[i])) {
                dlog(' getThumbFromRawDir', raw + '/' + files[i])
                return raw + '/' + files[i]
            }
        }
        return ''
    })
}

function getThumbFromAlbumDir(dir) {
    dlog('getThumbFromAlbumDir', dir)
    // dir should be an album dir containing other album/chapter dirs
    // so we call getThumb on each dir till we find an image
    return readDir(dir).then(function(files) {
        var i = 0
        return (function nextFile() {
            if (i >= files.length) {
                return ''
            }
            var file = files[i++]
            file = dir + '/' + file
            dlog('getThumbFromAlbumDir.nextFile', file)
            return isDirectory(file).then(function(isDir) {
                if (isDir) {
                    return getThumb(file).then(function(file) {
                        if (file) {
                            return file
                        } else {
                            return nextFile()
                        }
                    })
                } else {
                    return nextFile()
                }
            })
        })()
    })
}

function getThumb(dir) {
    dlog('getThumb', dir)
    var semaphores = []
    semaphores.push(hasAlbumSemaphore(dir))
    semaphores.push(hasChapterSemaphore(dir))

    return Promise.all(semaphores).then(function(results) {
        dlog('getThumb.all.results', results)
        var isAlbum = results[0]
        var isChapter = results[1]
        if (isAlbum) {
            return getThumbFromAlbumDir(dir)
        } else if (isChapter) {
            return getThumbFromRawDir(dir + '/raw')
        }
        return ''
    })
}

function getPics(dir, page) {
    dir += '/raw'
    return readDir(dir)
        .then(function(pics) {
            return pics.sort(imgSort)
        })
        .then(function(pics) {
            paths = []
            pics.forEach(function(file) {
                if (validImage(file)) {
                    paths.push({image: dir + '/' + file})
                }
            })
            return paths
        })
        .then(function(pics) {
            return pageSelector(pics, page)
        })
        .then(function(pics) {
            return addDescriptions(pics)
        })
}

function getSummary(dir) {
    var summaryPath = dir + '/txt/summary.txt'
    return pathExists(summaryPath)
        .then(function(exists) {
            if (exists) {
                return readFile(summaryPath)
            } else {
                return ''
            }
        })
        .then(function(summary) {
            return summary
        })
}

function addDescriptions(pics) {
    var texts = []
    var semaphores = []
    pics.forEach(function(pic) {
        var txt = pic.image.replace('/raw', '/txt').replace(/$/, '.txt')
        texts.push(txt)
        semaphores.push(pathExists(txt))
    })

    return Promise.all(semaphores).then(function(results) {
        var semaphores2 = []
        var indexes = []
        for (var i = 0; i < results.length; i++) {
            if (results[i]) {
                indexes.push(i) // remember which have text
                semaphores2.push(readFile(texts[i]))
            }
        }
        return Promise.all(semaphores2).then(function(results2) {
            for (var i = 0; i < indexes.length; i++) {
                pics[indexes[i]]['txt'] = results2[i]
            }
            return pics
        })
    })
}

function getDirs(dir) {
    function checkAlbumOrChapter(path) {
        return isDirectory(path).then(function(isDir) {
            if (!isDir) {
                return false
            } else {
                var semaphores = []
                semaphores.push(hasChapterSemaphore(path))
                semaphores.push(hasAlbumSemaphore(path))
                return Promise.all(semaphores).then(function(result) {
                    return result
                })
            }
        })
    }

    // some of these dirs will be chapters and some will be albums
    var list = []

    return readDir(dir).then(function(files) {
        files.forEach(function(file) {
            list.push(checkAlbumOrChapter(dir + '/' + file))
        })

        var dirList = []
        return Promise.all(list)
            .then(function(results) {
                for (var i = 0; i < results.length; i++) {
                    if (results[i][0] || results[i][1]) {
                        dirList.push(files[i])
                    }
                }

                return dirList.sort(function(a, b) {
                    return b - a
                })
            })
            .catch(function(e) {
                dlog('readDir Promise e', e)
            })
    })
}
function dirSort(a, b) {
    var r
    if (isNumeric(a.substring(0, 1)) && isNumeric(b.substring(0, 1))) {
        r = a < b ? 1 : -1
    } else if (isNumeric(a.substring(0, 1)) && !isNumeric(b.substring(0, 1))) {
        r = -1
    } else if (!isNumeric(a.substring(0, 1)) && isNumeric(b.substring(0, 1))) {
        r = 1
    } else {
        r = a.toLowerCase() > b.toLowerCase() ? 1 : -1
    }
    return r
}
function imgSort(a, b) {
    var r = a.toLowerCase() > b.toLowerCase() ? 1 : -1
    return r
}
function pageSelector(list, page) {
    if (!isNumeric(page)) {
        return list
    }
    return list.splice(page * config.pageSize, config.pageSize)
}

// TODO this logic sucks, not DRY!
function getDirsAndThumbs(dir, page) {
    return getDirs(dir)
        .then(function(dirs) {
            return dirs.sort(dirSort)
        })
        .then(function(dirs) {
            return pageSelector(dirs, page)
        })
        .then(function(dirs) {
            dlog('getDirsAndThumbs.then', dirs)
            var promises = []
            dirs.forEach(function(subdir) {
                if (dir && '.' != dir) {
                    promises.push(getThumb(dir + '/' + subdir))
                } else {
                    promises.push(getThumb(subdir))
                }
            })
            return Promise.all(promises).then(function(thumbs) {
                dlog('getDirsAndThumbs Promises.all', thumbs)
                var results = []
                for (var i = 0; i < dirs.length; i++) {
                    results.push({dir: dirs[i], image: thumbs[i]})
                }
                return results
            })
        })
}

function photoAlbum(dir, page) {
    dlog('photoAlbum', dir, page, process.cwd())

    var isAlbum
    var isChapter
    var semaphores = []

    semaphores.push(hasAlbumSemaphore(dir))
    semaphores.push(hasChapterSemaphore(dir))

    return Promise.all(semaphores).then(function(results) {
        isAlbum = results[0]
        isChapter = results[1]

        if (isAlbum) {
            return getDirsAndThumbs(dir, page).then(function(results) {
                dlog('getDirs.then', results)
                return {type: 'album', results: results}
            })
        } else if (isChapter) {
            return getPics(dir, page)
                .then(function(pics) {
                    dlog('getPics.then', pics)
                    return pics
                })
                .then(function(pics) {
                    return getSummary(dir).then(function(summary) {
                        return {summary: summary, pics: pics}
                    })
                })
                .then(function(obj) {
                    dlog('photoAlbum.then', obj)
                    if (obj.summary) {
                        return {
                            type: 'chapter',
                            summary: obj.summary,
                            results: obj.pics,
                        }
                    } else {
                        return {type: 'chapter', results: obj.pics}
                    }
                })
        } else {
            return []
        }
    })
}

//var arg = process.argv[2];
//
//pathExists('albums')
//.then(function(x) {
//    dlog('\npathExists',x)
//});
//
//
//readDir('albums')
//    .then(function(x) {
//        dlog('readDir',x);
//    });
//
//
//isDirectory('albums')
//    .then(function(x) {
//        dlog('\nisDirectory', x);
//    });
//
//
//verifyDir('hobbies')
//    .then(function(x) {
//        dlog('\nverifyDir', x);
//    });
//
//hasAlbumSemaphore('albums')
//    .then(function(x) {
//        dlog('\nhasAlbumSemaphore', x);
//    });
//
//hasChapterSemaphore('albums/hobbies')
//    .then(function(x) {
//        dlog('\nhasChapterSemaphore', x);
//    });
//
//getThumb('albums')
//    .then(function(x) {
//        dlog('\ngetThumb:', x);
//    });
//
//getPics('albums/hobbies/scuba')
//    .then(function(x) {
//        dlog('\ngetPics', x);
//    });
//
//getDirs(arg)
//  .then(function(x) {
//      dlog('getDirs',x);
//  });
//
//getDirsAndThumbs(arg)
//  .then(function(x) {
//      dlog('getDirsAndThumbs',x);
//  });
//
//dirList(arg)
//    .then(function(x) {
//        dlog('dirList', x);
//    });
