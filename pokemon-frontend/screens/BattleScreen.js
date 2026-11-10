import React from 'react';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const spriteUri = (name) =>
  `https://img.pokemondb.net/sprites/home/normal/${(name || '').toLowerCase()}.png`;

const hpPercentage = (currentHp, maxHp) => {
  if (!maxHp || maxHp <= 0) return '0%';
  return `${Math.max(0, Math.min(100, (currentHp / maxHp) * 100))}%`;
};

function PokemonCard({ name, title, hp, maxHp, sprite, level, enemy }) {
  return (
    <View style={[styles.pokemonCard, enemy ? styles.enemyCard : styles.playerCard]}>
      <View style={styles.pokemonInfo}>
        <Text style={styles.cardEyebrow}>{title}</Text>
        <Text style={styles.pokemonName} numberOfLines={1}>
          {name}
        </Text>
        {level ? <Text style={styles.levelText}>Nivel {level}</Text> : null}
        <View style={styles.hpLabels}>
          <Text style={styles.hpLabel}>PS</Text>
          <Text style={styles.hpValue}>{hp} / {maxHp}</Text>
        </View>
        <View style={styles.hpTrack}>
          <View style={[styles.hpFill, { width: hpPercentage(hp, maxHp) }]} />
        </View>
      </View>
      <Image source={{ uri: spriteUri(sprite) }} style={styles.pokemonSprite} resizeMode="contain" />
    </View>
  );
}

export default function BattleScreen({
  currentBattle,
  user,
  showSwitchPanel,
  setShowSwitchPanel,
  onAttack,
  onCatch,
  onSwitch,
  onFlee,
}) {
  const enemySpriteName = (currentBattle.enemyPokemonName || currentBattle.enemyName).toLowerCase();
  const enemyTitle = currentBattle.isBoss ? currentBattle.bossName : currentBattle.enemyName;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.screen}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>AVENTURA POKÉMON</Text>
            <Text style={styles.title}>Combate</Text>
          </View>
          <View style={[styles.modeBadge, currentBattle.isBoss && styles.bossBadge]}>
            <Text style={[styles.modeBadgeText, currentBattle.isBoss && styles.bossBadgeText]}>
              {currentBattle.isBoss ? 'JEFE' : 'SALVAJE'}
            </Text>
          </View>
        </View>

        {!!currentBattle.message && (
          <View style={styles.messageCard}>
            <Text style={styles.messageText}>{currentBattle.message}</Text>
          </View>
        )}

        <View style={styles.arena}>
          <PokemonCard
            title={currentBattle.isBoss ? 'OPONENTE · JEFE' : 'OPONENTE'}
            name={enemyTitle}
            hp={currentBattle.enemyHp}
            maxHp={currentBattle.enemyMaxHp}
            sprite={enemySpriteName}
            enemy
          />
          <View style={styles.versus}>
            <View style={styles.versusLine} />
            <Text style={styles.versusText}>VS</Text>
            <View style={styles.versusLine} />
          </View>
          <PokemonCard
            title="TU POKÉMON"
            name={currentBattle.currentPokemonName?.toUpperCase()}
            hp={currentBattle.playerHp}
            maxHp={currentBattle.playerMaxHp}
            sprite={currentBattle.currentPokemonName}
            level={user?.levelProgress || 1}
          />
        </View>

        <View style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>¿Qué quieres hacer?</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={[styles.actionButton, styles.attackButton, currentBattle.needsSwitch && styles.disabledButton]}
              onPress={onAttack}
              disabled={currentBattle.needsSwitch}
              activeOpacity={0.8}
            >
              <Text style={styles.actionIcon}>✦</Text>
              <Text style={styles.actionText}>ATACAR</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.switchButton]}
              onPress={() => setShowSwitchPanel((previous) => !previous)}
              activeOpacity={0.8}
            >
              <Text style={styles.actionIcon}>↔</Text>
              <Text style={styles.actionText}>CAMBIAR</Text>
            </TouchableOpacity>
            {!currentBattle.isBoss && (
              <TouchableOpacity
                style={[styles.actionButton, styles.catchButton]}
                onPress={onCatch}
                activeOpacity={0.8}
              >
                <Text style={styles.actionIcon}>●</Text>
                <Text style={styles.actionText}>POKÉBALL</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.actionButton, styles.fleeButton]}
              onPress={onFlee}
              activeOpacity={0.8}
            >
              <Text style={styles.actionIcon}>↗</Text>
              <Text style={styles.actionText}>HUIR</Text>
            </TouchableOpacity>
          </View>
        </View>

        {showSwitchPanel && (
          <View style={styles.switchCard}>
            <Text style={styles.sectionTitle}>
              {currentBattle.needsSwitch ? '¡Elige tu siguiente Pokémon!' : 'Cambiar Pokémon'}
            </Text>
            {(currentBattle.teamState || [])
              .filter((pokemon) => pokemon.name !== currentBattle.currentPokemonName)
              .map((pokemon) => {
                const isFainted = pokemon.currentHp <= 0;
                return (
                  <TouchableOpacity
                    key={pokemon.name}
                    style={[styles.teamMember, isFainted && styles.faintedMember]}
                    onPress={() => !isFainted && onSwitch(pokemon.name)}
                    disabled={isFainted}
                    activeOpacity={0.75}
                  >
                    <Image source={{ uri: spriteUri(pokemon.name) }} style={styles.teamSprite} resizeMode="contain" />
                    <View style={styles.teamMemberInfo}>
                      <Text style={styles.teamMemberName}>{pokemon.name.toUpperCase()}</Text>
                      <Text style={styles.teamMemberHp}>PS {pokemon.currentHp} / {pokemon.maxHp}</Text>
                    </View>
                    {isFainted && <Text style={styles.faintedLabel}>DEBILITADO</Text>}
                  </TouchableOpacity>
                );
              })}
            {!currentBattle.needsSwitch && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowSwitchPanel(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F7F4',
  },
  screen: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  eyebrow: {
    color: '#8B9A91',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  title: {
    color: '#263B32',
    fontSize: 30,
    fontWeight: '800',
    marginTop: 3,
  },
  modeBadge: {
    backgroundColor: '#E4F2E8',
    borderRadius: 24,
    paddingHorizontal: 15,
    paddingVertical: 9,
  },
  bossBadge: {
    backgroundColor: '#FCE9E4',
  },
  modeBadgeText: {
    color: '#4E9A68',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  bossBadgeText: {
    color: '#D56D58',
  },
  messageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 16,
    shadowColor: '#395548',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  messageText: {
    color: '#617269',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  arena: {
    backgroundColor: '#E5F0E7',
    borderRadius: 28,
    padding: 14,
    marginBottom: 16,
  },
  pokemonCard: {
    minHeight: 142,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 22,
    paddingHorizontal: 17,
    paddingVertical: 12,
    shadowColor: '#314D3E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 9,
    elevation: 2,
  },
  enemyCard: {
    backgroundColor: '#FFFFFF',
  },
  playerCard: {
    backgroundColor: '#FFFDF7',
  },
  pokemonInfo: {
    flex: 1,
    paddingRight: 5,
  },
  cardEyebrow: {
    color: '#8A9A90',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 5,
  },
  pokemonName: {
    color: '#2D4036',
    fontSize: 17,
    fontWeight: '800',
  },
  levelText: {
    color: '#8A9A90',
    fontSize: 12,
    marginTop: 3,
  },
  hpLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 5,
  },
  hpLabel: {
    color: '#718278',
    fontSize: 11,
    fontWeight: '800',
  },
  hpValue: {
    color: '#718278',
    fontSize: 11,
    fontWeight: '700',
  },
  hpTrack: {
    height: 8,
    backgroundColor: '#E8EEE9',
    borderRadius: 8,
    overflow: 'hidden',
  },
  hpFill: {
    height: '100%',
    backgroundColor: '#79C98A',
    borderRadius: 8,
  },
  pokemonSprite: {
    width: 110,
    height: 110,
  },
  versus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
  },
  versusLine: {
    width: 44,
    height: 1,
    backgroundColor: '#C7D8CA',
  },
  versusText: {
    color: '#82988A',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.3,
    marginHorizontal: 10,
  },
  actionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#395548',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  sectionTitle: {
    color: '#34483D',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 14,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  actionButton: {
    width: '48%',
    minHeight: 54,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  attackButton: {
    backgroundColor: '#F08B7C',
  },
  switchButton: {
    backgroundColor: '#F2C779',
  },
  catchButton: {
    backgroundColor: '#9A8BD4',
  },
  fleeButton: {
    backgroundColor: '#9BAAA1',
  },
  disabledButton: {
    backgroundColor: '#C7CFCA',
  },
  actionIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    marginRight: 7,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  switchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    shadowColor: '#395548',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  teamMember: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 66,
    backgroundColor: '#F5F8F5',
    borderRadius: 18,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  faintedMember: {
    opacity: 0.48,
  },
  teamSprite: {
    width: 48,
    height: 48,
    marginRight: 10,
  },
  teamMemberInfo: {
    flex: 1,
  },
  teamMemberName: {
    color: '#34483D',
    fontSize: 13,
    fontWeight: '800',
  },
  teamMemberHp: {
    color: '#7A8B80',
    fontSize: 11,
    marginTop: 3,
  },
  faintedLabel: {
    color: '#B86E62',
    fontSize: 9,
    fontWeight: '900',
  },
  cancelButton: {
    alignSelf: 'center',
    paddingHorizontal: 22,
    paddingVertical: 10,
    marginTop: 4,
  },
  cancelText: {
    color: '#819187',
    fontSize: 13,
    fontWeight: '700',
  },
});
