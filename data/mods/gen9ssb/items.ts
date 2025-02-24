export const Items: { [k: string]: ModdedItemData } = {
	// Roughskull
	cheaterglasses: {
		name: "Cheater Glasses",
		desc: "This Pokemon takes halved damage from attacks when it's at full HP. On switch-in, This Pokemon's Attack or Special Attack increases by 1 stage based on the foe's lower defense stat, and this Pokemon's Defense or Special Defense increases by 1 stage based on the foe's higher attack stat.",
		shortDesc: "On switch-in, boosts stats based on foe's weaker Defense/stronger Attack; Multiscale.",
		gen: 9,
		onStart(pokemon) {
			let totaldef = 0;
			let totalspd = 0;
			let totalatk = 0;
			let totalspa = 0;
			for (const target of pokemon.side.foe.active) {
				if (!target || target.fainted || target.hp <= 0) continue;
				totaldef += target.getStat('def', false, true);
				totalspd += target.getStat('spd', false, true);
				totalatk += target.getStat('atk', false, true);
				totalspa += target.getStat('spa', false, true);
			}
			if (totaldef && totaldef > totalspd) {
				this.boost({ spa: 1 });
			} else if (totalspd && totalspd > totaldef) {
				this.boost({ atk: 1 });
			} else {
				if (this.randomChance(1, 2)) {
					this.boost({ spa: 1 });
				} else {
					this.boost({ atk: 1 });
				}
			}
			if (totalatk && totalatk > totalspa) {
				this.boost({ def: 1 });
			} else if (totalspa && totalspa > totalatk) {
				this.boost({ spd: 1 });
			} else {
				if (this.randomChance(1, 2)) {
					this.boost({ def: 1 });
				} else {
					this.boost({ spd: 1 });
				}
			}
		},
		onSourceModifyDamage(damage, source, target, move) {
			if (target.hp >= target.maxhp) {
				this.debug(`Cheater Glasses halving damage from full HP`);
				return this.chainModify(0.5);
			}
		},
	},
	// Horrific17
	horrifiumz: {
		name: "Horrifium Z",
		gen: 9,
		shortDesc: "Arcanine with Meteor Strike can use Chicxulub Impact.",
		desc: "If held by an Arcanine with Meteor Strike, it can use Chicxulub Impact.",
		zMove: "Chicxulub Impact",
		zMoveFrom: "Meteor Strike",
		itemUser: ["Arcanine"],
		onTakeItem: false,
	},
	// Lyssa
	ramen: {
		name: "Ramen",
		gen: 9,
		desc: "At end of turn, holder's Speed is increased by 1 stage and restores 1/4 max HP. Single use.",
		shortDesc: "+25% HP/+1 SPE at end of turn. Single use.",
		onResidual(pokemon) {
			pokemon.eatItem();
		},
		onEat(pokemon) {
			this.heal(pokemon.baseMaxhp / 4);
			this.boost({ spe: 1 });
		},
	},
	// Gadget
	everythingamajig: {
		name: "Everythingamajig",
		gen: 9,
		desc: "Upon switching in, copies the foe's item, replacing Everythingamajig. Reverts back to Everythingamajig upon switching out. If no active foes have a held item upon switching in, Everythingamajig explodes; Holder loses 1/3 max HP. If the holder uses Pay Day, it changes type to match the holder's primary type.",
		shortDesc: "Copies the foe's item until the holder switches.",
		onStart(pokemon) {
			if (!pokemon.volatiles['everythingamajig']) pokemon.addVolatile('everythingamajig');
		},
		condition: {
			onStart(pokemon) {
				let myItem = false;
				let success = false;
				for (const target of pokemon.side.foe.active) {
					if (target.item) {
						success = true;
						myItem = target.getItem();
					}
				}
				if (!myItem) success = false;
				if (!success) {
					this.add('-message', `Everythingamajig couldn't find an identity and seized up!`);
					this.add('-anim', pokemon, 'Explosion', pokemon);
					this.add('-anim', pokemon, 'Tickle', pokemon);
					this.damage(pokemon.maxhp / 3);
					this.add('-enditem', pokemon, 'Everythingamajig');
					pokemon.clearItem();
					return;
				}
				this.add('-activate', pokemon, 'item: Everythingamajig');
				this.add('-message', `Everythingamajig transformed into ${myItem.name}!`);
				pokemon.item = myItem.id;
				pokemon.setItem(myItem);
			},
			onModifyMove(move, pokemon) {
				if (move.id === 'payday') move.type = pokemon.getTypes()[0];
			},
			onSwitchOut(pokemon) {
				if (pokemon.item) pokemon.setItem('Everythingamajig');
				pokemon.removeVolatile('everythingamajig');
			},
		},
	},
	// Mink
	corpselily: {
		name: "Corpse Lily",
		gen: 9,
		desc: "This Pokemon recovers 1/16 of its max HP at end of turn and an additional 1/16 of its max HP for each active Pokemon that is poisoned (other than the holder). If the holder is hit by a contact move, the attacker has a 30% chance to become poisoned. If held by a Venusaur-Mega with Transfuse Toxin, it can use Toxic Deluge.",
		shortDesc: "+1/16 HP; +1/16 for each poisoned Pokemon; Contact: 30% PSN.",
		zMove: "Toxic Deluge",
		zMoveFrom: "Transfuse Toxin",
		itemUser: ["Venusaur", "Venusaur-Mega"],
		onTakeItem: false,
		onResidual(pokemon) {
			if (!pokemon || !pokemon.hp) return;
			let totalPsn = 0;
			for (const target of this.getAllActive()) {
				if (!target.status || pokemon === target) continue;
				if (target.status === 'psn' || target.status === 'tox') totalPsn++;
			}
			if (!totalPsn) {
				this.heal(pokemon.baseMaxhp / 16);
			} else if (totalPsn >= 1) {
				this.heal((pokemon.baseMaxhp / 16) * totalPsn);
			}
		},
	},
	// Cinque
	moogleplushie: {
		name: "Moogle Plushie",
		gen: 9,
		shortDesc: "1.5x Atk/Def/SpDef; Allows use of Homerun Swing",
		desc: "This Pokemon's Attack, Defense, and Special Defense are 1.5x. If held by a Marowak with Homerun Swing - Windup, it can use Homerun Swing.",
		zMove: "Homerun Swing",
		zMoveFrom: "Homerun Swing - Windup",
		itemUser: ["Marowak"],
		onTakeItem: false,
		onModifyAtk(atk) {
			return this.chainModify(1.5);
		},
		onModifyDef(def) {
			return this.chainModify(1.5);
		},
		onModifySpD(spd) {
			return this.chainModify(1.5);
		},
	},
	// Marvin
	thehappyknife: {
		name: "The Happy Knife",
		gen: 9,
		desc: "This Pokémon's damaging moves hit twice. The second hit is Fire-type and has its damage quartered.",
		shortDesc: "Attacks hit twice; 2nd hit is Fire-type and has 1/4 damage.",
		onModifyMove(move) {
			if (move.multihit || move.category === 'Status' ||
				move.isZ || move.isMax || move.id === 'itembox') return;
			move.multihit = 2;
		},
		onBasePower(basePower, user, target, move) {
			if (move.hit > 1) {
				move.type = 'Fire';
				this.add('-anim', user, 'Fire Lash', target);
				return this.chainModify(0.25);
			}
		},
	},
	// Tao
	zhuyou: {
		name: "Zhuyou",
		gen: 9,
		shortDesc: "1.25x stats; Crits heal user 1/4 max HP; Cures status.",
		desc: "This Pokemon's stats are 1.25x, including HP. Whenever this Pokemon lands a critical hit, it recovers 1/4 of its max HP. At the end of each turn, this Pokemon is cured of any present status conditions.",
		onTakeItem: false,
		onStart(pokemon) {
			if (pokemon.itemState.zhuyouActivated) return;
			this.add('-activate', pokemon, 'item: Zhuyou');
			this.add('-message', `${pokemon.name}'s maximum HP increased!`);
			const newHp = Math.ceil(pokemon.hp * 1.25);
			const newMaxHp = Math.ceil(pokemon.maxhp * 1.25);
			pokemon.hp = newHp;
			pokemon.maxhp = newMaxHp;
			pokemon.baseMaxhp = newMaxHp;
			this.add('-heal', pokemon, pokemon.getHealth, '[silent]');
			pokemon.itemState.zhuyouActivated = true;
		},
		onModifySpD(spd, pokemon) {
			return this.chainModify(1.25);
		},
		onModifyDef(def, pokemon) {
			return this.chainModify(1.25);
		},
		onModifyAtk(atk, pokemon) {
			return this.chainModify(1.25);
		},
		onModifySpA(spa, pokemon) {
			return this.chainModify(1.25);
		},
		onModifySpe(spe, pokemon) {
			return this.chainModify(1.25);
		},
		onAfterMoveSecondarySelf(source, target, move) {
			if (target.getMoveHitData(move).crit) {
				this.heal(source.maxhp / 8, source);
			}
		},
		onResidual(pokemon) {
			if (!pokemon.status) return;
			if (pokemon.cureStatus()) {
				this.add('-curestatus', pokemon, pokemon.status, '[from] item: Zhuyou');
			}
		},
	},
	// Saint Deli
	giftsack: {
		name: "Gift Sack",
		gen: 9,
		shortDesc: "Swaps foe's strongest move; Absorbs up to 1 special move.",
		desc: "Replaces the target's strongest attacking move with another random move on switch-in. If this Pokemon is hit by a Special attack, it stores the attack and takes no damage, storing up to one attack. Upon using Gift of Fortune, holder uses move stored by Gift Sack if one is present.",
		onStart(pokemon) {
			let max = 0;
			let strongestMove;
			const target = pokemon.side.foe.active[pokemon.side.foe.active.length - 1 - pokemon.position];
			// Find opposing Pokemon's strongest attack
			for (const moveSlot of target.moveSlots) {
				const move = this.dex.moves.get(moveSlot.move);
				if (move.category === 'Status' || !move.basePower) continue;
				if (move.basePower > max) {
					max = move.basePower;
					strongestMove = move;
				}
			}
			if (!strongestMove) return;
			const moveIndex = target.moves.indexOf(strongestMove.id);
			const allMoves = this.dex.moves.all().filter(m => (
				(!target.moves.includes(m.id)) &&
				(!m.isNonstandard || m.isNonstandard === 'Unobtainable') &&
				(m.flags['metronome'])
			));
			const randomMove = this.sample(allMoves);
			target.moveSlots[moveIndex] = {
				move: randomMove.name,
				id: randomMove.id,
				pp: randomMove.pp,
				maxpp: randomMove.pp,
				target: randomMove.target,
				disabled: false,
				used: false,
				virtual: true,
			};
			this.add('-activate', pokemon, 'item: Gift Sack');
			this.add('-anim', pokemon, 'Present', target);
			this.add('-anim', target, 'Tickle', target);
			this.add('-message', `${target.name} forgot ${strongestMove.name}, and learned ${randomMove.name}!`);
		},
		onTryHit(pokemon, source, move) {
			if (move.category === 'Special' && pokemon !== source) {
				if (!pokemon.abilityState.sack) pokemon.abilityState.sack = [];
				if (pokemon.abilityState.sack.length >= 1) return;
				this.add('-anim', pokemon, 'Present', pokemon);
				this.add('-anim', pokemon, 'Tickle', pokemon);
				this.add('-activate', pokemon, 'item: Gift Sack', move.name);
				this.add('-message', `${pokemon.name} stored ${move.name} in its Gift Sack!`);
				pokemon.abilityState.sack.push(move.name);
				return null;
			}
		},
		onBasePowerPriority: 15,
		onBasePower(basePower, user, target, move) {
			if (!user.abilityState.sack) return;
			if (user.abilityState.sack.length && move.id === 'giftoffortune') {
				this.add('-message', `${user.name}'s Gift Sack amplified ${move.name}'s power!`);
				return this.chainModify(1 + 0.5 * user.abilityState.sack.length);
			}
		},
	},
	// Rooci Caxa
	spiritberry: {
		name: "Spirit Berry",
		gen: 9,
		isBerry: true,
		shortDesc: "Phantom Force: 1 turn; If hit by physical move: Ghost-type added to Target. Single use.",
		desc: "Completes holder's Phantom Force in one turn. If the holder is hit by a physical move, adds Ghost to the target's type(s).",
		onHit(target, source, move) {
			if (move.type === 'Physical' && target.eatItem()) {
				if (!source.addType('Ghost')) return false;
				this.add('-start', source, 'typeadd', 'Ghost', '[from] item: Spirit Berry');
			}
		},
		onChargeMove(pokemon, target, move) {
			if (pokemon.eatItem() && move.id === 'phantomforce') {
				this.debug('spirit berry - remove charge turn for ' + move.id);
				this.attrLastMove('[still]');
				this.addMove('-anim', pokemon, move.name, target);
				return false;
			}
		},
		onEat() { },
	},
	// Kusanali
	seedofstoredknowledge: {
		name: "Seed of Stored Knowledge",
		gen: 9,
		shortDesc: "Inflicts Akasha Seeds upon hitting a Pokemon with a Grass-type move.",
		onAfterMoveSecondarySelf(source, target, move) {
			if (source !== target && move.type === 'Grass') {
				this.add('-activate', source, '[from] item: Seed of Stored Knowledge');
				target.addVolatile('akashaseeds');
			}
		},
	},
	// Morax
	hadeansoil: {
		name: "Hadean Soil",
		gen: 9,
		onStart(pokemon) {
			if (pokemon.itemState.soilActivated) return;
			this.add('-activate', pokemon, 'item: Hadean Soil');
			this.add('-anim', pokemon, 'Sand Attack', pokemon);
			this.add('-message', `${pokemon.name}'s maximum HP increased!`);
			const newHp = Math.ceil(pokemon.hp * 1.31);
			const newMaxHp = Math.ceil(pokemon.maxhp * 1.31);
			pokemon.hp = newHp;
			pokemon.maxhp = newMaxHp;
			pokemon.baseMaxhp = newMaxHp;
			this.add('-heal', pokemon, pokemon.getHealth, '[silent]');
			pokemon.itemState.soilActivated = true;
		},
		onTryHit(pokemon, source, move) {
			if (pokemon !== source && move.type === 'Ground' || move.type === 'Rock') {
				if (['homerunswing', 'homerunswingwindup'].includes(move.id)) return;
				this.add('-immune', pokemon);
				this.heal(pokemon.maxhp / 4, pokemon);
				return null;
			}
		},
		onAfterMoveSecondarySelf(source, target, move) {
			if (source !== target && move.category !== 'Status' && move.type === 'Ground' || move.type === 'Rock') {
				if (target.side.sideConditions['stealthrock']) return;
				this.add('-activate', source, 'item: Hadean Soil', move.name);
				target.side.addSideCondition('stealthrock', target);
			}
		},
		onTakeItem: false,
		zMove: "Planet Befall",
		zMoveFrom: "Dominus Lapidis",
		itemUser: ["Landorus"],
	},
	// Varnava
	varnaviumz: {
		name: "Varnavium Z",
		gen: 9,
		desc: "If held by Varnava with Core Enforcer, it can use Southern Island's Last Defense, and its moves have -1 priority.",
		shortDesc: "-1 Priority. If held by Varnava with Core Enforcer, it can use Southern Island's Last Defense.",
		onTakeItem: false,
		zMove: "Southern Island's Last Defense",
		zMoveFrom: "Core Enforcer",
		itemUser: ["Zygarde-Complete", "Zygarde-10%", "Zygarde"],
		onModifyMove(move, pokemon) {
			if (pokemon.name === 'Varnava' && pokemon.moves.indexOf('coreenforcer')) move.priority = -1;
		},
	},
	// Aevum
	rewindwatch: {
		name: "Rewind Watch",
		shortDesc: "Calyrex: Grass/Steel. Survives first KO and fully heals.",
		desc: "Holder becomes Grass/Steel type if held by a Calyrex. If the holder would be knocked out by an attacking move, survives with at least one HP, then restores back to full health. Cannot be taken or removed. Single use.",
		gen: 9,
		onTakeItem: false,
		onStart(pokemon) {
			if (pokemon.baseSpecies.baseSpecies === 'Calyrex' && pokemon.setType(['Grass', 'Steel'])) {
				this.add('-start', pokemon, 'typechange', 'Grass/Steel', '[from] item: Rewind Watch');
			}
		},
		onDamage(damage, target, source, effect) {
			if (damage >= target.hp && effect && effect.effectType === 'Move') {
				target.itemState.useWatch = true;
				this.add('-activate', target, 'item: Rewind Watch');
				return target.hp - 1;
			}
		},
		onAfterMoveSecondary(target, source, move) {
			if (target.itemState.useWatch) {
				target.useItem();
				this.heal(target.maxhp - target.hp, target, target, 'item: Rewind Watch');
			}
		},
	},
	// Suika Ibuki
	ibukigourd: {
		name: "Ibuki Gourd",
		spritenum: 697,
		desc: "1.5x Attack and +1/16 HP per turn if held by an Ogerpon, otherwise the user loses 1/8 HP instead; only the first move executed can be selected.",
		fling: {
			basePower: 80,
		},
		onStart(pokemon) {
			if (pokemon.volatiles['choicelock']) {
				this.debug('removing choicelock: ' + pokemon.volatiles['choicelock']);
			}
			pokemon.removeVolatile('choicelock');
		},
		onModifyMove(move, pokemon) {
			pokemon.addVolatile('choicelock');
		},
		onModifyAtkPriority: 1,
		onModifyAtk(atk, pokemon) {
			if (pokemon.species.id === 'ogerpon') {
				return this.chainModify(1.5);
			}
		},
		onResidualOrder: 5,
		onResidualSubOrder: 4,
		onResidual(pokemon) {
			if (pokemon.species.id !== 'ogerpon') {
				this.damage(pokemon.baseMaxhp / 8);
			}
		},
		isChoice: true,
		gen: 9,
	},
	// Jack
	hagakure: {
		name: "Hagakure",
		gen: 9,
		onStart(pokemon) {
			if (pokemon.hp === pokemon.maxhp) {
				if (!pokemon.abilityState.hagakure) {
					this.add('-anim', pokemon, 'Mist', pokemon);
					this.add('-message', `${pokemon.name}'s Hagakure activated!`);
				}
				pokemon.abilityState.hagakure = true;
			} else {
				pokemon.abilityState.hagakure = false;
			}
		},
		onUpdate(pokemon) {
			if (pokemon.hp === pokemon.maxhp) {
				if (!pokemon.abilityState.hagakure) {
					this.add('-anim', pokemon, 'Mist', pokemon);
					this.add('-message', `${pokemon.name}'s Hagakure activated!`);
				}
				pokemon.abilityState.hagakure = true;
			} else {
				if (pokemon.abilityState.hagakure) {
					this.add('-message', `${pokemon.name}'s Hagakure vanished!`);
				}
				pokemon.abilityState.hagakure = false;
			}
		},
		onModifyAtk(atk, pokemon) {
			if (pokemon.abilityState.hagakure) return this.chainModify(2);
		},
		onModifyDef(def, pokemon) {
			if (pokemon.abilityState.hagakure) return this.chainModify(0.5);
		},
		onModifySpd(spd, pokemon) {
			if (pokemon.abilityState.hagakure) return this.chainModify(0.5);
		},
		onModifyCritRatio(critRatio, user) {
			if (user.abilityState.hagakure) return critRatio + 5;
		},
	},
	// Journeyman
	colossuscarrier: {
		name: "Colossus Carrier",
		gen: 9,
		onTakeItem: false,
		shortDesc: "User can hold 8 items; New item each turn.",
		desc: "The holder can hold up to eight additional items, other than Colossus Carrier, that are unaffected by Knock Off or other means of being taken, disabled, or removed. Colossus Carrier itself also cannot be taken, disabled, or removed. At the end of each turn, the holder picks up a random item that it isn't already holding.",
		onResidual(pokemon) {
			if (!pokemon.abilityState.carrierItems) pokemon.abilityState.carrierItems = [];
			const items = this.dex.items.all().filter(item => (
				pokemon.item !== item &&
				!pokemon.abilityState.carrierItems.includes(item) &&
				!item.name.includes('TR') && !item.itemUser &&
				!item.name.includes('Power') && !item.isPokeball &&
				!item.megaStone && !item.unusable
			));
			const item = this.sample(items);
			if (pokemon.abilityState.carrierItems.length < 8 && pokemon.item === 'colossuscarrier') {
				pokemon.abilityState.carrierItems.push(item);
				this.add('-anim', pokemon, 'Splash', pokemon);
				this.add('-message', `${pokemon.name} found one ${item.name}!`);
			} else if (pokemon.abilityState.carrierItems.length >= 8 || !pokemon.item || pokemon.item !== 'colossuscarrier') {
				this.add('-anim', pokemon, 'Celebrate', pokemon);
				this.add('-message', `${pokemon.name} found one ${item.name}, but has no more capacity for items!`);
			}
		},
		// Ability to carry multiple items handled in ../config/formats.ts
	},
	// Codie
	evileyeoformsbygore: {
		name: "Evil Eye of Orms-by-Gore",
		gen: 9,
		desc: "On switch-in, lowers the Attack of all active Pokemon by 1 stage, and restores HP equal to 50% of the total Attack lost. If holder is a Venomicon, turns Mind Reader into a 60 BP special move while retaining its secondary effects.",
		shortDesc: "Switch-in: Heals, all Pokemon -1ATK; Mind Reader: 60BP.",
		onSwitchIn(pokemon) {
			let health = 0;
			this.add('-anim', pokemon, 'Mean Look', pokemon);
			for (const activePokemon of this.getAllActive()) {
				health += activePokemon.storedStats.atk - (activePokemon.storedStats.atk * 0.67);
				this.boost({ atk: -1 }, activePokemon);
			}
			this.heal(health, pokemon);
		},
		onModifyMovePriority: 1,
		onModifyMove(move, pokemon) {
			if (move.id === 'mindreader' && pokemon.species.name === 'Venomicon') {
				move.category = 'Special';
				move.basePower = 60;
			}
		},
	},
	// Sakuya Izayoi
	stopwatch: {
		name: "Stopwatch",
		onTakeItem: false,
		zMove: "Misdirection",
		zMoveFrom: "Killing Doll",
		itemUser: ["Magearna"],
		desc: "If held by a Magearna with Killing Doll, it can use Misdirection.",
		gen: 9,
	},
	// Zeeb
	slingshot: {
		name: "Slingshot",
		gen: 9,
		shortDesc: "Target loses 1/16 max HP after the holder attacks.",
		desc: "After the holder successfully uses an attacking move, if the target is not affected by Substitute, Killing Doll, Orb Shield, or Jade Shield, the target loses 1/16 of its max HP.",
		onAfterMoveSecondarySelf(source, target, move) {
			const hitSub = target.volatiles['substitute'] || target.volatiles['killingdoll'] || target.volatiles['orbshield'] || target.side.sideConditions['jadeshield'];
			if (source === target || move.category === 'Status' || !target || target.fainted || hitSub) return;
			this.add('-anim', source, 'Bullet Seed', target);
			this.damage(target.maxhp / 16, target, source, this.dex.items.get('slingshot'));
		},
	},
	// Shifu Robot
	absorptiveshell: {
		name: "Absorptive Shell",
		gen: 9,
		onSwitchIn(pokemon) {
			pokemon.abilityState.newType = '';
			pokemon.abilityState.forcefield = false;
			pokemon.abilityState.forcefieldHp = 0;
			if (pokemon.hp <= pokemon.maxhp / 2) {
				this.add('-anim', pokemon, 'Aqua Ring', pokemon);
				this.add('-message', `${pokemon.name} created a forcefield!`);
				pokemon.abilityState.forcefield = true;
				pokemon.abilityState.forcefieldHp = pokemon.maxhp / 3;
			}
		},
		onDamage(damage, target, source, effect) {
			if (effect?.effectType !== 'Move' || source === target) return;
			if (target.abilityState.forcefield && target.abilityState.forcefieldHp > 0) {
				this.add('-anim', target, 'Aqua Ring', target);
				if (target.abilityState.forcefieldHp >= damage) {
					target.abilityState.forcefieldHp -= damage;
					if (target.abilityState.forcefieldHp <= 0) {
						target.abilityState.forcefield = false;
						target.abilityState.forcefieldHp = 0;
						this.add('-anim', target, 'Cosmic Power', target);
						this.add('-message', `${target.name}'s forcefield shattered!`);
					}
					return 0;
				}
				if (damage > target.abilityState.forcefieldHp) {
					let bleed = damage - target.abilityState.forcefieldHp;
					target.abilityState.forcefield = false;
					target.abilityState.forcefieldHp = 0;
					this.add('-anim', target, 'Cosmic Power', target);
					this.add('-message', `${target.name}'s forcefield shattered!`);
					return bleed;
				}
			}
		},
		onResidual(pokemon) {
			let types = ['Bug', 'Dark', 'Dragon', 'Electric', 'Fairy', 'Fighting', 'Fire', 'Flying', 'Ghost', 'Grass', 'Ground', 'Ice', 'Normal', 'Poison', 'Psychic', 'Rock', 'Water'];
			let newType = this.sample(types);
			pokemon.abilityState.newType = newType;
			pokemon.setType([newType, 'Steel']);
			this.add('-start', pokemon, 'typechange', pokemon.getTypes(true).join('/'), '[from] item: Absorptive Shell');
		},
		onModifyMove(move, pokemon) {
			if (move.id !== 'technoblast') return;
			if (pokemon.abilityState.newType) {
				move.type = pokemon.abilityState.newType;
				this.add('-message', `${pokemon.getItem().name} changed ${move.name} to ${pokemon.abilityState.newType}-type!`);
			} else {
				move.type = 'Steel';
				this.add('-message', `${pokemon.getItem().name} changed ${move.name} to Steel-type!`);
			}
		},
	},
	// PokeKart
	flameflyer: {
		name: "Flame Flyer",
		gen: 9,
		desc: "This Pokemon becomes Steel/Fire-type upon switching in. This Pokemon's attacks use Speed in damage calculation instead of Attack or Special Attack.",
		shortDesc: "Steel/Fire; Uses Speed in damage calculation.",
		onStart(pokemon) {
			if (pokemon.setType(['Steel', 'Fire'])) this.add('-start', pokemon, 'typechange', 'Steel/Fire', '[from] item: Flame Flyer');
		},
		onModifyMove(move, pokemon) {
			move.overrideOffensiveStat = 'spe';
		},
	},
	// Luminous
	spectralprism: {
		name: "Spectral Prism",
		gen: 9,
		onTakeItem: false,
		zMove: "Polaris",
		zMoveFrom: "Rainbow Maxifier",
		itemUser: ["Necrozma"],
		onDamage(damage, target, source, effect) {
			if (effect.effectType !== 'Move' && effect.id !== 'recoil') {
				if (effect.effectType === 'Ability') this.add('-activate', source, 'ability: ' + effect.name);
				return false;
			}
		},
		onModifyDefPriority: 6,
		onModifyDef(def, pokemon) {
			if (pokemon.status) {
				return this.chainModify(1.5);
			}
		},
		onModifySpdPriority: 6,
		onModifySpd(spd, pokemon) {
			if (pokemon.status) {
				return this.chainModify(1.5);
			}
		},
	},
	// Fblthp
	bubblewand: {
		name: 'Bubble Wand',
		gen: 9,
		desc: "Upon switching out, all adjacent Pokemon's Speed stats are lowered by one stage, and all active Pokemon's happiness stats are increased by 30 points, or increased to max if differential between current and max happiness is less than 30.",
		shortDesc: "Switch-out: Lowers Pokemon's Speed by 1; Boosts happiness.",
		onSwitchOut(pokemon) {
			this.add('-anim', pokemon, 'Bubble Beam', pokemon);
			for (const target of this.getAllActive()) {
				if (pokemon === target) continue;
				this.boost({ spe: -1 }, target, target, this.effect);
				if (target.happiness < 255) target.happiness += 30;
				if (target.happiness > 255) target.happiness = 255;
			}
			if (pokemon.happiness < 255) pokemon.happiness += 30;
			if (pokemon.happiness > 255) target.happiness = 255;
		},
	},
	// Faust
	crossroadsblues: {
		name: 'Crossroads Blues',
		gen: 9,
		onTakeItem: false,
		zMove: "The House Always Wins",
		zMoveFrom: "Faustian Bargain",
		itemUser: ["Hoopa-Unbound"],
		onAnyFaint() {
			let totalFaintedFoes = 0;
			const pokemon = this.effectState.target;
			const target = pokemon.side.foe.active[pokemon.side.foe.active.length - 1 - pokemon.position];
			const faintedFoes = target.side.pokemon.filter(foe => foe.fainted);
			if (faintedFoes.length) totalFaintedFoes = faintedFoes.length;
			const totalHeal = ((pokemon.baseMaxhp / 8) + ((pokemon.baseMaxhp / 8) * totalFaintedFoes));
			this.add('-activate', pokemon, 'item: Crossroads Blues');
			this.heal(totalHeal, pokemon);
		},
	},
	// Croupier
	staufensdie: {
		name: 'Staufen\'s Die',
		gen: 9,
		onStart(pokemon) {
			if (!pokemon.abilityState.wagerStacks) pokemon.abilityState.wagerStacks = 0;
		},
		onModifyDamage(damage, source, target, move) {
			if (target.getMoveHitData(move).crit) {
				this.add("-activate", source, "item: Staufen's Die");
				this.addMove('-anim', source, 'Pay Day', source);
				this.add('-message', `Critical hit! ${source.name} scored six wager stacks!`);
				if (!source.abilityState.wagerStacks) source.abilityState.wagerStacks = 0;
				source.abilityState.wagerStacks += 6;
				return;
			}
		},
		onResidual(pokemon) {
			if (pokemon.abilityState.wagerStacks >= 6) {
				pokemon.abilityState.wagerStacks -= 6;
				this.add("-activate", pokemon, "item: Staufen's Die");
				this.add('-message', `${pokemon.name} wagered six stacks to Roll the Dice!`);
				this.actions.useMove('Roll the Dice', pokemon);
			}
		},
		onModifyCritRatio(critRatio, user) {
			if (user.abilityState.luckySix) return critRatio + 5;
		},
		onTakeItem: false,
		zMove: "All In",
		zMoveFrom: "Roll the Dice",
		itemUser: ["Hoopa"],
	},
	// flufi
	epipen: {
		name: "EpiPen",
		gen: 9,
		shortDesc: "1.5x Defense; 1/3 or less max HP: Heals chosen ally.",
		desc: "This Pokemon's Defense is 1.5x. Whenever this Pokemon has 1/3 or less max HP, heals a selected inactive party member for 75% of their max HP and cures its status conditions. If held by a Pikachu-Starter with Cranberry Cutter, it can use Rip Apart. Single use.",
		onTakeItem: false,
		zMove: "Rip Apart",
		zMoveFrom: "Cranberry Cutter",
		itemUser: ["Pikachu-Starter"],
		onModifyDef(def, pokemon) {
			return this.chainModify(1.5);
		},
		onUpdate(pokemon) {
			if (pokemon.hp <= pokemon.maxhp / 3 && !this.effectState.epiUsed) {
				this.add('-activate', pokemon, 'item: EpiPen');
				let thisSideAllies = [];
				for (const ally of pokemon.side.pokemon) {
					if (ally === pokemon) continue;
					if (ally.fainted || ally.hp <= 0) continue;
					if (ally.hp >= ally.maxhp && !ally.status) continue;
					thisSideAllies.push(ally);
				}
				// If there are no surviving allies that require healing of any kind, use on self automatically
				if (!thisSideAllies.length) {
					this.heal(pokemon.maxhp * 0.75, pokemon);
					if (pokemon.status) pokemon.cureStatus();
					this.effectState.epiUsed = true;
					return;
				}
				pokemon.side.addSlotCondition(pokemon, 'epipen');
				pokemon.switchFlag = true;
				this.effectState.epiUsed = true;
			}
		},
		condition: {
			// implemented in ../scripts.ts
			duration: 1,
		},
	},
	// Cyclommatic Cell
	apparatus: {
		name: "Apparatus",
		gen: 9,
		shortDesc: "See '/ssb Cyclommatic Cell' for more!",
		desc: "On switch-in, starts Ion Deluge and Magnet Rise for holder. Restores one gauge of battery life at end of each turn. Techno Blast: Steel-type, 1.3x power.",
		onStart(pokemon) {
			this.add('-activate', pokemon, 'item: Apparatus');
			pokemon.addVolatile('magnetrise');
			this.field.addPseudoWeather('iondeluge');
		},
		onModifyType(move, pokemon) {
			if (move.id === 'technoblast') {
				move.type = 'Steel';
			}
		},
		onBasePowerPriority: 23,
		onBasePower(basePower, pokemon, target, move) {
			if (move.id === 'technoblast') return this.chainModify([5325, 4096]);
		},
		onResidual(pokemon) {
			if (pokemon.species.id !== 'vikavolttotem') return;
			if (pokemon.abilityState.gauges < 5) {
				this.add('-activate', pokemon, 'item: Apparatus');
				this.add('-message', `${pokemon.name} gained charge!`);
				pokemon.abilityState.gauges += 1;
				this.add('-message', `Battery Remaining: ${(pokemon.abilityState.gauges / 5) * 100}%`);
			}
		},
	},
	// Morte
	malediction: {
		name: "Malediction",
		gen: 9,
		desc: "Whenever this Pokemon is damaged by an attacking move, the attacking Pokemon is inflicted with Torment.",
		shortDesc: "If holder is damaged by an attack, uses Torment on attacker.",
		onDamagingHitOrder: 2,
		onDamagingHit(damage, target, source, move) {
			this.add('-activate', target, 'item: Malediction', target);
			source.addVolatile('torment');
		},
	},
	// Marisa Kirisame
	minihakkero: {
		name: "Mini-Hakkero",
		spritenum: 249,
		onTakeItem: false,
		zMove: "Master Spark",
		zMoveFrom: "Orb Shield",
		itemUser: ["Hatterene"],
		desc: "If held by a Hatterene with Orb Shield, it can use Master Spark.",
		gen: 9,
	},
	// Prince Smurf
	smurfscrown: {
		name: "Smurf\'s Crown",
		spritenum: 236,
		fling: {
			basePower: 300,
		},
		onTryBoost(boost, target, source, effect) {
			if (source && target === source) return;
			let showMsg = false;
			let i: BoostID;
			for (i in boost) {
				if (boost[i]! < 0) {
					delete boost[i];
					showMsg = true;
				}
			}
			if (showMsg && !(effect as ActiveMove).secondaries && effect.id !== 'octolock') {
				this.add('-fail', target, 'unboost', '[from] item: Smurf\'s Crown', '[of] ' + target);
			}
		},
		onAfterMoveSecondarySelfPriority: -1,
		onAfterMoveSecondarySelf(pokemon, target, move) {
			if (move.totalDamage && !pokemon.forceSwitchFlag) {
				this.heal(move.totalDamage / 4, pokemon);
			}
		},
		onUpdate(pokemon) {
			if (pokemon.hp <= pokemon.maxhp / 4) pokemon.eatItem();
		},
		onEat(pokemon) {
			const target = pokemon.side.foe.active[pokemon.side.foe.active.length - 1 - pokemon.position];
			const r = this.random(100);
			if (r < 33) {
				pokemon.addVolatile('grudge');
			} else if (r >= 33 && r < 66) {
				this.heal(pokemon.baseMaxhp / 2, pokemon, pokemon);
			} else if (r >= 66) {
				let dmg = this.actions.getDamage(pokemon, target, 'Explosion');
				this.add('-message', `${pokemon.name}'s crown exploded!`);
				this.addMove('-anim', pokemon, 'Explosion', pokemon);
				if (target.hp) this.damage(dmg, target, pokemon);
				pokemon.faint(pokemon);
			}
		},
		shortDesc: "See '/ssb Prince Smurf' for more!",
		desc: "Prevents other Pokemon from lowering the holder's stats; after an attack, holder recovers 1/4 of the damage dealt to the Target. When the holder is at 1/4 HP or less it will trigger 1 of 3 reactions: Applies Grudge to the holder for a turn, item is then disposed; Heals the holder for 50% HP and cures party of status, item is then disposed; Forces the holder to explode.",
	},
	// Kozuchi
	forgedhammer: {
		name: "forgedhammer",
		onTakeItem: false,
		spritenum: 761,
		onModifyMove(move) {
			delete move.flags['contact'];
		},
		zMove: "Emergency Upgrades",
		zMoveFrom: "Weapon Enhancement",
		itemUser: ["Tinkaton"],
		gen: 9,
		desc: "Protects from contact effects. If held by a Tinkaton with 'Weapon Enhancement', allows the usage of the Z-Move 'Emergency Upgrades'.",
	},
	// Urabrask
	braidoffire: {
		name: "Braid of Fire",
		onTakeItem: false,
		onDamagingHitOrder: 2,
		onDamagingHit(damage, target, source, move) {
			if (move.category === 'Physical') {
				this.add('-anim', target, 'Searing Shot', target);
				let temp = this.dex.getActiveMove('ember');
				for (const pokemon of this.getAllActive()) {
					if (pokemon.volatiles['protect']) continue;
					let burn = this.actions.getDamage(target, pokemon, temp);
					this.damage(burn, pokemon, target, this.dex.items.get('Braid of Fire'));
				}
				this.add('-message', `Braid of Fire scorched the battlefield!`);
			}
		},
		onAfterMoveSecondarySelf(source, target, move) {
			if (move.category === 'Physical') {
				this.add('-anim', source, 'Searing Shot', source);
				let temp = this.dex.getActiveMove('ember');
				for (const pokemon of this.getAllActive()) {
					let burn = this.actions.getDamage(source, pokemon, temp);
					this.damage(burn, pokemon, source, this.dex.items.get('Braid of Fire'));
				}
				this.add('-message', `Braid of Fire scorched the battlefield!`);
			}
		},
		zMove: "Blasphemous Act",
		zMoveFrom: "Terrorize the Peaks",
		itemUser: ["Smokomodo"],
		desc: "If holder is hit by a physical move or uses a physical move, all active Pokemon are hit with Ember. If held by a Smokomodo with Terorrize the Peaks, it can use Blasphemous Act.",
		shortDesc: "Damages all Pokemon if holder is hit by/uses a physical move.",
		gen: 9,
	},
	// Mima
	crescentstaff: {
		name: "Crescent Staff",
		spritenum: 698,
		onTakeItem: false,
		zMove: "Reincarnation",
		zMoveFrom: "Complete Darkness",
		itemUser: ["Mismagius"],
		desc: "If held by a Mismagius with Complete Darkness, it can use Reincarnation.",
		gen: 9,
	},
	// Gizmo
	inconspicuouscoin: {
		name: "Inconspicuous Coin",
		desc: "When the holder is hit by a damaging move: ~16% chance to do halved damage. When the holder uses a damaging move: 20% chance to do doubled damage. Chances roughly double for each charge this Pokemon has (~16%, ~33%, ~50% | 20%, 40%, 60%)",
		shortDesc: "See '/ssb Gizmo' for more!",
		gen: 9,
		onSourceModifyDamage(damage, source, target, move) {
			if (!target.abilityState.charges) target.abilityState.charges = 0;
			const chance = 6 / (1 + target.abilityState.charges);
			if (this.randomChance(1, chance)) {
				this.add('-message', `${target.name} defended itself with the Inconspicuous Coin!`);
				return this.chainModify(0.5);
			}
		},
		onModifyDamage(damage, source, target, move) {
			if (!source.abilityState.charges || source.abilityState.charges === 0) return;
			const chance = 5 / (1 + source.abilityState.charges);
			if (this.randomChance(1, chance) && move.basePower <= 60) {
				this.add('-message', `${source.name} used the Inconspicuous Coin's charge to strengthen ${move.name}'s impact!`);
				return this.chainModify(2);
			}
		},
	},
	// Glint
	slag: {
		name: "Slag",
		spritenum: 34,
		gen: 9,
		desc: "Serves no purpose. Gets slippery sometimes.",
		onTryMove(pokemon, target, move) {
			if (this.randomChance(1, 5)) {
				this.add('-message', `Oops! ${pokemon.name} slipped on the Slag!`);
				this.add('-message', `Why is he carrying slag?`);
				return null;
			}
		},
	},
	// Finger
	mattermirror: {
		name: "Matter Mirror",
		spritenum: 69,
		desc: "This Pokemon's Physical attacks become Special.",
		gen: 9,
		onModifyMove(move, pokemon) {
			if (move.category === 'Physical') {
				move.category = 'Special';
			}
		},
	},
	// Pablo
	sketchbook: {
		name: "Sketchbook",
		spritenum: 200,
		desc: "On switch-in, this Pokemon copies the positive stat changes of the opposing Pokemon, and receives a random positive volatile effect at the end of each full turn on the field.",
		shortDesc: "Switch-in: Copies boosts; Random volatile each turn.",
		gen: 9,
		onStart(pokemon) {
			const target = pokemon.side.foe.active[pokemon.side.foe.active.length - 1 - pokemon.position];
			const boosts: SparseBoostsTable = {};
			let i: BoostID;
			let boosted = false;
			if (!target.boosts) return;
			for (i in target.boosts) {
				if (target.boosts[i] > 0) {
					boosts[i] = target.boosts[i];
					boosted = true;
				}
			}
			if (boosted) {
				this.add("-activate", pokemon, "item: Sketchbook");
				this.boost(boosts, pokemon);
				this.add('-message', `${pokemon.name} copied ${target.name}'s stat changes!`);
			}
		},
		onResidual(pokemon) {
			let effectPool = ['aquaring', 'focusenergy', 'helpinghand', 'ingrain', 'laserfocus', 'magnetrise', 'substitute', 'stockpile', 'charge', 'destinybond', 'dragoncheer', 'lockon'];
			let randomEffect = this.sample(effectPool);
			if (!pokemon.volatiles[randomEffect]) pokemon.addVolatile(randomEffect);
		},
	},
	// Trey
	yoichisbow: {
		name: "Yoichi's Bow",
		spritenum: 429,
		onTakeItem: false,
		zMove: "Grand Delta",
		zMoveFrom: "Burst Delta",
		itemUser: ["Decidueye-Hisui"],
		onBasePowerPriority: 15,
		onBasePower(basePower, user, target, move) {
			if (move && move.type === 'Flying') {
				return this.chainModify(1.3);
			}
		},
		desc: "Holder's Flying-type attacks have 1.3x power. If held by Decidueye-Hiseui with Burst Delta, it can use Grand Delta.",
		gen: 9,
	},
	// Aeri
	fleetingwinds: {
		name: "Fleeting Winds",
		onStart(source) {
			this.field.setTerrain('mistyterrain');
		},
		onDamagePriority: -40,
		onDamage(damage, target, source, effect) {
			if (damage >= target.hp) {
				this.add("-activate", target, "item: Fleeting Winds");
				this.actions.useMove('Healing Wish', target);
				target.side.addSideCondition('tailwind', target);
				target.abilityState.faintOnUpdate = true;
				return target.hp - 1;
			}
		},
		onUpdate(pokemon) {
			if (pokemon.abilityState.faintOnUpdate) {
				pokemon.abilityState.faintOnUpdate = false;
				pokemon.faint();
			}
		},
		desc: "On switch-in, starts Misty Terrain. If this Pokemon would faint, starts Tailwind and uses Healing Wish.",
		shortDesc: "Switch-in: Misty Terrain; Faint; Tailwind + Healing Wish.",
		gen: 9,
	},
};
