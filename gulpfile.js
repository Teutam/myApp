var gulp = require('gulp');
var gutil = require('gulp-util');
var bower = require('bower');
var concat = require('gulp-concat');
var sass = require('gulp-sass');
var minifyCss = require('gulp-minify-css');
var rename = require('gulp-rename');
var sh = require('shelljs');
var path = require('path');
var express = require('express');
var spawn = require('child_process').spawn;
var Promise = require('bluebird');
var plugins = require('gulp-load-plugins')();
var protractor = require('protractor');

var paths = {
  sass: ['./scss/**/*.scss']
};


// this is the express server which 
// will be initiated when gulp serve
var server = null;

/**
 * Parse arguments
 */
var args = require('yargs')
    .alias('e', 'emulate')
    .alias('b', 'build')
    .alias('r', 'run')
    .alias('pr', 'port-reload')
    // remove all debug messages (console.logs, alerts etc) from release build
    .alias('release', 'strip-debug')
    .default('build', false)
    .default('port', 5000)
    .default('port-reload', Math.floor(Math.random() * (35730 - 35700) + 35700))
    .default('strip-debug', false)
    .argv;

var build = !!(args.build || args.emulate || args.run);
var emulate = args.emulate;
var run = args.run;
var port = args.port;
var livereload = args.portReload;
var stripDebug = !!args.stripDebug;
var targetDir = path.resolve('www');

console.log('targetDir: ', targetDir);

// if we just use emualate or run without specifying platform, we assume iOS
// in this case the value returned from yargs would just be true
if (emulate === true) {
    emulate = 'ios';
}
if (run === true) {
    run = 'ios';
}

// global error handler
function errorHandler(error) {
  console.log('beep: ', beep);
  beep();
  if (build) {
    throw error;
  } else {
    plugins.util.log(error);
  }
};

gulp.task('default', ['sass']);

gulp.task('sass', function(done) {
  gulp.src('./scss/ionic.app.scss')
    .pipe(sass())
    .on('error', sass.logError)
    .pipe(gulp.dest('./www/css/'))
    .pipe(minifyCss({
      keepSpecialComments: 0
    }))
    .pipe(rename({ extname: '.min.css' }))
    .pipe(gulp.dest('./www/css/'))
    .on('end', done);
});

gulp.task('watch', ['sass'], function() {
  gulp.watch(paths.sass, ['sass']);
});

gulp.task('install', ['git-check'], function() {
  return bower.commands.install()
    .on('log', function(data) {
      gutil.log('bower', gutil.colors.cyan(data.id), data.message);
    });
});

gulp.task('git-check', function(done) {
  if (!sh.which('git')) {
    console.log(
      '  ' + gutil.colors.red('Git is not installed.'),
      '\n  Git, the version control system, is required to download Ionic.',
      '\n  Download git here:', gutil.colors.cyan('http://git-scm.com/downloads') + '.',
      '\n  Once git is installed, run \'' + gutil.colors.cyan('gulp install') + '\' again.'
    );
    process.exit(1);
  }
  done();
});

// start local express server
gulp.task('serve', function() {
  server = express()
    //.use(!build ? connectLr({port: livereload}) : function(){})
    .use(express.static(targetDir))
    .listen(port);
});

/*
 * This gets the path to protractor folder under node_modules
 */
 
function getProtractorBinary(binaryName){
    var pkgPath = require.resolve('protractor');
    var protractorDir = path.resolve(path.join(path.dirname(pkgPath), '..', 'bin'));
    return path.join(protractorDir, '/'+binaryName);
}

gulp.task('e2e', ['serve'], function(){

    return new Promise(function(resolve, reject){
        var protractor = getProtractorBinary('protractor');
        setTimeout(function(){
            var stream = spawn('node', [protractor, 'protractor.conf.js'], {stdio: 'inherit'})
                .on('close', function(){
                    server.close();
                    process.exit(0);
                });
            resolve(stream);
        }, 5000);
    });
});

gulp.task('e2eLocal', ['serve'], function(){

  return new Promise(function(resolve, reject){
    /**
     * Steps:
     * 1. webdriver-manager update: to make sure the standalone 
     *      selenium driver is downloaded to be used
     * 2. webdriver-manager start: to start selenium driver
     * 3. run protractor test cases
     */
    var webdriverBinary = getProtractorBinary('webdriver-manager');
	var protractor = getProtractorBinary('protractor');

    var webdriverUpdate = spawn('node', [webdriverBinary, 'update'], {stdio: 'inherit'})
      .once('close', function(){
        //var webdriverProcess = spawn('node', [webdriverBinary, 'start'], {stdio: 'inherit'});
     
        setTimeout(function(){
			var stream = spawn('node', [protractor, 'protractor.conf.js'], {stdio: 'inherit'})
			.on('close', function(){
					//webdriverProcess.kill();
                    webdriverUpdate.kill();
					server.close();
					process.exit(0);
                  });

//          var stream = gulp.src('test/e2e/**/*.spec.js').
//                 pipe(protractor({
//                    configFile: './protractor.conf.js'
//                  })).on('end', function(){
//                    webdriverProcess.kill();
//                    webdriverUpdate.kill();
//                    server.close();
//                  });
          resolve(stream);
        }, 5000);
      });
  });
});
