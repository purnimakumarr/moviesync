import express, { Express } from 'express';
import movieRoutes from './routes/movieRoutes';
import userRoutes from './routes/userRoutes';
import cors from 'cors';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const app: Express = express();

app.use(express.json());
// Comma-separated list, e.g. "https://moviesync-xi.vercel.app,http://localhost:5173".
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    exposedHeaders: ['encrypted-key'],
  }),
);

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MovieSync API',
      version: '1.0.0',
    },
    servers: [
      {
        url: process.env.BACKEND_PROD,
        description: 'Production Server',
      },
      {
        url: process.env.BACKEND_DEV,
        description: 'Local Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./docs/*.ts'],
};

const specs = swaggerJSDoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Use the router for '/api' routes
app.use('/api', movieRoutes);
app.use('/api', userRoutes);

// Root route
app.get('/', (_req, res: any) => {
  res.send('Server is running! Try accessing /api endpoints.');
});

export default app;
