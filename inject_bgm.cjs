const fs = require('fs');
const path = require('path');

const scenes = [
  { file: 'MenuScene.js', bgm: 'bgm_menu' },
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

  // Add import if not exists
  if (!content.includes('import AudioManager')) {
    content = content.replace(
      /(import Logger from '..\/utils\/Logger.js';)/,
      "$1\nimport AudioManager from '../audio/AudioManager.js';"
    );
  }

  // Inject into create()
  if (!content.includes('AudioManager.init(this)')) {
    content = content.replace(
      /(create\([^\)]*\)\s*\{)/,
      `$1\n    AudioManager.init(this);\n    AudioManager.playBGM('${scene.bgm}');`
    );
  }
  
  // RESUME listener
  if (!content.includes('Phaser.Scenes.Events.RESUME') || !content.includes(`AudioManager.playBGM('${scene.bgm}')`)) {
     if (content.includes('this.events.on(Phaser.Scenes.Events.RESUME, () => {')) {
        content = content.replace(
          /(this\.events\.on\(Phaser\.Scenes\.Events\.RESUME,\s*\(\)\s*=>\s*\{)/,
          `$1\n      AudioManager.init(this);\n      AudioManager.playBGM('${scene.bgm}');`
        );
     } else {
        // Just inject at the end of create
        content = content.replace(
           /(\n  \}[ \t]*\n\s*(setupInputs|update|setupInteractions|setupAnimations|createUI))/g,
           `\n    this.events.on(Phaser.Scenes.Events.RESUME, () => {\n      AudioManager.init(this);\n      AudioManager.playBGM('${scene.bgm}');\n    });$1`
        );
     }
  }

  fs.writeFileSync(filePath, content, 'utf8');
}

const rewardPath = path.join(basePath, 'RewardScene.js');
if (fs.existsSync(rewardPath)) {
  let content = fs.readFileSync(rewardPath, 'utf8');
  if (!content.includes('AudioManager.stopBGM')) {
    content = content.replace(
      /(create\([^\)]*\)\s*\{)/,
      `$1\n    AudioManager.init(this);\n    AudioManager.stopBGM(500);`
    );
  }
  fs.writeFileSync(rewardPath, content, 'utf8');
}
