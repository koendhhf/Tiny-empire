export const PRESTIGE_THRESHOLD = 300000;
export const COST_SCALE = 1.2;
export const businesses = [
  {id:'lemonade',name:'Lemonade Stand',icon:'🍋',desc:'A refreshing little money-maker.',unlock:0,base:.18,cost:20,costGrowth:COST_SCALE,incomeGrowth:1.18},
  {id:'snack',name:'Snack Cart',icon:'🥨',desc:'Quick bites, steady business.',unlock:80,base:.78,cost:75,costGrowth:COST_SCALE,incomeGrowth:1.2},
  {id:'coffee',name:'Coffee Corner',icon:'☕',desc:'Fuel the town and your fortune.',unlock:500,base:3.8,cost:375,costGrowth:COST_SCALE,incomeGrowth:1.22},
  {id:'foodtruck',name:'Food Truck',icon:'🚚',desc:'Take your best sellers on the road.',unlock:2200,base:15,cost:1600,costGrowth:COST_SCALE,incomeGrowth:1.23},
  {id:'arcade',name:'Pixel Arcade',icon:'🕹️',desc:'A neon hangout with a steady crowd.',unlock:9000,base:72,cost:8000,costGrowth:COST_SCALE,incomeGrowth:1.24},
  {id:'mall',name:'Mini Mall',icon:'🏬',desc:'A whole block of shops under one roof.',unlock:36000,base:310,cost:30000,costGrowth:COST_SCALE,incomeGrowth:1.25},
  {id:'cinema',name:'Grand Cinema',icon:'🎬',desc:'Packed premieres turn tickets into serious income.',unlock:150000,base:1300,cost:140000,costGrowth:COST_SCALE,incomeGrowth:1.27},
  {id:'spaceport',name:'Spaceport',icon:'🚀',desc:'The town goes interstellar, and your profits follow.',unlock:650000,base:7800,cost:650000,costGrowth:COST_SCALE,incomeGrowth:1.28},
  {id:'railway',name:'Maglev Railway',icon:'🚄',desc:'Connect distant markets at astonishing speed.',unlock:2500000,base:22000,cost:2500000,costGrowth:COST_SCALE,incomeGrowth:1.29},
  {id:'resort',name:'Oceanfront Resort',icon:'🏝️',desc:'A luxury destination where every room earns.',unlock:10000000,base:110000,cost:10000000,costGrowth:COST_SCALE,incomeGrowth:1.3},
  {id:'lunar',name:'Lunar Colony',icon:'🌕',desc:'Build a thriving economy beyond Earth.',unlock:40000000,base:550000,cost:40000000,costGrowth:COST_SCALE,incomeGrowth:1.31},
  {id:'mars',name:'Mars Terraforming',icon:'🪐',desc:'Turn a red planet into your next market.',unlock:150000000,base:2600000,cost:150000000,costGrowth:COST_SCALE,incomeGrowth:1.32},
  {id:'dyson',name:'Dyson Energy Grid',icon:'☀️',desc:'Harvest a star’s power to fuel your empire.',unlock:600000000,base:12000000,cost:600000000,costGrowth:COST_SCALE,incomeGrowth:1.33},
  {id:'quantum',name:'Quantum Network',icon:'🌀',desc:'Trade across realities with near-infinite reach.',unlock:2500000000,base:70000000,cost:2500000000,costGrowth:COST_SCALE,incomeGrowth:1.34},
  {id:'timemachine',name:'Time Machine Works',icon:'⏳',desc:'Turn tomorrow’s opportunities into today’s revenue.',unlock:1e12,base:5e9,cost:1e12,costGrowth:COST_SCALE,incomeGrowth:1.35},
  {id:'multiverse',name:'Multiverse Exchange',icon:'🪐',desc:'Trade goods and ideas across parallel realities.',unlock:1e15,base:5e12,cost:1e15,costGrowth:COST_SCALE,incomeGrowth:1.36},
  {id:'blackhole',name:'Black Hole Foundry',icon:'🕳️',desc:'Convert extreme gravity into industrial output.',unlock:1e18,base:5e15,cost:1e18,costGrowth:COST_SCALE,incomeGrowth:1.37},
  {id:'federation',name:'Galactic Federation',icon:'🛸',desc:'Coordinate a thousand civilizations under one economy.',unlock:1e21,base:5e18,cost:1e21,costGrowth:COST_SCALE,incomeGrowth:1.38},
  {id:'universeforge',name:'Universe Forge',icon:'🌌',desc:'Manufacture new universes to expand your markets.',unlock:1e24,base:5e21,cost:1e24,costGrowth:COST_SCALE,incomeGrowth:1.39},
  {id:'realityengine',name:'Reality Engine',icon:'⚙️',desc:'Rewrite the rules that govern production itself.',unlock:1e27,base:5e24,cost:1e27,costGrowth:COST_SCALE,incomeGrowth:1.4},
  {id:'omniverse',name:'Omniverse Network',icon:'♾️',desc:'Connect every possible timeline to your supply chain.',unlock:1e30,base:5e27,cost:1e30,costGrowth:COST_SCALE,incomeGrowth:1.41},
  {id:'eternal',name:'Eternal Empire',icon:'👑',desc:'Build an empire that outlasts time and reality.',unlock:1e33,base:5e30,cost:1e33,costGrowth:COST_SCALE,incomeGrowth:1.42}
];
export const upgrades = [
  {id:'pitch',icon:'📣',name:'Confident Pitch',desc:'Every tap earns 1.4× cash.',cost:100,effect:'tap',mult:1.4},
  {id:'recipes',icon:'🍋',name:'Secret Recipe',desc:'Lemonade income ×1.5 forever.',cost:750,effect:'lemonade',mult:1.5},
  {id:'flyers',icon:'🗞️',name:'Local Flyers',desc:'All business income ×1.15.',cost:2500,effect:'global',mult:1.15},
  {id:'service',icon:'⚙️',name:'Fast Service',desc:'All business income ×1.2.',cost:12000,effect:'global',mult:1.2},
  {id:'franchise',icon:'📈',name:'Franchise Playbook',desc:'All business income ×1.5.',cost:30000,effect:'global',mult:1.5},
  {id:'digital',icon:'💳',name:'Digital Checkout',desc:'Every tap earns another 1.8× cash.',cost:50000,effect:'tap',mult:1.8},
  {id:'franchise2',icon:'🌐',name:'Global Franchise',desc:'All business income ×1.6.',cost:300000,effect:'global',mult:1.6},
  {id:'automation',icon:'🤖',name:'Smart Automation',desc:'All business income ×1.8.',cost:1800000,effect:'global',mult:1.8},
  {id:'orbital',icon:'🛰️',name:'Orbital Logistics',desc:'All business income ×2.0.',cost:10000000,effect:'global',mult:2.0},
  {id:'fusion',icon:'⚛️',name:'Fusion Power',desc:'All business income ×2.2.',cost:65000000,effect:'global',mult:2.2},
  {id:'neural',icon:'🧠',name:'Neural Management',desc:'All business income ×2.5.',cost:350000000,effect:'global',mult:2.5},
  {id:'nanotech',icon:'🧬',name:'Nanotech Manufacturing',desc:'All business income ×3.',cost:1500000000,effect:'global',mult:3},
  {id:'tapbot',icon:'🦾',name:'Auto-Collector Drones',desc:'Every tap earns another 2.2× cash.',cost:500000,effect:'tap',mult:2.2},
  {id:'singularity',icon:'✨',name:'Singularity Engine',desc:'All business income ×3.5.',cost:8000000000,effect:'global',mult:3.5},
  {id:'cinemaBoost',icon:'🎥',name:'Studio Blockbusters',desc:'Grand Cinema income ×2.',cost:150000,effect:'business',business:'cinema',threshold:1},
  {id:'spaceportBoost',icon:'🛸',name:'Orbital Tourism',desc:'Spaceport income ×2.',cost:500000,effect:'business',business:'spaceport',threshold:1},
  {id:'railwayBoost',icon:'🧭',name:'Maglev Scheduling',desc:'Maglev Railway income ×2.',cost:750000,effect:'business',business:'railway',threshold:1},
  {id:'resortBoost',icon:'🛎️',name:'Resort Booking AI',desc:'Oceanfront Resort income ×2.',cost:5000000,effect:'business',business:'resort',threshold:1},
  {id:'lunarBoost',icon:'🧪',name:'Lunar Helium Mining',desc:'Lunar Colony income ×2.',cost:25000000,effect:'business',business:'lunar',threshold:1},
  {id:'marsBoost',icon:'🏗️',name:'Martian Supply Chain',desc:'Mars Terraforming income ×2.',cost:125000000,effect:'business',business:'mars',threshold:1},
  {id:'dysonBoost',icon:'🔆',name:'Stellar Fusion Matrix',desc:'Dyson Energy Grid income ×2.',cost:625000000,effect:'business',business:'dyson',threshold:1},
  {id:'quantumBoost',icon:'🌀',name:'Quantum Entanglement',desc:'Quantum Network income ×2.',cost:2500000000,effect:'business',business:'quantum',threshold:1},
  {id:'timeBoost',icon:'⏳',name:'Chrono Arbitrage',desc:'Time Machine Works income ×2.',cost:500000000000,effect:'business',business:'timemachine',threshold:1},
  {id:'multiverseBoost',icon:'🪐',name:'Cross-Reality Markets',desc:'Multiverse Exchange income ×2.',cost:50000000000000,effect:'business',business:'multiverse',threshold:1},
  {id:'blackholeBoost',icon:'🕳️',name:'Event Horizon Mining',desc:'Black Hole Foundry income ×2.',cost:5000000000000000,effect:'business',business:'blackhole',threshold:1},
  {id:'federationBoost',icon:'🛸',name:'Galactic Trade Charter',desc:'Galactic Federation income ×2.',cost:500000000000000000,effect:'business',business:'federation',threshold:1},
  {id:'universeBoost',icon:'🌌',name:'Cosmic Fabrication',desc:'Universe Forge income ×2.',cost:5e19,effect:'business',business:'universeforge',threshold:1},
  {id:'realityBoost',icon:'⚙️',name:'Reality Optimization',desc:'Reality Engine income ×2.',cost:5e21,effect:'business',business:'realityengine',threshold:1},
  {id:'omniverseBoost',icon:'♾️',name:'Omniversal Logistics',desc:'Omniverse Network income ×2.',cost:5e23,effect:'business',business:'omniverse',threshold:1},
  {id:'eternalBoost',icon:'👑',name:'Eternal Dividend',desc:'Eternal Empire income ×2.',cost:5e25,effect:'business',business:'eternal',threshold:1}
];
export const tierThresholds=[10,25,50,100,150,200];
export const tierNames=['Starter','Established','Regional','National','Global','Legendary'];
upgrades.push(...businesses.flatMap(d=>tierThresholds.map((threshold,i)=>({id:'tier_'+d.id+'_'+threshold,icon:d.icon,name:d.name+' · '+tierNames[i]+' contract',desc:'Own '+threshold+' '+d.name+' to unlock. Doubles this business production permanently.',cost:Math.ceil(2.5*d.cost*(Math.abs((d.costGrowth||COST_SCALE)-1)<1e-9?threshold:(Math.pow(d.costGrowth||COST_SCALE,threshold)-1)/((d.costGrowth||COST_SCALE)-1))),effect:'business',business:d.id,mult:2,threshold,tierIndex:i}))));
export const goals=[
{id:'g10',value:10,title:'First pocket money',desc:'Earn $10 in total.',reward:2},
{id:'g25',value:25,title:'A growing little town',desc:'Earn $25 in total.',reward:5},
{id:'g180',value:180,title:'Coffee break',desc:'Earn $180 in total.',reward:15},
{id:'g500',value:500,title:'Local legend',desc:'Earn $500 in total.',reward:60},
{id:'g2500',value:2500,title:'Tiny tycoon',desc:'Earn $2,500 in total.',reward:250},
{id:'g10000',value:10000,title:'Business district',desc:'Earn $10,000 in total.',reward:1000},
{id:'g50000',value:50000,title:'Empire builder',desc:'Earn $50,000 in total.',reward:6000},
{id:'g250000',value:250000,title:'Lights, camera, empire',desc:'Earn $250,000 in total.',reward:15000},
{id:'g1000000',value:1000000,title:'Beyond the stratosphere',desc:'Earn $1,000,000 in total.',reward:50000},
{id:'g2500000',value:2500000,title:'A world of opportunity',desc:'Earn $2.5 million in one run.',reward:125000},
{id:'g10000000',value:10000000,title:'Lunar ambitions',desc:'Earn $10 million in one run.',reward:500000},
{id:'g50000000',value:50000000,title:'Red planet investor',desc:'Earn $50 million in one run.',reward:2500000},
{id:'g250000000',value:250000000,title:'Power of a star',desc:'Earn $250 million in one run.',reward:12500000},
{id:'g1000000000',value:1000000000,title:'Quantum leap',desc:'Earn $1 billion in one run.',reward:50000000},
{id:'g5000000000',value:5000000000,title:'The trillionaire mindset',desc:'Earn $5 billion in one run.',reward:250000000},
{id:'g25000000000',value:25000000000,title:'Reality reshaper',desc:'Earn $25 billion in one run.',reward:1250000000},
{id:'g100000000000',value:100000000000,title:'Tiny multiverse',desc:'Earn $100 billion in one run.',reward:5000000000},
{id:'g1e12',value:1e12,title:'Temporal tycoon',desc:'Earn $1 trillion in one run.',reward:6e10},
{id:'g1e13',value:1e13,title:'Across the multiverse',desc:'Earn $10 trillion in one run.',reward:6e11},
{id:'g1e14',value:1e14,title:'Gravity’s banker',desc:'Earn $100 trillion in one run.',reward:6e12},
{id:'g1e15',value:1e15,title:'Black hole billionaire',desc:'Earn $1 quadrillion in one run.',reward:6e13},
{id:'g1e17',value:1e17,title:'Galactic magnate',desc:'Earn $100 quadrillion in one run.',reward:7e15},
{id:'g1e19',value:1e19,title:'Universe architect',desc:'Earn $10 quintillion in one run.',reward:7e17},
{id:'g1e21',value:1e21,title:'Reality investor',desc:'Earn $1 sextillion in one run.',reward:7e19},
{id:'g1e23',value:1e23,title:'Omniverse owner',desc:'Earn $100 sextillion in one run.',reward:8e21},
{id:'g1e25',value:1e25,title:'Eternal empire',desc:'Earn $10 septillion in one run.',reward:8e23},
{id:'g1e27',value:1e27,title:'Reality engine architect',desc:'Earn $1 octillion in one run.',reward:8e25},
{id:'g1e29',value:1e29,title:'Omniverse industrialist',desc:'Earn $100 octillion in one run.',reward:9e27},
{id:'g1e31',value:1e31,title:'Master of all timelines',desc:'Earn $10 nonillion in one run.',reward:9e29},
{id:'g1e33',value:1e33,title:'The eternal frontier',desc:'Earn $1 decillion in one run.',reward:1e32}
];
export const ranks=[{value:0,name:'Starter',icon:'🌱'},{value:100,name:'Shopkeeper',icon:'🧃'},{value:750,name:'Entrepreneur',icon:'🧢'},{value:3000,name:'Tycoon',icon:'💼'},{value:12000,name:'Magnate',icon:'🏙️'},{value:50000,name:'Empire legend',icon:'👑'},{value:100000,name:'Industry titan',icon:'🎬'},{value:500000,name:'Cosmic mogul',icon:'🚀'},{value:1000000,name:'Universal tycoon',icon:'🌌'},{value:2500000,name:'Planetary mogul',icon:'🏝️'},{value:10000000,name:'Lunar lord',icon:'🌕'},{value:50000000,name:'Martian magnate',icon:'🪐'},{value:250000000,name:'Stellar architect',icon:'☀️'},{value:1000000000,name:'Quantum tycoon',icon:'🌀'},{value:10000000000,name:'Reality ruler',icon:'🪄'},{value:100000000000,name:'Multiverse legend',icon:'♾️'},{value:1e12,name:'Temporal tycoon',icon:'⏳'},{value:1e13,name:'Multiverse trader',icon:'🪐'},{value:1e15,name:'Gravity magnate',icon:'🕳️'},{value:1e17,name:'Galactic chancellor',icon:'🛸'},{value:1e19,name:'Universe architect',icon:'🌌'},{value:1e21,name:'Reality engineer',icon:'⚙️'},{value:1e23,name:'Omniverse sovereign',icon:'♾️'},{value:1e25,name:'Eternal emperor',icon:'👑'}];
export const SHORT_SCALE_NAMES=[
{value:1e36,name:'Undecillion'},{value:1e33,name:'Decillion'},{value:1e30,name:'Nonillion'},
{value:1e27,name:'Octillion'},{value:1e24,name:'Septillion'},{value:1e21,name:'Sextillion'},
{value:1e18,name:'Quintillion'},{value:1e15,name:'Quadrillion'},{value:1e12,name:'Trillion'},
{value:1e9,name:'Billion'},{value:1e6,name:'Million'}];
export const TAP_STREAK_WINDOW_MS=1500,TAP_STREAK_MAX_FOLLOWUPS=10,TAP_STREAK_INCREMENT=.1,TAP_STREAK_PROGRESS_INTERVAL_MS=100;
export const eras=[{value:0,name:'Village Era',icon:'🌱',desc:'Small shops, big ambitions.'},{value:750,name:'City Era',icon:'🏙️',desc:'Your local business becomes a city-wide force.'},{value:12000,name:'Metropolis Era',icon:'🏬',desc:'A full commercial district is taking shape.'},{value:250000,name:'Space Age',icon:'🚀',desc:'Your empire has reached beyond Earth.'},{value:2500000,name:'Global Empire',icon:'🌐',desc:'Connect markets and destinations worldwide.'},{value:10000000,name:'Lunar Era',icon:'🌕',desc:'The Moon is now part of your economy.'},{value:50000000,name:'Martian Era',icon:'🪐',desc:'Build a new frontier on the red planet.'},{value:250000000,name:'Stellar Era',icon:'☀️',desc:'Harness energy on a cosmic scale.'},{value:1000000000,name:'Quantum Era',icon:'🌀',desc:'Your network reaches beyond ordinary reality.'},{value:1e11,name:'Time Era',icon:'⏳',desc:'Profit from the past, present, and future.'},{value:1e13,name:'Multiverse Era',icon:'🪐',desc:'Every parallel reality is a new market.'},{value:1e15,name:'Singularity Era',icon:'🕳️',desc:'Build an economy around collapsed stars.'},{value:1e17,name:'Galactic Era',icon:'🛸',desc:'Civilizations become customers and partners.'},{value:1e19,name:'Universe Era',icon:'🌌',desc:'Create universes to expand your empire.'},{value:1e21,name:'Reality Era',icon:'⚙️',desc:'Engineer the rules of existence.'},{value:1e23,name:'Omniverse Era',icon:'♾️',desc:'Connect all timelines and possibilities.'},{value:1e25,name:'Eternal Era',icon:'👑',desc:'Your empire transcends time itself.'}];
export const legacyMilestones=[{count:1,icon:'🌱',name:'Second Chance',desc:'Permanent +5% business income.',incomeBonus:.05},{count:2,icon:'⚡',name:'Longer Rush Hour',desc:'Rush Hour lasts 5 seconds longer.',boostSeconds:5},{count:3,icon:'🤝',name:'Founder’s Network',desc:'Permanent +10% business income.',incomeBonus:.10},{count:5,icon:'🌙',name:'Offline Investor',desc:'Offline earnings cap increases by 1 hour.',offlineHours:1},{count:8,icon:'🦾',name:'Golden Touch',desc:'All manual taps earn 2× cash.',tapMultiplier:2},{count:12,icon:'🌌',name:'Galactic Franchise',desc:'Permanent +15% business income.',incomeBonus:.15},{count:20,icon:'🛰️',name:'Deep Space Logistics',desc:'Offline earnings cap increases by 2 more hours.',offlineHours:2},{count:30,icon:'♾️',name:'Multiverse Momentum',desc:'Permanent +25% business income.',incomeBonus:.25}];
export const businessMilestones=[{id:'levels10',levels:10,title:'Neighborhood favorite',desc:'Own 10 business levels · +5% business income.',reward:150,bonus:0.05,icon:'🏘️'},{id:'levels25',levels:25,title:'Local business network',desc:'Own 25 business levels · +8% business income.',reward:750,bonus:0.08,icon:'🏪'},{id:'levels50',levels:50,title:'Commercial district',desc:'Own 50 business levels · +12% business income.',reward:3000,bonus:0.12,icon:'🏙️'},{id:'levels100',levels:100,title:'Citywide powerhouse',desc:'Own 100 business levels · +16% business income.',reward:12000,bonus:0.16,icon:'🌆'},{id:'levels250',levels:250,title:'National franchise',desc:'Own 250 business levels · +22% business income.',reward:75000,bonus:0.22,icon:'🌐'},{id:'levels500',levels:500,title:'Economic superpower',desc:'Own 500 business levels · +30% business income.',reward:300000,bonus:0.30,icon:'👑'}];

export const PRESTIGE_EFFECT_TYPES = Object.freeze([
  'income_percent',
  'tap_flat',
  'tap_multiplier',
  'tap_streak_increment',
  'boost_seconds',
  'offline_hours',
  'buy_discount_percent',
]);

export const prestigeTreeBranches = [
  { id: 'capital', name: 'Capital', icon: '🪙', desc: 'Turn early earnings into a stronger foundation.' },
  { id: 'taps', name: 'Taps', icon: '👆', desc: 'Make every quick hand count.' },
  { id: 'operations', name: 'Operations', icon: '⚙️', desc: 'Get more from Rush Hour and time away.' },
];

export const prestigeTree = [
  { id: 'pt_capital_seed', branch: 'capital', tier: 1, name: 'Seed Capital', desc: '+5% business income permanently.', icon: '🌱', cost: 1, prereq: null, effect: { type: 'income_percent', value: 0.05 } },
  { id: 'pt_capital_wholesale', branch: 'capital', tier: 2, name: 'Wholesale Network', desc: 'Business levels cost 6% less.', icon: '🤝', cost: 2, prereq: 'pt_capital_seed', effect: { type: 'buy_discount_percent', value: 0.06 } },
  { id: 'pt_capital_compound', branch: 'capital', tier: 3, name: 'Compounding Growth', desc: '+12% business income permanently.', icon: '📈', cost: 3, prereq: 'pt_capital_wholesale', effect: { type: 'income_percent', value: 0.12 } },
  { id: 'pt_capital_scale', branch: 'capital', tier: 4, name: 'Empire of Scale', desc: '+25% business income permanently.', icon: '🏙️', cost: 5, prereq: 'pt_capital_compound', effect: { type: 'income_percent', value: 0.25 } },
  { id: 'pt_taps_quick', branch: 'taps', tier: 1, name: 'Quick Hands', desc: '+1 cash per tap, unaffected by combo streaks and Lemonade levels.', icon: '⚡', cost: 1, prereq: null, effect: { type: 'tap_flat', value: 1 } },
  { id: 'pt_taps_touch', branch: 'taps', tier: 2, name: 'Founder’s Touch', desc: 'Tap income ×1.5.', icon: '✨', cost: 2, prereq: 'pt_taps_quick', effect: { type: 'tap_multiplier', value: 1.5 } },
  { id: 'pt_taps_streak', branch: 'taps', tier: 3, name: 'Streak School', desc: 'Each tap combo step adds +0.05× more.', icon: '🔥', cost: 3, prereq: 'pt_taps_touch', effect: { type: 'tap_streak_increment', value: 0.05 } },
  { id: 'pt_taps_rhythm', branch: 'taps', tier: 4, name: 'Golden Rhythm', desc: 'Tap income ×2.', icon: '🥁', cost: 5, prereq: 'pt_taps_streak', effect: { type: 'tap_multiplier', value: 2 } },
  { id: 'pt_ops_shift', branch: 'operations', tier: 1, name: 'Longer Shift', desc: 'Rush Hour lasts 10 seconds longer.', icon: '⏱️', cost: 1, prereq: null, effect: { type: 'boost_seconds', value: 10 } },
  { id: 'pt_ops_night_crew', branch: 'operations', tier: 2, name: 'Night Crew', desc: 'Offline earnings are capped at 1 extra hour.', icon: '🌙', cost: 2, prereq: 'pt_ops_shift', effect: { type: 'offline_hours', value: 1 } },
  { id: 'pt_ops_rush_command', branch: 'operations', tier: 3, name: 'Rush Command', desc: 'Rush Hour lasts 15 seconds longer.', icon: '⚡', cost: 3, prereq: 'pt_ops_night_crew', effect: { type: 'boost_seconds', value: 15 } },
  { id: 'pt_ops_overnight', branch: 'operations', tier: 4, name: 'Overnight Network', desc: 'Offline earnings are capped at 2 extra hours.', icon: '🌌', cost: 5, prereq: 'pt_ops_rush_command', effect: { type: 'offline_hours', value: 2 } },
];

