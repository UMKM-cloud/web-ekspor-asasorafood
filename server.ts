import path from 'node:path';
import express from 'express';
import type { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { attachGlobalErrorHandler, createApiApp } from './apiApp.ts';

const PORT = 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

async function startServer(): Promise<void> {
  const app = createApiApp();

  if (!IS_PRODUCTION) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  }

  attachGlobalErrorHandler(app);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Asasora Food server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err instanceof Error ? err.message : 'Unknown error');
  process.exit(1);
});
