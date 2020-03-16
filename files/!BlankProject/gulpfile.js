const gulp = require('gulp'),
	browserSync = require('browser-sync').create(),
	imagemin = require('gulp-imagemin'),
	pngquant = require('imagemin-pngquant'),
	mozjpeg = require('imagemin-mozjpeg'),
	minifyCss = require('gulp-minify-css'),
	sourcemaps = require('gulp-sourcemaps'),
	concat = require('gulp-concat'),
	uglify = require('gulp-uglify'),
	plumber = require('gulp-plumber'),
	notify = require('gulp-notify'),
	webp = require('gulp-webp');

//Post css plugins
const processors = [
		require('postcss-import')(),
		require('postcss-simple-vars'),
		require('postcss-nested'),
		require('pixrem')(), // add fallbacks for rem units
		require('autoprefixer')({browsers: 'last 2 versions, ie 9, ios 6, android 4'}),
		require('cssnext')()
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
gulp.task('pcss', function(){
	return gulp.src(P.scss.src)
		.pipe(sourcemaps.init())
        .pipe(postcss(processors))
		.pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(P.scss.dest));
});

//Image min
gulp.task('img-min', function(){
	return gulp.src(P.imgMin.src)
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
        server: {
            baseDir: "./"
        }
    });

	gulp.watch(P.scss.src, ['pcss']);
	gulp.watch(P.cssMin.src, ['css-min']);
	gulp.watch(P.jsMin.src, ['js-min']);
	
	gulp.watch(P.liveReload, function(e){
		gulp.src(e.path)
			.pipe(plumber(plumberErrorHandler))
			.pipe(browserSync.stream())
			.pipe(notify(
				e.path.replace(__dirname, '').replace(/\\/g, '/') + ' changed/reloaded'
			));
	});
});

//Default task with postCss
gulp.task('default', gulp.series('pcss', 'watch'));

//Min files
gulp.task('min', gulp.series('img-min', 'css-min', 'js-min'));