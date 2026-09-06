module.exports = {
  apps: [
    {
      name: 'dparcels-backend',
      script: './dist/server.js',
      instances: 'max', // This will automatically detect the 2 vCPUs on KVM2 and spin up 2 instances
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G', // Keeps RAM usage in check
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      }
    }
  ]
};
