const nextConfigDev = {
    webpack: function (config) {
        config.module.rules.push({
            test: /\.(eot|woff|woff2|ttf|png|jpg|gif)$/,
            use: {
                loader: 'url-loader',
                options: {
                    limit: 100000,
                    name: '[name].[ext]',
                },
            },
        })
        config.module.rules.push({
            test: /\.svg$/,
            use: ['@svgr/webpack'],
        })
        return config
    },
    env: {
        APP_ENV: String(process.env.APP_ENV),
    },
}
const nextConfig = {
    webpack: function (config) {
        config.module.rules.push({
            test: /\.(eot|woff|woff2|ttf|png|jpg|gif)$/,
            use: {
                loader: 'url-loader',
                options: {
                    limit: 100000,
                    name: '[name].[ext]',
                },
            },
        })
        config.module.rules.push({
            test: /\.svg$/,
            use: ['@svgr/webpack'],
        })
        return config
    },
    env: {
        APP_ENV: String(process.env.APP_ENV),
    },
}

if (process.env.NODE_ENV === 'production') {
    module.exports = nextConfig
} else {
    module.exports = nextConfigDev
}
