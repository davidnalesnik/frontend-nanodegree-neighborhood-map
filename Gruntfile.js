module.exports = function(grunt) {
    grunt.initConfig({
        useminPrepare: {
            html: 'src/index.html',
            options: {
                dest: 'dist'
            }
        },

        copy: {
            task_1: {
                src: 'src/index.html',
                dest: 'dist/index.html'
            },
            task_2: {
                src: 'src/images/italian-flag.svg',
                dest: 'dist/images/italian-flag.svg'
            },
            task_3: {
                src: 'src/css/style.css',
                dest: 'dist/css/style.css'
            }
        },

        inline: {
            target: {
                options:{
                    cssmin: true,
                },
                src: 'dist/index.html',
                dest: 'dist/index.html'
            }
        },

        usemin: {
            html: ['dist/index.html']
        },

        htmlmin: {
            task: {
                options: {
                    removeComments: true,
                    collapseWhitespace: true
                },
                files: {
                    'dist/index.html': 'dist/index.html'
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-usemin');
    grunt.loadNpmTasks('grunt-inline');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');

    grunt.registerTask('build', [
        'copy:task_1',
        'copy:task_2',
        'copy:task_3',
        'useminPrepare',
        'concat',
        'uglify',
        'usemin',
        'inline',
        'htmlmin'
    ]);
};
