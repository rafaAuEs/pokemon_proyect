# spec.md — Especificación de PokeBattle

## 1. Visión General
PokeBattle es un RPG por turnos de progresión por niveles, sin *permadeath*. El jugador avanza enfrentándose a Pokémon salvajes (capturables) y líderes de nivel (bosses). Utiliza PokéAPI como fuente inicial de datos base y sprites, pero almacena localmente en MongoDB tanto las variables de estado de cada Pokémon (nivel, experiencia, stats actuales) como el caché de stats base de las especies, asegurando un rendimiento óptimo sin depender de la API externa durante la partida.

## 2. Requisitos Funcionales (EARS)

### 2.1 Equipo y PC (Almacenamiento)
- **RF1.1:** *When* el jugador captura un Pokémon *and* su equipo activo tiene menos de 6 integrantes, *the system shall* añadir el Pokémon directamente al equipo activo.
- **RF1.2:** *When* el jugador captura un Pokémon *and* su equipo activo ya tiene 6 integrantes, *the system shall* enviarlo automáticamente al PC (almacenamiento ilimitado en backend).
- **RF1.3:** *When* el jugador gestiona sus cajas, *the system shall* permitir intercambiar Pokémon entre el PC y el equipo activo.
- **RF1.4:** *If* una acción de movimiento o liberación de Pokémon (soltar) deja al equipo activo con 0 integrantes, *then the system shall* bloquear la acción, requiriendo siempre un mínimo de 1 Pokémon en el equipo activo.

### 2.2 Ciclo de Nivel y Exploración
- **RF2.1:** *When* el jugador inicia un nivel, *the system shall* generar proceduralmente los encuentros y recompensas de ese nivel.
- **RF2.2:** *When* un combate finaliza (por victoria o huida), *the system shall* curar automáticamente el 100% de los HP de todo el equipo del jugador.
- **RF2.3:** *If* todo el equipo del jugador llega a 0 HP (derrota), *then the system shall* reiniciar el progreso de exploración del nivel actual, regenerándolo proceduralmente de nuevo.
- **RF2.4:** *When* el jugador es derrotado, *the system shall* conservar toda su progresión persistente: experiencia ganada, niveles subidos, objetos en inventario y Pokémon capturados *antes* de la derrota.
- **RF2.5:** *When* el jugador reinicia un nivel tras una derrota, *the system shall* curar automáticamente el 100% de los HP de todo su equipo antes del primer combate.
- **RF2.6:** *When* el jugador derrota al Boss final del nivel, *the system shall* marcar el nivel como permanentemente superado y desbloquear el siguiente.

### 2.3 Mecánicas de Combate
- **RF3.1:** *When* el jugador inicia o participa en un combate, *the system shall* usar los stats almacenados en la base de datos local (HP, Ataque, Velocidad, etc.) para la fórmula de daño, sin llamar a la PokéAPI.
- **RF3.2:** *When* el jugador está en combate contra un Boss, *the system shall* deshabilitar las opciones de captura (Pokéballs) y de huida.
- **RF3.3:** *When* el jugador utiliza un objeto consumible en combate, *the system shall* eliminarlo de su inventario de forma permanente, independientemente de si gana o pierde el intento del nivel.

### 2.4 Progresión (Experiencia y Stats)
- **RF4.1:** *When* un Pokémon acumula suficiente experiencia para subir de nivel, *the system shall* recalcular sus stats máximos utilizando como referencia los stats base cacheados localmente y su nuevo nivel, sin realizar llamadas HTTP a PokéAPI.

## 3. Fuera de Alcance
- Mecánicas de muerte permanente (Permadeath) de Pokémon.
- Uso de objetos de curación fuera del contexto de combate (la curación post-combate es gratuita y automática).
- Almacenamiento de imágenes o sprites en la base de datos propia (solo se guardan referencias `pokemonId` y se leen desde la CDN de PokéAPI en el cliente).
- Consultas HTTP sincrónicas a PokéAPI para resolver daños o subidas de nivel durante la partida.

## 4. Criterios de Finalización
- El combate procesa los cálculos de turno 100% en el backend usando la base de datos propia, retornando el estado final al cliente.
- El jugador no puede vaciar su equipo ni abandonar su último Pokémon por error o por gestión del PC.
- Si el jugador pierde contra un Boss, reaparece al inicio de ese nivel con su equipo al 100% de HP, con los Pokémon que capturó intactos, y los objetos consumidos previamente descontados.
- Existe al menos un test comprobando que las Pokéballs fallan/están deshabilitadas contra un Boss y que la huida no es posible.
- Existe al menos un test comprobando que la subida de nivel de un Pokémon actualiza correctamente sus stats utilizando exclusivamente datos cacheados localmente.