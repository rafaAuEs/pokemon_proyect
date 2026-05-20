import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './apiConfig';

export default function App() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // NUEVO: Estado para saber si estamos en combate y con quién
  const [currentBattle, setCurrentBattle] = useState(null);
  const [showSwitchPanel, setShowSwitchPanel] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [levelWon, setLevelWon] = useState(false);

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
            playerName: 'pikachu',
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
          message: data.message,
          isBoss: data.isBossBattle,
          enemyHp: startData.estado.enemyPokemon.currentHp,
          enemyMaxHp: startData.estado.enemyPokemon.maxHp,
          playerHp: startData.estado.playerPokemon.currentHp,
          playerMaxHp: startData.estado.playerPokemon.maxHp,
          currentPokemonName: startData.estado.playerPokemon.name,
          teamState: startData.estado.teamState,
        });
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
        const [enemyHp] = data.estadoCombate.vidaEnemigo.split(' / ').map(Number);
        const [playerHp] = data.estadoCombate.vidaJugador.split(' / ').map(Number);

        setCurrentBattle(prev => ({
          ...prev,
          enemyHp,
          playerHp,
          currentPokemonName: data.estadoCombate.pokemonActual,
          enemyPokemonName: data.estadoCombate.enemyPokemonActual || prev.enemyName.toLowerCase(),
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
        const [enemyHp] = data.estadoCombate.vidaEnemigo.split(' / ').map(Number);
        setCurrentBattle(prev => ({
          ...prev,
          playerHp,
          playerMaxHp,
          enemyHp,
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

  // --- RENDERS CONDICIONALES ---

  // PANTALLA 4: NIVEL SUPERADO (jefe intermedio derrotado)
  if (levelWon) {
    const beatenLevel = (user?.levelProgress || 2) - 1;
    return (
      <View style={[styles.container, { backgroundColor: '#27ae60' }]}>
        <Text style={{ fontSize: 60, marginBottom: 10 }}>🏅</Text>
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 10 }}>
          ¡NIVEL {beatenLevel} SUPERADO!
        </Text>
        <Text style={{ fontSize: 16, color: '#fff', textAlign: 'center', marginBottom: 40 }}>
          Has derrotado al líder del gimnasio{'\n'}y desbloqueado el nivel {beatenLevel + 1}.
        </Text>
        <Text style={{ fontSize: 40, marginBottom: 30 }}>⭐🎖️⭐</Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#1e8449' }]}
          onPress={() => setLevelWon(false)}
        >
          <Text style={styles.buttonText}>Volver al menú</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // PANTALLA 5: FIN DEL JUEGO (último jefe derrotado)
  if (gameCompleted) {
    return (
      <View style={[styles.container, { backgroundColor: '#f39c12' }]}>
        <Text style={{ fontSize: 60, marginBottom: 10 }}>🏆</Text>
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 10 }}>
          ¡ENHORABUENA, {user?.username?.toUpperCase()}!
        </Text>
        <Text style={{ fontSize: 16, color: '#fff', textAlign: 'center', marginBottom: 40 }}>
          Has derrotado a todos los líderes de gimnasio{'\n'}y completado el juego.
        </Text>
        <Text style={{ fontSize: 40, marginBottom: 30 }}>💎🔥💎</Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#c0392b' }]}
          onPress={async () => {
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
          }}
        >
          <Text style={styles.buttonText}>Volver al menú</Text>
        </TouchableOpacity>
      </View>
    );
  }

// PANTALLA 3: ARENA DE COMBATE
  if (currentBattle) {
    // Convertimos el nombre a minúsculas para la URL de la imagen
    const enemyNameLower = currentBattle.enemyName.toLowerCase();
    
    return (
      <View style={[styles.container, { backgroundColor: currentBattle.isBoss ? '#2c3e50' : '#2ecc71' }]}>
        <Text style={styles.battleHeader}>⚔️ MODO COMBATE ⚔️</Text>
        <Text style={styles.battleMessage}>{currentBattle.message}</Text>

        {/* --- ZONA ENEMIGA (Arriba) --- */}
        <View style={styles.battleZoneRight}>
          <View style={styles.pokemonInfo}>
            <Text style={styles.pokemonName}>👹 {currentBattle.enemyName}</Text>
            <Text style={styles.hpText}>HP: {currentBattle.enemyHp} / {currentBattle.enemyMaxHp}</Text>
          </View>
          <Image 
            source={{ uri: `https://img.pokemondb.net/sprites/home/normal/${enemyNameLower}.png` }} 
            style={styles.pokemonSprite}
            resizeMode="contain"
          />
        </View>

        {/* --- ZONA JUGADOR (Abajo) --- */}
        <View style={styles.battleZoneLeft}>
          <Image 
            source={{ uri: `https://img.pokemondb.net/sprites/home/normal/${currentBattle.currentPokemonName}.png` }} 
            style={styles.pokemonSprite}
            resizeMode="contain"
          />
          <View style={styles.pokemonInfo}>
            <Text style={styles.pokemonName}>🛡️ {currentBattle.currentPokemonName?.toUpperCase()} (Nivel {user?.levelProgress || 1})</Text>
            <Text style={styles.hpText}>HP: {currentBattle.playerHp} / {currentBattle.playerMaxHp}</Text>
          </View>
        </View>

        {/* --- BOTONERA --- */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.btnAttack} onPress={handleAttack}>
            <Text style={styles.btnText}>💥 ATACAR</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnSwitch} onPress={() => setShowSwitchPanel(p => !p)}>
            <Text style={styles.btnText}>🔄 CAMBIAR</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnHuyen} onPress={async () => {
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
          }}>
            <Text style={styles.btnText}>🏃 HUIR</Text>
          </TouchableOpacity>
        </View>

        {/* --- PANEL DE CAMBIO --- */}
        {showSwitchPanel && (
          <View style={styles.switchPanel}>
            <Text style={styles.switchTitle}>
              {currentBattle.needsSwitch ? '¡Elige tu siguiente Pokémon!' : 'Elige un Pokémon:'}
            </Text>
            {(currentBattle.teamState || [])
              .filter(p => p.name !== currentBattle.currentPokemonName)
              .map(p => (
                <TouchableOpacity
                  key={p.name}
                  style={[styles.switchBtn, p.currentHp <= 0 && styles.switchBtnFainted]}
                  onPress={() => p.currentHp > 0 && handleSwitch(p.name)}
                  disabled={p.currentHp <= 0}
                >
                  <Text style={styles.switchBtnText}>
                    {p.name.toUpperCase()}  HP: {p.currentHp}/{p.maxHp}{p.currentHp <= 0 ? '  💀' : ''}
                  </Text>
                </TouchableOpacity>
              ))
            }
            {!currentBattle.needsSwitch && (
              <TouchableOpacity style={styles.switchCancelBtn} onPress={() => setShowSwitchPanel(false)}>
                <Text style={styles.switchBtnText}>Cancelar</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  }

  // PANTALLA 2: MENÚ PRINCIPAL
  if (user) {
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>¡Hola, {user.username}!</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Estado del Entrenador</Text>
          <Text>Nivel de Progreso: {user.levelProgress || 1}</Text>
        </View>

        <TouchableOpacity style={styles.btnExplore} onPress={() => handleEncounter(false)}>
          <Text style={styles.btnText}>EXPLORAR (Hierba Alta)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnGym} onPress={() => handleEncounter(true)}>
          <Text style={styles.btnText}>GIMNASIO (Líder)</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setUser(null)} style={{marginTop: 20}}>
          <Text style={{color: 'red', fontWeight: 'bold'}}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // PANTALLA 1: LOGIN
  return (
    <View style={styles.container}>
      <Text style={styles.title}>PokéBattle TFG</Text>
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Contraseña" value={password} onChangeText={setPassword} secureTextEntry />
      {loading ? <ActivityIndicator size="large" color="#ff5a5f" /> : <TouchableOpacity style={styles.button} onPress={handleLogin}><Text style={styles.buttonText}>ENTRAR</Text></TouchableOpacity>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 40 },
  welcome: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  input: { width: '100%', height: 50, backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 15, marginBottom: 20, borderWidth: 1, borderColor: '#ddd' },
  button: { width: '100%', height: 50, backgroundColor: '#ff5a5f', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  card: { width: '100%', backgroundColor: '#fff', padding: 20, borderRadius: 15, marginBottom: 30, elevation: 3 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  btnExplore: { width: '100%', height: 60, backgroundColor: '#4CAF50', borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  btnGym: { width: '100%', height: 60, backgroundColor: '#2196F3', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  
  // NUEVOS ESTILOS PARA LA ARENA DE COMBATE
  battleHeader: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 5 },
  battleMessage: { color: '#fff', fontStyle: 'italic', textAlign: 'center', marginBottom: 30 },
  
  battleZoneRight: { width: '100%', flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.85)', padding: 15, borderRadius: 12, marginBottom: 20, alignItems: 'center', justifyContent: 'space-between', alignSelf: 'flex-end' },
  battleZoneLeft: { width: '100%', flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.85)', padding: 15, borderRadius: 12, marginBottom: 40, alignItems: 'center', justifyContent: 'space-between', alignSelf: 'flex-start' },
  
  pokemonInfo: { flex: 1, justifyContent: 'center' },
  pokemonName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  hpText: { fontSize: 14, fontWeight: 'bold', color: '#e74c3c', marginTop: 3 },
  pokemonSprite: { width: 100, height: 100 },
  
  actionRow: { width: '100%', flexDirection: 'column', gap: 10 },
  btnAttack: { width: '100%', height: 55, backgroundColor: '#e74c3c', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  btnSwitch: { width: '100%', height: 50, backgroundColor: '#e67e22', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  btnHuyen: { width: '100%', height: 50, backgroundColor: '#7f8c8d', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  switchPanel: { width: '100%', backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 12, padding: 12, marginTop: 10 },
  switchTitle: { color: '#fff', fontWeight: 'bold', fontSize: 15, marginBottom: 8 },
  switchBtn: { backgroundColor: '#2ecc71', borderRadius: 8, padding: 10, marginBottom: 6 },
  switchBtnFainted: { backgroundColor: '#555' },
  switchCancelBtn: { backgroundColor: '#7f8c8d', borderRadius: 8, padding: 10, marginTop: 4 },
  switchBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
});