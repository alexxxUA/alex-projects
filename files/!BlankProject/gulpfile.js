var gulp = require('gulp'),
    livereload = require('gulp-livereload'),
    server = require('tiny-lr')();
	watch = require('gulp-watch'),
	compass = require('gulp-compass'),
	scsslint = require('gulp-scss-lint'),
	imagemin = require('gulp-imagemin'),
	pngquant = require('imagemin-pngquant'),
	minifyCss = require('gulp-minify-css'),
	sourcemaps = require('gulp-sourcemaps'),
	concat = require('gulp-concat'),
	uglify = require('gulp-uglify'),
	gutil = require('gulp-util');

//Post css plugins
var processors = [
		require('postcss-import')(),
		require('postcss-simple-vars'),
		require('postcss-nested'),
		require('pixrem')(), // add fallbacks for rem units
		require('autoprefixer-core')({browsers: 'last 2 versions, ie 9, ios 6, android 4'}), // add vendor prefixes
		require('cssnext')(),
		require('cssnano')() // minify the result
	];

//Paths
var P = {
	imgMin: {
		src: './img/src/*',
		dest: './img/dest'
	},
	cssMin: {
		name: 'base_min.css',
		src: [
			'./css/reset.css',
			'./css/bootstrap_3.2.0.min.css',
			'./css/base.css'
		],
		dest: './css'
	},
	jsMin: {
		name: 'app_min.js',
		src: [
			'./js/app.js'
		],
		dest: './js'
	},
	scss: {
		src: './scss/*.scss',
		dest: './css'
	}
};

//Post css task
gulp.task('pcss', function(){
	return gulp.src(P.scss.src)
		.pipe(plugins.sourcemaps.init())
        .pipe(plugins.postcss(processors))
		.pipe(plugins.sourcemaps.write('.'))
        .pipe(gulp.dest(P.scss.dest));
});

//Compass task
gulp.task('compass', function() {
	gulp.src(P.scss.src)
		.pipe(compass({
			css: 'css',
			sass: 'scss',
			javascript: 'js',
			image: 'img',
			style: 'expanded',
			bundleExec: true,
			relative: true,
			sourcemap: true,
			comments: true
		}))
		.pipe(gulp.dest(P.scss.dest))
		.on('error', function(error) {
			console.log(error);
			this.emit('end');
		})
		.pipe(livereload());
});

//Image min
gulp.task('img-min', function(){
	return gulp.src(P.imgMin.src)
        .pipe(imagemin({
			optimizationLevel: 7,
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            use: [pngquant()]
        }))
        .pipe(gulp.dest(P.imgMin.dest));
});

//Css min
gulp.task('css-min', function() {
	return gulp.src(P.cssMin.src)
		.pipe(concat(P.cssMin.name))
		.pipe(minifyCss({compatibility: 'ie8'}))
		.pipe(gulp.dest(P.cssMin.dest))
		.pipe(livereload());
});

//JS min
gulp.task('js-min', function() {  
	return gulp.src(P.jsMin.src)
		.pipe(concat(P.jsMin.name))
		.pipe(uglify())
		.pipe(gulp.dest(P.jsMin.dest))
		.on('error', gutil.log)
		.pipe(livereload());
});

gulp.task('watch', function () {
	livereload.listen({
		port: 12345
	});

	gulp.watch(P.scss.src, ['compass']);
	gulp.watch(P.cssMin.src, ['css-min']);
	gulp.watch(P.jsMin.src, ['js-min']);
});

//Dafault task with postCss
gulp.task('default', ['compass', 'watch']);

//Min files
gulp.task('min', ['img-min', 'css-min', 'js-min']);