# Constitución de PokeBattle

1. **La Spec Manda**: Ningún comportamiento se implementa si no está en la spec activa. Si falta una decisión, se detiene el trabajo y se pregunta.
2. **Stack Puro**: JavaScript (ES6+). Prohibido usar TypeScript y Redux. Utilizar `useState`/`useReducer` nativo en React Native + Expo.
3. **Datos y Assets**: Los datos provienen de PokéAPI. El backend almacena solo referencias (ej. `pokemonId`), no imágenes. El frontend obtiene y muestra los sprites de PokéAPI (ej. `front_default`, `back_default`).
4. **Desarrollo UI-First**: Construir vistas (`screens/`, `components/`) usando *mocks* visuales antes de conectar APIs.
5. **Arquitectura Backend**: Separación estricta y obligatoria entre `app.js` (lógica Express) y `server.js` (conexión MongoDB/Listen).
6. **Testing Estratégico**: Backend: `node:test` + `supertest`. Frontend: `jest-expo`. E2E: Un único "Happy Path" en Maestro.
7. **Cero Hardcoding**: Prohibido quemar IPs locales en el cliente. Depender siempre de `EXPO_PUBLIC_API_URL` vía `.env`.
8. **Contrato de API Estricto**: Los endpoints de combate deben validar que el JSON de salida encaja 100% con el estado de la App.
9. **Convención de Idioma**: Lógica, variables y endpoints en Inglés (`currentBattle`). Interfaz de usuario en Español ("Atacar").