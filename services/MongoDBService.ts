import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

class MongoDBService {
  private static instance: MongoDBService;
  private isConnected: boolean = false;

  private constructor() {
    // Constructor privado para Singleton
  }

  public static getInstance(): MongoDBService {
    if (!MongoDBService.instance) {
      MongoDBService.instance = new MongoDBService();
    }
    return MongoDBService.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      console.log('MongoDB ya está conectado');
      return;
    }

    try {
      const uri = process.env.NODE_ENV === 'production' 
        ? process.env.MONGODB_URI_RAILWAY 
        : process.env.MONGODB_URI;

      if (!uri) {
        throw new Error('No se encontró la URI de MongoDB en las variables de entorno');
      }

      await mongoose.connect(uri, {
        // Opciones de conexión recomendadas
        autoIndex: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      this.isConnected = true;
      console.log('Conexión exitosa a MongoDB');

      // Manejar eventos de conexión
      mongoose.connection.on('error', (error) => {
        console.error('Error en la conexión de MongoDB:', error);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.log('MongoDB desconectado');
        this.isConnected = false;
      });

      // Manejar señales de terminación
      process.on('SIGINT', this.gracefulShutdown.bind(this));
      process.on('SIGTERM', this.gracefulShutdown.bind(this));

    } catch (error) {
      console.error('Error al conectar a MongoDB:', error);
      throw error;
    }
  }

  private async gracefulShutdown(): Promise<void> {
    try {
      await mongoose.connection.close();
      console.log('Conexión a MongoDB cerrada por terminación de la aplicación');
      process.exit(0);
    } catch (error) {
      console.error('Error al cerrar la conexión de MongoDB:', error);
      process.exit(1);
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) return;

    try {
      await mongoose.connection.close();
      this.isConnected = false;
      console.log('Desconexión exitosa de MongoDB');
    } catch (error) {
      console.error('Error al desconectar de MongoDB:', error);
      throw error;
    }
  }

  public getConnection(): mongoose.Connection {
    return mongoose.connection;
  }

  public isConnectedToMongo(): boolean {
    return this.isConnected;
  }
}

export const mongoDBService = MongoDBService.getInstance(); 