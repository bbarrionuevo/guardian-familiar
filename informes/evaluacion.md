# Evaluación del motor (18/10/2026)

## Qué se midió

Se midieron solo las reglas fijas y el análisis de enlaces. La capa de IA todavía no se midió porque falta la clave de Anthropic: se corre con el workflow «Evaluar con IA».

- **Banco visible** (`data/banco/*.jsonl`): 100 estafas (40 IT, 30 ES, 30 AR) y 50 mensajes legítimos.
- **Banco ciego** (`data/banco/ciego/`): 45 estafas (15 por país) y 25 legítimos. Los armó otro agente con fuentes distintas. Sus textos no se leen, para no ajustar las reglas a ellos; la evaluación muestra solo totales e ids.

## Resultados

| | Banco visible, antes de ajustar | Banco visible, después de ajustar | Banco ciego |
|---|---|---|---|
| Estafas en «alto» | 23 % | 89 % | 73 % |
| Estafas en «medio» | 21 % | 10 % | 13 % |
| Estafas «sin señales» | 56 % | 1 % | 13 % (6 de 45) |
| Legítimos por encima de su nivel máximo | 2 de 50 | 0 de 50 | 3 de 25 |

- La primera columna es la medición a ciegas: las reglas se escribieron antes de leer las estafas.
- La segunda es optimista. Las reglas se ajustaron mirando ese mismo banco, aunque con patrones generales, no frase por frase.
- **La cifra que vale es la del banco ciego.** Con reglas solas, 6 de cada 45 estafas pasan sin señales y 3 de 25 mensajes legítimos dan una alarma de más.

## Límites de los datos

- **Pocas estafas textuales.** Solo 13 de las 100 del banco visible y 12 de las 45 del ciego copian el mensaje palabra por palabra. Las demás están reconstruidas a partir de la descripción de la fuente (prensa, policía, bancos), porque desde el entorno de trabajo no se podían abrir las páginas.
- **Enlaces quitados.** Muchas fuentes borran el enlace. En el banco aparece como `[enlace]` o `[link]`, y las reglas lo tratan como un enlace desconocido. En un mensaje real, el enlace verdadero suma señales (dominio que imita una marca, acortador), así que eso juega a favor del motor.
- **Legítimos escritos por nosotros.** Los mensajes legítimos se escribieron imitando el formato real de cada remitente, pero no son mensajes reales.

## Criterio antes de lanzar

Ninguna estafa del banco ciego puede quedar en «sin señales» con el motor completo (reglas + IA). Hoy, con reglas solas, quedan 6. Falta:

1. Correr «Evaluar con IA» con Opus 5.5 y con Haiku 5.5, y comparar aciertos y costo.
2. Si alguna estafa del banco ciego sigue en «sin señales», revisar el prompt de la IA, no las reglas. Así el banco ciego sigue sirviendo.
3. Sumar a un banco nuevo los mensajes reales que reenvíen los primeros usuarios (con permiso y sin datos personales).
