# Notas Pokemon Proyect #

## Descripción: ##

Juego de Pokemon de combates estilo RogueLike, con un sistema de niveles, habilidades y objetos. El jugador podrá elegir entre diferentes tipos de Pokemon y enfrentarse en diferentes
niveles de pantalla a Pokemons salvajes a los que pueda atrapar y entrenadores en combates por turnos.

## Funcionalidades: ##

- Selector de equipo: El jugador podrá elegir entre diferentes tipos de Pokemon para formar su equipo inicial.

- Sistema de niveles: El jugador podrá subir de nivel a su Pokemon y desbloquear nuevas habilidades y objetos.

- Combates por turnos: El jugador podrá enfrentarse a otros entrenadores y Pokemons.

- Sistema de captura: El jugador podrá atrapar Pokemons salvajes y añadirlos a su equipo.

- Sistema de objetos: El jugador podrá usar objetos para curar a su Pokemon o mejorar sus estadisticas.

- Sistema de habilidades: El jugador podrá usar enseñar habilidades a sus Pokemons por nivel u objetos.

- Sistema de evolución: El jugador podrá evolucionar a sus Pokemons al alcanzar ciertos niveles o condiciones.

- Sistema de tiendas: El jugador podrá comprar objetos y habilidades en tiendas//seleccionar entre 4 recompensas aleatorias tras derrotar a un lider de nivel.

- Sistema de jefes: El jugador podrá enfrentarse a jefes al final de cada nivel.

- Pokedex: El jugador podrá consultar la información de los Pokemons que ha capturado y los que ha visto en su aventura.((opcional))

- Historial de combates: El jugador podrá consultar el historial de sus combates.((opcional))

- Ranking global: El jugador podrá comparar su progreso con otros jugadores a través de un ranking global.((opcional))

- Admin Dashboard: Un panel de administración para analizar datos como los Pokemon más usados etc.((opcional))

- Sistema de guardado: El jugador podrá guardar su progreso y continuar su aventura en otro momento.

## Tecnologías: ##

- Motor de juego: React Native, para hacer la interface botones etc.

- Backend: Node.js con Express.

- Base de datos: MongoDB para almacenar la información de los Pokemons, jugadores, combates, etc.

- Frontend Web: React.js.

## Relación con las Asignaturas ((esto esta copiado de la IA)):##

- Programación (1º): Implementación de la fórmula de daño de Pokémon (que es una ecuación matemática real de los juegos).

- Acceso a Datos (DAM): Consumo de la PokeAPI mediante peticiones REST y almacenamiento en tu propia BD.

- Programación Multimedia (DAM): Gestión de sonidos de ataques, animaciones de barras de vida y transiciones.

- Desarrollo Web Servidor (DAW): Creación del sistema de usuarios y guardado de resultados de combates.

- Diseño de Interfaces: Adaptar la complejidad de un combate Pokémon a una pantalla móvil (UX móvil vs UX web).

## Escalabilidad: ##

- Podemos añadir "combartes Online" mediante websockets.

# Cronograma: #

Calendario del Proyecto: "PokeBattle Engine"
### Fase 1: Los Cimientos (Semanas 1 - 3) ###

Semana 1: Diseño de la Base de Datos (Usuarios, Equipos, Historial) y configuración del servidor (Node.js/Express).

Semana 2: Conexión con la PokeAPI. Crear scripts para traer datos de Pokémon y movimientos.

Semana 3: Lógica del Motor de Combate en el Backend. Crear la función que recibe "Ataque A vs Pokémon B" y calcula el daño según los tipos.

Hito: Tienes una API que, si le envías datos por texto, te devuelve el resultado del combate.

### Fase 2: El Corazón del Juego - DAM (Semanas 4 - 6) ###

Semana 4: Creación de la interfaz básica en el móvil (Flutter/React Native). Pantalla de Login y Selección de equipo.

Semana 5: Desarrollo de la Pantalla de Combate. Mostrar los sprites de los dos Pokémon y los botones de ataque.

Semana 6: Conectar el móvil con la API. Cuando pulsas "Atacar" en el móvil, el servidor procesa el daño y el móvil actualiza la barra de vida.

Hito: Puedes jugar un combate completo contra la IA o un combate estático desde tu móvil.

### Fase 3: El Ecosistema Web - DAW (Semanas 7 - 9) ###

Semana 7: Creación del Panel de Usuario (Web). Ranking global de jugadores y buscador de Pokémon (Pokedex personalizada).

Semana 8: Implementación de los WebSockets (opcional pero recomendado). Permitir que si ganas un combate en el móvil, la web se actualice sola con tu nueva puntuación.

Semana 9: Panel de Administración. Una sección privada donde puedas ver estadísticas: "¿Cuál es el Pokémon más usado?" o "Citas de combate del día".

### Fase 4: Pulido, Documentación y Entrega (Semanas 10 - 12) ###

Semana 10: Diseño y UX. Añadir sonidos, animaciones de daño, transiciones suaves y mejorar los estilos CSS/UI.

Semana 11: Depuración (Testing). Probar que no se rompa nada si el usuario hace cosas raras. Despliegue en la nube (Render para el backend, Vercel para la web).

Semana 12: Documentación final. Redactar la memoria del proyecto, manual de usuario y preparar la presentación para el tribunal.