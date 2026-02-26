/** PM2 ecosystem – run DB server + Vite dev server on 172.27.0.178:5008 */
const HOST = '172.27.0.178'
const VITE_PORT = 5008
const DB_PORT = 8003

module.exports = {
  apps: [
    {
      name: 'invoice-db',
      script: 'server/db-server.js',
      interpreter: 'node',
      cwd: __dirname,
      watch: false,
      env: {
        NODE_ENV: 'development',
        DB_SERVER_PORT: DB_PORT,
      },
    },
    {
      name: 'invoice-vite',
      script: 'npx',
      args: `vite --host ${HOST} --port ${VITE_PORT}`,
      interpreter: 'none',
      cwd: __dirname,
      watch: false,
      env: {
        NODE_ENV: 'development',
      },
    },
  ],
}
