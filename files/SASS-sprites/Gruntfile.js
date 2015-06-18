module.exports = function(grunt) {
	// Load Grunt tasks declared in the package.json file
  	require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		compass: {
	        dist: {
	            options: {
	                config: 'config.rb'
	            }
	        }
	    },
		watch:{
			scss: {
				files: ['scss/*.scss'],
				tasks: [ "compass"]
			},
			lReload:{
				files: ['css/*.css', 'js/*.js', '*.html'],
				options: {
					livereload: {
						port: 12345
					}
				}
			}			
		}
	});

	// Default
	grunt.registerTask('default', [ 'watch' ]);
}