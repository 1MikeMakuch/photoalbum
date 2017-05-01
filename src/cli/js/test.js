#!/usr/bin/env node

//var fs = require('fs');
//var thumb = '';
//var walk = function(dir, done) {
//    console.log('walk',dir);
//    var results = [];
//    fs.readdir(dir, function(err, list) {
//        if (err) return done(err);
//        var i = 0;
//        (function next() {
//            var file = list[i++];
//            console.log('   next', file);
//            if (!file) return done(null, results);
//            file = dir + '/' + file;
//            fs.stat(file, function(err, stat) {
//                if (stat && stat.isDirectory()) {
//                    walk(file, function(err, res) {
//                        results = results.concat(res);
//                        console.log('dir: ',file);
//                        if (thumb = next()) {
//                            return thumb;
//                        }
//                    });
//                } else {
//                    if (file.match(/jpg$/i)) {
//                        console.log('matched jpg', file);
//                        return file;
//                        //return done(null, file);
//                    }
//                    //results.push(file);
//                    //console.log('file:',file);
//                    if (thumb = next()) {
//                        return thumb;
//                    }
//                }
//            });
//        })();
//    });
//};

//walk('albums', function(err, results) {
//    if (err) throw err;
//    console.log(results);
//});

//////////////////////////////////////////////////////////////////////
var Promise    = require('bluebird');
var promisify = require("promisify-node");
var fs = promisify("fs");

function readDir(path) {
    if (!path) {
        return new Promise.resolve([]);
    }
    return fs.readdir(path)
             .then(function(files) {
                 console.log('readdir files ', files);
                 return files;
             })

             .catch(function(e) {
                 console.log('readdir error', e);
                 return [];
             });
}

function isDirectory(path) {
    //console.log('isDirectory',path);
    return fs.stat(path)
             .then(function(stats) {
                 console.log('isDirectory()',stats.isDirectory());
                 return stats.isDirectory();
             })
             .catch(function(e) {
                 //console.log('isDirectory()',e);
                 return false;
             })
}

var walk = function(dir) {
    console.log('walk', dir);
    return readDir(dir)
        .then(function(files) {
            if ([] == files) {
                return [];
            }
            var i = 0;

            return (function next() {
                var file = files[i++];
                if (!file) { return '' ; }
                file = dir + '/' + file;
                console.log('next', file);

                return isDirectory(file)
                    .then(function(isDir) {
                        if (isDir) {
                            if (thumb = walk(file)) {
                                return thumb;
                            }
                        } else {
                            if (file.match(/jpg$/i)) {
                                return file;
                            } else {
                                if (thumb = next()) {
                                    return thumb;
                                }
                            }
                        }
                    });
            })();
            
        })
}
walk(process.argv[2])
    .then(function(thumb) {
        console.log('thumb',thumb);
    });
