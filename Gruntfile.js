module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        copy: {
            main: {
                files: [
                    {expand: true, cwd: '<%= pkg.sourcePath %>/', src: ['**'], dest: '<%= pkg.buildPath %>/'}
                ]
            },
            bower: {
                files: [
                    {src: '<%= pkg.bowerPath %>/jquery/dist/jquery.min.js', dest: '<%= pkg.buildPath %>/data/scripts/jquery.min.js'},

                    {src: '<%= pkg.bowerPath %>/mustache/mustache.min.js', dest: '<%= pkg.buildPath %>/data/scripts/mustache.min.js'},

                    {src: '<%= pkg.bowerPath %>/jquery-timeago/jquery.timeago.js', dest: '<%= pkg.buildPath %>/data/scripts/timeago/jquery.timeago.js'},
                    {src: '<%= pkg.bowerPath %>/jquery-timeago/locales/jquery.timeago.ar.js', dest: '<%= pkg.buildPath %>/data/scripts/timeago/locales/jquery.timeago.ar.js'},
                    {src: '<%= pkg.bowerPath %>/jquery-timeago/locales/jquery.timeago.de.js', dest: '<%= pkg.buildPath %>/data/scripts/timeago/locales/jquery.timeago.de.js'},
                    {src: '<%= pkg.bowerPath %>/jquery-timeago/locales/jquery.timeago.en.js', dest: '<%= pkg.buildPath %>/data/scripts/timeago/locales/jquery.timeago.en.js'},
                    {src: '<%= pkg.bowerPath %>/jquery-timeago/locales/jquery.timeago.es.js', dest: '<%= pkg.buildPath %>/data/scripts/timeago/locales/jquery.timeago.es.js'},
                    {src: '<%= pkg.bowerPath %>/jquery-timeago/locales/jquery.timeago.et.js', dest: '<%= pkg.buildPath %>/data/scripts/timeago/locales/jquery.timeago.et.js'},
                    {src: '<%= pkg.bowerPath %>/jquery-timeago/locales/jquery.timeago.fr.js', dest: '<%= pkg.buildPath %>/data/scripts/timeago/locales/jquery.timeago.fr.js'},
                    {src: '<%= pkg.bowerPath %>/jquery-timeago/locales/jquery.timeago.it.js', dest: '<%= pkg.buildPath %>/data/scripts/timeago/locales/jquery.timeago.it.js'},
                    {src: '<%= pkg.bowerPath %>/jquery-timeago/locales/jquery.timeago.ko.js', dest: '<%= pkg.buildPath %>/data/scripts/timeago/locales/jquery.timeago.ko.js'},
                    {src: '<%= pkg.bowerPath %>/jquery-timeago/locales/jquery.timeago.pl.js', dest: '<%= pkg.buildPath %>/data/scripts/timeago/locales/jquery.timeago.pl.js'},
                    {src: '<%= pkg.bowerPath %>/jquery-timeago/locales/jquery.timeago.pt-br.js', dest: '<%= pkg.buildPath %>/data/scripts/timeago/locales/jquery.timeago.pt-br.js'},
                    {src: '<%= pkg.bowerPath %>/jquery-timeago/locales/jquery.timeago.ru.js', dest: '<%= pkg.buildPath %>/data/scripts/timeago/locales/jquery.timeago.ru.js'},
                    {src: '<%= pkg.bowerPath %>/jquery-timeago/locales/jquery.timeago.zh-CN.js', dest: '<%= pkg.buildPath %>/data/scripts/timeago/locales/jquery.timeago.zh-CN.js'}
                ]
            }
        },
        "string-replace": {
            keys: {
                files: {
                    "<%= pkg.buildPath %>/lib/main.js": "<%= pkg.buildPath %>/lib/main.js"
                },
                options: {
                    replacements: [
                        {
                            pattern: 'clientSecret: ""',
                            replacement: 'clientSecret: "' + grunt.option("clientSecret") + '"'
                        },
                        {
                            pattern: 'clientId: ""',
                            replacement: 'clientId: "' + grunt.option("clientId") + '"'
                        }
                    ]
                }
            },
            sandboxApi: {
                files: {
                    "<%= pkg.buildPath %>/lib/feedly.api.js": "<%= pkg.buildPath %>/lib/feedly.api.js"
                },
                options: {
                    replacements: [
                        {
                            pattern: /http(?:s)?:\/\/(?:www\.)?cloud\.feedly\.com/gi,
                            replacement: "http://sandbox.feedly.com"
                        }
                    ]
                }
            },
            sandboxLink: {
                files: {
                    "<%= pkg.buildPath %>/lib/main.js": "<%= pkg.buildPath %>/lib/main.js"
                },
                options: {
                    replacements: [
                        {
                            pattern: /http(?:s)?:\/\/(?:www\.)?feedly\.com/gi,
                            replacement: "http://sandbox.feedly.com"
                        }
                    ]
                }
            }
        },
        "jpm": {
            options: {
                src: "<%= pkg.buildPath %>",
                xpi: "<%= pkg.buildPath %>"
            }
        },
        clean: {
            build: {
                files: [
                    {expand: true, cwd: "<%= pkg.buildPath %>", src: ["*", "!*.xpi"]}
                ]
            }
        }
    });

    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks('grunt-string-replace');
    grunt.loadNpmTasks('grunt-jpm');
    grunt.loadNpmTasks('grunt-contrib-clean');

    grunt.registerTask("build", ["copy", "string-replace:keys", "jpm:xpi", "clean"]);
    grunt.registerTask("sandbox", ["copy", "string-replace", "jpm:run"]);
    grunt.registerTask("default", ["copy", "string-replace:keys", "jpm:run"]);
};