@echo off
REM Crear carpetas
mkdir controllers
mkdir models
mkdir routes
mkdir middlewares
mkdir config

REM Crear archivos
type nul > server.js
type nul > .env
type nul > config\db.js
type nul > models\User.js
type nul > models\Order.js
type nul > controllers\userController.js
type nul > controllers\orderController.js
type nul > routes\userRoutes.js
type nul > routes\orderRoutes.js

echo Estructura creada correctamente.
pause
