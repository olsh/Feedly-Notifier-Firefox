module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        "string-replace": {
            dist: {
                files: {
                    "<%= pkg.buildPath %>/lib/main.js": "<%= pkg.buildPath %>/lib/main.js"
                },
                options: {
                    replacements: [
                        {
                            pattern: 'clientSecret: ""',
                            replacement: 'clientSecret: "' + grunt.option("clientSecret")  +  '"'
                        },
                        {
                            pattern: 'clientId: ""',
                            replacement: 'clientId: "' + grunt.option("clientId")  +  '"'
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
            dist: {
                files: {
                    "<%= pkg.buildPath %>/lib/main.js" : ["<%= pkg.buildPath %>/lib/main.js"],
                    "<%= pkg.buildPath %>/lib/feedly.api.js" : ["<%= pkg.buildPath %>/lib/feedly.api.js"],
                    "<%= pkg.buildPath %>/data/scripts/popup.js" : ["<%= pkg.buildPath %>/data/scripts/popup.js"],
                    "<%= pkg.buildPath %>/data/scripts/widget.js" : ["<%= pkg.buildPath %>/data/scripts/widget.js"]
                }
            }
        },
        copy: {
            main: {
                files: [
                    {expand: true, cwd: '<%= pkg.sourcePath %>/', src: ['**'], dest: '<%= pkg.buildPath %>/'}
                ]
            }
        }
    });

    grunt.loadNpmTasks('grunt-string-replace');
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-copy");

    grunt.registerTask("default", ["copy", "string-replace", "uglify"]);
    grunt.registerTask("develop", ["copy", "string-replace"]);
};