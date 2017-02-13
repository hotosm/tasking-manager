var gulp = require('gulp'),
    browserSync = require('browser-sync'),
    del = require('del'),
    modRewrite = require('connect-modrewrite'),
    runSequence = require('run-sequence');

// paths object holds references to location of all assets
var paths = {
    scripts: ['app/**/*.js'],
    html: ['./**/*.html', '!node_modules/**/*.html'],
    images: ['assets/img/**/*']
};


gulp.task('browser-sync', function () {
    /** Runs the web app currently under development and watches the filesystem for changes */

    // Specify list of files to watch for changes, apparently reload method doesn't work on Windows */
	var filesToWatch = [
        './*.html',
        './*.js'
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

gulp.task('processhtml', function () {
    /** Replace refs to dev files with minified versions or versions on CDNs */
    return gulp.src(paths.html)
               .pipe(gulp.dest('../server/web/static/dist'));
});

/** Build task for STAGING env - will minify the app and copy it to the dist folder ready to deploy */
gulp.task('build', function(callback) {
    runSequence('clean',
                'processhtml',
                callback);

});

gulp.task('run', ['browser-sync']);