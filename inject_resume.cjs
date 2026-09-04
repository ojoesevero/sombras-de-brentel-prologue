const fs = require('fs');
const path = require('path');

const scenes = [
  { file: 'TavernScene.js', bgm: 'bgm_taverna' },
  { file: 'RastphenCityScene.js', bgm: 'bgm_cidade' },
  { file: 'TempleScene.js', bgm: 'bgm_templo' },
  { file: 'TempleNorthScene.js', bgm: 'bgm_templo' },
  { file: 'ForestRouteScene.js', bgm: 'bgm_masmorra' },
  { file: 'DungeonScene.js', bgm: 'bgm_masmorra' },
  { file: 'BattleScene.js', bgm: 'bgm_batalha' }
];

const basePath = path.join(__dirname, 'src', 'scenes');

for (const scene of scenes) {
  const filePath = path.join(basePath, scene.file);
  if (!fs.existsSync(filePath)) continue;
  let content = fs.readFileSync(filePath, 'utf8');

  // Insert RESUME listener before setupInputs() or update()
  if (!content.includes('Phaser.Scenes.Events.RESUME, () => {')) {
     if (content.includes('  setupInputs() {')) {
        content = content.replace(
           /  setupInputs\(\) \{/,
           `  setupInputs() {\n    this.events.on(Phaser.Scenes.Events.RESUME, () => {\n      AudioManager.init(this);\n      AudioManager.playBGM('${scene.bgm}');\n    });\n`
        );
     } else if (content.includes('  update() {')) {
        content = content.replace(
           /  update\(\) \{/,
           `  update() {\n    this.events.on(Phaser.Scenes.Events.RESUME, () => {\n      AudioManager.init(this);\n      AudioManager.playBGM('${scene.bgm}');\n    });\n`
        );
     } else if (content.includes('  setupInteractions() {')) {
        content = content.replace(
           /  setupInteractions\(\) \{/,
           `  setupInteractions() {\n    this.events.on(Phaser.Scenes.Events.RESUME, () => {\n      AudioManager.init(this);\n      AudioManager.playBGM('${scene.bgm}');\n    });\n`
        );
     }
  } else if (!content.includes(`AudioManager.playBGM('${scene.bgm}')`) && content.includes('Phaser.Scenes.Events.RESUME')) {
     // ForestRouteScene has it
     content = content.replace(
       /(this\.events\.on\(Phaser\.Scenes\.Events\.RESUME,\s*\(\)\s*=>\s*\{)/,
       `$1\n      AudioManager.init(this);\n      AudioManager.playBGM('${scene.bgm}');`
     );
  }

  fs.writeFileSync(filePath, content, 'utf8');
}
