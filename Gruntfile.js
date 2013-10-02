module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        copy: {
            main: {
                files: [
                    {expand: true, cwd: '<%= pkg.sourcePath %>/', src: ['**'], dest: '<%= pkg.buildPath %>/'}
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
                    "<%= pkg.buildPath %>/data/popup.html": "<%= pkg.buildPath %>/data/popup.html"
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
        uglify: {
            options: {
                compress: {
                    join_vars: false
                }
            },
            build: {
                files: {
                    "<%= pkg.buildPath %>/lib/main.js": ["<%= pkg.buildPath %>/lib/main.js"],
                    "<%= pkg.buildPath %>/lib/feedly.api.js": ["<%= pkg.buildPath %>/lib/feedly.api.js"],
                    "<%= pkg.buildPath %>/data/scripts/popup.js": ["<%= pkg.buildPath %>/data/scripts/popup.js"],
                    "<%= pkg.buildPath %>/data/scripts/widget.js": ["<%= pkg.buildPath %>/data/scripts/widget.js"]
                }
            }
        },
        "mozilla-addon-sdk": {
            download: {
                options: {
                    revision: "1.14"
                }
            },
            xpi: {
                options: {
                    extension_dir: "<%= pkg.buildPath %>",
                    dist_dir: "<%= pkg.buildPath %>"
                }
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
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks('grunt-mozilla-addon-sdk');
    grunt.loadNpmTasks('grunt-contrib-clean');

    grunt.registerTask("build", ["copy", "string-replace:keys", "uglify", "mozilla-addon-sdk", "clean"]);
    grunt.registerTask("sandbox", ["copy", "string-replace"]);
    grunt.registerTask("default", ["copy", "string-replace:keys"]);
};