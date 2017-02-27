var gulp = require('gulp'),
    browserSync = require('browser-sync'),
    concat = require('gulp-concat'),
    config = require('gulp-ng-config'),
    cssnano = require('gulp-cssnano'),
    del = require('del'),
    modRewrite = require('connect-modrewrite'),
    processhtml = require('gulp-processhtml'),
    runSequence = require('run-sequence'),
    sass = require('gulp-sass');
    uglify = require('gulp-uglify');

// paths object holds references to location of all assets
var paths = {
    scripts: ['app/**/*.js'],
    html: ['./**/*.html', '!node_modules/**/*.html'],
    styles: ['assets/styles/css/*.css'],
    images: ['assets/img/**/*']
};

gulp.task('browser-sync', function () {
    /** Runs the web app currently under development and watches the filesystem for changes */

    // Specify list of files to watch for changes, apparently reload method doesn't work on Windows */
	var filesToWatch = [
        './**/*.html',
        './**/*.js'
   ];

    // Create a rewrite rule that redirects to index.html to let Angular handle the routing
	browserSync.init(filesToWatch, {
        server: {
            baseDir: "./",
            middleware: [
                modRewrite([
                    '!\\.\\w+$ /index.html [L]'
                ])
            ]
        }
	});
});

gulp.task('clean', function() {
    /** Clean up dist folder before adding deployment files */
    return del(['../server/web/static/dist/*'], {force: true});
});

gulp.task('minify-css', function() {
    /** Minify all CSS and output to dist - Docs for CSSNano are here https://github.com/ben-eb/cssnano */

    return gulp.src(paths.styles)
        .pipe(concat('taskingmanager.min.css'))
        .pipe(gulp.dest('../server/web/static/dist/assets/styles/css'))
        .pipe(cssnano())
        .pipe(gulp.dest('../server/web/static/dist/assets/styles/css'));
});

gulp.task('uglify', function() {
    /**
     * Process scripts and concatenate them into one output file, note that output of uglify MUST be piped back
     * to dist, otherwise minified js won't be saved
     */
    gulp.src(paths.scripts)
        .pipe(concat('taskingmanager.min.js'))
        .pipe(gulp.dest('../server/web/static/dist/app'))
        .pipe(uglify())
        .pipe(gulp.dest('../server/web/static/dist/app'))
});

gulp.task('processhtml', function () {
    /** Replace refs to dev files with minified versions or versions on CDNs */
    return gulp.src(paths.html)
        .pipe(processhtml())
        .pipe(gulp.dest('../server/web/static/dist'));
});

gulp.task('compile-sass', function () {
    /** Creates a CSS file from the SCSS files */
    return gulp.src('assets/styles/sass/taskingmanager.scss')
        .pipe(sass({
            outputStyle: 'expanded', 
            precision: 10,
            includePaths: require('node-bourbon').with('node_modules/jeet/scss', require('oam-design-system/gulp-addons').scssPath)}
        ).on('error', sass.logError))
        .pipe(gulp.dest('assets/styles/css/'));
});

gulp.task('sass:watch', function () {
    /** Watches the sass files **/
    gulp.watch('assets/styles/sass/*.scss', ['compile-sass']);
});

gulp.task('create-config-dev', function (){
    /** Creates a config file for Angular with the relevant environment variables for development */
   return gulp.src('taskingmanager.config.json')
       .pipe(config('taskingmanager.config', {environment: 'development'}))
       .pipe(gulp.dest('app'))
});

gulp.task('create-config-build', function (){
    /** Creates a config file for Angular with the relevant environment variables for staging/production */
   return gulp.src('taskingmanager.config.json')
       .pipe(config('taskingmanager.config', {environment: 'build'}))
       .pipe(gulp.dest('app'))
});

/** Build task for will minify the app and copy it to the dist folder ready to deploy */
gulp.task('build', function(callback) {
    runSequence('clean',
                'create-config-build',
                'compile-sass',
                'minify-css',
                'uglify',
                'processhtml',
                callback);
});

gulp.task('run', function(callback){
    runSequence('create-config-dev',
                'compile-sass',
                'browser-sync',
                'sass:watch',
                callback);
});