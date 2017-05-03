// Gruntfile.js

module.exports = function(grunt) {
    // load plugins
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-injector");
    grunt.loadNpmTasks("grunt-babel");
    grunt.loadNpmTasks("grunt-shell");
    grunt.loadNpmTasks("grunt-contrib-watch");

    //     grunt.loadNpmTasks('grunt-contrib-watch');
    //     grunt.loadNpmTasks('grunt-contrib-jshint');
    //     grunt.loadNpmTasks('grunt-sass');
    //     grunt.loadNpmTasks('grunt-nodemon');
    //     grunt.loadNpmTasks('grunt-contrib-concat');
    //     grunt.loadNpmTasks('grunt-contrib-uglify');
    //     grunt.loadNpmTasks('grunt-filerev');

    var thirdPartySrcFiles = [
        "dist/cli/bower_components/jquery/dist/jquery.min.js",
        "dist/cli/bower_components/jquery/dist/jquery.min.map",
        "dist/cli/bower_components/swipebox/src/js/jquery.swipebox.js",
        "dist/cli/bower_components/swipebox/lib/ios-orientationchange-fix.js",
        "dist/cli/bower_components/spin/stylesheets/jquery.spin.css",
        "dist/cli/bower_components/spin/javascripts/jquery.spin.js",
        "dist/cli/css/photoalbum.css",
        "dist/cli/bower_components/swipebox/src/css/swipebox.css"
    ];

    var paSrcFiles = [
        "dist/cli/js/spin.js",
        "dist/cli/js/config.js",
        "dist/cli/js/photoalbum.js"
    ];

    var srcFiles = thirdPartySrcFiles.concat(paSrcFiles);

    var watchFiles = srcFiles.concat(["Gruntfile.js", "src/**"]);
    var tmp = [];
    watchFiles.forEach(function(file) {
        tmp.push(file.replace("dist/", "src/"));
    });

    watchFiles = tmp;
    console.log("watchFiles", watchFiles);
    // configure tasks
    grunt.initConfig({
        watch: {
            dev: {
                files: watchFiles,
                tasks: ["dev"]
            },

            options: {
                reload: true,
                spawn: true,
                atBegin: true
            }
        },

        shell: {
            options: {
                stderr: false
            },
            target: {
                command: "rm ../../../albums dist/cli/albums ; ln -s ../../../albums dist/cli/albums"
            }
        },
        babel: {
            options: {
                sourceMap: true,
                presets: ["es2015"]
            },
            dist: {
                files: {
                    "dist/cli/js/photoalbum.js": "src/cli/es2015/photoalbum.js"
                }
            }
        },

        // configure nodemon
        nodemon: {
            dev: {
                script: "src/srv/photoalbum.js"
            }
        },

        copy: {
            main: {
                files: [
                    {
                        src: "bower_components/**",
                        dest: "dist/cli/"
                    },
                    {
                        expand: true,
                        cwd: "src/cli/js/",
                        flatten: true,
                        filter: "isFile",
                        src: "*",
                        dest: "dist/cli/js/"
                    },
                    {
                        src: "src/cli/css/photoalbum.css",
                        dest: "dist/cli/css/photoalbum.css"
                    },
                    {
                        expand: true,
                        cwd: "src/cli/img/",
                        flatten: true,
                        filter: "isFile",
                        src: [
                            "Album.png",
                            "book_bg2.jpg",
                            "icons.png",
                            "loader.gif"
                        ],
                        dest: "dist/cli/img/"
                    }
                ]
            }
        },

        injector: {
            options: {
                template: "src/cli/index.html.grunt",
                addRootSlash: false,
                relative: true
            },
            dev: {
                files: {
                    "dist/cli/index.html": srcFiles
                }
            }
        },

        clean: ["dist/*"]
    });

    // Put all thirdparty and pa js files into index.html
    function buildDev() {
        console.log("buildDev!");
        grunt.task.run("babel");
        grunt.task.run("copy");
        grunt.task.run("injector:dev");
        grunt.task.run("shell");
    }

    // Concat all pa js file, uglify it, then concat thirdparty and pa into single file.
    function buildProd() {
        grunt.task.run("clean");
        grunt.task.run("concat:prod");
        grunt.task.run("uglify:prod");
        grunt.task.run("concat:third");
        grunt.task.run("uglify:third");
        grunt.task.run("concat:prod3");
        grunt.task.run("filerev");
        grunt.task.run("injector:prod");
    }

    // default run: `grunt`
    grunt.registerTask("default", ["dev"]);
    grunt.registerTask("dev", "build development", buildDev);
    grunt.registerTask("prod", "build production", buildProd);
};
