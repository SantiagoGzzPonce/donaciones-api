# Donaciones API — Módulo de registro de donantes

Sistema para gestionar donaciones de alimentos y recursos entre empresas y organizaciones sociales.
Este repositorio contiene el **módulo de registro de personas donantes** con:

- Autenticación con **JWT** (HS256, expiración 1 h) y contraseñas cifradas con **bcrypt**.
- **Roles** `admin` y `usuario` con control de acceso por recurso.
- **Pruebas unitarias e integración con Jest** (72 pruebas, cobertura > 95 %, umbral mínimo 80 % obligatorio).
- **Pipeline CI/CD con GitHub Actions**: pruebas → construcción → escaneo OWASP ZAP → despliegue automático en Render.
- **Análisis de calidad con SonarCloud**.

## Tecnologías
Node.js 20, Express 4, jsonwebtoken, bcryptjs, helmet, express-rate-limit, Jest, Supertest.

## Ejecutar localmente
```bash
npm install
cp .env.example .env        # en Windows: copy .env.example .env
npm test                    # pruebas + reporte de cobertura (coverage/index.html)
npm start                   # http://localhost:3000
```
Usuario administrador inicial: `admin@donaciones.local` / `Admin123!` (configurable en `.env`).

## Endpoints principales
| Método | Ruta | Acceso |
|---|---|---|
| POST | /api/auth/register | Público (siempre crea rol usuario) |
| POST | /api/auth/login | Público |
| GET | /api/auth/me | Autenticado |
| GET/POST | /api/donors | Autenticado (usuario ve solo los suyos, admin todos) |
| GET/PUT | /api/donors/:id | Dueño o admin |
| DELETE | /api/donors/:id | Solo admin |
| GET | /api/users | Solo admin |
| PATCH | /api/users/:id/role | Solo admin |

Especificación completa: `docs/openapi.yaml`.

## Controles de seguridad implementados
| Riesgo (OWASP Top 10) | Control |
|---|---|
| Inyección (SQLi/NoSQLi) | Validación estricta de tipos y formato; rechazo de objetos en campos de texto; búsqueda tratada como texto literal |
| XSS | Rechazo de `<` `>` en entradas, CSP estricta, UI usa `textContent` |
| Autenticación rota | bcrypt, JWT con algoritmo fijo, expiración, rate limit en login, mensaje genérico de error |
| Control de acceso roto / IDOR | Middleware `authorize`, verificación de dueño del recurso, rol leído del servidor |
| Escalamiento de privilegios | El registro ignora el campo `role` |
| Configuración insegura | helmet (HSTS, nosniff, frame-ancestors, CSP sin comodines), Permissions-Policy, CORS cerrado por defecto, `Cache-Control: no-store` en la API, sin `X-Powered-By`, errores 500 sin detalle, límite de 10 kb por petición |
| Credenciales por defecto | En producción la app no arranca sin `JWT_SECRET` y `ADMIN_PASSWORD` |
| Componentes vulnerables | `npm audit` en el pipeline |
