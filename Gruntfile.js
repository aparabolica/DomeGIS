module.exports = function(grunt) {

  grunt.initConfig({
    browserify: {
      all: {
        files: {
          'client/dist/app.js': 'client/src/js/index.js'
        }
      }
    },
    uglify: {
      all: {
        options: {
          mangle: true,
          compress: true
        },
        files: {
          'client/dist/app.js': 'client/dist/app.js',
        }
      }
    },
    less: {
      all: {
        options: {
          compress: true
        },
        files: {
          'client/dist/css/app.css': 'client/src/css/main.less'
        }
      }
    },
    jade: {
      all: {
        options: {
          doctype: 'html',
          pretty: false
        },
        files: [{
          expand: true,
          cwd: 'client/src',
          src: ['**/*.jade', '!views/includes/**/*'],
          dest: 'client/dist',
          ext: '.html'
        }]
      }
    },
    copy: {
      all: {
        files: [
          {
            cwd: 'src',
            src: ['**', '!js/**', '!**/*.less', '!**/*.jade', '!**/*.js'],
            dest: 'client/dist',
            expand: true
          }
        ]
      },
      static: {
        files: [
          {
            cwd: 'bower_components',
            src: ['**/*'],
            dest: 'client/dist/static',
            expand: true
          }
        ]
      }
    },
    watch: {
      options: {
        livereload: true
      },
      css: {
        files: 'client/src/css/**/*.less',
        tasks: ['less']
      },
      jade: {
        files: 'client/src/**/*.jade',
        tasks: ['jade']
      },
      scripts: {
        files: 'client/src/js/**/*.js',
        tasks: ['browserify']
      },
      copy: {
        files: ['client/src/**', '!client/src/**/*.less', '!client/src/**/*.jade', '!client/src/**/*.js'],
        tasks: ['copy']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-jade');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask(
    'javascript',
    'Compile scripts.',
    ['browserify', 'uglify']
  );

  grunt.registerTask(
    'views',
    'Compile views.',
    ['jade', 'less']
  );

  grunt.registerTask(
    'build',
    'Compiles everything.',
    ['copy', 'javascript', 'views']
  );

  grunt.registerTask(
    'default',
    'Build, start server and watch.',
    ['build', 'watch']
  );

}
