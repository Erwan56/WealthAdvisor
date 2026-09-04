#!/usr/bin/env node
// One-click start: builds the web app, boots the Express server (which
// serves both the API and the built frontend on a single port), then opens
// the browser once the server is ready.

import { spawn } from 'node:child_process';
import { platform } from 'node:process';

const PORT = process.env.PORT || 4000;
const URL = `http://localhost:${PORT}`;

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', ...opts });
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(' ')} exited with ${code}`))));
  });
}

async function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status < 500) return true;
    } catch {
      // server not up yet
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  return false;
}

function openBrowser(url) {
  const cmd = platform === 'darwin' ? 'open' : platform === 'win32' ? 'start' : 'xdg-open';
  const args = platform === 'win32' ? ['', url] : [url];
  spawn(cmd, args, { stdio: 'ignore', detached: true, shell: platform === 'win32' }).unref();
}

async function main() {
  console.log('WealthAdvisor — build de l\'interface web…');
  await run('npm', ['run', 'build', '--workspace=web']);

  console.log('WealthAdvisor — démarrage du serveur…');
  const server = spawn('npm', ['run', 'dev', '--workspace=server'], {
    stdio: 'inherit',
    env: { ...process.env, PORT: String(PORT) },
  });

  const ready = await waitForServer(URL);
  if (ready) {
    console.log(`WealthAdvisor prêt — ouverture du navigateur sur ${URL}`);
    openBrowser(URL);
  } else {
    console.warn(`Le serveur ne répond pas encore — ouvrez ${URL} manuellement.`);
  }

  server.on('exit', (code) => process.exit(code ?? 0));
  process.on('SIGINT', () => server.kill('SIGINT'));
  process.on('SIGTERM', () => server.kill('SIGTERM'));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
