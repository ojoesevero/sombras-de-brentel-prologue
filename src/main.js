import Phaser from 'phaser';
import PreloadScene from './scenes/PreloadScene.js';
import MenuScene from './scenes/MenuScene.js';
import SettingsScene from './scenes/SettingsScene.js';
import TavernScene from './scenes/TavernScene.js';
import RastphenCityScene from './scenes/RastphenCityScene.js';
import TempleScene from './scenes/TempleScene.js';
import ForestRouteScene from './scenes/ForestRouteScene.js';
import GameScene from './scenes/GameScene.js';
import BattleScene from './scenes/BattleScene.js';
import RewardScene from './scenes/RewardScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import PauseScene from './scenes/PauseScene.js';
import DemoEndScene from './scenes/DemoEndScene.js';
import DungeonScene from './scenes/DungeonScene.js';

const config = {
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 800,
    height: 600
  },
  scene: [PreloadScene, MenuScene, SettingsScene, TavernScene, RastphenCityScene, TempleScene, ForestRouteScene, DungeonScene, GameScene, BattleScene, RewardScene, GameOverScene, PauseScene, DemoEndScene],
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  }
};

const game = new Phaser.Game(config);
