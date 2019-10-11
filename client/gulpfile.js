var gulp = require('gulp'),
    browserSync = require('browser-sync'),
    concat = require('gulp-concat'),
    config = require('gulp-ng-config'),
    cssnano = require('gulp-cssnano'),
    del = require('del'),
    eslint = require("gulp-eslint"),
    fs = require('fs'),
    modRewrite = require('connect-modrewrite'),
    processhtml = require('gulp-processhtml'),
    remoteSrc = require('gulp-remote-src'),
    rename = require('gulp-rename'),
    runSequence = require('run-sequence'),
    sass = require('gulp-sass');
uglify = require('gulp-uglify');

// paths object holds references to location of all assets
var paths = {
    scripts: ['app/**/*.js'],
    html: ['./**/*.html', '!node_modules/**/*.html'],
    styles: ['assets/styles/css/*.css'],
    images: ['assets/img/**/*'],
    icons: ['assets/icons/**/*'],
    locale: ['locale/*.json']
};

gulp.task('eslint', function () {
  return gulp.src('**/*.js')
    .pipe(eslint())
    .pipe(eslint.format('stylish'));
});

gulp.task('browser-sync', function () {
    /** Runs the web app currently under development and watches the filesystem for changes */

        // Specify list of files to watch for changes, apparently reload method doesn't work on Windows */
    var filesToWatch = [
            './app/**/*.html',
            './app/**/*.js'
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

gulp.task('clean', function () {
    /** Clean up dist folder before adding deployment files */
    return del(['../server/web/static/dist/*'], {force: true});
});

gulp.task('minify-css', function () {
    /** Minify all CSS and output to dist - Docs for CSSNano are here https://github.com/ben-eb/cssnano */

    return gulp.src(paths.styles)
        .pipe(concat('taskingmanager.min.css'))
        .pipe(gulp.dest('../server/web/static/dist/assets/styles/css'))
        .pipe(cssnano())
        .pipe(gulp.dest('../server/web/static/dist/assets/styles/css'));
});

gulp.task('uglify', function () {
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
                includePaths: require('node-bourbon').with('node_modules/jeet/scss', require('hot-design-system/gulp-addons').scssPath)
            }
        ).on('error', sass.logError))
        .pipe(gulp.dest('assets/styles/css/'));
});

gulp.task('sass:watch', function () {
    /** Watches the sass files **/
    gulp.watch('assets/styles/sass/*.scss', ['compile-sass']);
});

gulp.task('copy_images_to_dist', function () {
    /* Copy the images in the image folder to a dist folder */
    return gulp.src(paths.images)
        .pipe(gulp.dest('../server/web/static/dist/assets/img'));
});

gulp.task('copy_icons_to_dist', function () {
    /* Copy the icons in the icons folder to a dist folder */
    return gulp.src(paths.icons)
        .pipe(gulp.dest('../server/web/static/dist/assets/icons'));
});

gulp.task('copy_translations_to_dist', function () {
    /* Copy the translations in the locale folder to a dist folder */
    return gulp.src(paths.locale)
        .pipe(gulp.dest('../server/web/static/dist/locale'));
});

gulp.task('create-dev-config', function () {
    /** Creates a config file for Angular with the relevant environment variables for development */
    return gulp.src('taskingmanager.config.json')
        .pipe(config('taskingmanager.config', {environment: 'development'}))
        .pipe(gulp.dest('app'))
});

gulp.task('create-release-config', function () {
    /** Creates a config file for Angular with the relevant environment variables for release */
    return gulp.src('taskingmanager.config.json')
        .pipe(config('taskingmanager.config', {environment: 'release'}))
        .pipe(gulp.dest('app'))
});

gulp.task('create-presets-config', function () {
   /**
    * Creates a config file for Angular containing iD editor preset categories
    * from the iD preset categories file, which will be fetched directly from
    * Github if no presets file exists locally
    *
    * There is a plan to break iD presets out into their own NPM package, at
    * which time this will no longer be necessary
    */
    var presetData = fs.existsSync('./id_preset_categories.json') ?
                     gulp.src('id_preset_categories.json') :
                     fetchIdPresets()

    return presetData
        .pipe(config('idpresets'))
        .pipe(gulp.dest('app'))
});

gulp.task('fetch-id-presets', function () {
  /**
   * Explicitly fetch presets file from Github, intended to be run manually on
   * demand
   */
  return fetchIdPresets();
});

/** Build task for will minify the app and copy it to the dist folder ready to deploy */
gulp.task('build', function (callback) {
    runSequence('clean',
        'create-release-config',
        'create-presets-config',
        'compile-sass',
        'copy_images_to_dist',
        'copy_icons_to_dist',
        'copy_translations_to_dist',
        'minify-css',
        'uglify',
        'processhtml',
        callback
    )
    ;
});

gulp.task('run', function (callback) {
    runSequence('create-dev-config',
        'create-presets-config',
        'compile-sass',
        'browser-sync',
        'sass:watch',
        callback
    )
    ;
});

function fetchIdPresets() {
  /**
   * Fetches the iD preset categories from github and saves them as
   * ./id_preset_categories.json
   */
  return remoteSrc('presets/categories.json', {
             base: 'https://raw.githubusercontent.com/openstreetmap/iD/v2.15.3/data/'
         })
      .pipe(rename('id_preset_categories.json'))
      .pipe(gulp.dest('./'));
}
