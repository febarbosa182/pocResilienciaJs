var gulp    = require('gulp');
var eslint  = require('gulp-eslint');
var error   = require('../util/handleErrors');
var config  = require('../config');
var log     = require('../util/gulpLogger');


gulp.task('lint', function () {
  return gulp.src(config.lint.all)
      .pipe(eslint())
      .pipe(eslint.format())
      .pipe(eslint.failOnError())
      .on('error',error)
});
