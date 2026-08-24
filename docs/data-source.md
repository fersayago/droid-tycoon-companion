# Data source

## Workbook

Fuente local: `.docs/Droid Tycoon Tracker.xlsx`

Ese workbook está ignorado por Git porque no es necesario para correr ni deployar la app. La data consumida por la aplicación vive materializada en `src/data/droidex.ts`.

La v1 usa únicamente la hoja `DroidexRebirths`.

## Included data

- Lista de droides no-Iconic.
- Rareza.
- Variantes disponibles.
- Requisitos de los 5 ciclos de rebirth/reset.
- Créditos requeridos por tramo de nivel.

## Excluded data

Quedan fuera de v1:

- Droides `ICONIC` en la tabla de inventario.
- Tipos de droides (`WORKER`, `ASTROMECH`, `BATTLE`).
- `Cosmetics`.
- `Droid Reference Sheet (costsval...)`.
- `Nova Crystals + Shop Reference`.
- `Contact Information`.

## Extraction notes

La planilla contiene una fila `TOTAL COLLECTED` dentro del bloque visual de droides. Esa fila se excluye porque contiene fórmulas de conteo, no un droide real.

Resultado de extracción actual:

- 62 droides trackeables no-Iconic.
- 525 requisitos totales.
- 5 ciclos × 35 niveles × 3 requisitos.
