# plan.md — Plan de Implementación de PokeBattle

## 1. Arquitectura de Módulos

### 1.1 Backend (`pokebattle-backend`)
- **Core App (`app.js`)**: Configuración de Express, middlewares y rutas. Sin `listen`. [Constitución #5]
- **Entry Point (`server.js`)**: Conexión a MongoDB y arranque del servidor. [Constitución #5]
- **API Routes**:
    - `/api/users`: Auth y perfil.
    - `/api/pokemon`: Sincronización con PokéAPI y caché de base stats.
    - `/api/battle`: Lógica de encuentros, turnos y PC. [RF2.1, RF3.1]
- **Controllers**:
    - `battleController.js`: Lógica de daño, cambio de Pokémon y gestión de niveles. [RF3.1, RF2.3]
    - `pcController.js`: Gestión de equipo activo vs PC. [RF1.1, RF1.2, RF1.3, RF1.4]
- **Services**:
    - `damageService.js`: Fórmula matemática de daño. [RF3.1]
    - `levelService.js`: Cálculo de crecimiento de stats. [RF4.1]
    - `proceduralService.js`: Generación de niveles y enemigos. [RF2.1]

### 1.2 Frontend (`pokemon-frontend`)
- **Screens**:
    - `LoginScreen`: Autenticación.
    - `HomeScreen`: Hub central y progreso.
    - `BattleScreen`: Arena de combate y log. [RF3.1]
    - `PCScreen`: Gestión de cajas y equipo. [RF1.3]
- **Components**:
    - `BattleArena`: Visualización de sprites y barras de vida.
    - `BattleMenu`: Botonera de acciones (Atacar, Cambiar, Mochila). [RF3.2]
    - `HealthBar`: Componente visual de vida.
- **Services**:
    - `apiService.js`: Cliente HTTP (fetch) usando `EXPO_PUBLIC_API_URL`. [Constitución #7]

---

## 2. Modelo de Datos (MongoDB)

### 2.1 `SpeciesCache` (Caché de PokéAPI) [RF4.1, Spec #1]
- `pokemonId` (Number, Index): ID de PokéAPI.
- `name` (String)
- `baseStats`: { hp, attack, defense, spAttack, spDefense, speed }
- `types`: [String]

### 2.2 `PokemonInstance` (Pokémon del Jugador) [RF1.1, RF4.1]
- `owner`: ObjectId(User)
- `pokemonId`: Number
- `nickname`: String
- `level`: Number
- `experience`: Number
- `currentHp`: Number
- `stats`: { hp, attack, defense, spAttack, spDefense, speed } (Valores calculados)
- `moves`: [String]
- `inTeam`: Boolean (true: Equipo, false: PC)

### 2.3 `User` / `GameState` [RF2.5, RF2.6]
- `username`: String
- `levelProgress`: Number (Stage actual)
- `inventory`: [{ itemId, quantity }]
- `activeBattle`: ObjectId(Battle) (Para persistencia ante desconexión)

---

## 3. Decisiones Justificadas

### 3.1 Almacenamiento de Stats Base
- **Decisión**: Colección `SpeciesCache` en MongoDB.
- **Alternativa descartada**: Consultar PokéAPI en cada subida de nivel.
- **Justificación**: Cumple con el requisito de no depender de la API externa durante la partida [Spec #1, RF4.1] y evita latencia de red.

### 3.2 Cálculo de Daño en Backend
- **Decisión**: Toda la lógica de HP y daño ocurre exclusivamente en el servidor.
- **Alternativa descartada**: Calcular daño en el cliente y enviar el resultado.
- **Justificación**: Seguridad (evita trampas) y cumplimiento del "Contrato de API Estricto" [Constitución #8]. El cliente solo es un visor del estado del backend.

### 3.3 Generación Procedural al Vuelo
- **Decisión**: Generar enemigos y recompensas al entrar al nivel o tras una derrota. [RF2.1, RF2.3]
- **Alternativa descartada**: Niveles predefinidos estáticos.
- **Justificación**: Aporta el componente "RogueLike" solicitado, aumentando la rejugabilidad y el desafío tras un reinicio.

---

## 4. Estrategia de Tests [Constitución #6]

### 4.1 Backend (`node:test` + `supertest`)
- **Unitarios**:
    - Fórmulas de daño en `damageService.test.js`. [RF3.1]
    - Recálculo de stats en `levelService.test.js`. [RF4.1]
- **Integración**:
    - Flujo de combate en `battle.test.js` (Start -> Attack -> Result). [RF3.1]
    - Gestión de PC en `pc.test.js` (Move to PC, min 1 active). [RF1.4]

### 4.2 Frontend (`jest-expo`)
- **Componentes**: Renderizado de `HealthBar` y `BattleMenu` según props de vida.
- **Lógica**: Formateo de datos recibidos de la API.

### 4.3 E2E (`Maestro`)
- **Happy Path**: Login -> Iniciar combate -> Atacar -> Ganar -> Ver recompensa.

---

## 5. Mapeo de Requisitos Funcionales (RF)

| RF | Módulo Responsable | Ubicación Clave |
| :--- | :--- | :--- |
| **RF1.1 - 1.2** | PC Controller | `pcController.addPokemon` |
| **RF1.3 - 1.4** | PC Controller | `pcController.movePokemon` / `pcController.release` |
| **RF2.1** | Procedural Service | `proceduralService.generateStage` |
| **RF2.2 - 2.5** | Battle Controller | `battleController.endCombat` / `battleController.resetStage` |
| **RF3.1 - 3.2** | Battle Controller | `battleController.attack` (check isBoss) |
| **RF3.3** | Battle Controller | `battleController.useItem` |
| **RF4.1** | Level Service | `levelService.calculateLevelUp` |

---

## 6. Desglose de Tareas (<30 min)

### Fase 1: Fundamentos y Modelo de Datos (Backend)
- [x] **1.1 Reestructuración del Servidor**
  - **RF:** N/A.
  - **Hecho cuando:** `npm start` arranca el servidor y `npm test` ejecuta el runner de Node.
- [x] **1.2 Modelos de Caché de Especies e Instancias**
  - **RF:** RF4.1.
  - **Hecho cuando:** Los archivos `SpeciesCache.js` y `PokemonInstance.js` están creados y exportan los esquemas.
- [x] **1.3 Refactorización del Modelo User y Battle**
  - **RF:** RF2.4.
  - **Hecho cuando:** `User.js` y `Battle.js` incluyen los nuevos campos y referencias a instancias.

### Fase 2: Servicios de Lógica (Backend)
- [x] **2.1 Servicio de Daño (`damageService.js`)**
  - **RF:** RF3.1.
  - **Hecho cuando:** El test `damageService.test.js` pasa con cálculos de daño positivos.
- [x] **2.2 Servicio de Niveles (`levelService.js`)**
  - **RF:** RF4.1.
  - **Hecho cuando:** El test `levelService.test.js` valida la subida de nivel y actualización de stats.
- [x] **2.3 Servicio Procedural (`proceduralService.js`)**
  - **RF:** RF2.1.
  - **Hecho cuando:** La función `generateEncounter` devuelve un objeto enemigo con stats coherentes al stage.

### Fase 3: Controladores y Flujo del Servidor (Backend)
- [ ] **3.1 Controlador del PC (`pcController.js`)**
  - **RF:** RF1.1, RF1.2, RF1.3, RF1.4.
  - **Hecho cuando:** Un test de integración valide que no se puede dejar el equipo vacío y el PC recibe Pokémon capturados.
- [ ] **3.2 Inicio y Fin de Combate (`battleController.js` parte 1)**
  - **RF:** RF2.2, RF2.5.
  - **Hecho cuando:** Un test valide que el equipo se cura al 100% tras finalizar un combate o reiniciar tras derrota.
- [ ] **3.3 Lógica de Turno y Bosses (`battleController.js` parte 2)**
  - **RF:** RF2.3, RF2.4, RF2.6, RF3.2.
  - **Hecho cuando:** Un test valide que no se puede huir de un Boss y que la derrota reinicia el nivel manteniendo el progreso.
- [ ] **3.4 Lógica de Objetos (`battleController.js` parte 3)**
  - **RF:** RF3.3.
  - **Hecho cuando:** El uso de un objeto en combate lo elimina del inventario permanentemente.

### Fase 4: Frontend (UI y Conexión)
- [ ] **4.1 Configuración de Variables de Entorno**
  - **RF:** N/A.
  - **Hecho cuando:** `apiConfig.js` use `process.env.EXPO_PUBLIC_API_URL` y no tenga IPs quemadas.
- [ ] **4.2 Mocks Visuales (Arena y Menú)**
  - **RF:** N/A.
  - **Hecho cuando:** La `BattleScreen` muestre sprites y barras de vida con datos estáticos.
- [ ] **4.3 Refactorización de App.js**
  - **RF:** N/A.
  - **Hecho cuando:** La lógica de navegación esté separada de la lógica de las pantallas.
- [ ] **4.4 Conexión de Combate Real**
  - **RF:** RF3.1, RF2.2.
  - **Hecho cuando:** El flujo de ataque en la App actualice el estado real del backend.

### Fase 5: Validación Final
- [ ] **5.1 Test E2E de Maestro**
  - **RF:** Criterios de Finalización.
  - **Hecho cuando:** El script de Maestro complete un flujo "Happy Path" de combate.
