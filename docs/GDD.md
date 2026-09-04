# GDD — Sombras de Brentel

**Versão:** 1.0
**Projeto:** Sombras de Brentel — Prologue
**Universo:** Os Seis Contra o Abismo (Livro Original)
**Engine:** Phaser 3
**Gênero:** RPG 2D Top-Down / Tactical RPG
**Perspectiva:** Top-down
**Estética:** Micro Pixel Art / Chibi
**Plataformas:** Web / Desktop (Electron)

---

## 1. Visão do Projeto

### Conceito e High Concept
Um RPG narrativo focado em exploração, gestão de recursos e combate tático que adapta o universo do livro "Os Seis Contra o Abismo". O jogador controla Rhogar Tordan, um guerreiro draconato assombrado pelo passado, que deve investigar uma corrupção sombria que ameaça a cidade de Rastphen e suas redondezas.

### Objetivo do Jogo
Oferecer um prólogo polido e imersivo que apresente os personagens principais, o mundo de Brentel e as mecânicas centrais de jogo (interação, economia, estado de personagem, combate e missões). O prólogo serve como demonstração da capacidade técnica e narrativa do estúdio.

### Público e Diferenciais
- **Público:** Fãs de RPGs clássicos de SNES/GBA, leitores de fantasia sombria e entusiastas de jogos indie narrativos.
- **Diferenciais:** 
  - Arte procedural em Pixel Art rica e atmosférica (feita nativamente na engine).
  - Sistema de diálogos dinâmico baseado em JSON.
  - Mecânicas de *Roleplay* únicas (como o status de Embriaguez que inverte controles).
  - Fidelidade rigorosa ao material original, traduzindo *Lore* para mecânicas.

### Cânone vs. Adaptação (Gameplay)
- **Cânone (Inviolável):** O massacre nas ravinas de Estayler pelas mãos de Iksar; a liderança tática de Joseph; a corrupção avançando do sul.
- **Adaptação (Flexível para Gameplay):** Onde Rhogar obtém recursos; interações menores com NPCs não-canônicos (como Gisela); conquistas e minigames de taverna.

---

## 2. Pilares da Experiência

1. **Personagens (Interação, não Exposição):**
   O jogador entende quem são Joseph, Verônica, John, Traudon e Alícia conversando com eles e observando suas reações, não através de longos blocos de texto expositivo.
   
2. **Exploração (Mundo Vivo):**
   Cenários como a Taverna e a Cidade de Rastphen possuem NPCs com micro-rotinas (ex: a garçonete patrulhando), ciclos de iluminação e partículas (fogo, névoa, folhas).

3. **Descoberta (Mistério Crescente):**
   O jogo começa na aparente segurança de uma taverna. A cada transição de mapa, o ambiente se torna mais hostil (Taverna -> Cidade -> Templo -> Estrada Destruída -> Masmorra).

4. **Combate (Tático e Punitivo):**
   Encontros não são aleatórios. O sistema de batalha por turnos exige gerenciamento do HP e da Fúria (necessária para ataques devastadores como o Sopro de Fogo/Elétrico).

5. **Atmosfera (Curva Emocional):**
   Segurança (Taverna) → Curiosidade (Rastphen) → Estranheza (Templo) → Tensão (Fazenda) → Ameaça (Bosque Cinzento).

---

## 3. Dinâmicas e Mecânicas de Jogo

### Sistema de Diálogos e Condicionais
A narrativa ramificada é controlada por arquivos JSON. NPCs reagem ao estado (flags) do jogador. Se Rhogar não falar com Joseph primeiro, Verônica e John se recusam a dar detalhes da missão.

### Economia e Inventário
O inventário não é infinito. Itens como *Poção de Vida* (cura) e *Cerveja Anã* (restaura fúria, mas pode embriagar) devem ser gerenciados e comprados em NPCs mercadores como Hilda e Yanil Resty.

### Progressão de Nível (RPG)
O ganho de XP (seja por combate ou conclusão de missão) resulta em Level Up, que aumenta atributos base do jogador (Max HP, ATQ, DEF, Eficiência de Fúria).

### Sistema de Status (Roleplay)
Consumir 3 Cervejas Anãs consecutivas ativa a flag temporária `isDrunk`. A tela balança e os controles de movimentação (`WASD` / Setas) são invertidos por 20 segundos.

### Gestão de *Quests* e Mundo Aberto
O fluxo de progressão é data-driven (usando `quests.json` e `map_transitions.json`). Portais são bloqueados automaticamente pelo `WorldManager` se o jogador não cumprir os requisitos da narrativa (ex: Não pode sair da cidade sem ir ao Templo).

---

## 4. Personagens e Fichas

### Heróis (Os Seis)
- **Rhogar Tordan:** (Player) Draconato guerreiro. Forte, assombrado. Mecânica: Sopro Elétrico (Fúria).
- **Joseph Sylven:** Acólito Meio-Elfo. O líder tático e compassivo. Entrega a Quest Principal.
- **Verônica Stinfy:** Arcanista de pavio curto. Direta e cética. Investiga feitiçaria abissal.
- **John Bardem:** Caçador/Ranger frio. O informante focado em sobrevivência e rastreamento.
- **Traudon:** Druida veterano da colina. Observa os sinais de corrupção na terra.
- **Alícia:** Patrulheira empática. Age como suporte emocional (e financeiro inicial) de Rhogar.

### NPCs de Destaque
- **Hilda Barba-de-Ferro:** Anã rude, dona da Taverna Cauda do Dragão. Controla a loja inicial.
- **Gisela:** Garçonete ambulante. Pode ser incomodada até dar uma cerveja de graça.
- **Ilídiz & Gunther:** Sacerdotisa e jovem monge do Templo de Palmem. Fornecem contexto de lore e suprimentos médicos.
- **Yanil Resty:** Mercador excêntrico. Vende tecidos e itens raros na cidade de Rastphen.

### Vilões
- **Iksar:** O algoz de Rhogar. Comanda os soldados no flashback das Ravinas de Estayler.
- **Cultistas e Criaturas:** Goblins, Minotauros e espectros que habitam o Bosque Cinzento.

---

## 5. Mapas e Ambientes

1. **Taverna Cauda do Dragão (`TavernScene`)**: Ambiente de madeira, calor e lareira. Segurança inicial.
2. **Ravinas de Estayler (`GameScene`/Battle)**: Flashback noturno, sangrento e doloroso.
3. **Cidade de Rastphen (`RastphenCityScene`)**: Praça movimentada, centro urbano, guardas patrulhando.
4. **Templo de Palmem (`TempleScene` & `TempleNorthScene`)**: Mármore, ouro e paz sagrada (maculada por feridos).
5. **Rota da Floresta e Fazenda (`ForestRouteScene`)**: Estrada de terra batida, celeiro destruído, rastros de sangue negro.
6. **Masmorra do Bosque Cinzento (`DungeonScene`)**: Névoa, árvores vermelhas, altares rúnicos e o Grande Portão lacrado.

---

## 6. O Arco do Prólogo (Resumo da Trama)
O jogo abre com Rhogar acordando exausto na Taverna de Rastphen. Atormentado e sem recursos, ele busca apoio de seus companheiros (Joseph, Verônica, John, Traudon e Alícia). Ao beber uma Cerveja Anã no balcão de Hilda, as memórias traumáticas o puxam para o passado (Flashback de Estayler, enfrentando Iksar). 
Ao retornar à realidade, a equipe traça o plano: Rhogar deve explorar a cidade, investigar anomalias no Templo de Palmem (visitando o ferido Gunther) e cruzar os portões ao sul. A trilha o leva a uma fazenda dizimada e, finalmente, às margens corrompidas do Bosque Cinzento. Lá, ele deve enfrentar cultistas e purificar altares rúnicos para revelar os segredos por trás do Grande Portão.

---
*Este GDD deve ser usado em conjunto com o FLOWCHARTS.md e o SCENES.md para implementação técnica completa.*
