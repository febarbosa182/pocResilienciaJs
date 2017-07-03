var root = process.cwd();

'use strict';

module.exports = {
  lint:{
    all:['lib/**/*.js', 'test/**/*.js','index.js', '!node_modules/']
  },
  spec:{
    path:'test/**/*.js',
    options:{
      ui:'nyan',
      growl: true,
      reporter:'spec'
    }
  },
  build:{
    path: root + '/docs/code/'
  }
};
