var gulp = require('gulp');
var log  = require('../util/gulpLogger');
var config = require('../config');

gulp.task('watch', function () {
    gulp.watch(config.lint.all, ['build']);
    gulp.watch(config.spec.path,['test:unit']);
    log.watch(config.lint.all)
});
