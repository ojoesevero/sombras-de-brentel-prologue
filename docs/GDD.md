# Sombras de Brentel — Prologue
## Game Design Document (GDD)

> Documento mestre do prólogo do jogo, cruzando a adaptação narrativa com a implementação atual do repositório.

**Status:** Baseline v0.1  
**Engine:** Phaser 4.2.1  
**Runtime:** Web + Electron  
**Arquitetura:** Data-driven  
**Resolução lógica:** 800x600  
**Fonte narrativa:** *Os Seis Contra o Abismo — A Floresta Cinzenta*

---

## 1. Regra de verdade do projeto

O projeto passa a ser acompanhado por quatro camadas:

| Camada | Significado |
|---|---|
| CANON | O que pertence à história/lore do livro. |
| GAME DESIGN | Como o prólogo adapta esse conteúdo para jogo. |
| IMPLEMENTADO | O que existe atualmente no código/dados do GitHub. |
| PENDENTE | O que foi definido, mas ainda precisa ser implementado ou refinado. |

Quando jogo e livro divergirem, a divergência deve ser registrada explicitamente como decisão de adaptação; nunca tratada como erro silencioso.

---

## 2. Visão do jogo

**Sombras de Brentel — Prologue** é um RPG top-down de exploração com combate tático em turnos, centrado no passado de Rhogar e no encontro dos seis protagonistas.

O prólogo não tenta reproduzir o livro inteiro. Ele funciona como uma porta de entrada para o universo, estabelecendo:

1. Rhogar como protagonista jogável;
2. sua ligação com Joseph, Verônica, John, Traudon e Alícia;
3. o trauma das Ravinas de Estayler;
4. a cidade de Rastphen;
5. os primeiros sinais da corrupção;
6. o caminho até o Bosque Cinzento;
7. o Grande Portão como cliffhanger.

---

## 3. Pilares de experiência

### 3.1 Exploração
O jogador percorre ambientes top-down conectados por transições físicas e câmera acompanhando o personagem.

### 3.2 Conversa e descoberta
NPCs e objetos usam diálogos orientados por dados, com escolhas em pontos selecionados.

### 3.3 Progressão narrativa
QuestManager e flags controlam a ordem das descobertas sem transformar o mundo em uma sequência de telas isoladas.

### 3.4 Combate
Batalhas são turn-based e separadas da exploração. O sistema trabalha com HP, ATK, DEF, XP, Fúria, seleção de alvo e habilidades especiais.

### 3.5 Atmosfera
A direção parte do Micro Pixel Art/Chibi e usa iluminação, partículas, neblina, flash, hit-stop e screen shake para reforçar impacto.

---

## 4. Estrutura macro atual

```text
IntroSplash
   ↓
Menu / Novo Jogo
   ↓
IntroStory / Introdução de lore
   ↓
Act I — Taverna Cauda do Dragão
   ↓
Exploração + NPCs + cerveja + Joseph
   ↓
Flashback — Ravinas de Estayler
   ↓
Batalha tutorial
   ↓
Reward — Espada Bastarda Serrilhada + XP
   ↓
Taverna / conclusão da Quest 1
   ↓
Act II — Rastphen
   ↓
Templo de Palmem / Gruther
   ↓
Rastphen / Mercador / Portões
   ↓
Estrada Sul / Fazenda Halfling
   ↓
Pistas da criatura
   ↓
Act III — Masmorra do Bosque Cinzento
   ↓
3 Runas de Purificação
   ↓
Grande Portão Selado
   ↓
FIM DO PRÓLOGO
```

A existência das cenas acima é confirmada pelo registro principal de cenas em `src/main.js` e pelo fluxo de transições em `public/data/map_transitions.json`.

---

## 5. Atos

### ATO I — A Taverna Cauda do Dragão

**Objetivo narrativo:** apresentar Rhogar, os companheiros e o trauma de Estayler.

**Objetivo de gameplay:** ensinar exploração, interação, inventário/economia básica e iniciar o primeiro combate.

**Quest principal:** `quest_01_flashback` — “Memórias de Estayler”.

A Quest inicia ativa e exige conversa com os frequentadores antes do diálogo de Joseph liberar o flashback.

### ATO II — Os Segredos de Rastphen

**Objetivo narrativo:** revelar que a ameaça não está limitada ao passado de Rhogar e introduzir a corrupção que aponta para o sul.

**Quest principal:** `quest_02_temple` — “O Templo de Palmem”.

Fluxo implementado:

```text
Taverna
  → Rastphen
  → Templo de Palmem
  → Ala Norte / Gruther
  → retorno à cidade
  → Portão Sul
  → Estrada da Fazenda
  → Fazenda Halfling
```

### ATO III — A Masmorra do Bosque Cinzento

**Objetivo narrativo:** colocar o jogador diante da manifestação física da ameaça.

**Quest:** `quest_04_forest_trail` e `quest_05_defeat_minotaur` estão previstas no manifesto atual.

O mapa possui 3 altares rúnicos, uma fogueira/checkpoint, inimigos e o Grande Portão selado.

---

## 6. Personagem jogável — Rhogar Tordan

**Função:** protagonista e personagem controlado diretamente.

**Identidade:** draconato bronze, ex-gladiador, guerreiro de linha de frente.

**Fantasia de gameplay:** força física, resistência, combate agressivo e Fúria.

**Habilidade especial:** Sopro Elétrico.

**Arma de progressão do flashback:** Espada Bastarda Serrilhada.

### Estado narrativo inicial
Rhogar desperta na taverna cansado e sem dinheiro. O primeiro objetivo não é uma batalha: é descobrir o estado do grupo e recuperar o rumo antes de enfrentar o passado.

---

## 7. Companheiros e função narrativa

| Personagem | Função no grupo | Contraste dramático |
|---|---|---|
| Joseph Sylven | líder tático / referência moral | fé × pragmatismo |
| Verônica Stinfy | magia / estratégia | controle × imprevisibilidade |
| John Bardem | reconhecimento / precisão | sobrevivência × moralidade |
| Traudon Balker | conhecimento / natureza | sabedoria × dúvida |
| Alícia Lavdik | suporte / sociabilidade | alegria × tensão |
| Rhogar Tordan | protagonista / linha de frente | honra × trauma |

No prólogo, os cinco companheiros funcionam inicialmente como NPCs e referências narrativas, enquanto Rhogar concentra a jogabilidade.

---

## 8. NPCs-chave

### Taverna
- Hilda — proprietária da Cauda do Dragão;
- Gisela — garçonete ambulante;
- Joseph, Verônica, John, Traudon e Alícia;
- Placa de regras;
- Quadro de avisos.

### Rastphen / Templo
- Yânil — comerciante;
- Guarda Telmer;
- Guarda Breno;
- Sacerdotisa de Palmem;
- Gruther — personagem ferido ligado ao avanço da ameaça.

### Fazenda
- Fazendeiro Halfling;
- pistas físicas no celeiro destruído.

---

## 9. Sistema de Quest

O manifesto atual possui cinco quests:

| ID | Título | Estado inicial |
|---|---|---|
| `quest_01_flashback` | Memórias de Estayler | active |
| `quest_02_temple` | O Templo de Palmem | locked |
| `quest_03_investigate_farm` | Rastros na Névoa | locked |
| `quest_04_forest_trail` | A Trilha do Bosque Cinzento | locked |
| `quest_05_defeat_minotaur` | O Pesadelo Abissal | locked |

A progressão atual é explicitamente controlada por `QuestManager`.

---

## 10. Gating narrativo

O jogo usa pensamentos de Rhogar para explicar bloqueios sem apresentar o bloqueio como erro técnico.

Estados identificados:

- `thought_locked_tavern` — precisa falar com Joseph;
- `thought_locked_south_gate` — precisa visitar o Templo de Palmem;
- `thought_locked_dungeon_entry` — precisa investigar a fazenda;
- `thought_locked_boss_gate` — precisa purificar as três runas.

**Decisão de design:** bloqueios narrativos devem sempre ter uma justificativa diegética clara.

---

## 11. Diálogos e escolhas

Os diálogos são mantidos em JSON e renderizados por `DialogueBox`.

A taverna já possui escolhas Positiva/Neutra/Negativa para Hilda, Verônica, John e o núcleo Traudon/Alícia.

As escolhas atuais são principalmente de caracterização. Elas ainda não constituem três campanhas narrativas diferentes.

**Regra para evolução:** uma escolha só deve criar uma nova ramificação persistente quando existir consequência clara em diálogo, quest, acesso, item, reputação ou estado.

---

## 12. Combate

### Estrutura
```text
Exploração
   ↓
Trigger / encontro
   ↓
BattleScene
   ↓
Ações do jogador
   ↓
Seleção de alvo
   ↓
Ataque / Defesa / habilidade
   ↓
Turno inimigo
   ↓
Vitória ou derrota
```

### Sistemas
- HP / Max HP;
- ATK / DEF;
- XP e nível;
- Fúria;
- Sopro Elétrico;
- mitigação por defesa;
- múltiplos alvos;
- seleção por teclado/gamepad;
- feedback visual e sonoro.

O flashback possui tratamento especial: a derrota não deve encerrar o prólogo como Game Over, pois o evento é uma memória e a história precisa retornar à taverna.

---

## 13. Economia e inventário

Itens e economia são administrados por `InventoryManager` e `ShopUI`.

Elementos já previstos no projeto:

- Ouro;
- Poção de Cura;
- Cerveja Anã;
- Pergaminho de Trovão;
- Manto Élfico;
- Espada Bastarda Serrilhada.

A Cerveja Anã também participa do estado de embriaguez e da sequência narrativa inicial.

---

## 14. Mapas e responsabilidades

| Cena | Função |
|---|---|
| `TavernScene` | hub inicial, diálogos, economia, flashback |
| `RastphenCityScene` | hub urbano e conexão dos mapas |
| `TempleScene` | templo e progressão narrativa |
| `TempleNorthScene` | ala norte / Gruther |
| `ForestRouteScene` | estrada e fazenda |
| `DungeonScene` | masmorra, runas, inimigos e portão |
| `GameScene` | cutscene/flashback de Estayler |
| `BattleScene` | combate em turnos |
| `RewardScene` | recompensa e persistência |
| `DemoEndScene` | encerramento do prólogo |

---

## 15. Flags e estados importantes

Flags/estados observados na implementação:

- `hasCompletedFlashback`;
- `drankBeer`;
- `returnedFromFlashback`;
- `battleOutcome`;
- `visitedNPCs`;
- `isTransitioning`;
- `runasPurificadas`;
- estado das quests.

**Diretriz:** flags narrativas devem possuir nome semântico e ser registradas neste documento antes de se multiplicarem no código.

---

## 16. Implementação x design

### Implementado e confirmado
- Phaser + Electron + Vite;
- cenas principais registradas;
- arquitetura data-driven;
- diálogos JSON;
- quests JSON;
- transições JSON;
- gating narrativo;
- inventário/economia;
- combate turn-based;
- save/fallback;
- mapa de Rastphen;
- templo;
- fazenda;
- masmorra;
- 3 altares;
- grande portão;
- RewardScene;
- Game Over / Pause;
- suporte de teclado/gamepad;
- efeitos de combate.

### Pontos a validar/refinar
1. Coerência entre nomes do livro e nomes usados no jogo;
2. ordem canônica de determinados eventos;
3. conteúdo final de cada batalha do Bosque Cinzento;
4. função narrativa das três runas;
5. ligação exata entre Gruther, Fazenda e criatura;
6. se o Minotauro deve ser boss real do prólogo ou apenas ameaça sugerida;
7. quais escolhas da taverna terão consequência persistente;
8. como o final do prólogo conecta diretamente com o próximo jogo.

---

## 17. Regra de ouro para novas features

Antes de implementar uma nova feature, responder:

1. **Ela existe no canon?**
2. **Se não existe, qual é a razão da adaptação?**
3. **Qual cena/quest utiliza a feature?**
4. **Qual estado/flag ela altera?**
5. **Qual consequência o jogador percebe?**
6. **Como ela termina ou retorna ao fluxo principal?**
7. **Como pode ser testada isoladamente?**

Se não houver resposta para pelo menos 4–6, a feature provavelmente ainda não está pronta para entrar no código.
