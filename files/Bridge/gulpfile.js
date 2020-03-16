const gulp = require('gulp'),
	browserSync = require('browser-sync').create(),
	imagemin = require('gulp-imagemin'),
	pngquant = require('imagemin-pngquant'),
	mozjpeg = require('imagemin-mozjpeg'),
	webp = require('gulp-webp'),
	sass        = require('gulp-sass'),
	sourcemaps = require('gulp-sourcemaps'),
    autoprefixer      = require('gulp-autoprefixer'),
	minifyCss = require('gulp-minify-css'),
	concat = require('gulp-concat'),
	uglify = require('gulp-uglify'),
	plumber = require('gulp-plumber'),
	notify = require('gulp-notify');

//Settings
const S = {
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
		dest: './css',
		options: {
			outputStyle: 'expanded'
		}
	}
};

//Error notification settings for plumber
const plumberErrorHandler = { errorHandler: notify.onError("Error: <%= error.message %>") };

gulp.task('styles', function() {
	return gulp.src(S.scss.src)
	  .pipe(plumber(plumberErrorHandler))
	  .pipe(sourcemaps.init())
	  .pipe(sass(S.scss.options))
	  .pipe(autoprefixer())
	  .pipe(gulp.dest(S.scss.dest))
});

//Image min
gulp.task('img-min', function(){
	return gulp.src(S.imgMin.src)
		.pipe(plumber(plumberErrorHandler))
        .pipe(imagemin([
			imagemin.gifsicle({interlaced: true}),
			imagemin.optipng({optimizationLevel: 7}),
			imagemin.svgo({
				plugins: [{removeViewBox: false}]
			}),
			pngquant(),
			mozjpeg({progressive: true, quality: 85})
		]))
        .pipe(gulp.dest(S.imgMin.dest))
        .pipe(webp())
        .pipe(gulp.dest(S.imgMin.dest));
});

//Css min
gulp.task('css-min', function() {
	return gulp.src(S.cssMin.src)
		.pipe(plumber(plumberErrorHandler))
		.pipe(concat(S.cssMin.name))
		.pipe(minifyCss({compatibility: 'ie8'}))
		.pipe(gulp.dest(S.cssMin.dest));
});

//JS min
gulp.task('js-min', function() {  
	return gulp.src(S.jsMin.src)
		.pipe(plumber(plumberErrorHandler))
		.pipe(concat(S.jsMin.name))
		.pipe(uglify())
		.pipe(gulp.dest(S.jsMin.dest));
});

gulp.task('watch', function () {
	browserSync.init({
        server: {
            baseDir: "./"
		}
    });

	gulp.watch(S.scss.src, gulp.series('styles'));
	gulp.watch(S.cssMin.src, gulp.series('css-min'));
	gulp.watch(S.jsMin.src, gulp.series('js-min'));
	
	gulp.watch(S.liveReload).on('change', function(path){
		console.log(`Test:  ${path}`);
		gulp.src(path)
			.pipe(plumber(plumberErrorHandler))
			.pipe(browserSync.stream())
			.pipe(notify(
				path.replace(__dirname, '').replace(/\\/g, '/') + ' changed/reloaded'
			));
	});
});

//Default task with postCss
gulp.task('default', gulp.series('styles', 'watch'));

//Min files
gulp.task('min', gulp.series('img-min', 'css-min', 'js-min'));