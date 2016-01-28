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
                    {src: '<%= pkg.bowerPath %>/jquery-timeago/locales/jquery.timeago.uk.js', dest: '<%= pkg.buildPath %>/data/scripts/timeago/locales/jquery.timeago.uk.js'},
                    {src: '<%= pkg.bowerPath %>/jquery-timeago/locales/jquery.timeago.zh-CN.js', dest: '<%= pkg.buildPath %>/data/scripts/timeago/locales/jquery.timeago.zh-CN.js'}
                ]
            },
            "arabic-locale": {
                src: '<%= pkg.sourcePath %>/locale/ar.properties',
                dest: '<%= pkg.buildPath %>/locale/ar.properties'
            }
        },
        multidest: {
            arabic: {
                tasks: ['copy:arabic-locale'],
                dest: [
                    '<%= pkg.buildPath %>/locale/ar-SA.properties',
                    '<%= pkg.buildPath %>/locale/ar-IQ.properties',
                    '<%= pkg.buildPath %>/locale/ar-EG.properties',
                    '<%= pkg.buildPath %>/locale/ar-LY.properties',
                    '<%= pkg.buildPath %>/locale/ar-DZ.properties',
                    '<%= pkg.buildPath %>/locale/ar-MA.properties',
                    '<%= pkg.buildPath %>/locale/ar-TN.properties',
                    '<%= pkg.buildPath %>/locale/ar-OM.properties',
                    '<%= pkg.buildPath %>/locale/ar-YE.properties',
                    '<%= pkg.buildPath %>/locale/ar-SY.properties',
                    '<%= pkg.buildPath %>/locale/ar-JO.properties',
                    '<%= pkg.buildPath %>/locale/ar-LB.properties',
                    '<%= pkg.buildPath %>/locale/ar-KW.properties',
                    '<%= pkg.buildPath %>/locale/ar-AE.properties',
                    '<%= pkg.buildPath %>/locale/ar-BH.properties',
                    '<%= pkg.buildPath %>/locale/ar-QA.properties'
                ]
            }
        }
        ,
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
    grunt.loadNpmTasks("grunt-multi-dest");
    grunt.loadNpmTasks('grunt-string-replace');
    grunt.loadNpmTasks('grunt-jpm');
    grunt.loadNpmTasks('grunt-contrib-clean');

    grunt.registerTask("build", ["copy", "multidest", "string-replace:keys", "jpm:xpi", "clean"]);
    grunt.registerTask("sandbox", ["copy", "multidest", "string-replace", "jpm:run"]);
    grunt.registerTask("default", ["copy", "multidest", "string-replace:keys", "jpm:run"]);
};