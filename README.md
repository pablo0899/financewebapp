# Mis Finanzas

Web app **mobile-first** para gestionar mis finanzas personales. Se instala en el
teléfono como PWA ("Agregar a pantalla de inicio") y guarda los datos en Supabase.

**Stack:** Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind CSS 4 · Supabase (Postgres + Auth)

## Módulos (v1)

| Módulo | Ruta | Qué hace |
| --- | --- | --- |
| Inicio | `/` | Disponible del mes (ingresos − gastos − ahorro), un anillo por categoría con presupuesto (gastado vs. restante), gastos sin presupuesto y últimos movimientos |
| Movimientos | `/movimientos` | Lista por mes agrupada por día; borrar movimientos |
| Nuevo movimiento | `/movimientos/nuevo` | Monto, gasto/ingreso, categoría y fecha (obligatorias) y nota |
| Presupuestos | `/presupuestos` | Límite mensual fijo por categoría (lo gastado se reinicia cada mes); crear y borrar categorías |
| Ahorro | `/ahorro` | Metas de ahorro con objetivo opcional; aportar y retirar; total ahorrado y ahorro del mes |
| Login | `/login` | Acceso con correo y contraseña (sin registro público) |

Todas las vistas mensuales aceptan `?mes=YYYY-MM`.

## Estructura

```
supabase/
  migrations/                 # Esquema SQL (tablas, RLS, categorías por defecto)
src/
  proxy.ts                    # Refresca la sesión y protege rutas privadas
  app/
    layout.tsx                # Layout raíz (viewport móvil, metadata PWA)
    manifest.ts               # Manifest de la PWA
    icon.svg, apple-icon.tsx  # Íconos
    (auth)/login/             # Pantalla de login
    (app)/                    # Rutas privadas con navegación inferior
      page.tsx                # Dashboard
      movimientos/            # Lista + nuevo
      presupuestos/
  features/                   # Lógica por módulo
    auth/          actions.ts, components/
    categories/    queries.ts, actions.ts (incluye presupuesto), components/
    transactions/  queries.ts, actions.ts, components/
    budgets/       queries.ts (avance del mes), components/
    savings/       queries.ts, actions.ts, components/
    dashboard/     queries.ts, components/
  components/                 # UI compartida (BottomNav, Donut, MonthPicker, ProgressBar…)
  lib/
    supabase/                 # Clientes server/proxy y tipos de la BD
    config.ts                 # Moneda, locale y zona horaria
    dates.ts, format.ts       # Helpers de fechas y formato de dinero
```

Convención: cada módulo en `features/` tiene `queries.ts` (lecturas, solo servidor),
`actions.ts` (Server Actions para escribir) y `components/`. Las páginas en `app/`
solo componen piezas de `features/`.

## Configuración

### 1. Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com) (el plan gratis alcanza).
2. Ejecuta las migraciones de `supabase/migrations/` en orden: abre **SQL Editor**,
   pega el contenido de cada archivo y córrelo
   (o con la CLI: `npx supabase link` y `npx supabase db push`).
3. **Authentication → Users → Add user → Create new user**: crea tu usuario con
   correo y contraseña y marca **Auto Confirm User**. Al crearse se generan sus
   categorías por defecto.
4. **Authentication → Sign In / Providers**: desactiva **Allow new users to sign up**
   para que nadie más pueda registrarse (la app no tiene pantalla de registro).

### 2. Variables de entorno

```bash
cp .env.example .env.local
```

Llena `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
(Project Settings → API Keys).

### 3. Correr en local

```bash
npm install
npm run dev
```

Abre http://localhost:3000. Para probar desde el teléfono en la misma red usa
`npm run dev -- -H 0.0.0.0` y entra a `http://<ip-de-tu-pc>:3000`.

### 4. Deploy

1. Importa el repo en [Vercel](https://vercel.com/new).
2. Agrega las dos variables de entorno.
3. En Supabase → **Authentication → URL Configuration**, pon la URL de Vercel como *Site URL*.
4. En el teléfono abre la URL → Compartir → **Agregar a pantalla de inicio**.

## Scripts

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run lint` | ESLint |

## Ideas para siguientes versiones

- Cuentas (efectivo, débito, tarjetas) con saldo por cuenta
- Editar movimientos y administrar categorías
- Movimientos recurrentes (renta, suscripciones)
- Gráfica de tendencia de varios meses
- Exportar a CSV
