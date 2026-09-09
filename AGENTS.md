# AGENTS.md — Pokemon Proyect

## Proyecto
Juego de Pokémon tipo RogueLike con combates por turnos. Arquitectura dividida en un backend Node.js/Express (`pokebattle-backend`) con MongoDB y un frontend móvil/web en React Native con Expo (`pokemon-frontend`).

## Comandos
- Ejecutar backend: `cd pokebattle-backend && npm start` (requiere archivo `.env` local con `MONGO_URI`).
- Ejecutar frontend: `cd pokemon-frontend && npm start`
- Tests backend: `cd pokebattle-backend && node --test` (utilizando Node nativo, `supertest` y `mongodb-memory-server` para no levantar servidor web real ni BD real).
- Tests frontend: Usar `jest-expo` y `@testing-library/react-native` (usar npm/npx expo commands correspondientes).

## Estilo y convenciones
- Lenguaje: JavaScript puro (ES6+). NO introducir TypeScript.
- Nomenclatura en inglés para código (`handleAttack`, `currentBattle`), pero los textos de la UI de la app van en español.
- NO usar gestores de estado complejos como Redux. Utilizar `useState` y `useReducer` nativos de React.
- **Backend:** Mantener separación estricta entre definición de Express (`app.js` - para tests) y arranque/conexión DB (`server.js` o `index.js`).
- **Frontend:** Modularizar fuertemente en `screens/`, `components/`, `services/`, `utils/`. Evitar concentrar lógica y vistas enteras en `App.js`.
- **Desarrollo UI:** Crear `BattleScreen` u otros flujos primero utilizando variables de datos *mock* antes de conectar el bucle entero al servidor y la BD.

## Reglas
- Lee `docs/constitution.md` (si existe) y la spec activa antes de tocar código.
- Límites: No añadir frameworks pesados de backend, no añadir TypeScript, no usar Redux. Jest está permitido *exclusivamente* en el frontend de Expo.
- Configuración de Red: Evitar modificar `apiConfig.js` con IPs quemadas en código duro; la convención es migrar o depender de variables de entorno `.env` en Expo usando `EXPO_PUBLIC_API_URL`.
- Testing E2E: No crear suites masivas. Se usará un único flujo de test con **Maestro** cubriendo un "Happy Path" del combate.
- Lógica de Batalla: Prestar especial atención a validaciones del backend: restar bien el HP, el HP nunca baja de 0, no atacar un Pokémon a 0 HP, y que el estado de respuesta (`JSON`) coincida perfectamente con la estructura esperada por la App.

## Al terminar cualquier tarea
- Valida la compatibilidad entre ambos proyectos: las APIs deben devolver siempre el formato exacto requerido por el frontend.
- Ejecuta los servicios localmente y asegúrate de que no hay errores de sintaxis o bloqueos en la compilación de Expo ni en la conexión a MongoDB Atlas.
- Lanza tests aplicables para confirmar que la lógica atómica de daño o cambio de Pokémon se comporta adecuadamente.