import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function VictoryScreen({
  username,
  beatenLevel,
  gameCompleted,
  onContinue,
}) {
  const rewards = gameCompleted
    ? [
        { icon: '🏅', title: 'Aventura completada', detail: 'Todos los gimnasios superados' },
        { icon: '⭐', title: 'Progreso de nivel', detail: 'Puedes comenzar una nueva aventura' },
      ]
    : [
        { icon: '🏅', title: 'Insignia de gimnasio', detail: `Líder del nivel ${beatenLevel} derrotado` },
        { icon: '🔓', title: 'Nuevo nivel desbloqueado', detail: `Nivel ${beatenLevel + 1}` },
      ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.screen} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={[styles.iconCircle, gameCompleted && styles.completeIconCircle]}>
            <Text style={styles.trophy}>{gameCompleted ? '🏆' : '🏅'}</Text>
          </View>
          <Text style={styles.eyebrow}>{gameCompleted ? '¡AVENTURA COMPLETADA!' : '¡GRAN VICTORIA!'}</Text>
          <Text style={styles.title}>
            {gameCompleted ? `¡Enhorabuena${username ? `, ${username}` : ''}!` : `¡Nivel ${beatenLevel} superado!`}
          </Text>
          <Text style={styles.description}>
            {gameCompleted
              ? 'Has derrotado a todos los líderes de gimnasio y completado el juego.'
              : `Has vencido al líder del gimnasio y desbloqueado el nivel ${beatenLevel + 1}.`}
          </Text>

          <View style={styles.divider} />
          <Text style={styles.rewardsHeading}>RECOMPENSAS</Text>
          {rewards.map((reward) => (
            <View key={reward.title} style={styles.rewardRow}>
              <View style={styles.rewardIcon}>
                <Text style={styles.rewardEmoji}>{reward.icon}</Text>
              </View>
              <View style={styles.rewardCopy}>
                <Text style={styles.rewardTitle}>{reward.title}</Text>
                <Text style={styles.rewardDetail}>{reward.detail}</Text>
              </View>
              <Text style={styles.rewardCheck}>✓</Text>
            </View>
          ))}

          <TouchableOpacity style={styles.continueButton} onPress={onContinue} activeOpacity={0.85}>
            <Text style={styles.continueText}>Continuar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F2F7F2',
  },
  screen: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 28,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 24,
    alignItems: 'center',
    shadowColor: '#365644',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 5,
  },
  iconCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#FFF3D6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  completeIconCircle: {
    backgroundColor: '#E8F2FF',
  },
  trophy: {
    fontSize: 42,
  },
  eyebrow: {
    color: '#7FA889',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.4,
    textAlign: 'center',
  },
  title: {
    color: '#2D4036',
    fontSize: 25,
    lineHeight: 32,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 8,
  },
  description: {
    color: '#738278',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 10,
  },
  divider: {
    alignSelf: 'stretch',
    height: 1,
    backgroundColor: '#EDF1ED',
    marginTop: 24,
    marginBottom: 20,
  },
  rewardsHeading: {
    alignSelf: 'flex-start',
    color: '#91A097',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  rewardRow: {
    width: '100%',
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 17,
    backgroundColor: '#F7F9F7',
    paddingHorizontal: 12,
    marginTop: 8,
  },
  rewardIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#EAF3EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  rewardEmoji: {
    fontSize: 19,
  },
  rewardCopy: {
    flex: 1,
  },
  rewardTitle: {
    color: '#3C5144',
    fontSize: 13,
    fontWeight: '800',
  },
  rewardDetail: {
    color: '#86938B',
    fontSize: 11,
    marginTop: 3,
  },
  rewardCheck: {
    color: '#69B27C',
    fontSize: 18,
    fontWeight: '900',
    marginLeft: 8,
  },
  continueButton: {
    width: '100%',
    minHeight: 52,
    borderRadius: 28,
    backgroundColor: '#70B980',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    shadowColor: '#4A9E61',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  continueText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
});
