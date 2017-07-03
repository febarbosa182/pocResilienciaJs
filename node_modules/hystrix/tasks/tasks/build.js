var gulp = require('gulp'),
    config = require('../config');

// BUILD
gulp.task('build', [
  'clean',
  'lint',
  'js-doc',
  'test:unit'
]);

