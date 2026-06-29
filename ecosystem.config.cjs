/**
 * ==============================================================================
 * PLANSZOWY ZAKĄTEK - PM2 PROCESS & DEPLOYMENT CONFIGURATION
 * ==============================================================================
 * Security Level: Bulletproof (Filar 1 - Deployment Safety)
 * Description: Orchestrates PM2 process management, clustering, and safe
 *              automated pre-deployment database backup hooks.
 * ==============================================================================
 */

module.exports = {
  apps: [
    {
      name: "planszowy-zakatek",
      script: "dist/server.cjs", // The bundled production entry point
      instances: "max",          // Runs in cluster mode for load balancing
      exec_mode: "cluster",      // Enables PM2 cluster mode
      autorestart: true,         // Automatically restart if process crashes
      watch: false,              // Never watch files in production (causes crash loops)
      max_memory_restart: "1G",  // Restarts process if memory exceeds 1GB
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
        JWT_SECRET: "planszowki-super-secret-key-12345" // Put your real production secret in your system .env
      }
    }
  ],

  // PM2 Automated Deployment System
  deploy: {
    production: {
      user: "ubuntu",                     // Your VPS SSH username (e.g., 'ubuntu' or 'root')
      host: ["YOUR_SERVER_IP_ADDRESS"],   // Your server's IP address
      ref: "origin/main",                 // Git branch to deploy from
      repo: "git@github.com:yourusername/planszowy-zakatek.git", // Your Git repository
      path: "/var/www/planszowy-zakatek", // Installation directory on your server
      
      // 🚀 CRITICAL DEPLOYMENT SAFETY HOOKS (Filar 1)
      
      // Hook 1: Executed locally on your machine BEFORE deploying
      "pre-deploy-local": "echo 'Deploying code to production server...'",

      // Hook 2: Executed on the SERVER immediately after code is pulled, BEFORE app is restarted
      // This is our primary shield: we run a fresh DB backup BEFORE applying any code/DB updates!
      "pre-setup": "echo 'Initializing server folder structure...'",
      "post-setup": "echo 'Server structure initialized.'",
      
      "pre-deploy": "echo '📦 Performing database backup before updating code...' && chmod +x scripts/backup.sh && ./scripts/backup.sh",
      
      // Hook 3: Executed on the SERVER after deployment is successful (installs packages, builds, restarts PM2)
      "post-deploy": "npm install && npm run build && pm2 startOrReload ecosystem.config.cjs --env production"
    }
  }
};
