import express, { Express } from 'express';
import http, { Server } from 'http';
import dotenv from 'dotenv';
import movieRoutes from './routes/movieRoutes';
import userRoutes from './routes/userRoutes';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import verifyToken from './middleware/authMiddleware';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const app: Express = express();
const server: Server = http.createServer(app);

const PORT = process.env.PORT || 80;

app.use(express.json());
app.use(
  cors({
    origin: '*',
    exposedHeaders: ['encrypted-key'],
  })
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

dotenv.config();

const userActionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20,
  message: 'rate_limiter.error_too_many_requests_edit',
});

const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5,
  message: 'rate_limiter.error_too_many_requests_movie_actions',
});

// app.use('/api/search', searchLimiter);
// app.use('/api/favourite/add', verifyToken, userActionLimiter);
// app.use('/api/favourite/list', verifyToken, userActionLimiter);
// app.use('/api/favourite/delete', verifyToken, userActionLimiter);
// app.use('/api/favourite/clear', verifyToken, userActionLimiter);

// app.use('/api/watch-later/add', verifyToken, userActionLimiter);
// app.use('/api/watch-later/list', verifyToken, userActionLimiter);
// app.use('/api/watch-later/clear', verifyToken, userActionLimiter);

// app.use('/api/watched/add', verifyToken, userActionLimiter);
// app.use('/api/watched/list', verifyToken, userActionLimiter);
// app.use('/api/watched/clear', verifyToken, userActionLimiter);

// app.use('/api/watch/delete', verifyToken, userActionLimiter);

// app.use('/api/user/update-user', verifyToken, authLimiter);

// Use the router for '/api' routes
app.use('/api', movieRoutes);
app.use('/api', userRoutes);

// Root route
app.get('/', (_req, res: any) => {
  res.send('Server is running! Try accessing /api endpoints.');
});

server.listen(PORT, function () {
  console.log(`Server running on ${PORT}`);
});

export default app;
