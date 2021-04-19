const gulp = require('gulp'),
	browserSync = require('browser-sync').create(),
	watch = require('gulp-watch'),
	postcss = require('gulp-postcss'),
	sass = require('gulp-sass'),
	imagemin = require('gulp-imagemin'),
	pngquant = require('imagemin-pngquant'),
	minifyCss = require('gulp-minify-css'),
	sourcemaps = require('gulp-sourcemaps'),
	concat = require('gulp-concat'),
	uglify = require('gulp-uglify-es').default,
	plumber = require('gulp-plumber'),
	notify = require('gulp-notify'),
	webp = require('gulp-webp');

//Post css plugins
const processors = [
		require('autoprefixer')({browsers: 'last 2 versions, ie 9, ios 6, android 4'})
	];

//Paths
const P = {
	liveReload: ['./css/**/*.css', './js/**/*.js', './*.html'],
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
		src: './scss/**/*.scss',
		dest: './css'
	}
};

//Error notification settings for plumber
const plumberErrorHandler = { errorHandler: notify.onError("Error: <%= error.message %>") };

//Post css task
gulp.task('sass', function(){
	return gulp.src(P.scss.src)
		.pipe(plumber(plumberErrorHandler))
		.pipe(sourcemaps.init())
		.pipe(sass().on('error', sass.logError))
        .pipe(postcss(processors))
		.pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(P.scss.dest));
});

//Image min
gulp.task('img-min', function(){
	return gulp.src(P.imgMin.src)
		.pipe(plumber(plumberErrorHandler))
        .pipe(imagemin({
			optimizationLevel: 7,
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            use: [pngquant()]
        }))
        .pipe(gulp.dest(P.imgMin.dest))
        .pipe(webp())
        .pipe(gulp.dest(P.imgMin.dest));
});

//Css min
gulp.task('css-min', function() {
	return gulp.src(P.cssMin.src)
		.pipe(plumber(plumberErrorHandler))
		.pipe(concat(P.cssMin.name))
		.pipe(minifyCss({compatibility: 'ie8'}))
		.pipe(gulp.dest(P.cssMin.dest));
});

//JS min
gulp.task('js-min', function() {  
	return gulp.src(P.jsMin.src)
		.pipe(plumber(plumberErrorHandler))
		.pipe(concat(P.jsMin.name))
		.pipe(uglify())
		.pipe(gulp.dest(P.jsMin.dest));
});

gulp.task('watch', function () {
	browserSync.init({
        files: P.liveReload
    });

	gulp.watch(P.scss.src, gulp.series('sass'));
	gulp.watch(P.cssMin.src, gulp.series('css-min'));
	gulp.watch(P.jsMin.src, gulp.series('js-min'));
});

//Default task with postCss
gulp.task('default', gulp.series('sass', 'watch'));

//Min files
gulp.task('min', gulp.series('img-min', 'css-min', 'js-min'));