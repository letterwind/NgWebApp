module.exports = function(config) {
    config.set({
        frameworks: ['jasmine'],
        browsers: ['Chrome'],
        files: [
            'src/app/app.component.spec.ts'
        ],
        singleRun: true
    });
};