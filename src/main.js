import Phaser from 'phaser';
import { inject } from '@vercel/analytics';

// Inicia o rastreamento do Vercel Analytics
inject();

import PreloadScene from './scenes/PreloadScene.js';
import IntroSplashScene from './scenes/IntroSplashScene.js';
import MenuScene from './scenes/MenuScene.js';
import IntroStoryScene from './scenes/IntroStoryScene.js';
import ActIntroScene from './scenes/ActIntroScene.js';
import ActTransitionScene from './scenes/ActTransitionScene.js';
import SettingsScene from './scenes/SettingsScene.js';
import TavernScene from './scenes/TavernScene.js';
import RastphenCityScene from './scenes/RastphenCityScene.js';
import TempleScene from './scenes/TempleScene.js';
import TempleNorthScene from './scenes/TempleNorthScene.js';
import ForestRouteScene from './scenes/ForestRouteScene.js';
import GameScene from './scenes/GameScene.js';
import BattleScene from './scenes/BattleScene.js';
import RewardScene from './scenes/RewardScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import PauseScene from './scenes/PauseScene.js';
import InventoryScene from './scenes/InventoryScene.js';
import YanilShopScene from './scenes/YanilShopScene.js';
import DemoEndScene from './scenes/DemoEndScene.js';
import DungeonScene from './scenes/DungeonScene.js';
import UIScene from './scenes/UIScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  pixelArt: true, // Renderização nítida para Pixel Art (sem anti-aliasing borrado)
  roundPixels: true, // Arredonda posições para inteiros para evitar shimmer
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 800,
    height: 600
  },
  scene: [
    PreloadScene,
    IntroSplashScene,
    MenuScene,
    IntroStoryScene,
    ActIntroScene,
    ActTransitionScene,
    SettingsScene,
    TavernScene,
    RastphenCityScene,
    TempleScene,
    TempleNorthScene,
    ForestRouteScene,
    DungeonScene,
    GameScene,
    BattleScene,
    RewardScene,
    GameOverScene,
    PauseScene,
    InventoryScene,
    YanilShopScene,
    DemoEndScene,
    UIScene
  ],
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  }
};

const game = new Phaser.Game(config);
