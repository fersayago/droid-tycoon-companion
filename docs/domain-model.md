# Domain model

## Droid

Un droide trackeable tiene:

- `id`: slug estable.
- `name`: nombre visible de la planilla.
- `rarity`: `COMMON`, `RARE`, `EPIC`, `LEGENDARY`, `MYTHIC`.
- `allowedVariants`: variantes disponibles para marcar en inventario.

La v1 no modela tipos de droides. También excluye droides `ICONIC` de la tabla de inventario.

## Variants

Variantes normales:

1. `BASE`
2. `GOLD`
3. `DIAMOND`
4. `RAINBOW`
5. `BESKAR`
6. `FLAWLESS`

La planilla usa `BASIC` y a veces `DEFAULT`; ambas se normalizan a `BASE`.

## Inventory rule

El inventario guarda una sola variante por droide: la variante máxima que el usuario tiene.

Esto se representa con radio buttons por fila, una columna por variante. Si el usuario no tiene el droide, la fila queda sin variante marcada.

## Coverage rule

Una variante superior cubre requisitos inferiores.

Ejemplos:

- `GOLD R3` cubre `BASE R3`.
- `BESKAR R3` cubre `RAINBOW R3`.
- `BASE R3` no cubre `GOLD R3`.

## Rebirths and levels

Hay 4 paths de rebirth. Cada uno tiene 27 tramos de nivel (`0→1` hasta `26→27`) y 3 requisitos por tramo.

El `currentLevel` representa el tramo que se quiere completar ahora. Por ejemplo, `currentLevel = 4` significa mirar primero `4→5`.

## Status

- `Need now`: requisito del nivel actual no cubierto.
- `Need soon`: requisito no cubierto dentro de los próximos 3 niveles.
- `Need later`: requisito no cubierto más adelante en el reset.
- `Keep`: droide poseído que todavía sirve para requisitos restantes.
- `Sell candidate`: droide poseído que ya no aparece en requisitos restantes del reset seleccionado.
- `Covered`: requisito satisfecho por variante exacta o superior.
