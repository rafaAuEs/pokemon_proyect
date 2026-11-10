import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Modal,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

const spriteUri = (name) =>
  `https://img.pokemondb.net/sprites/home/normal/${(name || '').toLowerCase()}.png`;

export default function HomeScreen({
  user,
  onExplore,
  onGym,
  onReorder,
  onMoveToBox,
  onMoveToTeam,
  onConfirmRelease,
  onLogout,
}) {
  const [showTeamManager, setShowTeamManager] = useState(false);
  const [showPC, setShowPC] = useState(false);
  const [releaseConfirm, setReleaseConfirm] = useState(null);

  const team = user?.pokemonTeam || [];
  const box = user?.pokemonBox || [];
  const level = user?.levelProgress || 1;
  const initial = (user?.username || '?').charAt(0).toUpperCase();

  const confirmRelease = () => {
    const name = releaseConfirm;
    setReleaseConfirm(null);
    if (name) onConfirmRelease(name);
  };

  return (
    <LinearGradient
      colors={['#7EC8E3', '#C8E6C9', '#F4F1DE']}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.gradient}
    >
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarLetter}>{initial}</Text>
            </View>
            <View style={styles.headerText}>
              <Text style={styles.hello}>¡Hola!</Text>
              <Text style={styles.username} numberOfLines={1}>
                {user?.username}
              </Text>
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelLabel}>NIVEL</Text>
              <Text style={styles.levelValue}>{level}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardEyebrow}>ENTRENADOR</Text>
            <Text style={styles.cardTitle}>Estado del entrenador</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.min(level * 10, 100)}%` }]} />
            </View>
            <Text style={styles.progressHint}>Progreso de gimnasios · Nivel {level}</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardEyebrow}>EQUIPO</Text>
                <Text style={styles.cardTitle}>Mi equipo ({team.length}/6)</Text>
              </View>
              {team.length > 1 && (
                <TouchableOpacity
                  style={styles.ghostBtn}
                  onPress={() => setShowTeamManager((p) => !p)}
                >
                  <Text style={styles.ghostBtnText}>
                    {showTeamManager ? 'Listo' : 'Ordenar'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {team.length === 0 ? (
              <Text style={styles.emptyText}>Sin Pokémon. ¡Sal a explorar!</Text>
            ) : showTeamManager ? (
              <View style={styles.managerWrap}>
                <Text style={styles.helperText}>
                  El primer Pokémon de la lista será el que entre a combatir.
                </Text>
                {team.map((name, index) => (
                  <View key={name} style={styles.row}>
                    <Image source={{ uri: spriteUri(name) }} style={styles.rowSprite} resizeMode="contain" />
                    <View style={styles.rowInfo}>
                      <Text style={styles.rowName}>{name.toUpperCase()}</Text>
                      {index === 0 && <Text style={styles.leaderTag}>Líder de combate</Text>}
                    </View>
                    <View style={styles.rowActions}>
                      <TouchableOpacity
                        style={[styles.iconBtn, index === 0 && styles.iconBtnDisabled]}
                        onPress={() => onReorder(index, -1)}
                        disabled={index === 0}
                      >
                        <Text style={styles.iconBtnText}>▲</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.iconBtn, index === team.length - 1 && styles.iconBtnDisabled]}
                        onPress={() => onReorder(index, 1)}
                        disabled={index === team.length - 1}
                      >
                        <Text style={styles.iconBtnText}>▼</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.iconBtn, styles.iconBtnBox, team.length <= 1 && styles.iconBtnDisabled]}
                        onPress={() => onMoveToBox(name)}
                        disabled={team.length <= 1}
                      >
                        <Text style={styles.iconBtnText}>PC</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.teamGrid}>
                {team.map((name, index) => (
                  <View key={name} style={styles.teamSlot}>
                    <View style={styles.spriteRing}>
                      <Image source={{ uri: spriteUri(name) }} style={styles.teamSprite} resizeMode="contain" />
                    </View>
                    <Text style={styles.teamName} numberOfLines={1}>{name.toUpperCase()}</Text>
                    {index === 0 && <Text style={styles.leaderDot}>Líder</Text>}
                  </View>
                ))}
              </View>
            )}
          </View>

          {box.length > 0 && (
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.cardHeader}
                onPress={() => setShowPC((p) => !p)}
                activeOpacity={0.8}
              >
                <View>
                  <Text style={styles.cardEyebrow}>ALMACÉN</Text>
                  <Text style={styles.cardTitle}>PC de Bill ({box.length})</Text>
                </View>
                <View style={styles.ghostBtn}>
                  <Text style={styles.ghostBtnText}>{showPC ? 'Cerrar' : 'Ver'}</Text>
                </View>
              </TouchableOpacity>

              {showPC && (
                <View style={styles.managerWrap}>
                  <Text style={styles.helperText}>
                    Pokémon guardados. Muévelos al equipo si tienes hueco (máx. 6).
                  </Text>
                  {box.map((name) => (
                    <View key={name} style={styles.row}>
                      <Image source={{ uri: spriteUri(name) }} style={styles.rowSprite} resizeMode="contain" />
                      <Text style={[styles.rowName, { flex: 1 }]}>{name.toUpperCase()}</Text>
                      <TouchableOpacity
                        style={[styles.pillBtn, styles.pillGreen, team.length >= 6 && styles.pillDisabled]}
                        onPress={() => onMoveToTeam(name)}
                        disabled={team.length >= 6}
                      >
                        <Text style={styles.pillBtnText}>Equipo</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.pillBtn, styles.pillRed]}
                        onPress={() => setReleaseConfirm(name)}
                      >
                        <Text style={styles.pillBtnText}>Soltar</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          <TouchableOpacity style={styles.exploreBtn} onPress={onExplore} activeOpacity={0.85}>
            <Text style={styles.exploreBtnText}>Explorar hierba alta</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gymBtn} onPress={onGym} activeOpacity={0.85}>
            <Text style={styles.gymBtnText}>Gimnasio · Líder</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>

      <Modal transparent animationType="fade" visible={releaseConfirm !== null}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>¿Soltar Pokémon?</Text>
            <Image
              source={{ uri: spriteUri(releaseConfirm) }}
              style={styles.modalSprite}
              resizeMode="contain"
            />
            <Text style={styles.modalBody}>
              ¿Seguro que quieres soltar a{' '}
              <Text style={styles.modalName}>{(releaseConfirm || '').toUpperCase()}</Text>
              ? Esta acción es permanente.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnGhost]}
                onPress={() => setReleaseConfirm(null)}
              >
                <Text style={styles.modalBtnGhostText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnDanger]}
                onPress={confirmRelease}
              >
                <Text style={styles.modalBtnDangerText}>Soltar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const cardShadow = {
  shadowColor: '#1B4F72',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.12,
  shadowRadius: 16,
  elevation: 6,
};

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 36 },

  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 28,
    padding: 14,
    marginBottom: 16,
    ...cardShadow,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFCB05',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarLetter: { fontSize: 22, fontWeight: '800', color: '#2C3E50' },
  headerText: { flex: 1, marginLeft: 12 },
  hello: { fontSize: 13, color: '#7A8A99', fontWeight: '600' },
  username: { fontSize: 22, fontWeight: '800', color: '#1A2B3C', letterSpacing: -0.3 },
  levelBadge: {
    backgroundColor: '#EEF6FF',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    minWidth: 64,
  },
  levelLabel: { fontSize: 9, fontWeight: '700', color: '#5B7CFF', letterSpacing: 0.8 },
  levelValue: { fontSize: 20, fontWeight: '800', color: '#3D5AFE' },

  card: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 28,
    padding: 20,
    marginBottom: 14,
    ...cardShadow,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8AA0B4',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#1A2B3C' },
  progressTrack: {
    height: 10,
    borderRadius: 8,
    backgroundColor: '#E8EEF4',
    marginTop: 14,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#42A5F5',
  },
  progressHint: { marginTop: 8, fontSize: 13, color: '#6B7C8A' },
  emptyText: { color: '#8AA0B4', marginTop: 12, fontSize: 14 },
  helperText: { color: '#6B7C8A', fontSize: 12, marginBottom: 10, lineHeight: 18 },
  managerWrap: { marginTop: 12 },

  ghostBtn: {
    backgroundColor: '#EEF6FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  ghostBtnText: { color: '#3D5AFE', fontWeight: '700', fontSize: 13 },

  teamGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  teamSlot: {
    width: '33.33%',
    alignItems: 'center',
    paddingVertical: 10,
  },
  spriteRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F3F8FC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E3EEF7',
  },
  teamSprite: { width: 58, height: 58 },
  teamName: { marginTop: 6, fontSize: 11, fontWeight: '800', color: '#1A2B3C', maxWidth: 90, textAlign: 'center' },
  leaderDot: { fontSize: 10, fontWeight: '700', color: '#F5A623', marginTop: 2 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F8FB',
    borderRadius: 18,
    padding: 10,
    marginBottom: 8,
  },
  rowSprite: { width: 44, height: 44 },
  rowInfo: { flex: 1, marginLeft: 8 },
  rowName: { fontWeight: '800', color: '#1A2B3C', fontSize: 13 },
  leaderTag: { color: '#F5A623', fontSize: 11, fontWeight: '700', marginTop: 2 },
  rowActions: { flexDirection: 'row', gap: 6 },
  iconBtn: {
    minWidth: 32,
    height: 32,
    paddingHorizontal: 8,
    backgroundColor: '#5B7CFF',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnBox: { backgroundColor: '#F5A623' },
  iconBtnDisabled: { backgroundColor: '#D5DEE6' },
  iconBtnText: { color: '#fff', fontWeight: '800', fontSize: 11 },

  pillBtn: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 6,
  },
  pillGreen: { backgroundColor: '#2ECC71' },
  pillRed: { backgroundColor: '#E74C3C' },
  pillDisabled: { backgroundColor: '#D5DEE6' },
  pillBtnText: { color: '#fff', fontWeight: '800', fontSize: 11 },

  exploreBtn: {
    width: '100%',
    height: 58,
    backgroundColor: '#2ECC71',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#1B7A43',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 5,
  },
  exploreBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  gymBtn: {
    width: '100%',
    height: 58,
    backgroundColor: '#5B7CFF',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: '#3148B0',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  gymBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  logoutBtn: { alignSelf: 'center', marginTop: 22, padding: 8 },
  logoutText: { color: '#C0392B', fontWeight: '700', fontSize: 14 },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 32, 46, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    ...cardShadow,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1A2B3C', marginBottom: 8 },
  modalSprite: { width: 88, height: 88, marginBottom: 8 },
  modalBody: { textAlign: 'center', color: '#5C6B78', marginBottom: 20, lineHeight: 20 },
  modalName: { fontWeight: '800', color: '#1A2B3C' },
  modalActions: { flexDirection: 'row', gap: 10, width: '100%' },
  modalBtn: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalBtnGhost: { backgroundColor: '#EEF2F6' },
  modalBtnGhostText: { color: '#5C6B78', fontWeight: '800' },
  modalBtnDanger: { backgroundColor: '#E74C3C' },
  modalBtnDangerText: { color: '#fff', fontWeight: '800' },
});
