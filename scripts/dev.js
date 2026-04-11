const { spawn } = require('child_process');

function runNodeScript(scriptModule, args = [], extraEnv = {}) {
  const scriptPath = require.resolve(scriptModule);

  return spawn(process.execPath, [scriptPath, ...args], {
    stdio: 'inherit',
    env: { ...process.env, ...extraEnv },
  });
}

const server = runNodeScript('nodemon/bin/nodemon.js', ['server/server.js'], { PORT: '5000' });
const client = runNodeScript('react-scripts/scripts/start.js', [], { PORT: '3000' });

let shuttingDown = false;

function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  server.kill('SIGINT');
  client.kill('SIGINT');

  setTimeout(() => process.exit(exitCode), 100);
}

server.on('exit', (code) => {
  if (!shuttingDown) {
    shutdown(code || 0);
  }
});

client.on('exit', (code) => {
  if (!shuttingDown) {
    shutdown(code || 0);
  }
});

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
