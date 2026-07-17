function containsBlockedWord(text, blockedWords) {
  if (!text) return { blocked: false };
  const lower = text.toLowerCase();
  const hit = blockedWords.find((w) => {
    const pattern = new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return pattern.test(lower);
  });
  return hit ? { blocked: true, word: hit } : { blocked: false };
}

module.exports = { containsBlockedWord };
