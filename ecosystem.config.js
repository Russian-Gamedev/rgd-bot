module.exports = {
  apps: [
    {
      name: 'rgd-bot',
      script: './dist/index.js',
      args: '--enable-source-maps',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
  deploy: {
    production: {
      user: 'root',
      host: '194.61.0.195',
      ref: 'origin/damir-dev',
      repo: 'git@github.com:ZirionNeft/rgd-bot.git',
      path: '/root/rgd-bot/',
      'post-deploy': 'pnpm i && pnpm build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
    },
  },
};