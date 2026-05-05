# TicoCars2 - API REST

Backend del proyecto TicoCars2. Desarrollado con Node.js y Express por Xavier Gerardo Fernández Zúñiga
Programación en Ambiente Web ISW-711 Universidad Técnica Nacional Sede San Carlos.

## Tecnologías
- Node.js / Express
- MongoDB / Mongoose
- JWT para autenticación
- Passport.js para Google OAuth2
- SendGrid para envío de emails
- Twilio Verify para 2FA por SMS
- OpenRouter AI para validación de mensajes

## Diagrama del proyecto
Se adjunta el diagrama del proyecto en la carpeta /docs de ticocars2_api
<img width="551" height="511" alt="TicoCars2_diagram drawio" src="https://github.com/user-attachments/assets/b767bc4b-c91d-4010-85fd-a73b99abedf8" />

## Servicios externos requeridos
- Padrón Electoral corriendo en puerto 8080
- MongoDB en puerto 27017

## Variables de entorno
Crear un archivo `.env` con las variables del archivo `.env.example`

## Cómo correr
```bash
npm install
npm start
```

El servidor corre en http://localhost:3000
