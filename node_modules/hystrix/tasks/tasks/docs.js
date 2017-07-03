var gulp = require('gulp' );
var shell = require( 'gulp-shell' );

gulp.task( 'js-doc', shell.task( [
  './node_modules/.bin/jsdoc -c jsdoc.conf.json -d docs/code lib/ -r index.js'
] ) );
