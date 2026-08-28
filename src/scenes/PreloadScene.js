import Phaser from 'phaser';
import { AssetsConfig } from '../config/assets.js';
import Logger from '../utils/Logger.js';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload() {
    this.load.json('dialogues', './data/dialogues.json');
    this.load.json('enemies', './data/enemies.json');
    this.load.json('tavern_interactions', './data/tavern_interactions.json');
    this.load.json('act2_interactions', './data/act2_interactions.json');
    this.load.json('quests', './data/quests.json');
    this.load.json('dungeon_enemies', './data/dungeon_enemies.json');
    this.load.json('thought_interactions', './data/thought_interactions.json');
    this.load.json('map_transitions', './data/map_transitions.json');
  }

  create() {
    // Gerar texturas procedurais/provisórias baseadas no Manifesto para evitar quebras visuais
    Object.values(AssetsConfig.portraits).forEach(key => {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x444466, 1);
      g.fillRect(0, 0, 128, 128);
      g.lineStyle(4, 0xd4af37, 1);
      g.strokeRect(0, 0, 128, 128);
      g.generateTexture(key, 128, 128);
    });

    let gp = this.make.graphics({ x: 0, y: 0, add: false });
    gp.fillStyle(0xffffff, 1);
    gp.fillCircle(8, 8, 8);
    gp.generateTexture(AssetsConfig.fx.particle_star, 16, 16);

    gp.clear();
    gp.fillStyle(0x00ffff, 1);
    gp.fillRect(0, 0, 16, 4);
    gp.generateTexture(AssetsConfig.fx.particle_lightning, 16, 4);

    Logger.info('PreloadScene', 'Assets procedurais provisórios gerados com sucesso.');
    this.scene.start('MenuScene');
  }
}
