// ============================================================
// INK & AETHER - Game Data
// ============================================================

const ISLANDS = [
    {
        id: 'echoes',
        name: 'Garden of Echoes',
        icon: '&#10043;',
        description: 'Where every footstep is remembered by the flowers',
        constellation: {
            stars: [
                { x: 0.30, y: 0.35 },
                { x: 0.50, y: 0.25 },
                { x: 0.70, y: 0.35 },
                { x: 0.60, y: 0.55 },
                { x: 0.40, y: 0.55 },
                { x: 0.50, y: 0.70 }
            ],
            connections: [[0,1], [1,2], [2,3], [3,4], [4,5], [5,0], [0,4], [1,3]]
        },
        narrative: {
            title: 'The Garden Remembers',
            text: 'In the Garden of Echoes, flowers do not bloom for sunlight. They bloom for footsteps. Each petal holds the weight of a traveler\'s sorrow, each stem bows with the joy of someone who finally arrived home. The garden keeper was not a person, but a silence — a silence so patient it learned to grow roots.'
        }
    },
    {
        id: 'silence',
        name: 'Observatory of Silence',
        icon: '&#9733;',
        description: 'Where astronomers once spoke with stars',
        constellation: {
            stars: [
                { x: 0.25, y: 0.40 },
                { x: 0.40, y: 0.30 },
                { x: 0.55, y: 0.35 },
                { x: 0.70, y: 0.30 },
                { x: 0.75, y: 0.50 },
                { x: 0.65, y: 0.65 },
                { x: 0.50, y: 0.60 }
            ],
            connections: [[0,1], [1,2], [2,3], [3,4], [4,5], [5,6], [6,0], [2,6]]
        },
        narrative: {
            title: 'The Last Observation',
            text: 'The astronomers of the Observatory did not look through glass. They listened. Each star had a voice — not of sound, but of meaning. They charted not positions, but intentions. When the world stopped asking questions, the stars stopped answering. The dome fell silent. But the chairs remain, turned toward the sky, waiting.'
        }
    },
    {
        id: 'harbor',
        name: 'Harbor of Unwritten Letters',
        icon: '&#9993;',
        description: 'Where words too heavy to send sink like anchors',
        constellation: {
            stars: [
                { x: 0.20, y: 0.45 },
                { x: 0.35, y: 0.35 },
                { x: 0.50, y: 0.30 },
                { x: 0.65, y: 0.35 },
                { x: 0.80, y: 0.45 },
                { x: 0.70, y: 0.60 },
                { x: 0.50, y: 0.65 },
                { x: 0.30, y: 0.60 }
            ],
            connections: [[0,1], [1,2], [2,3], [3,4], [4,5], [5,6], [6,7], [7,0], [2,6]]
        },
        narrative: {
            title: 'The Weight of Words Unsent',
            text: 'The Harbor does not hold ships. It holds letters — thousands of them, written by hands that trembled, sealed with wax that wept, addressed to people who moved on, or died, or simply stopped being real. The ink in these letters is heavier than water. They sink to the bottom of the harbor and form a foundation. A city built on almost-said things.'
        }
    },
    {
        id: 'cathedral',
        name: 'Cathedral of Falling',
        icon: '&#10013;',
        description: 'Where gravity is a form of prayer',
        constellation: {
            stars: [
                { x: 0.50, y: 0.20 },
                { x: 0.35, y: 0.30 },
                { x: 0.65, y: 0.30 },
                { x: 0.25, y: 0.45 },
                { x: 0.75, y: 0.45 },
                { x: 0.30, y: 0.60 },
                { x: 0.70, y: 0.60 },
                { x: 0.40, y: 0.75 },
                { x: 0.60, y: 0.75 }
            ],
            connections: [[0,1], [0,2], [1,3], [2,4], [3,5], [4,6], [5,7], [6,8], [7,8], [3,4], [5,6]]
        },
        narrative: {
            title: 'The Gravity of Faith',
            text: 'The Cathedral of Falling is not a place you enter. It is a place you descend into. Its worshippers believe that falling is the truest form of prayer — to let go of the edge, to trust the void, to find meaning in the drop. The stained glass windows show not saints, but comets. Not angels, but rain. Here, surrender is sacred.'
        }
    },
    {
        id: 'cartographer',
        name: 'The Cartographer\'s Rest',
        icon: '&#9737;',
        description: 'Where all maps converge and diverge',
        constellation: {
            stars: [
                { x: 0.50, y: 0.20 },
                { x: 0.30, y: 0.35 },
                { x: 0.70, y: 0.35 },
                { x: 0.25, y: 0.55 },
                { x: 0.75, y: 0.55 },
                { x: 0.40, y: 0.75 },
                { x: 0.60, y: 0.75 },
                { x: 0.50, y: 0.50 },
                { x: 0.50, y: 0.90 }
            ],
            connections: [[0,1], [0,2], [1,3], [2,4], [3,5], [4,6], [5,7], [6,7], [7,8], [0,7], [1,2], [3,4], [5,6]]
        },
        narrative: {
            title: 'The Mapmaker\'s Confession',
            text: 'You have reached the place where all maps end. The Cartographer who lived here spent a lifetime drawing shorelines that shifted the moment the ink dried. She learned that maps do not describe the world — they describe the mapper. Your constellation is not in the sky. It is in the pattern of your choices, the shape of your wandering. You are the map now.'
        }
    }
];

const PROLOGUE_LINES = [
    'In the age before forgetting,',
    'the sky was a library of light.',
    'Every star, a story.',
    'Every constellation, a civilization\'s memory.',
    'But the world below turned away from the night.',
    'And the stars began to dim.',
    'You are the last Cartographer.',
    'The ink is in your hands.'
];

const ENDING_LINES = [
    'The constellations burn again.',
    'Not as they were,',
    'but as they could be.',
    'You did not restore the past.',
    'You imagined a new sky.',
    'And somewhere, someone looks up',
    'and remembers how to wonder.'
];
