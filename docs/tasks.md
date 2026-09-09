# tasks.md — Desglose de Tareas de PokeBattle

Tareas de desarrollo ordenadas por dependencia (< 30 min cada una).

---

## Fase 1: Fundamentos y Modelo de Datos (Backend)

- [x] **1.1 Reestructuración del Servidor**
  - **RF:** N/A (Arquitectura base).
  - **Hecho cuando:** `npm start` arranca el servidor vía `server.js` o `index.js` y `npm test` ejecuta el runner nativo de Node.
- [x] **1.2 Modelos de Caché de Especies e Instancias**
  - **RF:** RF4.1.
  - **Hecho cuando:** Los archivos `SpeciesCache.js` y `PokemonInstance.js` están creados y exportan los esquemas de Mongoose con campos obligatorios validados.
- [x] **1.3 Refactorización del Modelo User y Battle**
  - **RF:** RF2.4.
  - **Hecho cuando:** `User.js` incluye `inventory` y `levelProgress`, y `Battle.js` referencia `PokemonInstance` y esquema de enemigo.

---

## Fase 2: Servicios de Lógica de Combate (Backend)

- [x] **2.1 Servicio de Daño (`damageService.js`)**
  - **RF:** RF3.1.
  - **Hecho cuando:** El test unitario `tests/damageService.test.js` pasa validando cálculo de daño positivo y probabilidad de crítico.
- [x] **2.2 Servicio de Niveles y Stats (`levelService.js`)**
  - **RF:** RF4.1.
  - **Hecho cuando:** El test unitario `tests/levelService.test.js` valida que la fórmula recalcula stats base y cura al 100% al subir de nivel.
- [x] **2.3 Servicio Procedural de Encuentros (`proceduralService.js`)**
  - **RF:** RF2.1.
  - **Hecho cuando:** `generateEncounter` genera datos de Pokémon y stats basados en el nivel/stage sin llamar a la PokéAPI externa.

---

## Fase 3: Controladores y Flujo del Servidor (Backend)

- [ ] **3.1 Controlador del PC y Almacenamiento (`pcController.js`)**
  - **RF:** RF1.1, RF1.2, RF1.3, RF1.4.
  - **Hecho cuando:** Un test de integración (Supertest) verifique que añadir un séptimo Pokémon lo envía al PC y que soltar/mover el último Pokémon activo devuelve HTTP 400.
- [ ] **3.2 Inicio y Fin de Combate (`battleController.js` - Start & End)**
  - **RF:** RF2.2, RF2.5.
  - **Hecho cuando:** Un test de integración compruebe que al iniciar combate tras derrota o al finalizar por victoria/huida, los HP del equipo se restablecen al 100%.
- [ ] **3.3 Lógica de Turnos y Reglas de Bosses (`battleController.js` - Attack & Bosses)**
  - **RF:** RF2.3, RF2.4, RF2.6, RF3.2.
  - **Hecho cuando:** Un test de integración verifique que la huida y captura devuelven error contra un Boss, y que la derrota reinicia el stage conservando los Pokémon capturados.
- [ ] **3.4 Lógica de Consumibles en Combate (`battleController.js` - Items)**
  - **RF:** RF3.3.
  - **Hecho cuando:** Un test confirme que usar un objeto en combate reduce su cantidad en el inventario del usuario de forma permanente.

---

## Fase 4: Frontend (Modularización y UI-First)

- [ ] **4.1 Migración de IP Hardcodeada a Variables de Entorno**
  - **RF:** N/A (Constitución: Cero Hardcoding).
  - **Hecho cuando:** `apiConfig.js` consuma `process.env.EXPO_PUBLIC_API_URL` y exista `.env.example` en `pokemon-frontend`.
- [ ] **4.2 Mocks Visuales de Combate (`BattleArena`, `BattleMenu`, `HealthBar`)**
  - **RF:** N/A (Constitución: UI-First).
  - **Hecho cuando:** Los componentes rendericen visualmente sprites (front/back vía PokéAPI) y barras de vida con datos estáticos sin conectar con la API.
- [ ] **4.3 Modularización de Pantallas desde `App.js`**
  - **RF:** N/A (Mantenibilidad).
  - **Hecho cuando:** `App.js` actúe como enrutador ligero y las vistas residan en `screens/LoginScreen.js`, `screens/HomeScreen.js` y `screens/BattleScreen.js`.
- [ ] **4.4 Conexión de Flujo Real de Batalla**
  - **RF:** RF3.1, RF2.2.
  - **Hecho cuando:** El combate en el frontend consuma `/api/battle/start` y `/api/battle/attack`, actualizando el estado de la UI según el JSON devuelto por el backend.

---

## Fase 5: Validación y E2E

- [ ] **5.1 Test E2E Happy Path con Maestro**
  - **RF:** Criterios de Finalización (E2E).
  - **Hecho cuando:** El flujo de login, inicio de combate, ataque y victoria se ejecute con `maestro test` de forma automatizada.
