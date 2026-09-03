// Polyfills globais de ambiente antes da importação de Phaser
const mockCtx = {
  fillStyle: '',
  fillRect: () => {},
  getImageData: () => ({ data: [0, 0, 0, 0] }),
  putImageData: () => {},
  createImageData: () => ({ data: [] }),
  setTransform: () => {},
  drawImage: () => {}
};

globalThis.HTMLCanvasElement = class HTMLCanvasElement {
  getContext() { return mockCtx; }
  parentNode = { removeChild: () => {} };
};
globalThis.HTMLVideoElement = class HTMLVideoElement {};
globalThis.Image = class Image {};

globalThis.window = {
  cordova: undefined,
  addEventListener: () => {},
  removeEventListener: () => {},
  focus: () => {}
};

globalThis.document = {
  createElement: (tag) => {
    if (tag === 'canvas') return new globalThis.HTMLCanvasElement();
    return {
      getContext: () => mockCtx,
      style: {},
      parentNode: { removeChild: () => {} }
    };
  },
  documentElement: { style: {} },
  body: { appendChild: () => {}, removeChild: () => {} }
};

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Player Progression & Level Up Unit Tests', async () => {
  const { default: Player } = await import('../src/entities/Player.js');

  const createMockPlayer = () => {
    const mockScene = {
      sys: {
        queueDepthSort: () => {},
        displayList: { queueDepthSort: () => {} }
      },
      add: {
        existing: () => {},
        text: () => ({
          setOrigin: () => ({ setDepth: () => ({}) }),
          setPosition: () => ({}),
          destroy: () => ({})
        }),
        container: () => {
          const c = {
            setDepth: () => c,
            setPosition: () => c,
            destroy: () => {},
            add: () => c
          };
          return c;
        }
      },
      tweens: {
        add: () => ({ stop: () => ({}) })
      },
      physics: null,
      textures: null,
      game: { events: { on: () => {}, off: () => {}, emit: () => {} } },
      events: { once: () => {} }
    };
    return new Player(mockScene, 0, 0, 32, 32);
  };

  it('deve inicializar Rhogar com Nível 1 e atributos padrão corretos', () => {
    const player = createMockPlayer();
    assert.equal(player.level, 1);
    assert.equal(player.xp, 0);
    assert.equal(player.xpToNextLevel, 100);
    assert.equal(player.maxHp, 120);
    assert.equal(player.hp, 120);
    assert.equal(player.attack, 18);
    assert.equal(player.defense, 8);
    assert.equal(player.electricBreathCost, 50);
  });

  it('deve acumular XP sem subir de nível se abaixo do limiar', () => {
    const player = createMockPlayer();
    const res = player.gainXP(50);
    assert.equal(res.leveledUp, false);
    assert.equal(player.xp, 50);
    assert.equal(player.level, 1);
  });

  it('deve processar Level Up ao atingir 100 XP aumentando vida, ataque, defesa e eficiência do Sopro', () => {
    const player = createMockPlayer();
    player.hp = 50;
    const res = player.gainXP(100);

    assert.equal(res.leveledUp, true);
    assert.equal(player.level, 2);
    assert.equal(player.xp, 0);
    assert.equal(player.maxHp, 145); // 120 + 25
    assert.equal(player.hp, 145); // Cura completa
    assert.equal(player.attack, 21); // 18 + 3
    assert.equal(player.defense, 10); // 8 + 2
    assert.equal(player.electricBreathCost, 45); // 50 -> 45
    assert.equal(player.electricBreathMultiplier, 2.7); // 2.5 + 0.2
    assert.equal(player.xpToNextLevel, 150); // 100 * 1.5
  });

  it('deve suportar ganho massivo de XP com múltiplos Level Ups encadeados', () => {
    const player = createMockPlayer();
    const res = player.gainXP(260);

    assert.equal(res.leveledUp, true);
    assert.equal(player.level, 3);
    assert.equal(player.xp, 10);
    assert.equal(player.maxHp, 170); // 120 + 25 + 25
    assert.equal(player.attack, 24); // 18 + 3 + 3
    assert.equal(player.defense, 12); // 8 + 2 + 2
    assert.equal(player.electricBreathCost, 40); // 50 - 5 - 5
  });

  it('deve consumir cervejas anãs e ativar estado de embriaguez ao atingir 3 doses', () => {
    const player = createMockPlayer();
    assert.equal(player.isDrunk, false);
    assert.equal(player.beersDrunkCount, 0);

    player.consumeBeer(); // 1ª dose
    assert.equal(player.beersDrunkCount, 1);
    assert.equal(player.isDrunk, false);

    player.consumeBeer(); // 2ª dose
    assert.equal(player.beersDrunkCount, 2);
    assert.equal(player.isDrunk, false);

    player.consumeBeer(); // 3ª dose -> ativa embriaguez
    assert.equal(player.beersDrunkCount, 3);
    assert.equal(player.isDrunk, true);
    assert.equal(player.drunkTimer, 20000);
  });

  it('deve dissipar o estado de embriaguez quando o temporizador expirar', () => {
    const player = createMockPlayer();
    player.activateDrunkState(20000);
    assert.equal(player.isDrunk, true);

    // Passagem de 10 segundos
    player.update(0, 10000);
    assert.equal(player.isDrunk, true);
    assert.equal(player.drunkTimer, 10000);

    // Passagem de mais 10 segundos (total 20s)
    player.update(0, 10000);
    assert.equal(player.isDrunk, false);
    assert.equal(player.drunkTimer, 0);
  });

  it('deve salvar e carregar corretamente o estado de nível e XP', () => {
    const player = createMockPlayer();
    player.gainXP(100);
    const state = player.getState();
    assert.equal(state.level, 2);
    assert.equal(state.maxHp, 145);

    const player2 = createMockPlayer();
    player2.loadState(state);

    assert.equal(player2.level, 2);
    assert.equal(player2.maxHp, 145);
    assert.equal(player2.electricBreathCost, 45);
  });
});
