import serverless from 'serverless-http';
import { createExpressApp } from '../../src/server/app';

const app = createExpressApp();

export const handler = serverless(app, {
  binary: ['image/*', 'audio/*', 'video/*'],
});
