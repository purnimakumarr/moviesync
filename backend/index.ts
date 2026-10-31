// Load environment variables before any module reads process.env.
import 'dotenv/config';
import http, { Server } from 'http';
import app from './app';
import { warmUpEmbeddings } from './services/embeddings';

const server: Server = http.createServer(app);

const PORT = process.env.PORT || 80;

server.listen(PORT, function () {
  console.log(`Server running on ${PORT}`);
  // Load the mood search model in the background so the first search is fast.
  void warmUpEmbeddings();
});

export default app;
