import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { mongoDBService } from './services/MongoDBService';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Inicializar MongoDB
async function initializeApp() {
  try {
    await mongoDBService.connect();
    console.log('Aplicación inicializada correctamente');
  } catch (error) {
    console.error('Error al inicializar la aplicación:', error);
    process.exit(1);
  }
}

// Función para encontrar un puerto disponible
function findAvailablePort(startPort: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.listen(startPort, () => {
      const { port } = server.address() as { port: number };
      server.close(() => resolve(port));
    });
    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        resolve(findAvailablePort(startPort + 1));
      } else {
        reject(err);
      }
    });
  });
}

// Iniciar el servidor
async function startServer() {
  try {
    const desiredPort = parseInt(process.env.PORT || '3000', 10);
    const port = await findAvailablePort(desiredPort);
    
    httpServer.listen(port, () => {
      console.log(`Servidor corriendo en puerto ${port}`);
      initializeApp();
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

startServer();

// Manejar cierre de la aplicación
process.on('SIGINT', async () => {
  try {
    await mongoDBService.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error al cerrar la aplicación:', error);
    process.exit(1);
  }
}); 