//Path
var P = {
    cssLint: {
        target: ['css/!(reset.css)*.css'],
        report: 'css/lint/csslint.txt'
    },
    lReload: ['css/*.css', 'js/*.js'],
    compass: ['scss/*.scss']
}

module.exports = function (grunt) {
    // Load Grunt tasks declared in the package.json file
    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        //Compass(scss)
        compass: {
            dist: {
                options: {
                    config: 'config.rb'
                }
            }
        },
        watch: {
            scss: {
                files: P.compass,
                tasks: ["compass"]
            },
            lReload: {
                files: P.lReload,
                options: {
                    livereload: {
                        port: 12345
                    }
                }
            }
        },
        //CSS lint
        csslint: {
            options: {
                import: 2,
                csslintrc: '.csslintrc',
                formatters: [
                    {
                        id: 'text',
                        dest: P.cssLint.report
                    }
    ]
            },
            src: P.cssLint.target
        },
        //Image optimization
        imagemin: {
            options: {
                optimizationLevel: 7,
                pngquant: true
            },
            files: {
                expand: true,
                cwd: 'img/target/',
                src: ['**/*.{png,jpg,gif,PNG,JPG,GIF}'],
                dest: 'img/min/'
            }
        },
        //CSS minification
        cssmin: {
            add_banner: {
                options: {
                    banner: '/* Generated date: <%= grunt.template.today("mm-dd-yyyy") %> */\n',
                },
                files: {
                    'css/base_min.css': [
                        'css/reset.css',
                        'css/bootstrap_3.2.0.min.css',
                        'css/animate.css',
                        'css/base.css'
                    ]
                }
            }
        },
        //JS minification
        uglify: {
            options: {
				mangle: false,
                banner: '/* Generated date: <%= grunt.template.today("mm-dd-yyyy") %> */\n',
            },
            my_target: {
                files: {
					'app/app_min.js': [
						'app/librarys/angular1.3.16.min.js',
						'app/librarys/scrollglue.js',
						'app/librarys/angular-cookies1.3.16.min.js',
						'app/app.js',
						'app/controllers/mainController.js'
					]
                }
            }
        }
    });

    // Default
    grunt.registerTask('default', ['watch']);

    //CSS lint task
    grunt.registerTask('cssLint', ['csslint']);

    //Compress images, css, js
    grunt.registerTask('min', ['imagemin', 'cssmin', 'uglify']);

    //Image optimization
    grunt.registerTask('image', ['imagemin']);

    //CSS minification
    grunt.registerTask('cssMin', ['cssmin']);

    //JS minification
    grunt.registerTask('jsMin', ['uglify']);
}