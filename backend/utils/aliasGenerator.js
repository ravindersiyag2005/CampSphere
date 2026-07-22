function generateAlias() {
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `Anon-${randomStr}`;
}

module.exports = { generateAlias };
