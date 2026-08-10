import { spawn } from 'child_process';

console.log('🚀 Starting Backend API Server (Port 5000)...');
const backend = spawn('node', ['backend/server.js'], { stdio: 'inherit', shell: true });

console.log('⚡ Starting Vite Frontend (Port 5173)...');
const frontend = spawn('npx', ['vite'], { stdio: 'inherit', shell: true });

process.on('SIGINT', () => {
  backend.kill();
  frontend.kill();
  process.exit();
});
