var path = require('path');
var webpack = require('webpack');

function _static(name){
    return path.resolve(__dirname, name);
}

module.exports = {
    entry: {
        'main': _static("main.jsx"),
        'common': _static("common.js"),
        'vendor': [
            'react',
            'react/addons',
            'react-bootstrap',
            'react-router',
            'reflux',
            'eventemitter3'
        ]
    },
    output: {
        path: _static("build"),
        filename: '[name].js',
    },
    module: {
        loaders: [
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                loader: "babel-loader"
            },
            // {
            //     test: /\.js$/,
            //         use: [{
            //         loader: 'babel-loader',
            //         options: {
            //             presets: ['es2015']
            //         }
            //     }],
            // exclude: /node_modules/
            // }
        ]
    },
    resolve: {
        extensions: ['', '.js', '.jsx']
    },
    plugins: [
        new webpack.optimize.CommonsChunkPlugin("vendor", "vendor.js"),
    ]
    //devtool: "#inline-source-map",
};
