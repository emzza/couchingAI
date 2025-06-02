# Documentación de la Aplicación de Coaching

## Versión 1.1.0

### Cambios Recientes
- Integración con WhatsApp Web
- Sistema de notificaciones en tiempo real
- Mejoras en la interfaz de usuario

### Características Principales

#### 1. Integración con WhatsApp
- Conexión en tiempo real mediante Socket.IO
- Visualización del código QR para autenticación
- Estado de conexión en tiempo real
- Envío de mensajes directos
- Notificaciones de éxito/error

#### 2. Sistema de Mensajes
- Envío de mensajes individuales
- Validación de números de teléfono
- Confirmación de entrega
- Manejo de errores

#### 3. Interfaz de Usuario
- Panel de control intuitivo
- Visualización del estado de conexión
- Formulario de envío de mensajes
- Notificaciones en tiempo real

### Configuración

#### Requisitos
- Node.js 14+
- NPM 6+
- Backend de WhatsApp corriendo en http://localhost:3000

#### Instalación
1. Clonar el repositorio
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```

### Uso

#### Conexión con WhatsApp
1. Navegar a la sección de Configuración
2. Esperar a que se muestre el código QR
3. Escanear el código con WhatsApp en el teléfono
4. Confirmar la conexión

#### Envío de Mensajes
1. Ingresar el número de teléfono del destinatario
2. Escribir el mensaje
3. Hacer clic en "Enviar Mensaje"
4. Esperar la confirmación de envío

### API Endpoints

#### WhatsApp
- GET /api/whatsapp/status
  - Obtiene el estado actual de la conexión
  - Retorna: `{ connected: boolean, qrCode?: string }`

- POST /api/whatsapp/send
  - Envía un mensaje de WhatsApp
  - Body: `{ to: string, message: string }`

### Eventos Socket.IO

#### Cliente
- 'qr': Recibe el código QR para autenticación
- 'session_status': Actualiza el estado de la conexión
- 'message_sent': Confirma el envío exitoso
- 'message_error': Notifica errores en el envío

### Contribución
1. Fork el repositorio
2. Crear una rama para la característica
3. Commit los cambios
4. Push a la rama
5. Crear un Pull Request

### Licencia
MIT

## Descripción General
Esta es una aplicación web diseñada para coaches motivacionales que les permite gestionar frases motivacionales, contactos y simular el envío de mensajes. La aplicación está construida con React, TypeScript y utiliza la API de Gemini para generar frases similares.

## Características Principales
1. **Sistema de Autenticación**
   - Login simple basado en nombre de usuario
   - Persistencia de sesión mediante localStorage

2. **Gestión de Frases**
   - Creación y eliminación de frases motivacionales
   - Generación automática de frases similares usando la API de Gemini
   - Almacenamiento local de frases

3. **Gestión de Contactos**
   - Creación y eliminación de contactos
   - Almacenamiento local de contactos

4. **Simulador de Mensajes**
   - Simulación de envío de mensajes a contactos
   - Integración con Telegram (requiere token de bot)

5. **Configuraciones**
   - Gestión del token de Telegram
   - Personalización de la aplicación

## Estado Actual
La aplicación parece estar funcional en términos de estructura y código, pero requiere:

1. **Configuración Necesaria**
   - Una clave API de Gemini (`GEMINI_API_KEY`)
   - (Opcional) Token de bot de Telegram para funcionalidad completa

2. **Dependencias**
   - Node.js
   - npm para gestión de paquetes

## Requisitos para Ejecución
1. Instalar dependencias: `npm install`
2. Configurar la variable de entorno `GEMINI_API_KEY`
3. Ejecutar la aplicación: `npm run dev`

## Tecnologías Utilizadas
- React
- TypeScript
- Tailwind CSS
- API de Gemini
- Integración con Telegram

## Notas Importantes
- La aplicación utiliza almacenamiento local para persistir datos
- La generación de frases requiere una conexión a internet y una clave API válida
- La funcionalidad de Telegram es opcional y requiere configuración adicional

---

## Documentación de Componentes

### 1. App.tsx
**Función:** Componente principal. Gestiona el estado global y la navegación entre secciones.

### 2. Sidebar.tsx
**Función:** Menú lateral de navegación. Permite cambiar entre Dashboard, Frases, Contactos, Simular Envío, Pagos y Ajustes.

### 3. Dashboard.tsx
**Función:** Muestra el resumen principal del coach (bienvenida, contactos, próximo mensaje, última frase).

### 4. PhraseManager.tsx
**Función:** Permite crear, programar y gestionar frases motivacionales. Incluye generación de variantes con IA.

### 5. ContactManager.tsx
**Función:** Permite gestionar los contactos del coach (añadir, eliminar, importar por CSV).

### 6. MessageSimulator.tsx
**Función:** Permite simular el envío de mensajes a los contactos según las frases programadas.

### 7. SettingsView.tsx
**Función:** Permite configurar el token de Telegram y ver información sobre la API de Gemini.

### 8. PaymentsView.tsx
**Función:** Muestra la sección de facturación y pagos, con resumen, historial y botón de pago.

### 9. types.ts
**Función:** Define los tipos e interfaces TypeScript usados en toda la app (Coach, Phrase, Contact, AppView, etc.).

---

## Estructura del Proyecto y Explicación de Archivos

- **/components/**
  - Contiene todos los componentes visuales reutilizables y las vistas principales de la app.
  - Ejemplo: `Sidebar.tsx`, `PhraseManager.tsx`, `ContactManager.tsx`, `PaymentsView.tsx`, etc.

- **/services/**
  - Lógica de negocio y utilidades para interactuar con APIs externas o lógica de facturación.
  - Ejemplo: `GeminiService.ts` (frases IA), `BillingService.ts` (cálculo de facturación), `TelegramService.ts` (envío de mensajes).

- **/types.ts**
  - Define los tipos e interfaces TypeScript globales (Coach, Phrase, Contact, AppView, etc.).

- **App.tsx**
  - Punto de entrada principal de la app. Gestiona el estado global, la navegación y renderiza el layout general.

- **documentacion.md**
  - Este archivo. Documentación técnica y funcional del proyecto.

- **package.json**
  - Define las dependencias, scripts y metadatos del proyecto.

- **tailwind.config.js**
  - Configuración de Tailwind CSS para estilos personalizados.

- **index.html / main.tsx**
  - Archivos de entrada para el renderizado de la app en el navegador.

- **/public/**
  - Archivos estáticos y recursos públicos (imágenes, favicon, etc.).

- **/node_modules/**
  - Dependencias instaladas automáticamente (no modificar manualmente).

---

Cada carpeta y archivo está pensado para mantener la aplicación modular, escalable y fácil de mantener. Si necesitas agregar nuevas funcionalidades, lo ideal es crear un nuevo componente en `/components` o un nuevo servicio en `/services` según corresponda. 