import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './apiConfig';
import HomeScreen from './screens/HomeScreen';
import BattleScreen from './screens/BattleScreen';
import VictoryScreen from './screens/VictoryScreen';

export default function App() {
  // Todos los hooks al inicio, sin condiciones intermedias
  const [loading, setLoading] = useState(false);
  const [restoringSession, setRestoringSession] = useState(true);
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [currentBattle, setCurrentBattle] = useState(null);
  const [showSwitchPanel, setShowSwitchPanel] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [levelWon, setLevelWon] = useState(false);

  // Al arrancar la app, intentamos restaurar la sesión con el token guardado
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) { setRestoringSession(false); return; }
        const response = await fetch(`${API_URL}/users/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          // Token expirado o inválido: limpiamos el almacenamiento
          await AsyncStorage.removeItem('userToken');
          await AsyncStorage.removeItem('userId');
        }
      } catch (e) {
        // Sin conexión al arrancar: no hacemos nada, se muestra el login
      } finally {
        setRestoringSession(false);
      }
    };
    restoreSession();
  }, []);

  if (restoringSession) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#ff5a5f" />
        <Text style={{ marginTop: 12, color: '#555' }}>Cargando sesión...</Text>
      </View>
    );
  }

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert("Error", "Rellena los campos");
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        await AsyncStorage.setItem('userToken', data.token);
        await AsyncStorage.setItem('userId', data.user.id);
        setUser(data.user);
      } else {
        Alert.alert("Error", data.message);
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo conectar");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!regUsername || !regEmail || !regPassword || !regConfirmPassword) return Alert.alert("Error", "Rellena todos los campos");
    if (regPassword !== regConfirmPassword) return Alert.alert("Error", "Las contraseñas no coinciden");
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: regUsername, email: regEmail, password: regPassword }),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert("¡Registro exitoso!", "Ya puedes iniciar sesión con tu nueva cuenta.");
        setRegUsername('');
        setRegEmail('');
        setRegPassword('');
        setRegConfirmPassword('');
        setShowRegister(false);
      } else {
        Alert.alert("Error al registrarse", data.message || "Inténtalo de nuevo");
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleEncounter = async (wantBoss = false) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userId = await AsyncStorage.getItem('userId');

      const response = await fetch(`${API_URL}/battle/encounter`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, wantBoss }),
      });

      const data = await response.json();

      if (response.ok) {
        // Creamos el combate en la BD para obtener battleId y HP reales
        const startResponse = await fetch(`${API_URL}/battle/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            userId,
            playerName: user.pokemonTeam?.[0] || 'pikachu',
            enemyName: data.enemyName,
            isBossBattle: data.isBossBattle
          }),
        });
        const startData = await startResponse.json();
        if (!startResponse.ok) {
          Alert.alert("Error", startData.message || "No se pudo iniciar el combate");
          return;
        }
        setCurrentBattle({
          battleId: startData.battleId,
          enemyName: data.enemyName.toUpperCase(),
          enemyPokemonName: data.enemyName.toLowerCase(),
          bossName: data.bossName || data.enemyName.toUpperCase(),
          message: data.message,
          isBoss: data.isBossBattle,
          enemyHp: startData.estado.enemyPokemon.currentHp,
          enemyMaxHp: startData.estado.enemyPokemon.maxHp,
          playerHp: startData.estado.playerPokemon.currentHp,
          playerMaxHp: startData.estado.playerPokemon.maxHp,
          currentPokemonName: startData.estado.playerPokemon.name,
          teamState: startData.estado.teamState,
        });
        // Si el backend añadió pikachu como inicial (equipo vacío), actualizamos el estado local
        if (!user.pokemonTeam || user.pokemonTeam.length === 0) {
          setUser(prev => ({
            ...prev,
            pokemonTeam: startData.estado.teamState.map(p => p.name)
          }));
        }
      }
    } catch (error) {
      Alert.alert("Error", "Error al buscar oponente");
    }
  };

  // --- LÓGICA DE TURNO DE ATAQUE ---
  const handleAttack = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userId = await AsyncStorage.getItem('userId');

      const response = await fetch(`${API_URL}/battle/attack`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          battleId: currentBattle.battleId,
          moveName: 'tackle'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const [enemyHp, enemyMaxHp] = data.estadoCombate.vidaEnemigo.split(' / ').map(Number);
        const [playerHp] = data.estadoCombate.vidaJugador.split(' / ').map(Number);

        setCurrentBattle(prev => ({
          ...prev,
          enemyHp,
          enemyMaxHp,
          playerHp,
          currentPokemonName: data.estadoCombate.pokemonActual,
          enemyPokemonName: data.estadoCombate.enemyPokemonActual || prev.enemyPokemonName,
          teamState: data.estadoCombate.teamState,
          needsSwitch: data.estadoCombate.needsSwitch || false,
        }));

        if (data.estadoCombate.needsSwitch) {
          setShowSwitchPanel(true);
          Alert.alert('¡Tu Pokémon se ha debilitado!', data.log.join('\n') + '\n\nElige un Pokémon para continuar.');
          return;
        }

        Alert.alert('Resultado del turno', data.log.join('\n'));

        if (data.estadoCombate.gameCompleted) {
          setCurrentBattle(null);
          setGameCompleted(true);
          return;
        }

        if (data.estadoCombate.estado === 'won') {
          if (currentBattle?.isBoss) {
            // Victoria contra jefe de nivel intermedio
            setCurrentBattle(null);
            setUser(prev => ({ ...prev, levelProgress: (prev.levelProgress || 1) + 1 }));
            setLevelWon(true);
          } else {
            // Victoria contra Pokémon salvaje → volver al menú automáticamente
            setCurrentBattle(null);
          }
        } else if (data.estadoCombate.estado === 'lost') {
          // Derrota → volver al menú automáticamente
          Alert.alert('💀 ¡DERROTA!', 'Todos tus Pokémon se han debilitado.');
          setCurrentBattle(null);
        }

      } else {
        Alert.alert("Error", data.message || "No se pudo realizar el ataque");
      }
    } catch (error) {
      Alert.alert("Error de conexión", "Hubo un problema al procesar el ataque");
    }
  };

  // --- LÓGICA DE CAMBIO DE POKÉMON ---
  const handleSwitch = async (newPokemonName) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const forced = currentBattle.needsSwitch || false;
      const response = await fetch(`${API_URL}/battle/switch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ battleId: currentBattle.battleId, newPokemonName, forced }),
      });
      const data = await response.json();
      if (response.ok) {
        const [playerHp, playerMaxHp] = data.estadoCombate.vidaJugador.split(' / ').map(Number);
        const [enemyHp, enemyMaxHp] = data.estadoCombate.vidaEnemigo.split(' / ').map(Number);
        setCurrentBattle(prev => ({
          ...prev,
          playerHp,
          playerMaxHp,
          enemyHp,
          enemyMaxHp,
          currentPokemonName: data.estadoCombate.pokemonActual,
          enemyPokemonName: data.estadoCombate.enemyPokemonActual || prev.enemyPokemonName,
          teamState: data.estadoCombate.teamState,
          needsSwitch: data.estadoCombate.needsSwitch || false,
        }));

        if (!data.estadoCombate.needsSwitch) setShowSwitchPanel(false);

        Alert.alert('Cambio de Pokémon', data.log.join('\n'));

        if (data.estadoCombate.estado === 'won') {
          Alert.alert('🏆 ¡VICTORIA!', '¡Has derrotado al oponente!', [
            { text: 'Recoger recompensa', onPress: () => setCurrentBattle(null) }
          ]);
        } else if (data.estadoCombate.estado === 'lost') {
          Alert.alert('💀 ¡DERROTA!', 'Todos tus Pokémon se han debilitado.', [
            { text: 'Volver al menú', onPress: () => setCurrentBattle(null) }
          ]);
        }
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (error) {
      Alert.alert('Error de conexión', 'No se pudo cambiar de Pokémon');
    }
  };

  // --- PC DE BILL: MOVER POKÉMON ENTRE EQUIPO Y CAJA ---
  const handleMoveToBox = async (pokemonName) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userId = await AsyncStorage.getItem('userId');
      const res = await fetch(`${API_URL}/users/team/move-to-box`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userId, pokemonName }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(prev => ({ ...prev, pokemonTeam: data.pokemonTeam, pokemonBox: data.pokemonBox }));
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (e) {
      Alert.alert('Error de conexión', 'No se pudo mover el Pokémon.');
    }
  };

  const handleConfirmRelease = async (pokemonName) => {
    if (!pokemonName) return;
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userId = await AsyncStorage.getItem('userId');
      const res = await fetch(`${API_URL}/users/box/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userId, pokemonName }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(prev => ({ ...prev, pokemonBox: data.pokemonBox }));
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (e) {
      Alert.alert('Error de conexión', 'No se pudo soltar el Pokémon.');
    }
  };

  const handleMoveToTeam = async (pokemonName) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userId = await AsyncStorage.getItem('userId');
      const res = await fetch(`${API_URL}/users/team/move-to-team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userId, pokemonName }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(prev => ({ ...prev, pokemonTeam: data.pokemonTeam, pokemonBox: data.pokemonBox }));
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (e) {
      Alert.alert('Error de conexión', 'No se pudo mover el Pokémon.');
    }
  };

  // --- LÓGICA DE REORDENACIÓN DEL EQUIPO ---
  const handleReorder = async (index, direction) => {
    const team = [...(user.pokemonTeam || [])];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= team.length) return;

    // Intercambiar posiciones
    [team[index], team[newIndex]] = [team[newIndex], team[index]];

    // Actualizar estado local de inmediato para respuesta visual rápida
    setUser(prev => ({ ...prev, pokemonTeam: team }));

    try {
      const token = await AsyncStorage.getItem('userToken');
      const userId = await AsyncStorage.getItem('userId');
      const response = await fetch(`${API_URL}/users/team/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userId, newOrder: team }),
      });
      if (!response.ok) {
        // Revertir si falla
        const original = [...(user.pokemonTeam || [])];
        setUser(prev => ({ ...prev, pokemonTeam: original }));
        Alert.alert('Error', 'No se pudo guardar el nuevo orden.');
      }
    } catch (e) {
      Alert.alert('Error de conexión', 'No se pudo guardar el orden del equipo.');
    }
  };

  // --- LÓGICA DE CAPTURA ---
  const handleCatch = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_URL}/battle/catch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ battleId: currentBattle.battleId }),
      });
      const data = await response.json();

      if (data.caught) {
        // Re-fetch del usuario para garantizar que el menú refleja el estado real de la BD
        try {
          const meRes = await fetch(`${API_URL}/users/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (meRes.ok) {
            const updatedUser = await meRes.json();
            setUser(updatedUser);
          } else {
            // Fallback: actualizar solo el campo que cambió
            if (data.sentToBox) {
              setUser(prev => ({ ...prev, pokemonBox: data.pokemonBox }));
            } else {
              setUser(prev => ({ ...prev, pokemonTeam: data.pokemonTeam }));
            }
          }
        } catch (_) {
          if (data.sentToBox) {
            setUser(prev => ({ ...prev, pokemonBox: data.pokemonBox }));
          } else {
            setUser(prev => ({ ...prev, pokemonTeam: data.pokemonTeam }));
          }
        }
        Alert.alert('¡Capturado! ⚾', data.message);
        setCurrentBattle(null);
      } else {
        // Fallo: actualizar HP tras contraataque del enemigo
        if (data.estadoCombate) {
          const [playerHp] = data.estadoCombate.vidaJugador.split(' / ').map(Number);
          setCurrentBattle(prev => ({
            ...prev,
            playerHp,
            teamState: data.estadoCombate.teamState,
            needsSwitch: data.estadoCombate.needsSwitch || false,
          }));
          if (data.estadoCombate.needsSwitch) {
            setShowSwitchPanel(true);
          }
          if (data.estadoCombate.estado === 'lost') {
            Alert.alert('💀 ¡DERROTA!', 'Todos tus Pokémon se han debilitado.');
            setCurrentBattle(null);
            return;
          }
        }
        Alert.alert('¡Escapó! 💨', data.message);
      }
    } catch (error) {
      Alert.alert('Error de conexión', 'No se pudo lanzar la Pokéball');
    }
  };

  const handleFlee = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      await fetch(`${API_URL}/battle/flee`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ battleId: currentBattle.battleId }),
      });
    } finally {
      setCurrentBattle(null);
    }
  };

  const handleVictoryContinue = async () => {
    if (levelWon) {
      setLevelWon(false);
      return;
    }

    try {
      const storedId = await AsyncStorage.getItem('userId');
      if (storedId) {
        await fetch(`${API_URL}/users/reset`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: storedId }),
        });
      }
    } catch (e) { /* ignorar errores de red */ }
    setGameCompleted(false);
    setUser(prev => ({ ...prev, levelProgress: 1 }));
  };

  // --- RENDERS CONDICIONALES ---

  // PANTALLA 4: NIVEL SUPERADO (jefe intermedio derrotado)
  if (levelWon) {
    const beatenLevel = (user?.levelProgress || 2) - 1;
    return (
      <VictoryScreen
        username={user?.username}
        beatenLevel={beatenLevel}
        gameCompleted={false}
        onContinue={handleVictoryContinue}
      />
    );
  }

  // PANTALLA 5: FIN DEL JUEGO (último jefe derrotado)
  if (gameCompleted) {
    return (
      <VictoryScreen
        username={user?.username}
        gameCompleted
        onContinue={handleVictoryContinue}
      />
    );
  }

  // PANTALLA 3: ARENA DE COMBATE
  if (currentBattle) {
    return (
      <BattleScreen
        currentBattle={currentBattle}
        user={user}
        showSwitchPanel={showSwitchPanel}
        setShowSwitchPanel={setShowSwitchPanel}
        onAttack={handleAttack}
        onCatch={handleCatch}
        onSwitch={handleSwitch}
        onFlee={handleFlee}
      />
    );
  }

  // PANTALLA 2: MENÚ PRINCIPAL
  if (user) {
    return (
      <HomeScreen
        user={user}
        onExplore={() => handleEncounter(false)}
        onGym={() => handleEncounter(true)}
        onReorder={handleReorder}
        onMoveToBox={handleMoveToBox}
        onMoveToTeam={handleMoveToTeam}
        onConfirmRelease={handleConfirmRelease}
        onLogout={async () => {
          await AsyncStorage.removeItem('userToken');
          await AsyncStorage.removeItem('userId');
          setUser(null);
        }}
      />
    );
  }

  // PANTALLA 1: LOGIN / REGISTRO
  return (
    <View style={styles.container}>
      <Text style={styles.title}>PokéBattle TFG</Text>

      {showRegister ? (
        <>
          <TextInput style={styles.input} placeholder="Nombre de entrenador" value={regUsername} onChangeText={setRegUsername} autoCapitalize="none" />
          <TextInput style={styles.input} placeholder="Email" value={regEmail} onChangeText={setRegEmail} autoCapitalize="none" keyboardType="email-address" />
          <TextInput style={styles.input} placeholder="Contraseña" value={regPassword} onChangeText={setRegPassword} secureTextEntry />
          <TextInput style={styles.input} placeholder="Confirmar contraseña" value={regConfirmPassword} onChangeText={setRegConfirmPassword} secureTextEntry />
          {loading
            ? <ActivityIndicator size="large" color="#ff5a5f" />
            : <TouchableOpacity style={styles.button} onPress={handleRegister}><Text style={styles.buttonText}>REGISTRARSE</Text></TouchableOpacity>
          }
          <TouchableOpacity onPress={() => setShowRegister(false)} style={{ marginTop: 16 }}>
            <Text style={styles.toggleText}>¿Ya tienes cuenta? <Text style={styles.toggleLink}>Iniciar sesión</Text></Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
          <TextInput style={styles.input} placeholder="Contraseña" value={password} onChangeText={setPassword} secureTextEntry />
          {loading
            ? <ActivityIndicator size="large" color="#ff5a5f" />
            : <TouchableOpacity style={styles.button} onPress={handleLogin}><Text style={styles.buttonText}>ENTRAR</Text></TouchableOpacity>
          }
          <TouchableOpacity onPress={() => setShowRegister(true)} style={{ marginTop: 16 }}>
            <Text style={styles.toggleText}>¿No tienes cuenta? <Text style={styles.toggleLink}>Regístrate aquí</Text></Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: {
    fontSize: 38,
    fontWeight: '900',
    color: '#2778C4',
    marginBottom: 40,
    textAlign: 'center',
    textShadowColor: '#F5C94D',
    textShadowOffset: { width: 2, height: 3 },
    textShadowRadius: 3,
  },
  input: { width: '100%', height: 50, backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 15, marginBottom: 20, borderWidth: 1, borderColor: '#ddd' },
  button: { width: '100%', height: 50, backgroundColor: '#ff5a5f', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  toggleText: { color: '#555', fontSize: 14 },
  toggleLink: { color: '#ff5a5f', fontWeight: 'bold' },
});