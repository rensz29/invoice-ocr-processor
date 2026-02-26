/** PM2 ecosystem – run DB server + Vite dev server concurrently */
module.exports = {
  apps: [
    {
      name: 'invoice-db',
      script: 'server/db-server.js',
      interpreter: 'node',
      cwd: __dirname,
      watch: false,
      env: { NODE_ENV: 'development' },
    },
    {
      name: 'invoice-vite',
      script: 'npx',
      args: 'vite --port 5008',
      interpreter: 'none',
      cwd: __dirname,
      watch: false,
      env: { NODE_ENV: 'development' },
    },
  ],
}
