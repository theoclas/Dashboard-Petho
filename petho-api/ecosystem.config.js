module.exports = {
    apps: [
      {
        name: 'petho-api',
        script: 'dist/main.js',
        cwd: '/var/www/petho-api',
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '512M',
        env_file: '.env',
        env: {
          NODE_ENV: 'production',
        },
      },
    ],
  };
  