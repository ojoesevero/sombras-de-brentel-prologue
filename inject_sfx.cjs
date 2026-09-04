const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'src');

function updateFile(filePath, replacer) {
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${filePath}, not found`);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  const newContent = replacer(content);
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated ${path.basename(filePath)}`);
  }
}

// 1. BGM Injection
const bgmMapping = {
  'MenuScene.js': 'bgm_ecos_do_abismo',
  'TavernScene.js': 'bgm_fogo_ouro_cerveja',
  'BattleScene.js': 'bgm_furia_estayler',
  'RastphenCityScene.js': 'bgm_muralhas_medo',
  'TempleScene.js': 'bgm_bencao_gunther',
  'TempleNorthScene.js': 'bgm_bencao_gunther',
  'ForestRouteScene.js': 'bgm_rastros_icor',
  'DungeonScene.js': 'bgm_rastros_icor'
};

for (const [file, bgm] of Object.entries(bgmMapping)) {
  const p = path.join(basePath, 'scenes', file);
  updateFile(p, (c) => {
    // Replace old playBGM
    let res = c.replace(/AudioManager\.playBGM\([^)]+\);/g, `window.playBGM(this, '${bgm}');`);
    return res;
  });
}

// 2. SFX Injections

// UIScene.js - advanceDialogue -> sfx_ui_confirm
updateFile(path.join(basePath, 'scenes', 'UIScene.js'), (c) => {
  return c.replace(/this\.game\.events\.on\('advanceDialogue', \(\) => \{/, "this.game.events.on('advanceDialogue', () => {\n      this.sound.play('sfx_ui_confirm', { volume: 0.4 });");
});

// InventoryManager.js - sfx_item_drink
updateFile(path.join(basePath, 'services', 'InventoryManager.js'), (c) => {
  return c.replace(/(consumeItem\(itemId\) \{[\s\S]*?)(this\.removeItem\(itemId, 1\);)/, "$1this.scene.sound.play('sfx_item_drink', { volume: 0.6 });\n    $2");
});

// RewardScene.js - sfx_item_coin
updateFile(path.join(basePath, 'scenes', 'RewardScene.js'), (c) => {
  return c.replace(/(InventoryManager\.addGold\([^)]+\);)/g, "$1\n    this.sound.play('sfx_item_coin', { volume: 0.5 });");
});

// WorldManager.js - sfx_env_portal
updateFile(path.join(basePath, 'services', 'WorldManager.js'), (c) => {
  return c.replace(/(transitionTo\(targetScene, data = \{\}\) \{)/, "$1\n    if (this.currentScene) this.currentScene.sound.play('sfx_env_portal', { volume: 0.4 });");
});

// DungeonScene.js - sfx_env_chest and sfx_env_purify
updateFile(path.join(basePath, 'scenes', 'DungeonScene.js'), (c) => {
  let res = c.replace(/(this\.runasPurificadas\+\+;)/, "this.sound.play('sfx_env_purify', { volume: 0.6 });\n        this.cameras.main.flash(500, 255, 255, 255);\n        $1");
  // Assuming there's a chest logic, let's find it. If not, we'll manually check.
  // We can look for "chest" or "open"
  res = res.replace(/(Logger\.info\('DungeonScene', 'Baú aberto!)/, "this.sound.play('sfx_env_chest', { volume: 0.5 });\n      $1");
  return res;
});

// BattleScene.js - sfx_combat_slash, sfx_combat_zap, sfx_combat_hurt, sfx_combat_death
updateFile(path.join(basePath, 'scenes', 'BattleScene.js'), (c) => {
  let res = c.replace(/(this\.pendingActionType === 'ATTACK'[\s\S]*?)(Logger\.info)/, "$1this.sound.play('sfx_combat_slash', { volume: 0.5 });\n      $2");
  res = res.replace(/(this\.pendingActionType === 'SKILL'[\s\S]*?)(Logger\.info)/, "$1this.sound.play('sfx_combat_zap', { volume: 0.5 });\n      $2");
  // hurt
  res = res.replace(/(this\.player\.hp -= [^;]+;)/, "$1\n        this.sound.play('sfx_combat_hurt', { volume: 0.5 });");
  // death
  res = res.replace(/(target\.hp <= 0)/g, "$1\n      this.sound.play('sfx_combat_death', { volume: 0.6 });");
  return res;
});

// ShopUI.js - sfx_ui_hover
updateFile(path.join(basePath, 'ui', 'ShopUI.js'), (c) => {
  return c.replace(/(updateSelection\(\) \{)/, "$1\n    this.scene.sound.play('sfx_ui_hover', { volume: 0.3 });");
});

// Scenes with updateSelectionVisuals
['MenuScene.js', 'SettingsScene.js', 'PauseScene.js', 'GameOverScene.js'].forEach(f => {
  updateFile(path.join(basePath, 'scenes', f), (c) => {
    return c.replace(/(updateSelectionVisuals\(\) \{)/, "$1\n    this.sound.play('sfx_ui_hover', { volume: 0.3 });");
  });
});
