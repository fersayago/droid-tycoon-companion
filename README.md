# Droid Tycoon Companion

Local tracker para el modo **Droid Tycoon** de Fortnite. La app ayuda a marcar qué droides tenés, en qué reset/rebirth estás y qué requisitos necesitás cubrir para avanzar niveles.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui-style components locales
- `localStorage` para persistencia local
- Vitest para lógica de dominio y componentes

## Desarrollo local

```bash
yarn install
yarn dev
```

La app queda disponible en `http://localhost:3000`.

## Tests

```bash
yarn test
```

> Regla del proyecto: no correr build automáticamente después de cambios.

## Deploy en Vercel

1. Subir el repo a GitHub.
2. Importar el proyecto en Vercel.
3. Usar la configuración default de Next.js:
   - Framework Preset: `Next.js`
   - Install Command: `yarn install`
   - Build Command: `yarn build`
   - Output Directory: dejar vacío/default
4. Deploy.

No requiere variables de entorno ni base de datos.

## Comportamiento principal

- La tabla de inventario no muestra droides `ICONIC`.
- La app no modela tipos de droides; para esta v1 solo importan nombre, rareza y variante.
- El inventario usa una columna por variante y radio buttons para marcar la variante máxima que tenés.
- Una variante superior cubre requisitos inferiores.
- Los requisitos de rebirth muestran rareza requerida, variante propia, cobertura y próxima aparición del mismo droide en el reset.

## Actualizar data desde Excel

La fuente inicial está en:

`G:\code\projects\droid-tycoon-companion\.docs\Droid Tycoon Tracker.xlsx`

Ese Excel es una fuente local de regeneración y está ignorado por Git. El deploy usa la data ya materializada en `src/data/droidex.ts`.

La v1 usa solo la hoja `DroidexRebirths`. Si la planilla cambia, regenerar `src/data/droidex.ts` leyendo:

- Droides: columnas A:I, excluyendo `ICONIC` y la fila `TOTAL COLLECTED`.
- Rebirth 1: columnas K:P.
- Rebirth 2: columnas R:V.
- Rebirth 3: columnas X:AB.
- Rebirth 4: columnas AD:AH.

Resultado actual:

- 62 droides trackeables.
- 324 requisitos.
