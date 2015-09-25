({
    include: ['boot', 'dicts/de'],
    out: 'build/app/app.min.js',
    baseUrl: 'app/',
    mainConfigFile: 'app/main.js',
    optimize: 'uglify2',
    insertRequire: ['boot'],
    wrap: true
});
