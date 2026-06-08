module.exports = {
  apps: [
    {
      name: "loden-api",
      script: "dist/backend/main.js",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      max_memory_restart: "300M",
      env_production: {
        NODE_ENV: "production",
        PORT: 4000,
        API_USE_MEMORY: "false"
      }
    },
    {
      name: "loden-web",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      max_memory_restart: "500M",
      env_production: {
        NODE_ENV: "production",
        LODEN_API_URL: "http://127.0.0.1:4000",
        // Même secret que l'API : le middleware /admin vérifie la signature du JWT.
        JWT_SECRET: process.env.JWT_SECRET
      }
    }
  ]
};
