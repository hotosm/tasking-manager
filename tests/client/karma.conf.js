// Karma configuration

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '../../client',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],


    // list of files / patterns to load in the browser
    files: [
      'node_modules/angular/angular.js',
      'node_modules/angular-sanitize/angular-sanitize.js',
      'node_modules/angular-route/angular-route.js',
      'node_modules/angular-ui-bootstrap/dist/ui-bootstrap.js',
      'node_modules/angular-mocks/angular-mocks.js',
      'node_modules/openlayers/dist/ol-debug.js',
      'node_modules/ol3-layerswitcher/src/ol3-layerswitcher.js',
      'node_modules/ol3-geocoder/build/ol3-geocoder-debug.js',
      'node_modules/turf/turf.js',
      'node_modules/ng-file-upload/dist/ng-file-upload.js',
      'node_modules/showdown/dist/showdown.js',
      'node_modules/ng-showdown/dist/ng-showdown.js',
      'node_modules/moment/moment.js',
      'node_modules/angular-moment/angular-moment.js',
      'node_modules/chart.js/dist/Chart.js',
      'node_modules/angular-chart.js/dist/angular-chart.js',
      'app/*.js',
      'app/**/*.js',
      '../tests/client/unit/**/*.js'
    ],


    // list of files to exclude
    exclude: [],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {},
    
    
    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],


    // Junit Reporter can be used to output test info for CI system, see homepage for config
    // https://github.com/karma-runner/karma-junit-reporter
    junitReporter: {
      outputDir: '../shippable/testresults',
      useBrowserName: true
    },
    

    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  })
}
