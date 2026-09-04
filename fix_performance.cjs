const fs = require('fs');
const path = require('path');

const scenesToPatch = [
  'TavernScene.js',
  'TempleScene.js',
  'TempleNorthScene.js',
  'RastphenCityScene.js'
];

scenesToPatch.forEach(filename => {
  const filePath = path.join(__dirname, 'src', 'scenes', filename);
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf8');

  // Fix TavernScene if it got broken
  if (filename === 'TavernScene.js') {
    if (content.includes("giselaEntry.y = this.waitress.y;\n    });\n\n    if (closest && this.player.canInteract()) {")) {
      content = content.replace("giselaEntry.y = this.waitress.y;\n    });\n\n    if (closest && this.player.canInteract()) {", `giselaEntry.y = this.waitress.y;
    }

    // Sistema de Gatilhos Espaciais
    let closest = null;
    let closestDist = Infinity;

    if (this.player.body.velocity.lengthSq() > 0 || !this.currentInteractable) {
      this.interactables.forEach(ent => {
        let distSq;
        // Para o balcão da taverna (permite interação fluida ao longo de toda a extensão x: 280 a 520)
        if (ent.id === 'balcao_taverna') {
          const clampedX = Phaser.Math.Clamp(this.player.x, 280, 520);
          distSq = Phaser.Math.Distance.Squared(this.player.x, this.player.y, clampedX, ent.y);
        } else {
          distSq = Phaser.Math.Distance.Squared(this.player.x, this.player.y, ent.x, ent.y);
        }

        let maxRange = 65;
        if (ent.id === 'hilda') {
          maxRange = 150; // Permite interação confortável através do balcão sem bloqueio de colisão
        } else if (ent.id === 'balcao_taverna') {
          maxRange = 125;
        }

        if (distSq <= (maxRange * maxRange) && distSq < closestDist) {
          closestDist = distSq;
          closest = ent;
        }
      });
    } else {
      closest = this.interactables.find(e => e.id === this.currentInteractable);
    }

    if (closest && this.player.canInteract()) {`);
    }
  }

  // General replace for other scenes
  if (filename !== 'TavernScene.js') {
    const blockRegex = /let closest = null;\s*let closestDist = Infinity;\s*this\.interactables\.forEach\(ent => \{\s*const dist = Phaser\.Math\.Distance\.Between\(this\.player\.x, this\.player\.y, ent\.x, ent\.y\);\s*if \(dist <= (\d+) && dist < closestDist\) \{\s*closestDist = dist;\s*closest = ent;\s*\}\s*\}\);/g;
    
    content = content.replace(blockRegex, (match, maxRange) => {
      return `let closest = null;
    let closestDist = Infinity;

    if (this.player.body.velocity.lengthSq() > 0 || !this.currentInteractable) {
      this.interactables.forEach(ent => {
        const distSq = Phaser.Math.Distance.Squared(this.player.x, this.player.y, ent.x, ent.y);
        const maxRangeSq = ${maxRange} * ${maxRange};
        if (distSq <= maxRangeSq && distSq < closestDist) {
          closestDist = distSq;
          closest = ent;
        }
      });
    } else {
      closest = this.interactables.find(e => e.id === this.currentInteractable);
    }`;
    });
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Patched', filename);
});
