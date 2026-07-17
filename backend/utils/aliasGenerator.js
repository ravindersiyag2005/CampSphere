const ADJECTIVES = ['Silent', 'Cosmic', 'Rapid', 'Hidden', 'Lucky', 'Brave', 'Quiet', 'Golden', 'Swift', 'Mystic', 'Clever', 'Bold', 'Calm', 'Electric', 'Frosty'];
const ANIMALS = ['Falcon', 'Tiger', 'Panda', 'Otter', 'Eagle', 'Wolf', 'Fox', 'Hawk', 'Lynx', 'Raven', 'Panther', 'Dolphin', 'Cobra', 'Heron', 'Badger'];

function generateAlias() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  const num = Math.floor(Math.random() * 900) + 100;
  return `${adj} ${animal} ${num}`;
}

module.exports = { generateAlias };
