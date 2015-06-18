//Path
var P = {
	cssLint: {
		target: ['css/!(reset.css)*.css'],
		report: 'css/lint/csslint.txt'
	},
	lReload: ['css/*.css', 'js/*.js', '*.html'],
	compass: ['scss/*.scss']
}

module.exports = function(grunt) {
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
		watch:{
			scss: {
				files: P.compass,
				tasks: [ "compass"]
			},
			lReload:{
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
					{id: 'text', dest: P.cssLint.report}
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
				src: ['**/*.{png,jpg,gif}'],
				dest: 'img/dest/'
			}
		},
		//CSS minification
		cssmin: {
			add_banner: {		
				files: {
					'css/global_min.css': ['css/!(global_min.css)*.css']
				}
			}
		},
		//JS minification
		uglify: {
			my_target: {
				files: {
					'js/min/app.min.js': ['js/jquery1.7.2.min.js', 'js/jquery.bxslider.min.js', 'js/pikaday.js', 'js/app.js']
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