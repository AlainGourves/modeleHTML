const gulp = require('gulp');
const { sassSync } = require("@mr-hope/gulp-sass");
const rename = require('gulp-rename');
const autoprefixer = require('gulp-autoprefixer');
const sourcemaps = require('gulp-sourcemaps');
const browserSync = require('browser-sync').create();

const reload = browserSync.reload;

// CSS
function style() {
    return gulp.src('./scss/**/*.scss')
        .pipe(sourcemaps.init())
        .pipe(sassSync({
            outputStyle: 'expanded'
        }).on('error', sassSync.logError))
        // .pipe(rename('./sty.css'))
        .pipe(autoprefixer())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./css'));
}

// Watch
// server: true     -> serve files from the current directory
// open: false      -> stop the browser from automatically opening
// ghostMode: false -> prevent Clicks, Scrolls & Form inputs on any device to be mirrored to all others
// https: true
function watch() {
    browserSync.init({
        server: true,
        open: false,
        ghostMode: false
    });
    gulp.watch('./scss/**/*.scss', style)
    gulp.watch('./css/**/*.css').on('change', reload);
    gulp.watch('./*.html').on('change', reload);
    gulp.watch('./js/**/*.js').on('change', reload);
};

exports.default = watch;