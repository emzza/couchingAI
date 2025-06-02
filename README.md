# CoachAI - Sistema de Mensajería para Coaches

Sistema de mensajería automatizada para coaches que permite programar y enviar mensajes a través de Telegram y WhatsApp.

## Requisitos

- Node.js >= 18.0.0
- MongoDB
- Cuenta de Telegram Bot
- WhatsApp (con conexión por QR)

## Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/coachai

# Server
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token
```

## Instalación

1. Clona el repositorio
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

## Despliegue en Railway

1. Crea una cuenta en [Railway](https://railway.app)
2. Conecta tu repositorio de GitHub
3. Agrega las variables de entorno en Railway:
   ```env
   MONGODB_URI_RAILWAY=tu_uri_de_mongodb
   NODE_ENV=production
   PORT=3000
   CLIENT_URL=tu_url_de_railway
   ```
4. El despliegue se realizará automáticamente

## Estructura del Proyecto

```
├── models/          # Modelos de MongoDB
├── services/        # Servicios de la aplicación
├── types/          # Definiciones de tipos TypeScript
└── index.ts        # Punto de entrada de la aplicación
```

## Licencia

ISC
