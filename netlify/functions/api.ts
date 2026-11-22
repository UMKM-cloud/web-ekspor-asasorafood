import serverless from 'serverless-http';
import { attachGlobalErrorHandler, createApiApp } from '../../apiApp.ts';

const app = createApiApp();
attachGlobalErrorHandler(app);

export const handler = serverless(app);
