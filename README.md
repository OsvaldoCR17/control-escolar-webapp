# Control Escolar WebApp

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 16.2.11.

## Descripción

Aplicación Angular para gestión escolar (usuarios y materias) con integración a un backend (Django/DRF). Incluye pantallas de administración, registro de usuarios (administradores, maestros, alumnos), registro y listado de materias, y gráficas dinámicas.

## Características

- Autenticación basada en token (consumida desde el frontend via `FacadeService`).
- Registro/edición de usuarios por rol con formularios dedicados.
- Registro/edición/eliminación de materias, validación de horarios y días.
- Tablas con paginación, filtro y ordenamiento (Angular Material) con columnas dinámicas según el rol.
- Gráficas (Chart.js via ng2-charts) para totales de usuarios y distribución de materias por día.
- Modales de confirmación para editar/eliminar.

## Tecnologías

- Frontend: Angular, Angular Material, ng2-charts/Chart.js, Luxon, ngx-material-timepicker.
- Backend (referencia): Django REST Framework (DRF), Render/Supabase/Postgres (según despliegue).

## Estructura del proyecto (frontend)

```
control-escolar-webapp/
	angular.json
	package.json
	tsconfig.json
	src/
		main.ts
		index.html
		styles.scss
		app/
			app.module.ts
			app-routing.module.ts
			services/
				facade.service.ts
				administradores.service.ts
				maestros.service.ts
				alumnos.service.ts
				materias.service.ts
			screens/
				login-screen/
				registro-usuarios-screen/
				materias-screen/
				graficas-screens/
				...
			partials/
				navbar-user/
				sidebar/
			layouts/
				auth-layout/
				dashboard-layout/
			modals/
				editar-user-modal/
				editar-materia-modal/
				eliminar-materia-modal/
		assets/
		environments/
			environment.ts
			environment.prod.ts
```

## Configuración

- Requisitos: Node.js LTS (18+), Angular CLI (`npm i -g @angular/cli`).
- Variables de entorno (frontend):
	- `environment.ts` y `environment.prod.ts` deben incluir `apiUrl` apuntando al backend (p. ej. `https://your-backend.onrender.com/api`).
	- Si usas Vercel, puedes exponer `NG_APP_API_URL` y leerlo en `environment.prod.ts`.

## Instalación y ejecución

1. Instalar dependencias:

```
npm install
```

2. Desarrollo (serve):

```
npm start
```

- Abre `http://localhost:4200/`.

3. Construir producción:

```
npm run build
```

- Salida en `dist/<project-name>` (configurada en `angular.json`).

## Scripts útiles

- `npm start`: `ng serve` con HMR.
- `npm test`: pruebas (si están configuradas).
- `npm run build`: build producción.

## Rutas principales (frontend)

- `/login` — inicio de sesión.
- `/registro-usuarios` — selector de tipo, formularios de alta.
- `/registro-usuarios/:rol` — apertura directa del formulario por rol y bloqueo de selección.
- `/registro-usuarios/:rol/:id` — edición de usuario existente.
- `/materias` — listado de materias con filtros/ordenamiento.
- `/registro-materias` — registro de materia.
- `/registro-materias/:id` — edición de materia.
- `/graficas` — gráficas de usuarios y materias.

## Comportamiento por rol

- Administrador: puede ver/editar/eliminar en tablas (columnas dinámicas), acceder a todos los registros.
- Maestro/Alumno: visibilidad reducida según `FacadeService.getUserGroup()`.

## Integración con backend

- Servicios HTTP (`services/*`) consumen endpoints REST.
- Token de sesión gestionado en `FacadeService` (Bearer en headers cuando corresponde).
- Materias: se esperan campos como `dias_json` (array de días), `hora_inicio`/`hora_fin` en formato 24h (`HH:MM`).
- Usuarios: endpoints por rol (`administradores`, `maestros`, `alumnos`).

## Validaciones relevantes (materias)

- `dias_json` requerido; horarios dentro de 07:00–21:00.
- `hora_inicio` < `hora_fin` y duración exacta de 120 minutos.
- `creditos` numérico y con límite máximo.

## Despliegue sugerido

- Frontend: Vercel / Netlify / Cloudflare Pages.
- Backend: Render / Railway / Fly.io (según preferencia).
- Asegura CORS y `ALLOWED_HOSTS` en el backend; define `apiUrl` correcto en el frontend.

## Buenas prácticas

- No subir secretos: usa `.env` (backend) y variables de entorno del proveedor.
- Mantener lockfile (`package-lock.json` o `yarn.lock`) para reproducibilidad.
- Evitar subir `dist/`, `node_modules/`, caches y archivos locales (ver `.gitignore`).

## Problemas conocidos

- Actualización de gráficas: forzar `chart.update()` si el wrapper no detecta cambios.

## Contribuir

- Estándar de código: Angular + TypeScript, servicios para HTTP, componentes con Material.
- PRs deben incluir descripción clara, pruebas (si aplica) y no introducir secretos.

