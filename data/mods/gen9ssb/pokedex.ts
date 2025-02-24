export const Pokedex: { [k: string]: ModdedSpeciesData } = {
	/*
	// Example
	id: {
		inherit: true, // Always use this, makes the pokemon inherit its default values from the parent mod (gen7)
		baseStats: {hp: 100, atk: 100, def: 100, spa: 100, spd: 100, spe: 100}, // the base stats for the pokemon
	},
	*/
	skuntank: {
		inherit: true,
		abilities: { 0: "Venom Shock" },
	},
	arcanine: {
		inherit: true,
		abilities: { 0: "Adaptive Fighter" },
	},
	darmanitangalarzen: {
		inherit: true,
		abilities: { 0: "Murderous Mimic" },
		baseStats: { hp: 115, atk: 120, def: 85, spa: 30, spd: 65, spe: 108 },
	},
	trevenant: {
		inherit: true,
		abilities: { 0: "Horrors of the Forest" },
	},
	zygarde10: {
		inherit: true,
		baseStats: { hp: 59, atk: 100, def: 81, spa: 61, spd: 95, spe: 115 },
	},
	ogerpon: {
		inherit: true,
		types: ['Fighting', 'Rock'],
		abilities: { 0: "Density Manipulation" },
	},
	aipom: {
		inherit: true,
		abilities: { 0: "Nutcracker" },
		baseStats: { hp: 55, atk: 70, def: 80, spa: 40, spd: 80, spe: 110 },
	},
	ironthorns: {
		inherit: true,
		types: ['Steel'],
		abilities: { 0: "Auto Repair" },
		baseStats: { hp: 81, atk: 120, def: 75, spa: 120, spd: 75, spe: 99 },
	},
	magearna: {
		inherit: true,
		abilities: {0: "The World"},
	},
	necrozma: {
		inherit: true,
		abilities: { 0: "Blinding Light" },
	},
	necrozmaultra: {
		inherit: true,
		types: ['Light'],
		abilities: { 0: "Blinding Light" },
	},
	poliwhirl: {
		inherit: true,
		abilities: { 0: "Lost and Found" },
		types: ['Water', 'Normal'],
		baseStats: { hp: 65, atk: 65, def: 65, spa: 90, spd: 50, spe: 90 },
	},
	pikachustarter: {
		inherit: true,
		abilities: { 0: "Force of Will" },
	},
	zapdos: {
		inherit: true,
		abilities: { 0: "Peal of Thunder" },
	},
	mimikyu: {
		inherit: true,
		baseStats: { hp: 75, atk: 90, def: 80, spa: 105, spd: 105, spe: 96 },
		abilities: { 0: "Dollkeeper" },
	},
	mimikyubusted: {
		inherit: true,
		baseStats: { hp: 75, atk: 90, def: 105, spa: 50, spd: 105, spe: 96 },
		abilities: { 0: "Dollkeeper" },
	},
	kecleon: {
		inherit: true,
		abilities: { 0: "Quick Camo" },
	},
	smokomodo: {
		inherit: true,
		baseStats: { hp: 98, atk: 116, def: 77, spa: 88, spd: 78, spe: 97 },
		abilities: { 0: "Praetor's Grasp" },
	},
	lunala: {
		inherit: true,
		types: ['Psychic', 'Dark'],
		abilities: { 0: "Regenerator" },
	},
	butterfreegmax: {
		inherit: true,
		types: ['Flying'],
		baseStats: { hp: 95, atk: 45, def: 50, spa: 90, spd: 80, spe: 100 },
		abilities: { 0: "Woven Together, Cohere Forever" },
	},
	gimmighoul: {
		inherit: true,
		types: ['Ghost', 'Steel'],
		baseStats: { hp: 80, atk: 75, def: 65, spa: 50, spd: 45, spe: 45 },
		abilities: { 0: "Cash Grab" },
	},
	gimmighoulroaming: {
		inherit: true,
		types: ['Ghost', 'Electric'],
		baseStats: { hp: 45, atk: 75, def: 65, spa: 50, spd: 45, spe: 80 },
		abilities: { 0: "Head-On Battery" },
	},
	mismagius: {
		inherit: true,
		types: ['Ghost', 'Dark'],
		abilities: { 0: "Vengeful Spirit" },
	},
	yveltal: {
		inherit: true,
		types: ['Dark', 'Fairy'],
		abilities: { 0: "Angel of Death" },
	},
	vikavolt: {
		inherit: true,
		abilities: { 0: "Battery Life" },
	},
	decidueyehisui: {
		inherit: true,
		baseStats: { hp: 88, atk: 112, def: 80, spa: 95, spd: 95, spe: 93 },
		abilities: { 0: "Concentration" },
	},
};
