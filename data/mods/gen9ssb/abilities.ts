// @ts-nocheck
// I love avoiding my problems instead of solving them
import { ssbSets } from "./random-teams";
import { changeSet, getName, enemyStaff, PSEUDO_WEATHERS } from "./scripts";

const STRONG_WEATHERS = ['desolateland', 'primordialsea', 'deltastream', 'millenniumcastle'];

export const Abilities: { [k: string]: ModdedAbilityData } = {
	/*
	// Example
	abilityid: {
		shortDesc: "", // short description, shows up in /dt
		desc: "", // long description
		name: "Ability Name",
		// The bulk of an ability is not easily shown in an example since it varies
		// For more examples, see https://github.com/smogon/pokemon-showdown/blob/master/data/abilities.ts
	},
	*/
	// Please keep abilites organized alphabetically based on staff member name!
	// Roughskull
	venomshock: {
		name: "Venom Shock",
		gen: 9,
		shortDesc: "Attacks have a 30% chance to badly poison or paralyze.",
		desc: "This Pokemon's attacking moves have a 30% chance to either badly poison or paralyze the target.",
		onAfterMoveSecondarySelf(source, target, move) {
			if (move.category === 'Status' || source === target || target.status) return;
			if (this.randomChance(3, 10)) {
				let r = this.random(2);
				if (r === 0) {
					target.setStatus('tox', source, this.dex.abilities.get('venomshock'));
				} else {
					target.setStatus('par', source, this.dex.abilities.get('venomshock'));
				}
			}
		},
	},
	// Horrific17
	adaptivefighter: {
		name: "Adaptive Fighter",
		gen: 9,
		desc: "This Pokemon sets Magic Room upon switching in. If HP is above 50%, Defense and Special Defense are doubled, Attack and Special Attack are halved, ignores Attack and Special Attack boosts from opposing Pokemon, and survives an attack that would KO on 1 HP. If HP is below 50%, Attack and Special Attack are doubled, Defense and Special Defense are halved, ignores opposing Pokemons' Defense and Special Defense boosts, and sets Fairy Lock when an attack drops this Pokemon below 50% HP.",
		shortDesc: "Magic Room; 50%+ HP: Defensive. 49%- HP: Offensive.",
		onSwitchInPriority: 2,
		onStart(pokemon) {
			if (!this.field.pseudoWeather['magicroom']) {
				this.field.addPseudoWeather('magicroom');
			}
		},
		onUpdate(pokemon) {
			if (pokemon.hp < pokemon.maxhp / 2 && !pokemon.abilityState.flActivated) {
				pokemon.abilityState.flActivated = true;
				this.add('-ability', pokemon, 'Adaptive Fighter');
				this.field.addPseudoWeather('fairylock');
			}
		},
		onModifyAtkPriority: 5,
		onModifyAtk(atk, pokemon) {
			if (pokemon.hp < pokemon.maxhp / 2) return this.chainModify(2);
			return this.chainModify(0.5);
		},
		onModifySpAPriority: 5,
		onModifySpA(spa, pokemon) {
			if (pokemon.hp < pokemon.maxhp / 2) return this.chainModify(2);
			return this.chainModify(0.5);
		},
		onModifyDefPriority: 6,
		onModifyDef(def, pokemon) {
			if (pokemon.hp < pokemon.maxhp / 2) return this.chainModify(0.5);
			return this.chainModify(2);
		},
		onModifySpDPriority: 6,
		onModifySpD(spd, pokemon) {
			if (pokemon.hp < pokemon.maxhp / 2) return this.chainModify(0.5);
			return this.chainModify(2);
		},
		onDamagePriority: -30,
		onDamage(damage, target, source, effect) {
			if (target.hp >= target.maxhp / 2 && damage >= target.hp && effect &&
				effect.effectType === 'Move' && source !== target) {
				this.add('-ability', target, 'Adaptive Fighter');
				this.add('-message', `${target.name} endured the attack!`);
				return target.hp - 1;
			}
		},
		// The variable handling in onAnyModifyBoost is a little confusing, so here's clarification for any readers.
		// 'abilityHolder' is the user with Adaptive Fighter; 'pokemon' is the foe.
		onAnyModifyBoost(boosts, pokemon) {
			const abilityHolder = this.effectState.target;
			if (abilityHolder === pokemon) return;
			// If the foe is the one being attacked, ignore their defense boosts.
			if (abilityHolder === this.activePokemon && pokemon === this.activeTarget && abilityHolder.hp < abilityHolder.maxhp / 2) {
				boosts['def'] = 0;
				boosts['spd'] = 0;
			}
			// If the user is the one being attacked, ignore their attack boosts.
			if (pokemon === this.activePokemon && abilityHolder === this.activeTarget && abilityHolder.hp >= abilityHolder.maxhp / 2) {
				boosts['atk'] = 0;
				boosts['spa'] = 0;
			}
		},
	},
	// Lyssa
	risinganger: {
		name: "Rising Anger",
		gen: 9,
		desc: "This Pokemon's Attack increases by 1 stage whenever it is damaged by an attacking move. This Pokemon takes halved damage when at full HP. After taking 2 hits, transforms into Annihilape. After taking 4 hits, Endure becomes Rage Fist with 1 PP. After taking 6 hits. Rage Fist's PP is restored. Attacks recover 1/3 of damage dealt as Annihilape.",
		shortDesc: "Damaged: +1 ATK; Multiscale; Varying effects as damage is taken.",
		onStart(pokemon) {
			if (!pokemon.abilityState.hits) pokemon.abilityState.hits = 0;
			if (pokemon.abilityState.transformed && pokemon.species.id !== 'annihilape') pokemon.formeChange('Annihilape');
		},
		onUpdate(pokemon) {
			if (pokemon.abilityState.hits >= 2 && !pokemon.abilityState.transformed) pokemon.abilityState.transformed = true;
			if (pokemon.abilityState.transformed && pokemon.species.id !== 'annihilape') pokemon.formeChange('Annihilape');
			if (pokemon.abilityState.hits >= 4 && pokemon.hasMove('endure')) {
				const slot = pokemon.moves.indexOf('endure');
				const move = this.dex.moves.get('ragefist');
				const newSlot = {
					move: move.name,
					id: move.id,
					pp: 1,
					maxpp: 1,
					target: move.target,
					disabled: false,
					used: false,
				};
				pokemon.moveSlots[slot] = newSlot;
				pokemon.baseMoveSlots[slot] = newSlot;
			}
			if (pokemon.abilityState.hits >= 6 && !pokemon.abilityState.restoreTriggered) {
				const rf = pokemon.moveSlots.find(move => move.id === 'ragefist');
				if (rf) {
					rf.pp = 1;
					this.add('-message', `Rising Anger restored Rage Fist's PP!`);
					pokemon.abilityState.restoreTriggered = true;
				}
			}
		},
		onModifyMove(move, pokemon) {
			if (pokemon.species.id === 'annihilape' && !move.drain) {
				move.drain = [1, 3];
			}
		},
		onSourceModifyDamage(damage, source, target, move) {
			if (target.hp >= target.maxhp) {
				this.debug('Rising Anger halving damage');
				return this.chainModify(0.5);
			}
		},
		onHit(target, source, move) {
			if (!target.hp) return;
			if (move?.effectType === 'Move' && source !== target) {
				target.abilityState.hits++;
				this.boost({ atk: 1 }, target, target);
			}
		},
	},
	// Mink
	sickeningstench: {
		name: "Sickening Stench",
		gen: 9,
		flags: {},
		desc: "The accuracy and power of attacks used against the user is 0.9x. Prevents other active Pokemon from eating their items.",
		shortDesc: "Attacks on user have 0.9x BP/ACC. Active Pokemon cannot eat.",
		onUpdate(pokemon) {
			for (const target of this.getAllActive()) {
				if (pokemon === target) continue;
				if (!target.volatiles['sickeningstench']) target.addVolatile('sickeningstench');
			}
		},
		onTryHit(pokemon, target, move) {
			if (pokemon === target || !target || !move) return;
			if (move.basePower) {
				this.debug('sickening stench BP debuff');
				move.basePower *= 0.9;
			}
			if (move.accuracy !== true) {
				this.debug('sickening stench accuracy debuff');
				move.accuracy *= 0.9;
			}
		},
		onEnd(pokemon) {
			for (const target of this.getAllActive()) {
				if (pokemon === target) continue;
				if (target.volatiles['sickeningstench']) target.removeVolatile('sickeningstench');
			}
		},
		condition: {
			onTryEatItem(item, pokemon) {
				this.add('-message', `${pokemon.name} couldn't eat because of the Sickening Stench!`);
				return null;
			},
		},
	},
	// Cinque
	cheerleader: {
		name: "Cheerleader",
		gen: 9,
		flags: {},
		shortDesc: "-Flinch/Par/Frz/Slp/Cnf; Multiscale; +1 crit if attacked.",
		desc: "Prevents Flinching, Paralysis, Freeze, Sleep, and Confusion. Whenever this Pokemon is damaged by an attacking move, its crit ratio is raised by 1.",
		onStart() {
			this.effectState.attacksTaken = 0;
		},
		onModifyAtk(atk, pokemon) {
			if (!pokemon.abilityState.homerun) return;
			return this.chainModify(1.5);
		},
		onModifyDef(def, pokemon) {
			if (!pokemon.abilityState.homerun) return;
			return this.chainModify(1.5);
		},
		onModifySpD(spd, pokemon) {
			if (!pokemon.abilityState.homerun) return;
			return this.chainModify(1.5);
		},
		onModifySTAB(stab, source, target, move) {
			if (!source.abilityState.homerun) return;
			if (move.forceSTAB || source.hasType(move.type)) {
				if (stab === 2) {
					return 2.25;
				}
				return 2;
			}
		},
		onSourceModifyDamage(damage, source, target, move) {
			if (target.hp >= target.maxhp) {
				this.debug('Cheerleader weaken');
				return this.chainModify(0.5);
			}
		},
		onTryAddVolatile(status, pokemon) {
			if (['flinch', 'confusion', 'yawn'].includes(status.id)) {
				this.add('-immune', pokemon, '[from] ability: Cheerleader');
				return null;
			}
		},
		onUpdate(pokemon) {
			if (['slp', 'frz', 'par'].includes(pokemon.status)) {
				this.add('-activate', pokemon, 'ability: Cheerleader');
				pokemon.cureStatus();
			}
			if (pokemon.volatiles['confusion']) {
				this.add('-activate', pokemon, 'ability: Cheerleader');
				pokemon.removeVolatile('confusion');
			}
		},
		onSetStatus(status, target, source, effect) {
			if (['slp', 'par', 'frz'].includes(status.id)) {
				this.add('-immune', target, '[from] ability: Cheerleader');
				return false;
			}
		},
		onDamagingHit(damage, target, source, move) {
			if (move && damage && target !== source) this.effectState.attacksTaken++;
		},
		onModifyCritRatio(critRatio, pokemon) {
			if (!this.effectState.attacksTaken) return;
			return critRatio + this.effectState.attacksTaken;
		},
	},
	// Marvin
	murderousmimic: {
		name: "Murderous Mimic",
		gen: 9,
		flags: {},
		shortDesc: "Transforms into an ally of choice when using Mimic.",
		onModifyMove(move, pokemon) {
			if (move.id === 'mimic') {
				move.onAfterMove = function (p, t, m) {
					this.add('-activate', p, 'ability: Murderous Mimic');
					p.side.addSlotCondition(p, 'mimic');
					p.switchFlag = true;
				};
			}
		},
		onSwitchOut(pokemon) {
			if (pokemon.species.name !== 'Darmanitan-Galar-Zen') changeSet(this, pokemon, ssbSets['Marvin'], true);
		},
	},
	// Tao
	shangqing: {
		name: "Shangqing",
		gen: 9,
		flags: {},
		desc: "This Pokemon is permanently tormented, and its Fighting-type moves can hit Ghost-type Pokemon for neutral damage. Whenever this Pokemon lands a critical hit, it immediately uses Ziran. This Pokemon's attacks that would KO, barring Ziran, instead leave the foe at 1 HP, paralyzed, and forces them to switch.",
		shortDesc: "Torment; Fighting hits Ghost; Crit: Ziran.",
		onUpdate(pokemon) {
			for (const target of pokemon.foes()) {
				if (!target.volatiles['shangqing']) target.addVolatile('shangqing');
			}
			if (!pokemon.volatiles['torment']) {
				this.add('-activate', pokemon, 'Shangqing');
				pokemon.addVolatile('torment');
			}
		},
		onResidual(pokemon) {
			this.effectState.ziranUsed = false;
			if (pokemon.volatiles['torment']) {
				pokemon.volatiles['torment'].duration++;
			}
			for (const target of this.getAllActive()) {
				if (target.abilityState.eotSwitch) {
					target.abilityState.eotSwitch = false;
					target.forceSwitchFlag = true;
				}
			}
		},
		onModifyDamage(damage, source, target, move) {
			if (move.id !== 'ziran' && damage >= target.hp) {
				this.effectState.koTrigger = true;
				return target.hp - 1;
			}
		},
		onAfterMoveSecondarySelf(source, target, move) {
			if (this.effectState.koTrigger) {
				target.trySetStatus('par', source);
				target.abilityState.eotSwitch = true;
				this.effectState.koTrigger = false;
			}
			if (target.getMoveHitData(move).crit && !this.effectState.ziranUsed) {
				this.effectState.ziranUsed = true;
				this.actions.useMove('Ziran', source, target);
			}
		},
		onSwitchOut(pokemon) {
			for (const target of pokemon.foes()) {
				if (target.volatiles['shangqing']) target.removeVolatile('shangqing');
			}
		},
		condition: {
			noCopy: true,
			onNegateImmunity(pokemon, type) {
				if (pokemon.hasType('Ghost') && ['Normal', 'Fighting'].includes(type)) return false;
			},
			onSwitchOut(pokemon) {
				pokemon.removeVolatile('shangqing');
			},
		},
	},
	// Flufi
	forceofwill: {
		name: "Force of Will",
		gen: 9,
		flags: {},
		shortDesc: "Survives a KO attack with 1 HP. Moves have 1.33x/2x power.",
		desc: "If this Pokemon would be knocked out by an attack, it survives at 1 HP. Once per battle. This Pokemon's moves have 1.33x power, or 2x power if this Pokemon has 1 HP remaining.",
		onDamage(damage, target, source, effect) {
			if (damage >= target.hp && effect && effect.effectType === 'Move' && !target.abilityState.forceActivated) {
				target.abilityState.forceActivated = true;
				this.add('-ability', target, 'Force of Will');
				this.add('-anim', target, 'Inferno', target);
				this.add('-message', `${target.name} isn't backing down!`);
				return target.hp - 1;
			}
		},
		onBasePowerPriority: 21,
		onBasePower(basePower, pokemon, target, move) {
			if (pokemon.hp === 1) {
				return this.chainModify(2);
			} else {
				return this.chainModify(1.33);
			}
		},
	},
	// Saint Deli
	generosity: {
		name: "Generosity",
		gen: 9,
		flags: {},
		desc: "Ice/Water; Present becomes Ice-type/Special + Gives Charcoal; Life Dew heals unfainted party members 1/4 max HP; On switch out, summons Lucky Chant and cures allies of all status conditions. Upon fainting, summons Revival Blessing and grants permanent Helping Hand to all party members.",
		shortDesc: "See '/ssb Saint Deli' for more!",
		onStart(pokemon) {
			if (pokemon.baseSpecies.baseSpecies === 'Delibird' && pokemon.setType(['Ice', 'Water'])) {
				this.add('-start', pokemon, 'typechange', 'Ice/Water', '[from] ability: Generosity');
			}
		},
		onUpdate(pokemon) {
			const target = pokemon.side.foe.active[pokemon.side.foe.active.length - 1 - pokemon.position];
			if (this.effectState.revivalBlessing && !pokemon.abilityState.rbProc) {
				pokemon.abilityState.rbProc = true;
				this.effectState.revivalBlessing = false;
				this.effectState.killMe = true;
				this.actions.useMove('Revival Blessing', pokemon);
			}
		},
		onResidual(pokemon) {
			if (this.effectState.killMe) pokemon.faint();
		},
		onModifyMove(move, pokemon) {
			if (move.id === 'present') {
				move.type = 'Ice';
				move.category = 'Special';
				move.onHit = function (t, s, m) {
					const success = t.takeItem();
					const newItem = this.dex.items.get('charcoal')
					if (!success) return;
					t.item = newItem.id;
					t.setItem(newItem);
					this.add('-item', t, newItem, '[from] move: Present');
				};
			}
			if (move.id === 'lifedew') {
				move.onAfterMoveSecondarySelf = function (p, t, m) {
					for (const ally of p.side.pokemon) {
						if (ally === p) continue;
						if (!ally.hp || ally.hp >= ally.maxhp) continue;
						if (ally.isActive) {
							this.heal(ally.maxhp / 4, ally, s, this.effect);
						} else {
							ally.hp += ally.maxhp / 4;
							this.add('-heal', ally, ally.getHealth);
						}
					}
				};
			}
		},
		onSwitchOut(pokemon) {
			this.add('-activate', pokemon, 'ability: Generosity');
			pokemon.side.addSideCondition('luckychant');
			let success = false;
			const allies = [...pokemon.side.pokemon, ...pokemon.side.allySide?.pokemon || []];
			for (const ally of allies) {
				if (ally.status) ally.cureStatus();
			}
		},
		onDamage(damage, target, source, effect) {
			if (effect?.effectType === 'Move' && target !== source && damage >= target.hp) {
				const move = this.dex.moves.get(effect.id);
				if (move.category === 'Special' && target.abilityState.sack) {
					// Using this to escape from onDamage if being hit in a scenario
					// where Gift Sack will activate. Without this, Generosity will
					// see incoming damage, trigger Revival Blessing, then no damage
					// will be taken due to Gift Sack, giving you a free Revival Blessing.
					if (target.abilityState.sack.length < 3) return;
				}
				this.add('-activate', target, 'ability: Generosity');
				this.effectState.revivalBlessing = true;
				return target.hp - 1;
			}
		},
		onTryHit(target, source, move) {
			// @ts-ignore
			const damage = this.actions.getDamage(source, target, move);
			if (!damage) return;
			if (move.category === 'Special' && target.abilityState.sack) {
				// Break from onTryHit if the target has Gift Sack and if it has less than 3 moves in it.
				// This is because the Gift Sack will absorb the move and nullify damage, meaning we
				// do not want Revival Blessing to happen.
				if (target.abilityState.sack.length < 3) return;
			}
			if (damage >= target.hp) {
				this.add('-activate', target, 'ability: Generosity');
				this.add('-anim', target, 'Confuse Ray', target);
			}
		},
		onFaint(pokemon) {
			pokemon.side.hhBoost = true;
		},
	},
	// Gadget
	cashgrab: {
		name: "Cash Grab",
		desc: "Whenever this Pokemon uses Pay Day or Stockpile, it collects a random number of coins, ranging from 0 to 3x the number of times Pay Day and Stockpile have been used this battle. This Pokemon's weight is multiplied by the number of coins stored.",
		shortDesc: "Pay Day/Stockpile: Collects coins. Weight scales with coins.",
		gen: 9,
		flags: {},
		onStart(pokemon) {
			if (!pokemon.abilityState.coins) pokemon.abilityState.coins = 0;
			this.effectState.coins = pokemon.abilityState.coins;
		},
		onResidual(pokemon) {
			if (!pokemon.abilityState.coins) pokemon.abilityState.coins = 0;
			if (pokemon.abilityState.coins === 0) {
				this.add('-message', `${pokemon.name} boasts... no coins?!`);
				this.add('-anim', pokemon, 'Splash', pokemon);
				this.add('-message', 'Aw, man!');
			} else {
				this.add('-anim', pokemon, 'Taunt', pokemon);
				if (pokemon.abilityState.coins === 1) {
					this.add('-message', `${pokemon.name} boasts one coin!`);
				} else {
					this.add('-message', `${pokemon.name} boasts ${pokemon.abilityState.coins} coins!`);
				}
			}
		},
		onUpdate(pokemon) {
			if (!pokemon.abilityState.coins) pokemon.abilityState.coins = 0;
			this.effectState.coins = pokemon.abilityState.coins;
		},
		onModifyWeight(weighthg) {
			return weighthg * this.effectState.coins;
		},
		onAfterMoveSecondarySelf(source, target, move) {
			if (['payday', 'stockpile'].includes(move.id)) {
				this.add('-activate', source, 'ability: Cash Grab');
				if (!source.abilityState.coins) source.abilityState.coins = 0;
				if (!source.abilityState.pdTriggers) source.abilityState.pdTriggers = 0;
				source.abilityState.pdTriggers++;
				const gain = this.random((source.abilityState.pdTriggers * 3) + 1);
				if (!gain) return;
				this.add('-anim', source, 'Pay Day', source);
				this.add('-anim', source, 'Tickle', source);
				source.abilityState.coins += gain;
			}
		},
	},
	// Rooci Caxa
	horrorsoftheforest: {
		name: "Horrors of the Forest",
		gen: 9,
		shortDesc: "Harvest (100% in Grassy Terrain) + Flash Fire.",
		desc: "At the end of each turn, if this Pokemon has no held item, and its last held item was a berry, 50% chance to recover previous held item. 100% chance in Grassy Terrain. This Pokemon's Fire-type attacks do x1.5 damage after being hit by a Fire move; Fire immunity.",
		flags: {},
		onStart(pokemon) {
			this.field.setTerrain('grassyterrain');
		},
		onResidualOrder: 28,
		onResidualSubOrder: 2,
		onResidual(pokemon) {
			if (this.field.isTerrain('grassyterrain') || this.randomChance(1, 2)) {
				if (pokemon.hp && !pokemon.item && this.dex.items.get(pokemon.lastItem).isBerry) {
					pokemon.setItem(pokemon.lastItem);
					pokemon.lastItem = '';
					this.add('-item', pokemon, pokemon.getItem(), '[from] ability: Horrors of the Forest');
				}
			}
		},
		onTryHit(target, source, move) {
			if (target !== source && move.type === 'Fire') {
				move.accuracy = true;
				if (!target.addVolatile('horrorsoftheforest')) {
					this.add('-immune', target, '[from] ability: Horrors of the Forest');
				}
				if (target.addType('Fire')) {
					this.add('-start', target, 'typeadd', 'Fire', '[from] ability: Horrors of the Forest');
				}
				return null;
			}
		},
		onEnd(pokemon) {
			pokemon.removeVolatile('horrorsoftheforest');
		},
		condition: {
			noCopy: true,
			onStart(target) {
				this.add('-start', target, 'ability: Horrors of the Forest');
			},
			onModifyAtkPriority: 5,
			onModifyAtk(atk, attacker, defender, move) {
				if (move.type === 'Fire') {
					this.debug('HOTF fire boost');
					return this.chainModify(1.5);
				}
			},
			onModifySpAPriority: 5,
			onModifySpA(atk, attacker, defender, move) {
				if (move.type === 'Fire') {
					this.debug('HOTF fire boost');
					return this.chainModify(1.5);
				}
			},
			onEnd(target) {
				this.add('-end', target, 'ability: Horrors of the Forest', '[silent]');
			},
		},
	},
	// Aevum
	temporaldomain: {
		name: "Temporal Domain",
		desc: "On switch-in, this Pokemon summons Temporal Terrain for 5 turns. Lasts for 8 turns if the user is holding a Terrain Extender.",
		shortDesc: "On switch-in, this Pokemon summons Temporal Terrain.",
		gen: 9,
		flags: {},
		onStart(pokemon) {
			this.field.setTerrain('temporalterrain');
		}
	},
	// Kusanali
	onallthingsmeditated: {
		name: "On All Things Meditated",
		gen: 9,
		shortDesc: "On switch-in, this Pokemon summons Court of Dreams.",
		flags: {},
		onStart(pokemon) {
			this.add('-activate', pokemon, '[from] ability: On All Things Meditated');
			pokemon.side.addSideCondition('courtofdreams');
		},
	},
	// Genus
	luckycharm: {
		name: "Lucky Charm",
		gen: 9,
		flags: {},
		onStart(pokemon) {
			if (pokemon.abilityState.charmBoost) pokemon.abilityState.charmBoost = false;
			let statsN = ['HP', 'Attack', 'Defense', 'Special Attack', 'Special Defense', 'Speed'];
			let stats = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
			let boostedStat = this.sample(stats);
			pokemon.abilityState.charmBoost = boostedStat;
			switch (boostedStat) {
				case 'hp':
					pokemon.hp *= 1.5;
					pokemon.maxhp *= 1.5;
					this.add('-heal', pokemon, pokemon.getHealth, '[silent]');
					break;
				case 'atk':
				case 'def':
				case 'spa':
				case 'spd':
				case 'spe':
					pokemon.storedStats[boostedStat] *= 1.5;
					break;
			}
			boostedStat = statsN[stats.indexOf(boostedStat)];
			this.add('-activate', pokemon, 'ability: Lucky Charm');
			this.add('-message', `Lucky Charm boosted ${pokemon.name}'s ${boostedStat}!`);
		},
		onUpdate(pokemon) {
			if (pokemon.volatiles['taunt']) {
				this.add('-activate', pokemon, 'ability: Lucky Charm');
				pokemon.removeVolatile('taunt');
			}
		},
		onTryHit(pokemon, target, move) {
			if (move.id === 'taunt') {
				this.add('-immune', pokemon, '[from] ability: Lucky Charm');
				return null;
			}
		},
	},
	// Castaways
	tumultuoustrio: {
		name: "Tumultuous Trio",
		gen: 9,
		flags: {},
		onResidual(pokemon) {
			switch (pokemon.species.id) {
				case 'swalot':
					this.add('-anim', pokemon, 'Razor Leaf', pokemon);
					this.damage(pokemon.maxhp / 10, pokemon);
					pokemon.formeChange('Carnivine');
					pokemon.set.evs = { hp: 248, atk: 56, def: 204, spa: 0, spd: 0, spe: 0 };
					pokemon.set.nature = 'Relaxed';
					break;
				case 'carnivine':
					this.add('-anim', pokemon, 'Flash Cannon', pokemon);
					this.damage(pokemon.maxhp / 10, pokemon);
					pokemon.formeChange('Perrserker');
					pokemon.set.evs = { hp: 0, atk: 252, def: 4, spa: 0, spd: 0, spe: 252 };
					pokemon.set.nature = 'Naughty';
					break;
				case 'perrserker':
					this.add('-anim', pokemon, 'Mud Bomb', pokemon);
					this.damage(pokemon.maxhp / 10, pokemon);
					pokemon.formeChange('Swalot');
					pokemon.set.evs = { hp: 248, atk: 0, def: 104, spa: 0, spd: 156, spe: 0 };
					pokemon.set.nature = 'Careful';
					break;
			}
		},
	},
	// Morax
	heraldoforder: {
		name: "Herald of Order",
		gen: 9,
		flags: {},
		shortDesc: "See '/ssb Morax' for more!",
		onModifyMove(move, pokemon) {
			if (move.category !== 'Status' && move.target !== 'allAdjacent') move.target = 'allAdjacent';
		},
	},
	// Toshinori
	oneforall: {
		name: "One for All",
		gen: 9,
		flags: {},
		shortDesc: "See '/ssb Toshinori' for more!",
		onModifyMove(move, pokemon) {
			let statName = [];
			let statNum = [];
			for (const stat of pokemon.storedStats) {
				statName.push(stat);
				statNum.push(pokemon.storedStats[stat]);
			}
			let highStat = Math.max(statNum);
			let pos = statNum.indexOf(Math.max(statNum));
			this.add('-message', stats);
			this.add('-message', `highest stat is ${statName[pos]}: ${Math.max}`);
			//move.overrideOffensiveStat
		},
	},
	// Ingrid
	caliberconversion: {
		name: "Caliber Conversion",
		gen: 9,
		shortDesc: "If Doublade, changes between 1st/2nd Caliber each turn.",
		flags: {},
		onStart(pokemon) {
			pokemon.abilityState.caliber = 1;
			if (pokemon.hp > pokemon.maxhp / 3) {
				this.add('-anim', pokemon, 'Swords Dance', pokemon);
				this.add('-anim', pokemon, 'Secret Sword', pokemon);
				this.add('-message', `${pokemon.name} is prepared for battle!`);
			} else if (pokemon.hp <= pokemon.maxhp / 3) {
				this.add('-anim', pokemon, 'Hex', pokemon);
				this.add('-anim', pokemon, 'Swords Dance', pokemon);
				if (this.randomChance(1, 3)) {
					this.add('-message', `${pokemon.name} can't hold on much longer!`);
				} else {
					if (this.randomChance(1, 2)) {
						this.add('-message', `${pokemon.name} is losing hope!`);
					} else {
						this.add('-message', `${pokemon.name} won't give in!`);
					}
				}
			}
		},
		onResidual(pokemon) {
			if (pokemon.abilityState.caliber === 1) {
				pokemon.abilityState.caliber = 2;
				this.add('-message', `${pokemon.name} converted to Second Caliber!`);
				pokemon.set.shiny = true;
				const details = pokemon.species.name + (pokemon.level === 100 ? '' : ', L' + pokemon.level) +
					(pokemon.gender === '' ? '' : ', ' + pokemon.gender) + (pokemon.set.shiny ? ', shiny' : '');
				pokemon.details = details;
				this.add('replace', pokemon, details);
				const newMoves = ['Smart Strike', 'Counter', 'Detect', 'Impaling Thrust'];
				let index = 0;
				for (const move of newMoves) {
					const moveData = this.dex.moves.get(move);
					const moveFill = {
						move: moveData.name,
						id: moveData.id,
						pp: (moveData.noPPBoosts || moveData.isZ) ? moveData.pp : moveData.pp * 8 / 5,
						maxpp: (moveData.noPPBoosts || moveData.isZ) ? moveData.pp : moveData.pp * 8 / 5,
						target: moveData.target,
						disabled: false,
						used: false,
					};
					pokemon.moveSlots[index] = moveFill;
					pokemon.baseMoveSlots[index] = moveFill;
					index++;
				}
			} else if (pokemon.abilityState.caliber === 2) {
				pokemon.abilityState.caliber = 1;
				this.add('-message', `${pokemon.name} converted to First Caliber!`);
				pokemon.set.shiny = false;
				const details = pokemon.species.name + (pokemon.level === 100 ? '' : ', L' + pokemon.level) +
					(pokemon.gender === '' ? '' : ', ' + pokemon.gender) + (pokemon.set.shiny ? ', shiny' : '');
				pokemon.details = details;
				this.add('replace', pokemon, details);
				const newMoves = ['Smart Strike', 'Sacred Sword', 'Acrobatics', 'Equip Spectre'];
				for (const move of newMoves) {
					const moveData = this.dex.moves.get(move);
					const moveFill = {
						move: moveData.name,
						id: moveData.id,
						pp: (moveData.noPPBoosts || moveData.isZ) ? moveData.pp : moveData.pp * 8 / 5,
						maxpp: (moveData.noPPBoosts || moveData.isZ) ? moveData.pp : moveData.pp * 8 / 5,
						target: moveData.target,
						disabled: false,
						used: false,
					};
					pokemon.moveSlots[index] = moveFill;
					pokemon.baseMoveSlots[index] = moveFill;
					index++;
				}
			}
		},
	},
	// Varnava
	celldeconstruct: {
		name: "Cell Deconstruct",
		shortDesc: "See '/ssb Varnava' for more!",
		gen: 9,
		flags: {},
		onModifyMove(move, pokemon) {
			if (move.id === 'coreenforcer') move.category = 'Physical';
			if (['zygarde', 'zygardecomplete'].includes(pokemon.species.id) &&
				!move.multihit && move.category !== 'Status'
			) move.multihit = 2;
		},
		onBasePower(basePower, pokemon, target, move) {
			if (move.hit === 2) {
				if (pokemon.species.id === 'zygardecomplete') return basePower / 2;
				if (pokemon.species.id === 'zygarde') return basePower / 4;
				return;
			}
		},
		onDamage(damage, target, source, effect) {
			// If current HP is more than 50%...
			if (target.hp > target.maxhp / 2) {
				// Do not cap at half HP if HP was already capped at half this battle, OR if species is not Complete
				// Damage should only cap at half HP when transforming from Complete to Zygarde-50
				if (target.abilityState.halfCapped || target.species.id !== 'zygardecomplete') return;
				if (target.hp - damage < target.maxhp / 2) {
					target.abilityState.halfCapped = true;
					return target.hp - target.maxhp / 2;
				}
			}
			// If current HP is between 25% and 49%...
			if (target.hp <= target.maxhp / 2 && target.hp > target.maxhp / 4) {
				// Do not cap at 1/4 HP if HP was already capped at 1/4 this battle, OR if species is not Zygarde-50
				// Damage should only cap at 1/4 HP when transforming from Zygarde-50 to Zygarde-10
				if (target.abilityState.quarterCapped || target.species.id !== 'zygarde') return;
				if (target.hp - damage < target.maxhp / 4) {
					target.abilityState.quarterCapped = true;
					return target.hp - target.maxhp / 4;
				}
			}
		},
		onUpdate(pokemon) {
			if (pokemon.hp <= pokemon.maxhp / 2 && pokemon.hp > pokemon.maxhp / 4 && pokemon.species.id !== 'zygarde') {
				if (pokemon.abilityState.transformed50) return;
				this.add('-activate', pokemon, 'ability: Cell Deconstruct');
				changeSet(this, pokemon, ssbSets['Varnava-50'], true);
				pokemon.abilityState.transformed50 = true;
			} else if (pokemon.hp <= pokemon.maxhp / 4 && pokemon.species.id !== 'zygarde10') {
				if (pokemon.abilityState.transformed10) return;
				this.add('-activate', pokemon, 'ability: Cell Deconstruct');
				changeSet(this, pokemon, ssbSets['Varnava-25'], true);
				pokemon.abilityState.transformed10 = true;
			}
		},
	},
	// Suika Ibuki
	densitymanipulation: {
		desc: "This Pokemon sets a Substitute and loses 33% of their max HP upon switching in.",
		shortDesc: "Switch-in: -33% HP, sets Substitute.",
		onSwitchIn(pokemon) {
			if (pokemon.hp > pokemon.maxhp / 3) {
				this.add('-activate', pokemon, 'Density Manipulation');
				pokemon.addVolatile('substitute');
				pokemon.volatiles['substitute'].hp = 1;
				this.directDamage(pokemon.maxhp / 3, pokemon);
			}
		},
		flags: {},
		name: "Density Manipulation",
		gen: 9,
	},
	// Journeyman
	loveofthejourney: {
		name: "Love of the Journey",
		gen: 9,
		onStart(pokemon) {
			if (!pokemon.abilityState.started) {
				this.add(`raw|<b>${pokemon.name}</b>!<br>Your journey starts here!<br>Good luck!`);
				this.add('-anim', pokemon, 'Splash', pokemon);
				pokemon.abilityState.started = true;
			}
		},
		onFaint(pokemon) {
			this.add('-message', `Your journey ends here!`);
			this.add('-message', `Goodbye, ${pokemon.name}!`);
		},
		onResidual(pokemon) {
			const tiles = ['movetutor', 'trap', 'rest', 'weather'];
			const r = this.sample(tiles);
			switch (r) {
				case 'movetutor':
					const tutorNames = ["Aaran", "Aaren", "Aarez", "Aarman", "Aaron", "Aaron-James", "Aarron", "Aaryan", "Aaryn", "Aayan", "Aazaan", "Abaan", "Abbas", "Abdallah", "Abdalroof", "Abdihakim", "Abdirahman", "Abdisalam", "Abdul", "Abdul-Aziz", "Abdulbasir", "Abdulkadir", "Abdulkarem", "Abdulkhader", "Abdullah", "Abdul-Majeed", "Abdulmalik", "Abdul-Rehman", "Abdur", "Abdurraheem", "Abdur-Rahman", "Abdur-Rehmaan", "Abel", "Abhinav", "Abhisumant", "Abid", "Abir", "Abraham", "Abu", "Abubakar", "Ace", "Adain", "Adam", "Adam-James", "Addison", "Addisson", "Adegbola", "Adegbolahan", "Aden", "Adenn", "Adie", "Adil", "Aditya", "Adnan", "Adrian", "Adrien", "Aedan", "Aedin", "Aedyn", "Aeron", "Afonso", "Ahmad", "Ahmed", "Ahmed-Aziz", "Ahoua", "Ahtasham", "Aiadan", "Aidan", "Aiden", "Aiden-Jack", "Aiden-Vee", "Aidian", "Aidy", "Ailin", "Aiman", "Ainsley", "Ainslie", "Airen", "Airidas", "Airlie", "AJ", "Ajay", "A-Jay", "Ajayraj", "Akan", "Akram", "Al", "Ala", "Alan", "Alanas", "Alasdair", "Alastair", "Alber", "Albert", "Albie", "Aldred", "Alec", "Aled", "Aleem", "Aleksandar", "Aleksander", "Aleksandr", "Aleksandrs", "Alekzander", "Alessandro", "Alessio", "Alex", "Alexander", "Alexei", "Alexx", "Alexzander", "Alf", "Alfee", "Alfie", "Alfred", "Alfy", "Alhaji", "Al-Hassan", "Ali", "Aliekber", "Alieu", "Alihaider", "Alisdair", "Alishan", "Alistair", "Alistar", "Alister", "Aliyaan", "Allan", "Allan-Laiton", "Allen", "Allesandro", "Allister", "Ally", "Alphonse", "Altyiab", "Alum", "Alvern", "Alvin", "Alyas", "Amaan", "Aman", "Amani", "Ambanimoh", "Ameer", "Amgad", "Ami", "Amin", "Amir", "Ammaar", "Ammar", "Ammer", "Amolpreet", "Amos", "Amrinder", "Amrit", "Amro", "Anay", "Andrea", "Andreas", "Andrei", "Andrejs", "Andrew", "Andy", "Anees", "Anesu", "Angel", "Angelo", "Angus", "Anir", "Anis", "Anish", "Anmolpreet", "Annan", "Anndra", "Anselm", "Anthony", "Anthony-John", "Antoine", "Anton", "Antoni", "Antonio", "Antony", "Antonyo", "Anubhav", "Aodhan", "Aon", "Aonghus", "Apisai", "Arafat", "Aran", "Arandeep", "Arann", "Aray", "Arayan", "Archibald", "Archie", "Arda", "Ardal", "Ardeshir", "Areeb", "Areez", "Aref", "Arfin", "Argyle", "Argyll", "Ari", "Aria", "Arian", "Arihant", "Aristomenis", "Aristotelis", "Arjuna", "Arlo", "Armaan", "Arman", "Armen", "Arnab", "Arnav", "Arnold", "Aron", "Aronas", "Arran", "Arrham", "Arron", "Arryn", "Arsalan", "Artem", "Arthur", "Artur", "Arturo", "Arun", "Arunas", "Arved", "Arya", "Aryan", "Aryankhan", "Aryian", "Aryn", "Asa", "Asfhan", "Ash", "Ashlee-jay", "Ashley", "Ashton", "Ashton-Lloyd", "Ashtyn", "Ashwin", "Asif", "Asim", "Aslam", "Asrar", "Ata", "Atal", "Atapattu", "Ateeq", "Athol", "Athon", "Athos-Carlos", "Atli", "Atom", "Attila", "Aulay", "Aun", "Austen", "Austin", "Avani", "Averon", "Avi", "Avinash", "Avraham", "Awais", "Awwal", "Axel", "Ayaan", "Ayan", "Aydan", "Ayden", "Aydin", "Aydon", "Ayman", "Ayomide", "Ayren", "Ayrton", "Aytug", "Ayub", "Ayyub", "Azaan", "Azedine", "Azeem", "Azim", "Aziz", "Azlan", "Azzam", "Azzedine", "Babatunmise", "Babur", "Bader", "Badr", "Badsha", "Bailee", "Bailey", "Bailie", "Bailley", "Baillie", "Baley", "Balian", "Banan", "Barath", "Barkley", "Barney", "Baron", "Barrie", "Barry", "Bartlomiej", "Bartosz", "Basher", "Basile", "Baxter", "Baye", "Bayley", "Beau", "Beinn", "Bekim", "Believe", "Ben", "Bendeguz", "Benedict", "Benjamin", "Benjamyn", "Benji", "Benn", "Bennett", "Benny", "Benoit", "Bentley", "Berkay", "Bernard", "Bertie", "Bevin", "Bezalel", "Bhaaldeen", "Bharath", "Bilal", "Bill", "Billy", "Binod", "Bjorn", "Blaike", "Blaine", "Blair", "Blaire", "Blake", "Blazej", "Blazey", "Blessing", "Blue", "Blyth", "Bo", "Boab", "Bob", "Bobby", "Bobby-Lee", "Bodhan", "Boedyn", "Bogdan", "Bohbi", "Bony", "Bowen", "Bowie", "Boyd", "Bracken", "Brad", "Bradan", "Braden", "Bradley", "Bradlie", "Bradly", "Brady", "Bradyn", "Braeden", "Braiden", "Brajan", "Brandan", "Branden", "Brandon", "Brandonlee", "Brandon-Lee", "Brandyn", "Brannan", "Brayden", "Braydon", "Braydyn", "Breandan", "Brehme", "Brendan", "Brendon", "Brendyn", "Breogan", "Bret", "Brett", "Briaddon", "Brian", "Brodi", "Brodie", "Brody", "Brogan", "Broghan", "Brooke", "Brooklin", "Brooklyn", "Bruce", "Bruin", "Bruno", "Brunon", "Bryan", "Bryce", "Bryden", "Brydon", "Brydon-Craig", "Bryn", "Brynmor", "Bryson", "Buddy", "Bully", "Burak", "Burhan", "Butali", "Butchi", "Byron", "Cabhan", "Cadan", "Cade", "Caden", "Cadon", "Cadyn", "Caedan", "Caedyn", "Cael", "Caelan", "Caelen", "Caethan", "Cahl", "Cahlum", "Cai", "Caidan", "Caiden", "Caiden-Paul", "Caidyn", "Caie", "Cailaen", "Cailean", "Caileb-John", "Cailin", "Cain", "Caine", "Cairn", "Cal", "Calan", "Calder", "Cale", "Calean", "Caleb", "Calen", "Caley", "Calib", "Calin", "Callahan", "Callan", "Callan-Adam", "Calley", "Callie", "Callin", "Callum", "Callun", "Callyn", "Calum", "Calum-James", "Calvin", "Cambell", "Camerin", "Cameron", "Campbel", "Campbell", "Camron", "Caolain", "Caolan", "Carl", "Carlo", "Carlos", "Carrich", "Carrick", "Carson", "Carter", "Carwyn", "Casey", "Casper", "Cassy", "Cathal", "Cator", "Cavan", "Cayden", "Cayden-Robert", "Cayden-Tiamo", "Ceejay", "Ceilan", "Ceiran", "Ceirin", "Ceiron", "Cejay", "Celik", "Cephas", "Cesar", "Cesare", "Chad", "Chaitanya", "Chang-Ha", "Charles", "Charley", "Charlie", "Charly", "Chase", "Che", "Chester", "Chevy", "Chi", "Chibudom", "Chidera", "Chimsom", "Chin", "Chintu", "Chiqal", "Chiron", "Chris", "Chris-Daniel", "Chrismedi", "Christian", "Christie", "Christoph", "Christopher", "Christopher-Lee", "Christy", "Chu", "Chukwuemeka", "Cian", "Ciann", "Ciar", "Ciaran", "Ciarian", "Cieran", "Cillian", "Cillin", "Cinar", "CJ", "C-Jay", "Clark", "Clarke", "Clayton", "Clement", "Clifford", "Clyde", "Cobain", "Coban", "Coben", "Cobi", "Cobie", "Coby", "Codey", "Codi", "Codie", "Cody", "Cody-Lee", "Coel", "Cohan", "Cohen", "Colby", "Cole", "Colin", "Coll", "Colm", "Colt", "Colton", "Colum", "Colvin", "Comghan", "Conal", "Conall", "Conan", "Conar", "Conghaile", "Conlan", "Conley", "Conli", "Conlin", "Conlly", "Conlon", "Conlyn", "Connal", "Connall", "Connan", "Connar", "Connel", "Connell", "Conner", "Connolly", "Connor", "Connor-David", "Conor", "Conrad", "Cooper", "Copeland", "Coray", "Corben", "Corbin", "Corey", "Corey-James", "Corey-Jay", "Cori", "Corie", "Corin", "Cormac", "Cormack", "Cormak", "Corran", "Corrie", "Cory", "Cosmo", "Coupar", "Craig", "Craig-James", "Crawford", "Creag", "Crispin", "Cristian", "Crombie", "Cruiz", "Cruz", "Cuillin", "Cullen", "Cullin", "Curtis", "Cyrus", "Daanyaal", "Daegan", "Daegyu", "Dafydd", "Dagon", "Dailey", "Daimhin", "Daithi", "Dakota", "Daksh", "Dale", "Dalong", "Dalton", "Damian", "Damien", "Damon", "Dan", "Danar", "Dane", "Danial", "Daniel", "Daniele", "Daniel-James", "Daniels", "Daniil", "Danish", "Daniyal", "Danniel", "Danny", "Dante", "Danyal", "Danyil", "Danys", "Daood", "Dara", "Darach", "Daragh", "Darcy", "D'arcy", "Dareh", "Daren", "Darien", "Darius", "Darl", "Darn", "Darrach", "Darragh", "Darrel", "Darrell", "Darren", "Darrie", "Darrius", "Darroch", "Darryl", "Darryn", "Darwyn", "Daryl", "Daryn", "Daud", "Daumantas", "Davi", "David", "David-Jay", "David-Lee", "Davie", "Davis", "Davy", "Dawid", "Dawson", "Dawud", "Dayem", "Daymian", "Deacon", "Deagan", "Dean", "Deano", "Decklan", "Declain", "Declan", "Declyan", "Declyn", "Dedeniseoluwa", "Deecan", "Deegan", "Deelan", "Deklain-Jaimes", "Del", "Demetrius", "Denis", "Deniss", "Dennan", "Dennin", "Dennis", "Denny", "Dennys", "Denon", "Denton", "Denver", "Denzel", "Deon", "Derek", "Derick", "Derin", "Dermot", "Derren", "Derrie", "Derrin", "Derron", "Derry", "Derryn", "Deryn", "Deshawn", "Desmond", "Dev", "Devan", "Devin", "Devlin", "Devlyn", "Devon", "Devrin", "Devyn", "Dex", "Dexter", "Dhani", "Dharam", "Dhavid", "Dhyia", "Diarmaid", "Diarmid", "Diarmuid", "Didier", "Diego", "Diesel", "Diesil", "Digby", "Dilan", "Dilano", "Dillan", "Dillon", "Dilraj", "Dimitri", "Dinaras", "Dion", "Dissanayake", "Dmitri", "Doire", "Dolan", "Domanic", "Domenico", "Domhnall", "Dominic", "Dominick", "Dominik", "Donald", "Donnacha", "Donnie", "Dorian", "Dougal", "Douglas", "Dougray", "Drakeo", "Dre", "Dregan", "Drew", "Dugald", "Duncan", "Duriel", "Dustin", "Dylan", "Dylan-Jack", "Dylan-James", "Dylan-John", "Dylan-Patrick", "Dylin", "Dyllan", "Dyllan-James", "Dyllon", "Eadie", "Eagann", "Eamon", "Eamonn", "Eason", "Eassan", "Easton", "Ebow", "Ed", "Eddie", "Eden", "Ediomi", "Edison", "Eduardo", "Eduards", "Edward", "Edwin", "Edwyn", "Eesa", "Efan", "Efe", "Ege", "Ehsan", "Ehsen", "Eiddon", "Eidhan", "Eihli", "Eimantas", "Eisa", "Eli", "Elias", "Elijah", "Eliot", "Elisau", "Eljay", "Eljon", "Elliot", "Elliott", "Ellis", "Ellisandro", "Elshan", "Elvin", "Elyan", "Emanuel", "Emerson", "Emil", "Emile", "Emir", "Emlyn", "Emmanuel", "Emmet", "Eng", "Eniola", "Enis", "Ennis", "Enrico", "Enrique", "Enzo", "Eoghain", "Eoghan", "Eoin", "Eonan", "Erdehan", "Eren", "Erencem", "Eric", "Ericlee", "Erik", "Eriz", "Ernie-Jacks", "Eroni", "Eryk", "Eshan", "Essa", "Esteban", "Ethan", "Etienne", "Etinosa", "Euan", "Eugene", "Evan", "Evann", "Ewan", "Ewen", "Ewing", "Exodi", "Ezekiel", "Ezra", "Fabian", "Fahad", "Faheem", "Faisal", "Faizaan", "Famara", "Fares", "Farhaan", "Farhan", "Farren", "Farzad", "Fauzaan", "Favour", "Fawaz", "Fawkes", "Faysal", "Fearghus", "Feden", "Felix", "Fergal", "Fergie", "Fergus", "Ferre", "Fezaan", "Fiachra", "Fikret", "Filip", "Filippo", "Finan", "Findlay", "Findlay-James", "Findlie", "Finlay", "Finley", "Finn", "Finnan", "Finnean", "Finnen", "Finnlay", "Finnley", "Fintan", "Fionn", "Firaaz", "Fletcher", "Flint", "Florin", "Flyn", "Flynn", "Fodeba", "Folarinwa", "Forbes", "Forgan", "Forrest", "Fox", "Francesco", "Francis", "Francisco", "Franciszek", "Franco", "Frank", "Frankie", "Franklin", "Franko", "Fraser", "Frazer", "Fred", "Freddie", "Frederick", "Fruin", "Fyfe", "Fyn", "Fynlay", "Fynn", "Gabriel", "Gallagher", "Gareth", "Garren", "Garrett", "Garry", "Gary", "Gavin", "Gavin-Lee", "Gene", "Geoff", "Geoffrey", "Geomer", "Geordan", "Geordie", "George", "Georgia", "Georgy", "Gerard", "Ghyll", "Giacomo", "Gian", "Giancarlo", "Gianluca", "Gianmarco", "Gideon", "Gil", "Gio", "Girijan", "Girius", "Gjan", "Glascott", "Glen", "Glenn", "Gordon", "Grady", "Graeme", "Graham", "Grahame", "Grant", "Grayson", "Greg", "Gregor", "Gregory", "Greig", "Griffin", "Griffyn", "Grzegorz", "Guang", "Guerin", "Guillaume", "Gurardass", "Gurdeep", "Gursees", "Gurthar", "Gurveer", "Gurwinder", "Gus", "Gustav", "Guthrie", "Guy", "Gytis", "Habeeb", "Hadji", "Hadyn", "Hagun", "Haiden", "Haider", "Hamad", "Hamid", "Hamish", "Hamza", "Hamzah", "Han", "Hansen", "Hao", "Hareem", "Hari", "Harikrishna", "Haris", "Harish", "Harjeevan", "Harjyot", "Harlee", "Harleigh", "Harley", "Harman", "Harnek", "Harold", "Haroon", "Harper", "Harri", "Harrington", "Harris", "Harrison", "Harry", "Harvey", "Harvie", "Harvinder", "Hasan", "Haseeb", "Hashem", "Hashim", "Hassan", "Hassanali", "Hately", "Havila", "Hayden", "Haydn", "Haydon", "Haydyn", "Hcen", "Hector", "Heddle", "Heidar", "Heini", "Hendri", "Henri", "Henry", "Herbert", "Heyden", "Hiro", "Hirvaansh", "Hishaam", "Hogan", "Honey", "Hong", "Hope", "Hopkin", "Hosea", "Howard", "Howie", "Hristomir", "Hubert", "Hugh", "Hugo", "Humza", "Hunter", "Husnain", "Hussain", "Hussan", "Hussnain", "Hussnan", "Hyden", "I", "Iagan", "Iain", "Ian", "Ibraheem", "Ibrahim", "Idahosa", "Idrees", "Idris", "Iestyn", "Ieuan", "Igor", "Ihtisham", "Ijay", "Ikechukwu", "Ikemsinachukwu", "Ilyaas", "Ilyas", "Iman", "Immanuel", "Inan", "Indy", "Ines", "Innes", "Ioannis", "Ireayomide", "Ireoluwa", "Irvin", "Irvine", "Isa", "Isaa", "Isaac", "Isaiah", "Isak", "Isher", "Ishwar", "Isimeli", "Isira", "Ismaeel", "Ismail", "Israel", "Issiaka", "Ivan", "Ivar", "Izaak", "J", "Jaay", "Jac", "Jace", "Jack", "Jacki", "Jackie", "Jack-James", "Jackson", "Jacky", "Jacob", "Jacques", "Jad", "Jaden", "Jadon", "Jadyn", "Jae", "Jagat", "Jago", "Jaheim", "Jahid", "Jahy", "Jai", "Jaida", "Jaiden", "Jaidyn", "Jaii", "Jaime", "Jai-Rajaram", "Jaise", "Jak", "Jake", "Jakey", "Jakob", "Jaksyn", "Jakub", "Jamaal", "Jamal", "Jameel", "Jameil", "James", "James-Paul", "Jamey", "Jamie", "Jan", "Jaosha", "Jardine", "Jared", "Jarell", "Jarl", "Jarno", "Jarred", "Jarvi", "Jasey-Jay", "Jasim", "Jaskaran", "Jason", "Jasper", "Jaxon", "Jaxson", "Jay", "Jaydan", "Jayden", "Jayden-James", "Jayden-Lee", "Jayden-Paul", "Jayden-Thomas", "Jaydn", "Jaydon", "Jaydyn", "Jayhan", "Jay-Jay", "Jayke", "Jaymie", "Jayse", "Jayson", "Jaz", "Jazeb", "Jazib", "Jazz", "Jean", "Jean-Lewis", "Jean-Pierre", "Jebadiah", "Jed", "Jedd", "Jedidiah", "Jeemie", "Jeevan", "Jeffrey", "Jensen", "Jenson", "Jensyn", "Jeremy", "Jerome", "Jeronimo", "Jerrick", "Jerry", "Jesse", "Jesuseun", "Jeswin", "Jevan", "Jeyun", "Jez", "Jia", "Jian", "Jiao", "Jimmy", "Jincheng", "JJ", "Joaquin", "Joash", "Jock", "Jody", "Joe", "Joeddy", "Joel", "Joey", "Joey-Jack", "Johann", "Johannes", "Johansson", "John", "Johnathan", "Johndean", "Johnjay", "John-Michael", "Johnnie", "Johnny", "Johnpaul", "John-Paul", "John-Scott", "Johnson", "Jole", "Jomuel", "Jon", "Jonah", "Jonatan", "Jonathan", "Jonathon", "Jonny", "Jonothan", "Jon-Paul", "Jonson", "Joojo", "Jordan", "Jordi", "Jordon", "Jordy", "Jordyn", "Jorge", "Joris", "Jorryn", "Josan", "Josef", "Joseph", "Josese", "Josh", "Joshiah", "Joshua", "Josiah", "Joss", "Jostelle", "Joynul", "Juan", "Jubin", "Judah", "Jude", "Jules", "Julian", "Julien", "Jun", "Junior", "Jura", "Justan", "Justin", "Justinas", "Kaan", "Kabeer", "Kabir", "Kacey", "Kacper", "Kade", "Kaden", "Kadin", "Kadyn", "Kaeden", "Kael", "Kaelan", "Kaelin", "Kaelum", "Kai", "Kaid", "Kaidan", "Kaiden", "Kaidinn", "Kaidyn", "Kaileb", "Kailin", "Kain", "Kaine", "Kainin", "Kainui", "Kairn", "Kaison", "Kaiwen", "Kajally", "Kajetan", "Kalani", "Kale", "Kaleb", "Kaleem", "Kal-el", "Kalen", "Kalin", "Kallan", "Kallin", "Kalum", "Kalvin", "Kalvyn", "Kameron", "Kames", "Kamil", "Kamran", "Kamron", "Kane", "Karam", "Karamvir", "Karandeep", "Kareem", "Karim", "Karimas", "Karl", "Karol", "Karson", "Karsyn", "Karthikeya", "Kasey", "Kash", "Kashif", "Kasim", "Kasper", "Kasra", "Kavin", "Kayam", "Kaydan", "Kayden", "Kaydin", "Kaydn", "Kaydyn", "Kaydyne", "Kayleb", "Kaylem", "Kaylum", "Kayne", "Kaywan", "Kealan", "Kealon", "Kean", "Keane", "Kearney", "Keatin", "Keaton", "Keavan", "Keayn", "Kedrick", "Keegan", "Keelan", "Keelin", "Keeman", "Keenan", "Keenan-Lee", "Keeton", "Kehinde", "Keigan", "Keilan", "Keir", "Keiran", "Keiren", "Keiron", "Keiryn", "Keison", "Keith", "Keivlin", "Kelam", "Kelan", "Kellan", "Kellen", "Kelso", "Kelum", "Kelvan", "Kelvin", "Ken", "Kenan", "Kendall", "Kendyn", "Kenlin", "Kenneth", "Kensey", "Kenton", "Kenyon", "Kenzeigh", "Kenzi", "Kenzie", "Kenzo", "Kenzy", "Keo", "Ker", "Kern", "Kerr", "Kevan", "Kevin", "Kevyn", "Kez", "Khai", "Khalan", "Khaleel", "Khaya", "Khevien", "Khizar", "Khizer", "Kia", "Kian", "Kian-James", "Kiaran", "Kiarash", "Kie", "Kiefer", "Kiegan", "Kienan", "Kier", "Kieran", "Kieran-Scott", "Kieren", "Kierin", "Kiern", "Kieron", "Kieryn", "Kile", "Killian", "Kimi", "Kingston", "Kinneil", "Kinnon", "Kinsey", "Kiran", "Kirk", "Kirwin", "Kit", "Kiya", "Kiyonari", "Kjae", "Klein", "Klevis", "Kobe", "Kobi", "Koby", "Koddi", "Koden", "Kodi", "Kodie", "Kody", "Kofi", "Kogan", "Kohen", "Kole", "Konan", "Konar", "Konnor", "Konrad", "Koray", "Korben", "Korbyn", "Korey", "Kori", "Korrin", "Kory", "Koushik", "Kris", "Krish", "Krishan", "Kriss", "Kristian", "Kristin", "Kristofer", "Kristoffer", "Kristopher", "Kruz", "Krzysiek", "Krzysztof", "Ksawery", "Ksawier", "Kuba", "Kurt", "Kurtis", "Kurtis-Jae", "Kyaan", "Kyan", "Kyde", "Kyden", "Kye", "Kyel", "Kyhran", "Kyie", "Kylan", "Kylar", "Kyle", "Kyle-Derek", "Kylian", "Kym", "Kynan", "Kyral", "Kyran", "Kyren", "Kyrillos", "Kyro", "Kyron", "Kyrran", "Lachlainn", "Lachlan", "Lachlann", "Lael", "Lagan", "Laird", "Laison", "Lakshya", "Lance", "Lancelot", "Landon", "Lang", "Lasse", "Latif", "Lauchlan", "Lauchlin", "Laughlan", "Lauren", "Laurence", "Laurie", "Lawlyn", "Lawrence", "Lawrie", "Lawson", "Layne", "Layton", "Lee", "Leigh", "Leigham", "Leighton", "Leilan", "Leiten", "Leithen", "Leland", "Lenin", "Lennan", "Lennen", "Lennex", "Lennon", "Lennox", "Lenny", "Leno", "Lenon", "Lenyn", "Leo", "Leon", "Leonard", "Leonardas", "Leonardo", "Lepeng", "Leroy", "Leven", "Levi", "Levon", "Levy", "Lewie", "Lewin", "Lewis", "Lex", "Leydon", "Leyland", "Leylann", "Leyton", "Liall", "Liam", "Liam-Stephen", "Limo", "Lincoln", "Lincoln-John", "Lincon", "Linden", "Linton", "Lionel", "Lisandro", "Litrell", "Liyonela-Elam", "LLeyton", "Lliam", "Lloyd", "Lloyde", "Loche", "Lochlan", "Lochlann", "Lochlan-Oliver", "Lock", "Lockey", "Logan", "Logann", "Logan-Rhys", "Loghan", "Lokesh", "Loki", "Lomond", "Lorcan", "Lorenz", "Lorenzo", "Lorne", "Loudon", "Loui", "Louie", "Louis", "Loukas", "Lovell", "Luc", "Luca", "Lucais", "Lucas", "Lucca", "Lucian", "Luciano", "Lucien", "Lucus", "Luic", "Luis", "Luk", "Luka", "Lukas", "Lukasz", "Luke", "Lukmaan", "Luqman", "Lyall", "Lyle", "Lyndsay", "Lysander", "Maanav", "Maaz", "Mac", "Macallum", "Macaulay", "Macauley", "Macaully", "Machlan", "Maciej", "Mack", "Mackenzie", "Mackenzy", "Mackie", "Macsen", "Macy", "Madaki", "Maddison", "Maddox", "Madison", "Madison-Jake", "Madox", "Mael", "Magnus", "Mahan", "Mahdi", "Mahmoud", "Maias", "Maison", "Maisum", "Maitlind", "Majid", "Makensie", "Makenzie", "Makin", "Maksim", "Maksymilian", "Malachai", "Malachi", "Malachy", "Malakai", "Malakhy", "Malcolm", "Malik", "Malikye", "Malo", "Ma'moon", "Manas", "Maneet", "Manmohan", "Manolo", "Manson", "Mantej", "Manuel", "Manus", "Marc", "Marc-Anthony", "Marcel", "Marcello", "Marcin", "Marco", "Marcos", "Marcous", "Marcquis", "Marcus", "Mario", "Marios", "Marius", "Mark", "Marko", "Markus", "Marley", "Marlin", "Marlon", "Maros", "Marshall", "Martin", "Marty", "Martyn", "Marvellous", "Marvin", "Marwan", "Maryk", "Marzuq", "Mashhood", "Mason", "Mason-Jay", "Masood", "Masson", "Matas", "Matej", "Mateusz", "Mathew", "Mathias", "Mathu", "Mathuyan", "Mati", "Matt", "Matteo", "Matthew", "Matthew-William", "Matthias", "Max", "Maxim", "Maximilian", "Maximillian", "Maximus", "Maxwell", "Maxx", "Mayeul", "Mayson", "Mazin", "Mcbride", "McCaulley", "McKade", "McKauley", "McKay", "McKenzie", "McLay", "Meftah", "Mehmet", "Mehraz", "Meko", "Melville", "Meshach", "Meyzhward", "Micah", "Michael", "Michael-Alexander", "Michael-James", "Michal", "Michat", "Micheal", "Michee", "Mickey", "Miguel", "Mika", "Mikael", "Mikee", "Mikey", "Mikhail", "Mikolaj", "Miles", "Millar", "Miller", "Milo", "Milos", "Milosz", "Mir", "Mirza", "Mitch", "Mitchel", "Mitchell", "Moad", "Moayd", "Mobeen", "Modoulamin", "Modu", "Mohamad", "Mohamed", "Mohammad", "Mohammad-Bilal", "Mohammed", "Mohanad", "Mohd", "Momin", "Momooreoluwa", "Montague", "Montgomery", "Monty", "Moore", "Moosa", "Moray", "Morgan", "Morgyn", "Morris", "Morton", "Moshy", "Motade", "Moyes", "Msughter", "Mueez", "Muhamadjavad", "Muhammad", "Muhammed", "Muhsin", "Muir", "Munachi", "Muneeb", "Mungo", "Munir", "Munmair", "Munro", "Murdo", "Murray", "Murrough", "Murry", "Musa", "Musse", "Mustafa", "Mustapha", "Muzammil", "Muzzammil", "Mykie", "Myles", "Mylo", "Nabeel", "Nadeem", "Nader", "Nagib", "Naif", "Nairn", "Narvic", "Nash", "Nasser", "Nassir", "Natan", "Nate", "Nathan", "Nathanael", "Nathanial", "Nathaniel", "Nathan-Rae", "Nawfal", "Nayan", "Neco", "Neil", "Nelson", "Neo", "Neshawn", "Nevan", "Nevin", "Ngonidzashe", "Nial", "Niall", "Nicholas", "Nick", "Nickhill", "Nicki", "Nickson", "Nicky", "Nico", "Nicodemus", "Nicol", "Nicolae", "Nicolas", "Nidhish", "Nihaal", "Nihal", "Nikash", "Nikhil", "Niki", "Nikita", "Nikodem", "Nikolai", "Nikos", "Nilav", "Niraj", "Niro", "Niven", "Noah", "Noel", "Nolan", "Noor", "Norman", "Norrie", "Nuada", "Nyah", "Oakley", "Oban", "Obieluem", "Obosa", "Odhran", "Odin", "Odynn", "Ogheneochuko", "Ogheneruno", "Ohran", "Oilibhear", "Oisin", "Ojima-Ojo", "Okeoghene", "Olaf", "Ola-Oluwa", "Olaoluwapolorimi", "Ole", "Olie", "Oliver", "Olivier", "Oliwier", "Ollie", "Olurotimi", "Oluwadamilare", "Oluwadamiloju", "Oluwafemi", "Oluwafikunayomi", "Oluwalayomi", "Oluwatobiloba", "Oluwatoni", "Omar", "Omri", "Oran", "Orin", "Orlando", "Orley", "Orran", "Orrick", "Orrin", "Orson", "Oryn", "Oscar", "Osesenagha", "Oskar", "Ossian", "Oswald", "Otto", "Owain", "Owais", "Owen", "Owyn", "Oz", "Ozzy", "Pablo", "Pacey", "Padraig", "Paolo", "Pardeepraj", "Parkash", "Parker", "Pascoe", "Pasquale", "Patrick", "Patrick-John", "Patrikas", "Patryk", "Paul", "Pavit", "Pawel", "Pawlo", "Pearce", "Pearse", "Pearsen", "Pedram", "Pedro", "Peirce", "Peiyan", "Pele", "Peni", "Peregrine", "Peter", "Phani", "Philip", "Philippos", "Phinehas", "Phoenix", "Phoevos", "Pierce", "Pierre-Antoine", "Pieter", "Pietro", "Piotr", "Porter", "Prabhjoit", "Prabodhan", "Praise", "Pranav", "Pravin", "Precious", "Prentice", "Presley", "Preston", "Preston-Jay", "Prinay", "Prince", "Prithvi", "Promise", "Puneetpaul", "Pushkar", "Qasim", "Qirui", "Quinlan", "Quinn", "Radmiras", "Raees", "Raegan", "Rafael", "Rafal", "Rafferty", "Rafi", "Raheem", "Rahil", "Rahim", "Rahman", "Raith", "Raithin", "Raja", "Rajab-Ali", "Rajan", "Ralfs", "Ralph", "Ramanas", "Ramit", "Ramone", "Ramsay", "Ramsey", "Rana", "Ranolph", "Raphael", "Rasmus", "Rasul", "Raul", "Raunaq", "Ravin", "Ray", "Rayaan", "Rayan", "Rayane", "Rayden", "Rayhan", "Raymond", "Rayne", "Rayyan", "Raza", "Reace", "Reagan", "Reean", "Reece", "Reed", "Reegan", "Rees", "Reese", "Reeve", "Regan", "Regean", "Reggie", "Rehaan", "Rehan", "Reice", "Reid", "Reigan", "Reilly", "Reily", "Reis", "Reiss", "Remigiusz", "Remo", "Remy", "Ren", "Renars", "Reng", "Rennie", "Reno", "Reo", "Reuben", "Rexford", "Reynold", "Rhein", "Rheo", "Rhett", "Rheyden", "Rhian", "Rhoan", "Rholmark", "Rhoridh", "Rhuairidh", "Rhuan", "Rhuaridh", "Rhudi", "Rhy", "Rhyan", "Rhyley", "Rhyon", "Rhys", "Rhys-Bernard", "Rhyse", "Riach", "Rian", "Ricards", "Riccardo", "Ricco", "Rice", "Richard", "Richey", "Richie", "Ricky", "Rico", "Ridley", "Ridwan", "Rihab", "Rihan", "Rihards", "Rihonn", "Rikki", "Riley", "Rio", "Rioden", "Rishi", "Ritchie", "Rivan", "Riyadh", "Riyaj", "Roan", "Roark", "Roary", "Rob", "Robbi", "Robbie", "Robbie-lee", "Robby", "Robert", "Robert-Gordon", "Robertjohn", "Robi", "Robin", "Rocco", "Roddy", "Roderick", "Rodrigo", "Roen", "Rogan", "Roger", "Rohaan", "Rohan", "Rohin", "Rohit", "Rokas", "Roman", "Ronald", "Ronan", "Ronan-Benedict", "Ronin", "Ronnie", "Rooke", "Roray", "Rori", "Rorie", "Rory", "Roshan", "Ross", "Ross-Andrew", "Rossi", "Rowan", "Rowen", "Roy", "Ruadhan", "Ruaidhri", "Ruairi", "Ruairidh", "Ruan", "Ruaraidh", "Ruari", "Ruaridh", "Ruben", "Rubhan", "Rubin", "Rubyn", "Rudi", "Rudy", "Rufus", "Rui", "Ruo", "Rupert", "Ruslan", "Russel", "Russell", "Ryaan", "Ryan", "Ryan-Lee", "Ryden", "Ryder", "Ryese", "Ryhs", "Rylan", "Rylay", "Rylee", "Ryleigh", "Ryley", "Rylie", "Ryo", "Ryszard", "Saad", "Sabeen", "Sachkirat", "Saffi", "Saghun", "Sahaib", "Sahbian", "Sahil", "Saif", "Saifaddine", "Saim", "Sajid", "Sajjad", "Salahudin", "Salman", "Salter", "Salvador", "Sam", "Saman", "Samar", "Samarjit", "Samatar", "Sambrid", "Sameer", "Sami", "Samir", "Sami-Ullah", "Samual", "Samuel", "Samuela", "Samy", "Sanaullah", "Sandro", "Sandy", "Sanfur", "Sanjay", "Santiago", "Santino", "Satveer", "Saul", "Saunders", "Savin", "Sayad", "Sayeed", "Sayf", "Scot", "Scott", "Scott-Alexander", "Seaan", "Seamas", "Seamus", "Sean", "Seane", "Sean-James", "Sean-Paul", "Sean-Ray", "Seb", "Sebastian", "Sebastien", "Selasi", "Seonaidh", "Sephiroth", "Sergei", "Sergio", "Seth", "Sethu", "Seumas", "Shaarvin", "Shadow", "Shae", "Shahmir", "Shai", "Shane", "Shannon", "Sharland", "Sharoz", "Shaughn", "Shaun", "Shaunpaul", "Shaun-Paul", "Shaun-Thomas", "Shaurya", "Shaw", "Shawn", "Shawnpaul", "Shay", "Shayaan", "Shayan", "Shaye", "Shayne", "Shazil", "Shea", "Sheafan", "Sheigh", "Shenuk", "Sher", "Shergo", "Sheriff", "Sherwyn", "Shiloh", "Shiraz", "Shreeram", "Shreyas", "Shyam", "Siddhant", "Siddharth", "Sidharth", "Sidney", "Siergiej", "Silas", "Simon", "Sinai", "Skye", "Sofian", "Sohaib", "Sohail", "Soham", "Sohan", "Sol", "Solomon", "Sonneey", "Sonni", "Sonny", "Sorley", "Soul", "Spencer", "Spondon", "Stanislaw", "Stanley", "Stefan", "Stefano", "Stefin", "Stephen", "Stephenjunior", "Steve", "Steven", "Steven-lee", "Stevie", "Stewart", "Stewarty", "Strachan", "Struan", "Stuart", "Su", "Subhaan", "Sudais", "Suheyb", "Suilven", "Sukhi", "Sukhpal", "Sukhvir", "Sulayman", "Sullivan", "Sultan", "Sung", "Sunny", "Suraj", "Surien", "Sweyn", "Syed", "Sylvain", "Symon", "Szymon", "Tadd", "Taddy", "Tadhg", "Taegan", "Taegen", "Tai", "Tait", "Taiwo", "Talha", "Taliesin", "Talon", "Talorcan", "Tamar", "Tamiem", "Tammam", "Tanay", "Tane", "Tanner", "Tanvir", "Tanzeel", "Taonga", "Tarik", "Tariq-Jay", "Tate", "Taylan", "Taylar", "Tayler", "Taylor", "Taylor-Jay", "Taylor-Lee", "Tayo", "Tayyab", "Tayye", "Tayyib", "Teagan", "Tee", "Teejay", "Tee-jay", "Tegan", "Teighen", "Teiyib", "Te-Jay", "Temba", "Teo", "Teodor", "Teos", "Terry", "Teydren", "Theo", "Theodore", "Thiago", "Thierry", "Thom", "Thomas", "Thomas-Jay", "Thomson", "Thorben", "Thorfinn", "Thrinei", "Thumbiko", "Tiago", "Tian", "Tiarnan", "Tibet", "Tieran", "Tiernan", "Timothy", "Timucin", "Tiree", "Tisloh", "Titi", "Titus", "Tiylar", "TJ", "Tjay", "T-Jay", "Tobey", "Tobi", "Tobias", "Tobie", "Toby", "Todd", "Tokinaga", "Toluwalase", "Tom", "Tomas", "Tomasz", "Tommi-Lee", "Tommy", "Tomson", "Tony", "Torin", "Torquil", "Torran", "Torrin", "Torsten", "Trafford", "Trai", "Travis", "Tre", "Trent", "Trey", "Tristain", "Tristan", "Troy", "Tubagus", "Turki", "Turner", "Ty", "Ty-Alexander", "Tye", "Tyelor", "Tylar", "Tyler", "Tyler-James", "Tyler-Jay", "Tyllor", "Tylor", "Tymom", "Tymon", "Tymoteusz", "Tyra", "Tyree", "Tyrnan", "Tyrone", "Tyson", "Ubaid", "Ubayd", "Uchenna", "Uilleam", "Umair", "Umar", "Umer", "Umut", "Urban", "Uri", "Usman", "Uzair", "Uzayr", "Valen", "Valentin", "Valentino", "Valery", "Valo", "Vasyl", "Vedantsinh", "Veeran", "Victor", "Victory", "Vinay", "Vince", "Vincent", "Vincenzo", "Vinh", "Vinnie", "Vithujan", "Vladimir", "Vladislav", "Vrishin", "Vuyolwethu", "Wabuya", "Wai", "Walid", "Wallace", "Walter", "Waqaas", "Warkhas", "Warren", "Warrick", "Wasif", "Wayde", "Wayne", "Wei", "Wen", "Wesley", "Wesley-Scott", "Wiktor", "Wilkie", "Will", "William", "William-John", "Willum", "Wilson", "Windsor", "Wojciech", "Woyenbrakemi", "Wyatt", "Wylie", "Wynn", "Xabier", "Xander", "Xavier", "Xiao", "Xida", "Xin", "Xue", "Yadgor", "Yago", "Yahya", "Yakup", "Yang", "Yanick", "Yann", "Yannick", "Yaseen", "Yasin", "Yasir", "Yassin", "Yoji", "Yong", "Yoolgeun", "Yorgos", "Youcef", "Yousif", "Youssef", "Yu", "Yuanyu", "Yuri", "Yusef", "Yusuf", "Yves", "Zaaine", "Zaak", "Zac", "Zach", "Zachariah", "Zacharias", "Zacharie", "Zacharius", "Zachariya", "Zachary", "Zachary-Marc", "Zachery", "Zack", "Zackary", "Zaid", "Zain", "Zaine", "Zaineddine", "Zainedin", "Zak", "Zakaria", "Zakariya", "Zakary", "Zaki", "Zakir", "Zakk", "Zamaar", "Zander", "Zane", "Zarran", "Zayd", "Zayn", "Zayne", "Ze", "Zechariah", "Zeek", "Zeeshan", "Zeid", "Zein", "Zen", "Zendel", "Zenith", "Zennon", "Zeph", "Zerah", "Zhen", "Zhi", "Zhong", "Zhuo", "Zi", "Zidane", "Zijie", "Zinedine", "Zion", "Zishan", "Ziya", "Ziyaan", "Zohaib", "Zohair", "Zoubaeir", "Zubair", "Zubayr", "Zuriel"];
					const moves = this.dex.moves.all().filter(move => (
						!pokemon.moves.includes(move.id) &&
						!move.isZ && !move.isMax
					));
					const move = this.sample(moves);
					const newMove = {
						move: move.name,
						id: move.id,
						pp: move.pp,
						maxpp: move.maxpp,
						target: move.target,
						disabled: false,
						used: false,
					};
					pokemon.baseMoveSlots[pokemon.moveSlots.length] = newMove;
					pokemon.moveSlots[pokemon.moveSlots.length] = newMove;
					const tutor = this.sample(tutorNames);
					this.add('-message', `${pokemon.name} encountered Move Tutor ${tutor}!`);
					this.add('-message', `${tutor} taught ${pokemon.name} how to use ${move.name}!`);
					this.add('-anim', pokemon, 'Work Up', pokemon);
					break;
				case 'trap':
					let trapdamage = 0;
					const types = ['spikes', 'snare', 'bomb'];
					const type = this.sample(types);
					switch (type) {
						case 'spikes':
							trapdamage = this.random(40, 80);
							this.add('-message', `Yikes! ${pokemon.name} stepped on a spike!`);
							this.add('-anim', pokemon, 'Horn Attack', pokemon);
							this.damage(trapdamage, pokemon);
							break;
						case 'snare':
							trapdamage = this.random(80, 120);
							this.add('-message', `Ouch! ${pokemon.name} was caught in a snare!`);
							this.add('-anim', pokemon, 'Crunch', pokemon);
							this.damage(trapdamage, pokemon);
							break;
						case 'bomb':
							trapdamage = this.random(120, 180);
							this.add('-message', `Oh, no! ${pokemon.name} stepped on a Seed Bomb!`);
							this.add('-anim', pokemon, 'Seed Bomb', pokemon);
							this.damage(trapdamage, pokemon);
							break;
					}
					break;
				case 'rest':
					this.add('-anim', pokemon, 'Rest', pokemon);
					this.add('-anim', pokemon, 'Morning Sun', pokemon);
					this.add('-message', `${pokemon.name} took time to rest and recover!`);
					this.heal(pokemon.maxhp / 3, pokemon);
					pokemon.cureStatus();
					break;
				case 'weather':
					this.add('-message', `${pokemon.name} traveled into another climate!`);
					let weathers = ['sunnyday', 'snowscape', 'sandstorm', 'raindance'];
					let weather = this.sample(weathers);
					this.field.setWeather(weather);
					break;
			}
		},
	},
	// Morte
	dollkeeper: {
		name: "Dollkeeper",
		gen: 9,
		onDamagePriority: 1,
		onDamage(damage, target, source, effect) {
			if (effect?.effectType === 'Move' && ['mimikyu', 'mimikyutotem'].includes(target.species.id) && damage >= target.hp) {
				this.add('-activate', target, 'ability: Dollkeeper');
				target.formeChange('Mimikyu-Busted');
				target.abilityState.dollDur = 3;
				target.hp = target.baseMaxhp;
				this.add('-heal', target, target.getHealth, '[silent]');
				source.side.addSideCondition('Cursed Doll', target);
				return 0;
			}
		},
		onTryHit(target, source, move) {
			if (target.species.id === 'mimikyubusted') {
				this.add('-activate', target, 'ability: Dollkeeper');
				move.priority = -6;
				source.addVolatile('yawn');
				this.damage(source.maxhp / 6, source, target, 'ability: Dollkeeper');
				return;
			}
		},
		onBeforeMove(pokemon, target, move) {
			if (pokemon.species.id === 'mimikyubusted') {
				this.debug(`${pokemon.name}: cannot move due to Dollkeeper`);
				this.add('-message', `${pokemon.name} couldn't move!`);
				return false;
			}
		},
	},
	// Sakuya Izayoi
	theworld: {
		name: "The World",
		gen: 9,
		onSwitchIn(pokemon) {
			if (!this.field.pseudoWeather['trickroom']) {
				this.field.addPseudoWeather('trickroom');
			} else {
				this.field.removePseudoWeather('trickroom');
			}
		},
		onFoeTryMove(target, source, move) {
			if (move.category === 'Status' || move.flags['futuremove']) return;
			if (!source.side.addSlotCondition(source, 'futuremove')) return;
			Object.assign(source.side.slotConditions[source.position]['futuremove'], {
				duration: 2,
				move: move.id,
				source: target,
				moveData: {
					id: move.id,
					name: move.name,
					accuracy: move.accuracy,
					basePower: move.basePower,
					category: move.category,
					priority: move.priority,
					flags: { allyanim: 1, metronome: 1, futuremove: 1, bypasssub: 1 },
					ignoreImmunity: true,
					effectType: 'Move',
					type: move.type,
				},
			});
			this.add('-start', source, 'move: ' + move.name, '[silent]');
			this.add('-message', `${source.name} shifted ${move.name} into the future!`);
			return this.NOT_FAIL;
		},
	},
	// Emerl
	perfectcopy: {
		desc: "Upon switching in, this Pokemon adds a random move of the foe's to its moveset not already included. It also copies stat changes and ability.",
		shortDesc: "Learns 1 enemy move; Copies stat changes, ability.",
		onStart(pokemon) {
			const target = pokemon.side.foe.active[pokemon.side.foe.active.length - 1 - pokemon.position];
			// Replace Ability
			if (target.ability !== 'perfectcopy') {
				this.singleEvent('End', pokemon.getAbility(), pokemon.abilityState, pokemon);
				pokemon.setAbility(target.getAbility().id);
				pokemon.abilityState = { id: this.toID(target.ability), target: pokemon };
			}
			// Learning An Opponent's Move
			let possibleMoves = [];
			for (const moveSlot of target.moveSlots) {
				if (pokemon.moves.includes(moveSlot.id)) continue;
				possibleMoves.push(moveSlot.id);
			}
			if (possibleMoves.length) {
				const moveid = this.sample(possibleMoves);
				const move = this.dex.moves.get(moveid);
				const newMove = {
					move: move.name,
					id: move.id,
					pp: (move.noPPBoosts || move.isZ) ? move.pp : move.pp * 8 / 5,
					maxpp: (move.noPPBoosts || move.isZ) ? move.pp : move.pp * 8 / 5,
					target: move.target,
					disabled: false,
					used: false,
				};
				pokemon.baseMoveSlots[pokemon.moveSlots.length] = newMove;
				pokemon.moveSlots[pokemon.moveSlots.length] = newMove;
				this.add('-message', `${pokemon.name} copied ${target.name}'s ${target.getAbility().name} and ${this.dex.moves.get(pokemon.moveSlots[pokemon.moveSlots.length - 1].id).name}!`);
			}
			// Copying Stat Changes
			const boosts: SparseBoostsTable = {};
			let i: BoostID;
			let boosted = false;
			if (target.boosts) {
				for (i in target.boosts) {
					if (target.boosts[i] > 0) {
						boosts[i] = target.boosts[i];
						boosted = true;
					}
				}
			}
			if (boosted) {
				this.add("-activate", pokemon, "ability: Perfect Copy");
				this.boost(boosts, pokemon);
				this.add('-message', `${pokemon.name} copied ${target.name}'s stat changes!`);
			}
		},
		flags: { failroleplay: 1, noreceiver: 1, noentrain: 1, notrace: 1 },
		name: "Perfect Copy",
		gen: 9,
	},
	// Zeeb
	nutcracker: {
		name: "Nutcracker",
		gen: 9,
		shortDesc: "Uses Speed in damage calculation. x1.33 damage to Males.",
		desc: "Uses Speed in damage calculation instead of Attack or Special Attack. This Pokemon's attacks deal x1.33 damage to opposing Male Pokemon.",
		onModifyMove(move, pokemon, target) {
			if (move.category !== "Status") move.overrideOffensiveStat = 'spe';
		},
		onBasePowerPriority: 24,
		onBasePower(basePower, attacker, defender, move) {
			if (defender.gender === 'M') {
				this.debug('nutcracker boost');
				return this.chainModify(1.33);
			}
		},
	},
	// Kaiser Dragon
	elementalshift: {
		desc: "This Pokemon becomes Fire/Grass/Water/Electric/Ice/Flying/Poison/Psychic/Fairy/Rock-type and sets the appropriate weather/terrain upon switching in.",
		shortDesc: "Random type + corresponding move upon switch-in.",
		onStart(pokemon) {
			let r = this.random(10);
			if (r === 0) {
				this.add('-start', pokemon, 'typechange', 'Fire');
				pokemon.setType('Fire');
				this.actions.useMove('Sunny Day', pokemon);
				for (let i = 0; i < 4; i++) {
					let moves = ['willowisp', 'protect', 'magmastorm', 'firelash'];
					const move = this.dex.moves.get(moves[i]);
					const newSlot = {
						move: move.name,
						id: move.id,
						pp: (move.noPPBoosts || move.isZ) ? move.pp : move.pp * 8 / 5,
						maxpp: (move.noPPBoosts || move.isZ) ? move.pp : move.pp * 8 / 5,
						target: move.target,
						disabled: false,
						used: false,
					};
					pokemon.moveSlots[i] = newSlot;
					pokemon.baseMoveSlots[i] = newSlot;
				}
			} else if (r === 1) {
				this.add('-start', pokemon, 'typechange', 'Grass');
				pokemon.setType('Grass');
				this.actions.useMove('Grassy Terrain', pokemon);
				for (let i = 0; i < 4; i++) {
					let moves = ['leechseed', 'protect', 'hornleech', 'gigadrain'];
					const move = this.dex.moves.get(moves[i]);
					const newSlot = {
						move: move.name,
						id: move.id,
						pp: (move.noPPBoosts || move.isZ) ? move.pp : move.pp * 8 / 5,
						maxpp: (move.noPPBoosts || move.isZ) ? move.pp : move.pp * 8 / 5,
						target: move.target,
						disabled: false,
						used: false,
					};
					pokemon.moveSlots[i] = newSlot;
					pokemon.baseMoveSlots[i] = newSlot;
				}
			} else if (r === 2) {
				this.add('-start', pokemon, 'typechange', 'Water');
				pokemon.setType('Water');
				this.actions.useMove('Rain Dance', pokemon);
				for (let i = 0; i < 4; i++) {
					let moves = ['flipturn', 'hydrosteam', 'waterspout', 'aquatail'];
					const move = this.dex.moves.get(moves[i]);
					const newSlot = {
						move: move.name,
						id: move.id,
						pp: (move.noPPBoosts || move.isZ) ? move.pp : move.pp * 8 / 5,
						maxpp: (move.noPPBoosts || move.isZ) ? move.pp : move.pp * 8 / 5,
						target: move.target,
						disabled: false,
						used: false,
					};
					pokemon.moveSlots[i] = newSlot;
					pokemon.baseMoveSlots[i] = newSlot;
				}
			} else if (r === 3) {
				this.add('-start', pokemon, 'typechange', 'Electric');
				pokemon.setType('Electric');
				this.actions.useMove('Electric Terrain', pokemon);
				for (let i = 0; i < 4; i++) {
					let moves = ['thunderwave', 'voltswitch', 'charge', 'doubleshock'];
					const move = this.dex.moves.get(moves[i]);
					const newSlot = {
						move: move.name,
						id: move.id,
						pp: (move.noPPBoosts || move.isZ) ? move.pp : move.pp * 8 / 5,
						maxpp: (move.noPPBoosts || move.isZ) ? move.pp : move.pp * 8 / 5,
						target: move.target,
						disabled: false,
						used: false,
					};
					pokemon.moveSlots[i] = newSlot;
					pokemon.baseMoveSlots[i] = newSlot;
				}
			} else if (r === 4) {
				this.add('-start', pokemon, 'typechange', 'Ice');
				pokemon.setType('Ice');
				this.actions.useMove('Snowscape', pokemon);
				for (let i = 0; i < 4; i++) {
					let moves = ['auroraveil', 'freezyfrost', 'icespinner', 'blizzard'];
					const move = this.dex.moves.get(moves[i]);
					const newSlot = {
						move: move.name,
						id: move.id,
						pp: (move.noPPBoosts || move.isZ) ? move.pp : move.pp * 8 / 5,
						maxpp: (move.noPPBoosts || move.isZ) ? move.pp : move.pp * 8 / 5,
						target: move.target,
						disabled: false,
						used: false,
					};
					pokemon.moveSlots[i] = newSlot;
					pokemon.baseMoveSlots[i] = newSlot;
				}
			} else if (r === 5) {
				this.add('-start', pokemon, 'typechange', 'Flying');
				pokemon.setType('Flying');
				this.actions.useMove('Tailwind', pokemon);
				for (let i = 0; i < 4; i++) {
					let moves = ['roost', 'defog', 'aeroblast', 'beakblast'];
					const move = this.dex.moves.get(moves[i]);
					const newSlot = {
						move: move.name,
						id: move.id,
						pp: (move.noPPBoosts || move.isZ) ? move.pp : move.pp * 8 / 5,
						maxpp: (move.noPPBoosts || move.isZ) ? move.pp : move.pp * 8 / 5,
						target: move.target,
						disabled: false,
						used: false,
					};
					pokemon.moveSlots[i] = newSlot;
					pokemon.baseMoveSlots[i] = newSlot;
				}
			} else if (r === 6) {
				this.add('-start', pokemon, 'typechange', 'Poison');
				pokemon.setType('Poison');
				this.actions.useMove('Toxic Spikes', pokemon);
				for (let i = 0; i < 4; i++) {
					let moves = ['gunkshot', 'mortalspin', 'sludgebomb', 'clearsmog'];
					const move = this.dex.moves.get(moves[i]);
					const newSlot = {
						move: move.name,
						id: move.id,
						pp: (move.noPPBoosts || move.isZ) ? move.pp : move.pp * 8 / 5,
						maxpp: (move.noPPBoosts || move.isZ) ? move.pp : move.pp * 8 / 5,
						target: move.target,
						disabled: false,
						used: false,
					};
					pokemon.moveSlots[i] = newSlot;
					pokemon.baseMoveSlots[i] = newSlot;
				}
			} else if (r === 7) {
				this.add('-start', pokemon, 'typechange', 'Psychic');
				pokemon.setType('Psychic');
				this.actions.useMove('Psychic Terrain', pokemon);
				for (let i = 0; i < 4; i++) {
					let moves = ['lunardance', 'revivalblessing', 'futuresight', 'psychicfangs'];
					const move = this.dex.moves.get(moves[i]);
					const newSlot = {
						move: move.name,
						id: move.id,
						pp: (move.noPPBoosts || move.isZ) ? move.pp : move.pp * 8 / 5,
						maxpp: (move.noPPBoosts || move.isZ) ? move.pp : move.pp * 8 / 5,
						target: move.target,
						disabled: false,
						used: false,
					};
					pokemon.moveSlots[i] = newSlot;
					pokemon.baseMoveSlots[i] = newSlot;
				}
			} else if (r === 8) {
				this.add('-start', pokemon, 'typechange', 'Fairy');
				pokemon.setType('Fairy');
				this.actions.useMove('Misty Terrain', pokemon);
				for (let i = 0; i < 4; i++) {
					let moves = ['moonlight', 'protect', 'sparklyswirl', 'spiritbreak'];
					const move = this.dex.moves.get(moves[i]);
					const newSlot = {
						move: move.name,
						id: move.id,
						pp: (move.noPPBoosts || move.isZ) ? move.pp : move.pp * 8 / 5,
						maxpp: (move.noPPBoosts || move.isZ) ? move.pp : move.pp * 8 / 5,
						target: move.target,
						disabled: false,
						used: false,
					};
					pokemon.moveSlots[i] = newSlot;
					pokemon.baseMoveSlots[i] = newSlot;
				}
			} else {
				this.add('-start', pokemon, 'typechange', 'Rock');
				pokemon.setType('Rock');
				this.actions.useMove('Sandstorm', pokemon);
				for (let i = 0; i < 4; i++) {
					let moves = ['stealthrock', 'protect', 'saltcure', 'powergem'];
					const move = this.dex.moves.get(moves[i]);
					const newSlot = {
						move: move.name,
						id: move.id,
						pp: (move.noPPBoosts || move.isZ) ? move.pp : move.pp * 8 / 5,
						maxpp: (move.noPPBoosts || move.isZ) ? move.pp : move.pp * 8 / 5,
						target: move.target,
						disabled: false,
						used: false,
					};
					pokemon.moveSlots[i] = newSlot;
					pokemon.baseMoveSlots[i] = newSlot;
				}
			}
		},
		flags: { failroleplay: 1, noreceiver: 1, noentrain: 1, notrace: 1, failskillswap: 1, cantsuppress: 1 },
		name: "Elemental Shift",
		gen: 9,
	},
	// Shifu Robot
	autorepair: {
		name: "Auto Repair",
		gen: 9,
		// Handled in ../config/formats.ts
	},
	// Luminous
	blindinglight: {
		name: "Blinding Light",
		gen: 9,
		onStart(pokemon) {
			this.add('-anim', pokemon, 'Flash', pokemon);
			for (const target of this.getAllActive()) {
				if (pokemon === target) continue;
				target.addVolatile('blindinglight');
			}
		},
		onModifyType(move, pokemon) {
			this.debug(`LOR typechange to Light-type`);
			if (move.id === 'lightofruin' && pokemon.species.id === 'necrozmaultra') move.type = 'Light';
		},
		condition: {
			duration: 1,
			onStart(pokemon) {
				this.add('-message', `${pokemon.name} was struck by a blinding light!`);
				this.boost({ accuracy: -6 }, pokemon);
			},
			onEnd(pokemon) {
				this.add('-message', `The blinding light faded!`);
				this.boost({ accuracy: 6 }, pokemon);
			},
		},
	},
	// PokeKart
	chaindrift: {
		name: "Chain Drift",
		gen: 9,
		onStart() {
			this.effectState.damaged = false;
		},
		onDamagingHit(damage, target, source, move) {
			if (!target || source === target) return;
			this.boost({ spe: -1 }, target, source);
			this.effectState.damaged = true;
		},
		onResidual(pokemon) {
			if (this.effectState.damaged === false) {
				this.boost({ spe: 1 }, pokemon);
			}
			this.effectState.damaged = false;
		},
	},
	// Fblthp
	lostandfound: {
		name: "Lost and Found",
		gen: 9,
		desc: "Whenever this Pokemon is damaged by an attacking move, it takes 1/5 of the damage and immediately switches to an ally of choice. Three times per battle.",
		shortDesc: "Takes 1/5 damage from attacks, then switches to ally of choice.",
		onDamagePriority: 1,
		onDamage(damage, target, source, effect) {
			if (!target.abilityState.switches) target.abilityState.switches = 0;
			if (target === source || !damage ||
				effect.effectType !== 'Move' || target.abilityState.switches >= 3 ||
				target.side.totalFainted >= 5) return;
			target.abilityState.switches++;
			this.add('-activate', target, 'ability: Lost and Found');
			this.add('-message', `${target.name} scrambled away from danger!`);
			this.add('-anim', target, 'Dive', target);
			target.switchFlag = true;
			return damage / 5;
		},
	},
	// Quetzalcoatl
	pealofthunder: {
		desc: "This Pokemon summons Electric Terrain when hit by Electric moves; Electric immunity.",
		onTryHit(target, source, move) {
			if (move.type === 'Electric') {
				this.field.setTerrain('electricterrain');
				this.add('-immune', target, '[from] ability: Peal of Thunder');
				return null;
			}
		},
		onResidual(pokemon) {
			this.add('-activate', pokemon, 'Peal of Thunder');
			this.effectState.runStatic = true;

			let allTargets = [];
			for (const target of this.getAllPokemon()) {
				if (target.fainted || !target.hp) continue;
				allTargets.push(target);
			}
			const target = this.sample(allTargets);

			const move = this.dex.moves.get('thundershock');
			const activeMove = {
				move: move.name, id: move.id, basePower: 20, pp: move.pp, maxpp: move.pp,
				target: move.target, disabled: false, used: false,
			};
			const damage = this.actions.getDamage(pokemon, target, activeMove);
			this.add('-anim', pokemon, 'Thunderbolt', target.side.active[0]);

			// First run an ability check and damage check to ensure target does not have PoT and damage is present
			if (target.ability === 'pealofthunder') {
				this.field.setTerrain('electricterrain');
				this.add('-immune', target);
				return;
			}
			if (!damage || damage <= 0) {
				this.add('-immune', target);
				return;
			}
			// Both checks break from the function if true. If the checks are passed, proceed to damage
			// First checking if target is active or inactive, so we can use the correct function for damage
			// this.damage does NOT work on inactive Pokemon, HP must be manually lowered; See below.
			if (target.isActive) {
				this.damage(damage, target, pokemon);
			} else {
				target.hp -= damage;
				if (target.hp < 0) target.hp = 0;
				this.add('-message', `${target.name} was hurt by Peal of Thunder!`);
			}
		},
		onUpdate(pokemon) {
			if (this.effectState.runStatic) {
				this.effectState.runStatic = false;
				this.add('-anim', pokemon, 'Charge', pokemon);
				if (!pokemon.abilityState.static) pokemon.abilityState.static = 0;
				if (this.field.terrain === 'electricterrain') {
					pokemon.abilityState.static += 2;
					this.add('-message', `${pokemon.name} received two static counters!`);
				} else {
					pokemon.abilityState.static++;
					this.add('-message', `${pokemon.name} received a static counter!`);
				}
			}
		},
		name: "Peal of Thunder",
		gen: 9,
	},
	// Yukari Yakumo
	spiritingaway: {
		desc: "After using a move, this Pokemon switches to an ally of the user's choice. Sleep turns still burn while inactive.",
		shortDesc: "User switches after move; sleep turns burn while inactive.",
		onTryMove(pokemon, target, move) {
			if (move.id === 'futuresight') pokemon.abilityState.fsSwitch = true;
		},
		onAfterMoveSecondarySelf(source, target, move) {
			source.switchFlag = true;
		},
		onSwitchOut(pokemon) {
			if (pokemon.status === 'slp') {
				pokemon.abilityState.sleepBurn = true;
				pokemon.abilityState.ts = this.turn;
			}
		},
		onUpdate(pokemon) {
			if (pokemon.abilityState.fsSwitch) {
				pokemon.abilityState.fsSwitch = false;
				pokemon.switchFlag = true;
			}
		},
		onSwitchIn(pokemon) {
			if (pokemon.abilityState.sleepBurn && pokemon.status === 'slp') {
				const turnsBurned = this.turn - pokemon.abilityState.ts;
				pokemon.statusState.time -= turnsBurned;
				if (!pokemon.statusState.time || pokemon.statusState.time <= 0) pokemon.cureStatus();
				pokemon.abilityState.sleepBurn = false;
				pokemon.abilityState.ts = 0;
			}
		},
		flags: {},
		name: "Spiriting Away",
		gen: 9,
	},
	// Cylcommatic Cell
	batterylife: {
		name: "Battery Life",
		gen: 9,
		shortDesc: "See '/ssb Cyclommatic Cell' for more!",
		desc: "Look at discord pins man idk im not typing this shit",
		onStart(pokemon) {
			if (pokemon.abilityState.gauges === undefined) pokemon.abilityState.gauges = 5;
		},
		onBasePower(basePower, attacker, defender, move) {
			if (move.category === 'Status') return;
			if (!attacker.abilityState.gauges || attacker.abilityState.gauges === undefined) attacker.abilityState.gauges = 0;
			switch (attacker.abilityState.gauges) {
				case 0:
				case 1:
					return this.chainModify(0.5);
					break;
				case 2:
					return this.chainModify(0.75);
					break;
				case 3:
					break;
				case 4:
					return this.chainModify(1.25);
					break;
				case 5:
					return this.chainModify(1.5);
					break;
			}
		},
		onTryHit(target, source, move) {
			if (target !== source && move.type === 'Electric') {
				this.heal(target.baseMaxhp / 4);
				target.addVolatile('charge');
				if (!target.abilityState.gauges) target.abilityState.gauges = 0;
				target.abilityState.gauges++;
				this.add('-message', `${target.name} was charged up by ${move.name}!`);
				return null;
			}
		},
		onBeforeMove(pokemon, target, move) {
			// Use gauges for non-status electric moves
			if (move.category === 'Status') return;
			if (move.type === 'Electric') {
				if (pokemon.abilityState.gauges < 2) {
					this.debug("Not enough battery");
					this.add('-message', `${pokemon.name} doesn't have enough battery!`);
					return false;
				} else if (pokemon.abilityState.gauges >= 2) {
					pokemon.abilityState.gauges -= 2;
					this.add('-message', `${pokemon.name} used its battery to power up ${move.name}!`);
				}
			}
			// Use gauges for techno blast
			if (move.id === 'technoblast') {
				if (pokemon.abilityState.gauges < 3) {
					this.debug("Not enough battery");
					this.add('-message', `${pokemon.name} doesn't have enough battery!`);
					return false;
				} else if (pokemon.abilityState.gauges >= 3) {
					pokemon.abilityState.gauges -= 3;
					this.add('-message', `${pokemon.name} used its battery to power up ${move.name}!`);
				}
			}
		},
		onResidual(pokemon) {
			// Recharge if out of battery
			if (pokemon.abilityState.gauges <= 0) {
				this.add(`-anim`, pokemon, 'Tickle', pokemon);
				this.add('-message', `${pokemon.name} is out of battery!`);
				this.field.setTerrain('electricterrain');
				pokemon.addVolatile('mustrecharge');
				// Charge if at maximum battery
			} else if (pokemon.abilityState.gauges >= 5) {
				this.add(`-anim`, pokemon, 'Charge', pokemon);
				pokemon.addVolatile('charge');
				this.add('-message', `${pokemon.name} is at maximum charge!`);
				// Otherwise state charge amount
			} else {
				this.add(`-anim`, pokemon, 'Charge', pokemon);
				this.add('-message', `${pokemon.name} is at ${(pokemon.abilityState.gauges / 5) * 100}% battery!`);
			}
			// Add charge from sleep or terrain
			let totalCharge = 0;
			if (pokemon.status === 'slp') totalCharge++;
			if (this.field.isTerrain('electricterrain')) totalCharge++;
			if (totalCharge > 0 && pokemon.abilityState.gauges < 5) {
				this.add('-activate', pokemon, 'ability: Battery Life');
				pokemon.abilityState.gauges += totalCharge;
				if (pokemon.abilityState.gauges > 5) pokemon.abilityState.gauges = 5;
				if (totalCharge === 1) {
					this.add('-message', `${pokemon.name} is charging up!`);
				}
				if (totalCharge > 1) {
					this.add('-message', `${pokemon.name} is charging rapidly!`);
				}
			}
		},
	},
	// Marisa Kirisame
	ordinarymagician: {
		desc: "This Pokemon is immune to status, and changes its typing to match the typing of the move it's using. On switch-in, user obtains either Assault Vest, Choice Specs, Expert Belt, Flame Orb, Light Ball, Razor Fang, or Toxic Orb. On switch-out, uses Fling.",
		shortDesc: "Immune to status; Protean; Random item/fling on switch-in/out.",
		onStart(pokemon) {
			let i = this.random(7);
			if (i === 0) {
				pokemon.setItem('assaultvest');
				this.add('-message', `${pokemon.name} obtained an Assault Vest!`);
			} else if (i === 1) {
				pokemon.setItem('choicespecs');
				this.add('-message', `${pokemon.name} obtained Choice Specs!`);
			} else if (i === 2) {
				pokemon.setItem('expertbelt');
				this.add('-message', `${pokemon.name} obtained an Expert Belt!`);
			} else if (i === 3) {
				pokemon.setItem('flameorb');
				this.add('-message', `${pokemon.name} obtained a Flame Orb!`);
			} else if (i === 4) {
				pokemon.setItem('lightball');
				this.add('-message', `${pokemon.name} obtained a Light Ball!`);
			} else if (i === 5) {
				pokemon.setItem('razorfang');
				this.add('-message', `${pokemon.name} obtained a Razor Fang!`);
			} else {
				pokemon.setItem('toxicorb');
				this.add('-message', `${pokemon.name} obtained a Toxic Orb!`);
			}
		},
		onPrepareHit(source, target, move) {
			if (move.hasBounced || move.flags['futuremove'] || move.sourceEffect === 'snatch') return;
			const type = move.type;
			if (type && type !== '???' && source.getTypes().join() !== type) {
				if (!source.setType(type)) return;
				this.add('-start', source, 'typechange', type, '[from] ability: Ordinary Magician');
			}
		},
		onUpdate(pokemon) {
			if (pokemon.status === 'brn' || pokemon.status === 'frz' || pokemon.status === 'par' || pokemon.status === 'psn' || pokemon.status === 'tox' || pokemon.status === 'slp') {
				this.add('-activate', pokemon, 'ability: Ordinary Magician');
				pokemon.cureStatus();
			}
		},
		onSetStatus(status, target, source, effect) {
			if (status.id !== 'brn' || status.id !== 'frz' || status.id !== 'par' || status.id !== 'psn' || status.id !== 'tox' || status.id !== 'slp') return;
			if ((effect as Move)?.status) {
				this.add('-immune', target, '[from] ability: Ordinary Magician');
			}
			return false;
		},
		onTryAddVolatile(status, target) {
			if (status.id === 'yawn') {
				this.add('-immune', target, '[from] ability: Ordinary Magician');
				return null;
			}
		},
		onSwitchOut(pokemon) {
			this.actions.useMove('Fling', pokemon);
		},
		flags: { breakable: 1 },
		name: "Ordinary Magician",
		gen: 9,
	},
	// Sanae Kochiya
	windpriestess: {
		desc: "This Pokemon summons a random weather upon switching in and gains +1 Defense, Special Attack or Special Defense per turn.",
		shortDesc: "Switch-in: Random weather. +1 Def, Spd, or Spe per turn.",
		onStart(pokemon) {
			const w = this.random(4);
			if (w === 0) {
				this.field.setWeather('sunnyday');
				this.add('-message', `${pokemon.name}'s Wind Priestess summoned harsh sunlight!`);
			} else if (w === 1) {
				this.field.setWeather('raindance');
				this.add('-message', `${pokemon.name}'s Wind Priestess summoned heavy rain!`);
			} else if (w === 2) {
				this.field.setWeather('snow');
				this.add('-message', `${pokemon.name}'s Wind Priestess summoned a snowstorm!`);
			} else {
				this.field.setWeather('sandstorm');
				this.add('-message', `${pokemon.name}'s Wind Priestess summoned a sandstorm!`);
			}
		},
		onResidual(pokemon) {
			if (pokemon.activeTurns) {
				const s = this.random(3);
				if (s === 0) {
					this.boost({ spd: 1 });
				} else if (s === 1) {
					this.boost({ def: 1 });
				} else {
					this.boost({ spa: 1 });
				}
			}
		},
		flags: {},
		name: "Wind Priestess",
		gen: 9,
	},
	// Prince Smurf
	quickcamo: {
		shortDesc: "Changes type to resist move before hit + Protean. First move slot always stab.",
		name: "Quick Camo",
		onTryHit(target, source, move) {
			if (target === source) return;
			if (move.flags['futuremove']) return;
			const possibleTypes = [];
			const attackType = move.type;
			for (const type of this.dex.types.names()) {
				if (target.hasType(type)) continue;
				const typeCheck = this.dex.types.get(type).damageTaken[attackType];
				if (typeCheck === 2) {
					possibleTypes.push(type);
				}
			}
			if (!possibleTypes.length) return;
			const randomType = this.sample(possibleTypes);
			target.setType(randomType);
			this.add('-start', target, 'typechange', randomType);
		},
		onPrepareHit(source, target, move) {
			if (move.hasBounced || move.flags['futuremove'] || move.sourceEffect === 'snatch') return;
			const type = move.type;
			if (type && type !== '???' && source.getTypes().join() !== type) {
				source.setType(type);
				this.add('-start', source, 'typechange', type, '[from] ability: Quick Camo');
			}
		},
		onModifyMove(move, pokemon, target) {
			const types = pokemon.getTypes(true);
			const noModifyType = [
				'judgment', 'multiattack', 'naturalgift', 'revelationdance', 'technoblast', 'terrainpulse', 'weatherball',
			];
			if (noModifyType.includes(move.id)) return;
			for (const [i, type] of types.entries()) {
				if (!this.dex.types.isName(type)) continue;
				if (pokemon.moveSlots[i] && move.id === pokemon.moveSlots[i].id) move.type = type;
			}
		},
		flags: {},
	},
	// Kozuchi
	scrapworker: {
		desc: "1.1x Accuracy. Reduces damage from Physical Attacks by 75% and Special Attacks by 30%. Loses 25% for Physical and 10% for Special with each attack received.",
		shortdesc: "1.1x Accuracy. 75% Damage Reduction vs Physical and 30% vs Special. Loses 1/3rd damage reduction when attacked.",
		onStart(pokemon) {
			if (!pokemon.abilityState.armor && !pokemon.abilityState.usedArmor) {
				this.add('-activate', pokemon, 'ability: Scrapworker');
				pokemon.abilityState.armor = 3;
				pokemon.abilityState.usedArmor = true;
				this.add('-message', `${pokemon.name} equipped their armor from Scrapworker!`);
			}
		},
		onSourceModifyDamage(damage, source, target, move) {
			if (move.category === 'Physical') {
				if (!target.abilityState.armor) return;
				if (target.abilityState.armor === 3) return this.chainModify(0.25);
				if (target.abilityState.armor === 2) return this.chainModify(0.5);
				if (target.abilityState.armor === 1) return this.chainModify(0.75);
			}
			if (move.category === 'Special') {
				if (!target.abilityState.armor) return;
				if (target.abilityState.armor === 3) return this.chainModify(0.7);
				if (target.abilityState.armor === 2) return this.chainModify(0.8);
				if (target.abilityState.armor === 1) return this.chainModify(0.9);
			}
		},
		onSourceModifyAccuracy(accuracy) {
			if (typeof accuracy !== 'number') return;
			this.debug('Scrapworker - enhancing accuracy');
			return accuracy * 1.1;
		},
		onDamagingHit(damage, source, target, move) {
			if (source.abilityState.armor && source.abilityState.armor > 0) {
				source.abilityState.armor -= 1;
				if (source.abilityState.armor > 0) this.add('-message', `${source.name}'s armor was chipped!`);
				if (source.abilityState.armor === 0) this.add('-message', `${source.name}'s armor broke!`);
			}
		},
		onBasePower(basePower, pokemon, move) {
			if (!pokemon.abilityState.enhancement) return;
			if (pokemon.abilityState.enhancement === 1) return this.chainModify(1.3);
			if (pokemon.abilityState.enhancement === 2) return this.chainModify(1.82);
			if (pokemon.abilityState.enhancement === 3) return this.chainModify(2.73);
		},
	},
	// Urabrask
	praetorsgrasp: {
		name: "Praetor's Grasp",
		desc: "Opposing Pokemon that have been active for less than 2 turns are prevented from switching.",
		shortDesc: "Opposing Pokemon that have been active for less than 2 turns cannot switch.",
		gen: 9,
		onFoeTrapPokemon(pokemon) {
			if (!pokemon.activeTurns || pokemon.activeTurns < 2) pokemon.tryTrap(true);
		},
	},
	// Sariel
	angelofdeath: {
		desc: "While this Pokemon is active, opposing Pokemon are prevented from healing and lose HP equal to 1/16 of their max HP per turn.",
		shortDesc: "Opponents cannot heal; Lose 1/16 max HP per turn.",
		onDisableMove(pokemon) {
			for (const target of pokemon.foes()) {
				for (const moveSlot of target.moveSlots) {
					if (this.dex.moves.get(moveSlot.id).flags['heal']) {
						target.disableMove(moveSlot.id);
					}
				}
			}
		},
		onBeforeMovePriority: 6,
		onFoeTryMove(target, source, move) {
			if (move.flags['heal'] && !move.isZ && !move.isMax) {
				this.attrLastMove('[still]');
				this.add('cant', target, 'ability: Angel of Death', move);
				return false;
			}
		},
		onResidualOrder: 28,
		onResidualSubOrder: 2,
		onResidual(pokemon) {
			if (!pokemon.hp) return;
			for (const target of pokemon.foes()) {
				this.damage(target.baseMaxhp / 16, target, pokemon);
			}
		},
		onTryHeal(damage, pokemon, effect) {
			for (const target of pokemon.foes()) {
				if ((effect?.id === 'zpower') || this.effectState.isZ) return damage;
				return false;
			}
		},
		flags: {},
		name: "Angel of Death",
		gen: 9,
	},
	// Mima
	vengefulspirit: {
		desc: "This Pokemon's attacks hit before the target switches. This Pokemon's attacks knock off the target's held item.",
		shortDesc: "Hits before target switches; Attacks knock off item.",
		onBeforeTurn(pokemon) {
			for (const side of this.sides) {
				if (side.hasAlly(pokemon)) continue;
				side.addSideCondition('vengefulspirit', pokemon);
				const data = side.getSideConditionData('vengefulspirit');
				if (!data.sources) {
					data.sources = [];
				}
				data.sources.push(pokemon);
			}
		},
		onTryHit(source, target) {
			target.side.removeSideCondition('vengefulspirit');
		},
		onAfterMoveSecondarySelf(source, target, move) {
			if (!move || !target || source.switchFlag === true) return;
			if (target !== source && move.category !== 'Status') {
				const item = target.takeItem(source);
				if (item) this.add('-enditem', target, item.name, '[from] ability: Vengeful Spirit', '[of] ' + source);
			}
		},
		condition: {
			duration: 1,
			onBeforeSwitchOut(pokemon) {
				const move = this.queue.willMove(pokemon.foes()[0]);
				const moveName = move && move.moveid ? move.moveid.toString() : "";
				this.debug('Pursuit start');
				let alreadyAdded = false;
				pokemon.removeVolatile('destinybond');
				for (const source of this.effectState.sources) {
					if (!source.isAdjacent(pokemon) || !this.queue.cancelMove(source) || !source.hp) continue;
					if (!alreadyAdded) {
						this.add('-activate', pokemon.foes()[0], 'ability: Vengeful Spirit');
						alreadyAdded = true;
					}
					if (source.canMegaEvo || source.canUltraBurst) {
						for (const [actionIndex, action] of this.queue.entries()) {
							if (action.pokemon === source && action.choice === 'megaEvo') {
								this.actions.runMegaEvo(source);
								this.queue.list.splice(actionIndex, 1);
								break;
							}
						}
					}
					this.actions.runMove(moveName, source, source.getLocOf(pokemon));
				}
			},
		},
		flags: {},
		name: "Vengeful Spirit",
		gen: 9,
	},
	// Gizmo
	headonbattery: {
		name: "Head-On Battery",
		desc: "Allows this Pokemon to use Charge up to three times. Deals (100HP*number of charges) damage to target after reaching three charges. 12.5-25% recoil. Forces user to switch to a random ally. Increases Attack and Speed by 50% for each charge this Pokemon has.",
		shortDesc: "See '/ssb Gizmo' for more!",
		onStart(pokemon) {
			if (pokemon.abilityState.recallActive && !pokemon.item) {
				pokemon.setItem('inconspicuouscoin');
				this.add('-item', pokemon, pokemon.getItem(), '[from] item: Inconspicuous Coin');
				pokemon.abilityState.recallActive = false;
			}
		},
		onSwitchOut(pokemon) {
			pokemon.abilityState.firedUp = false;
		},
		onModifyMove(move, pokemon) {
			const target = pokemon.side.foe.active[pokemon.side.foe.active.length - 1 - pokemon.position];
			if (move.id === 'charge') {
				if (!pokemon.abilityState.charges) pokemon.abilityState.charges = 0;
				if (pokemon.abilityState.charges > 3) return;
				pokemon.abilityState.charges += 1;
				if (pokemon.abilityState.charges > 3) {
					this.add('-activate', pokemon, '[from] ability: Head-On Battery');
					this.add('-message', `${pokemon.name} is overflowing with charge!`);
					this.add(`-anim`, pokemon, "Thunderclap", pokemon);
					this.add(`-anim`, pokemon, "Volt Tackle", target);
					this.damage(100 * pokemon.abilityState.charges, target, pokemon);
					pokemon.abilityState.charges = 0;
					this.add('-message', `${pokemon.name} was launched away by the impact!`);
					if (pokemon.hp && !pokemon.fainted) pokemon.forceSwitchFlag = true;
					return false;
				}
			}
		},
		onModifyAtkPriority: 5,
		onModifyAtk(atk, pokemon) {
			if (!pokemon.abilityState.charges) return;
			this.debug('Charge boost');
			return this.chainModify(1 + (0.5 * pokemon.abilityState.charges));
		},
		onModifySpe(spe, pokemon) {
			if (!pokemon.abilityState.charges) return;
			this.debug('Charge boost');
			return this.chainModify(1 + (0.5 * pokemon.abilityState.charges));
		},
		onModifyCritRatio(critRatio, source, target) {
			if (source.abilityState.firedUp) return critRatio + 2;
		},
		onModifyAccuracyPriority: -1,
		onModifyAccuracy(accuracy, target, source, move) {
			if (typeof accuracy !== 'number') return;
			if (target.abilityState.firedUp) {
				return this.chainModify([3277, 4096]);
			}
		},
		gen: 9,
	},
	// Aeri
	woventogethercohereforever: {
		name: "Woven Together, Cohere Forever",
		gen: 9,
		desc: "Whenever this Pokemon uses a Flying-type move, it hits for the next three turns using the typing of your team's last used move before the Flying-type move. Opposing Pokemon take x1.4 damage from attacks of this typing for three turns.",
		shortDesc: "Flying moves hit for 3-turns using team's last attack type.",
		onBeforeMovePriority: 9,
		onBeforeMove(pokemon) {
			if (!pokemon.side.lastMoveUsed) return;
			this.effectState.lastMoveType = pokemon.side.lastMoveUsed.type;
		},
		onModifyMove(move, pokemon, target) {
			if (move.type === 'Flying' && pokemon.side.lastMoveUsed) {
				if (!target.side.addSideCondition('woventogethercohereforever')) return;
				target.side.addSideCondition('woventogethercohereforever');
				target.side.sideConditions['woventogethercohereforever'].type = this.effectState.lastMoveType;
			}
		},
		condition: {
			duration: 3,
			onDamagePriority: 1,
			onDamage(damage, target, source, effect) {
				if (effect.effectType === 'Move') {
					let move = this.dex.getActiveMove(effect.id);
					if (move.type === this.effectState.type) {
						this.debug('wtcf 1.4 damage boost due to typing match');
						return damage * 1.4;
					}
				}
			},
			onResidual(pokemon) {
				let sources = pokemon.side.foe.pokemon.filter(ally => ally.ability === 'woventogethercohereforever');
				let source = sources[0];
				let move = this.dex.getActiveMove('blissfulbreeze');
				move.type = this.effectState.type;
				this.add('-anim', pokemon, 'Geomancy', pokemon);
				// @ts-ignore
				const damage = this.actions.getDamage(source, pokemon, move);
				this.damage(damage * 1.4, pokemon, source, this.dex.conditions.get('Woven Together, Cohere Forever'));
			},
		},
	},
	// Glint
	augmentthegiants: {
		name: "Augment the Giants",
		gen: 9,
		onBeforeMove(pokemon, target, move) {
			if (move.category !== 'Physical') return;
			this.add('-activate', pokemon, 'ability: Augment the Giants');
			changeSet(this, pokemon, ssbSets['Glint-Melmetal']);
		},
		onAfterMove(source, target, move) {
			if (source.species.id === 'meltan') return;
			this.add('-activate', source, 'ability: Augment the Giants');
			changeSet(this, source, ssbSets['Glint']);
		},
	},
	// Finger
	absolutezen: {
		name: "Absolute Zen",
		desc: "This Pokemon cannot be taunted, confused, or infatuated, and at the end of every turn, restores HP equal to 1/5 of the total damage dealt to this Pokemon this turn.",
		shortDesc: "Immune to Taunt/Confusion/Infatuation; Heals 1/4 total damage taken at end of turn.",
		gen: 9,
		// Damage Recovery
		onDamagePriority: 1,
		onDamage(damage, target, source, effect) {
			if (!target.abilityState.damageThisTurn) target.abilityState.damageThisTurn = 0;
			target.abilityState.damageThisTurn += damage;
		},
		onResidual(pokemon) {
			if (!pokemon.abilityState.damageThisTurn) return;
			if (pokemon.abilityState.damageThisTurn > 0) {
				this.heal(pokemon.abilityState.damageThisTurn / 4, pokemon, pokemon, this.effect);
				pokemon.abilityState.damageThisTurn = 0;
			}
		},
		onUpdate(pokemon) {
			// Infatuation Immunity
			if (pokemon.volatiles['attract']) {
				this.add('-activate', pokemon, 'ability: Absolute Zen');
				pokemon.removeVolatile('attract');
				this.add('-end', pokemon, 'move: Attract', '[from] ability: Absolute Zen');
			}
			// Taunt Immunity
			if (pokemon.volatiles['taunt']) {
				this.add('-activate', pokemon, 'ability: Absolute Zen');
				pokemon.removeVolatile('taunt');
			}
			// Confusion Immunity
			if (pokemon.volatiles['confusion']) {
				this.add('-activate', pokemon, 'ability: Absolute Zen');
				pokemon.removeVolatile('confusion');
			}
		},
		onTryAddVolatile(status, pokemon) {
			if (status.id === 'confusion') return null;
		},
		onTryHit(pokemon, target, move) {
			if (move.id === 'attract' || move.id === 'captivate' || move.id === 'taunt' || move?.volatileStatus === 'confusion') {
				this.add('-immune', pokemon, '[from] ability: Absolute Zen');
				return null;
			}
		},
	},
	// Pablo
	artistblock: {
		name: 'Artist Block',
		gen: 9,
		desc: "Whenever this Pokemon has a stat lowered, its Attack, Special Attack, and Speed increase by 2 stages. This Pokemon cannot be taunted. This Pokemon usually goes first when using Sketch.",
		shortDesc: "Stat(s) lowered: +2 Atk/Spa/Spe; Cannot be taunted; Sketch: +1 Priority.",
		onAfterEachBoost(boost, target, source, effect) {
			if (!source || target.isAlly(source)) {
				return;
			}
			let statsLowered = false;
			let i: BoostID;
			for (i in boost) {
				if (boost[i]! < 0) {
					statsLowered = true;
				}
			}
			if (statsLowered) {
				this.boost({ atk: 2 }, target, target, null, false, true);
				this.boost({ spa: 2 }, target, target, null, false, true);
				this.boost({ spe: 2 }, target, target, null, false, true);
			}
		},
		onUpdate(pokemon) {
			if (pokemon.volatiles['taunt']) {
				this.add('-activate', pokemon, 'ability: Artist Block');
				pokemon.removeVolatile('taunt');
			}
		},
		onTryHit(pokemon, target, move) {
			if (move.id === 'taunt') {
				this.add('-immune', pokemon, '[from] ability: Artist Block');
				return null;
			}
		},
		onModifyPriority(priority, pokemon, target, move) {
			if (move.id === 'sketch') return priority + 1;
		},
	},
	// Trey
	concentration: {
		desc: "Starts Dynamite Arrow on the opposing side upon switching in. This Pokemon has x1.3 speed. This Pokemon's attacks cannot miss. This Pokemon's attacks have 1.5x power and +2 crit ratio after one full turn of not being attacked.",
		shortDesc: "See '/ssb Trey' for more!",
		onStart(pokemon) {
			const target = pokemon.side.foe.active[pokemon.side.foe.active.length - 1 - pokemon.position];
			target.side.addSideCondition('dynamitearrow');
			this.add('-anim', pokemon, 'Ember', pokemon);
			this.add('-message', `${pokemon.name} is preparing Dynamite Arrow!`);
			this.add('-message', `${pokemon.name} is building concentration!`);
			pokemon.abilityState.damaged = false;
			pokemon.abilityState.concentrated = true;
		},
		onDamagingHit(damage, target, source, move) {
			if (!target.abilityState.damaged && target.abilityState.concentrated) {
				target.abilityState.damaged = true;
				target.abilityState.concentrated = false;
				this.add('-message', `${target.name} lost their concentration!`);
			}
		},
		onSourceModifyAccuracyPriority: -1,
		onSourceModifyAccuracy(accuracy) {
			if (typeof accuracy !== 'number') return;
			this.debug('concentration - user will not miss');
			return true;
		},
		onResidual(pokemon, target) {
			if (!pokemon.abilityState.damaged && !pokemon.abilityState.concentrated) {
				pokemon.abilityState.concentrated = true;
				this.add('-anim', pokemon, 'Focus Energy', pokemon);
				this.add('-message', `${pokemon.name} is building concentration!`);
				return;
			}
			pokemon.abilityState.damaged = false;
		},
		onBasePowerPriority: 29,
		onBasePower(basePower, pokemon, target, move) {
			if (pokemon.abilityState.concentrated) {
				this.debug(`concentration bp boost, concentration disabled`);
				pokemon.abilityState.concentrated = false;
				return move.basePower * 1.5;
			}
			return move.basePower;
		},
		onModifyCritRatio(critRatio, pokemon, target, move) {
			if (pokemon.abilityState.concentrated) {
				return move.critRatio + 2;
			}
			return move.critRatio;
		},
		flags: {},
		name: "Concentration",
		gen: 9,
	},
};
