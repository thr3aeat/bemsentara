const { commands } = require('../bot/ekoyildiz/commands');

console.log("Total commands registered:", commands.size);

const uniqueCommands = new Map();
for (const [key, cmd] of commands) {
  if (!cmd || typeof cmd !== 'object') {
    console.error(`Invalid command at key "${key}":`, cmd);
    continue;
  }
  if (!cmd.name) {
    console.error(`Command at key "${key}" has no name!`, cmd);
    continue;
  }
  if (!uniqueCommands.has(cmd.name)) {
    uniqueCommands.set(cmd.name, cmd);
  }
}

console.log("Unique commands:", uniqueCommands.size);

for (const [name, cmd] of uniqueCommands) {
  console.log(`Cmd: "${name}", Cat: "${cmd.category}", Desc len: ${cmd.description?.length || 0}`);
}
