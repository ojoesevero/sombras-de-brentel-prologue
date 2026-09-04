const fs = require('fs');
const path = require('path');

const scenes = [
  { file: 'TavernScene.js', bgm: 'bgm_taverna' },
  { file: 'RastphenCityScene.js', bgm: 'bgm_cidade' },
  { file: 'TempleScene.js', bgm: 'bgm_templo' },
  { file: 'TempleNorthScene.js', bgm: 'bgm_templo' },
  { file: 'ForestRouteScene.js', bgm: 'bgm_masmorra' },
  { file: 'DungeonScene.js', bgm: 'bgm_masmorra' }
];

const basePath = path.join(__dirname, 'src', 'scenes');

for (const scene of scenes) {
  const filePath = path.join(basePath, scene.file);
  if (!fs.existsSync(filePath)) continue;
  let content = fs.readFileSync(filePath, 'utf8');

  // Insert RESUME listener safely
  if (!content.includes('this._bgmResumeHandler')) {
    content = content.replace(
       /  setupInputs\(\) \{/,
       `  setupInputs() {\n    this.events.off(Phaser.Scenes.Events.RESUME, this._bgmResumeHandler, this);\n    this._bgmResumeHandler = () => {\n      AudioManager.init(this);\n      AudioManager.playBGM('${scene.bgm}');\n    };\n    this.events.on(Phaser.Scenes.Events.RESUME, this._bgmResumeHandler, this);\n`
    );
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Injected RESUME into ${scene.file}`);
  }
}
