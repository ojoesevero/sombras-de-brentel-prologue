# Developer Log (DEVLOG)
## Sombras de Brentel - Prologue

### Fase 1 (Setup Inicial)
- **Status:** Concluído
- **Detalhes:** Configuração da base do pipeline de build do projeto utilizando Vite como bundler, Electron para empacotamento Desktop e Phaser 3 como motor gráfico do jogo. A estrutura inicial garante Hot Module Replacement (HMR) e portas travadas para fluidez e velocidade no desenvolvimento.

### Fase 2 (Data-Driven Architecture)
- **Status:** Concluído
- **Detalhes:** Isolamento de `dialogues.json` e `enemies.json` em `public/data/`. O objetivo foi adotar o princípio de separação de responsabilidades (SoC), mantendo a base de dados do jogo estática, gerenciável e escalável (Data-Driven), carregada dinamicamente via cache nativo da engine do Phaser, em vez de codificada (hardcoded).

### Fase 3 (Sistema de Diálogos)
- **Status:** Concluído
- **Detalhes:** Implementação estruturada do container interativo `DialogueBox.js` com efeito visual *typewriter*, renderizando textos dinâmicos na tela. A lógica inclui suporte cross-input (teclado: ESPAÇO, ENTER, Z e clique do mouse), encapsulada de modo Orientado a Objetos (estendendo `Phaser.GameObjects.Container`).

### Fase 4 (Sistema de Combate e Entidades)
- **Status:** Concluído
- **Detalhes:** Arquitetura do módulo de Entidades (ex: `Player.js` para Rhogar) com gerenciamento de HP, status, mitigação de defesa e mecânica de Fúria (Rage). Implementação do ciclo de batalha em turnos na cena isolada `BattleScene.js`, fluxo assíncrono entre UI e ataques, com logs de combate em tempo real via Logger. Transição de fade suave incluída para progressão desde a exploração/diálogos (`GameScene`).

### Fase 5 (Áudio, Save System e Cena de Recompensa)
- **Status:** Concluído
- **Detalhes:** Implementação do singleton `AudioManager.js` responsável pela orquestração fluida de BGM e SFX e do `SaveManager.js`, que viabiliza a persistência de dados em FileSystem (Electron/Node) e fallback em LocalStorage usando serialização Base64. Construção da `RewardScene.js` encarregada de premiar o jogador, modificar seus atributos (Espada Bastarda) e encerrar o Prólogo.

### Fase 6 (Menu, Gamepad & Settings)
- **Status:** Concluído
- **Detalhes:** Criação da classe singleton abstrata `InputManager.js` que decodifica ações base de Gamepad (Joysticks XInput/DInput) e mapeamentos complexos de teclado (WASD, Setas) para eventos lógicos puros ('UP', 'CONFIRM'). Desenvolvimento robusto do ciclo de Front-end do jogo via `MenuScene.js` e opções nativas na `SettingsScene.js`, permitindo controle em tempo real dos Singletons de áudio criados na Fase 5 e alternância para tela cheia na janela nativa do Electron.

### Fase 7 (Game Over, Pausa e Combate Multi-Alvo)
- **Status:** Concluído
- **Detalhes:** Implementação do sistema punitivo de falha via `GameOverScene.js`, interceptando a morte de Rhogar com um fade rubro dramático e opções persistentes. Introdução da `PauseScene.js`, uma overlay translúcida baseada em eventos do InputManager. Refatoração profunda da `BattleScene.js` escalando-a para ondas com suporte a seleção granular de alvos através do D-Pad/Setas, lidando eficientemente com arranjos de inimigos carregados dinamicamente via JSON.

### Fase 8 (Pipeline de VFX, Portraits e Asset Manifest)
- **Status:** Concluído
- **Detalhes:** Centralização dos identificadores gráficos e sonoros no `assets.js` com auto-geração processual de texturas *placeholders* via `PreloadScene.js`. Evolução da interface de diálogo incorporando molduras e animações de **Retratos (Portraits)** via metadados nos JSONs. Construção do singleton estético `FXManager.js` que engendra *Game Juice*: feixes elétricos paramétricos (Sopro Elétrico), arcos de corte (`createSlashEffect`), Flashbangs (Críticos) e *Floating Combat Texts* numéricos ascendentes integrados ao loop tático de combate.

### Fase 9 (Overworld Top-Down, Taverna e Diálogos)
- **Status:** Concluído
- **Detalhes:** Introdução da `TavernScene.js` operando a API nativa do `Phaser.Physics.Arcade` para detecção de colisão (Static Groups) de forma *top-down*. Implementação de cinemática de movimento controlada, amarrada com a leitura de eventos de proximidade via distanciamento euclidiano (Gatilhos / InteractableTriggers) para *Prompts* flutuantes ("▼ [Z] Interagir"). Nova estrutura JSON encadeada de interações para sustentar os NPCs, quadros e rumores, servindo como o *Hub* central do mundo que dispara o grande Flashback da história de Brentel.

### Fase 10 (Economia, Consumíveis e Demo End)
- **Status:** Concluído
- **Detalhes:** Criação do singleton estrito `InventoryManager.js` que engendra a base da economia (Ouro) e controle vetorial de pilhas de itens (consumíveis de Cura e Buff). Desenvolvimento da primeira interface complexa desacoplada `ShopUI.js` gerida pela NPC Hilda. Integração tática do fluxo de itens (`useItem`) em plenas ramificações da `BattleScene.js`. Criação do evento canônico final (*DemoEndScene*), atrelado à flag global de retorno à Taverna, induzindo a cinemática conclusiva do *cliffhanger* narrativo com a conversão (Wishlist Link via Electron Shell).

### Fase 11 (Motor de Quests e Mapa Exterior da Floresta)
- **Status:** Concluído
- **Detalhes:** Estabelecimento do singleton dinâmico `QuestManager.js`, operando fluxos baseados em JSON (`quests.json`) para orquestrar bloqueios lógicos (ex: impedir o jogador de sair da Taverna antes do Flashback). Expansão do Overworld (Ato II) através da gigantesca `ForestRouteScene.js` (1600x1200) com *Camera Tracking* (câmera seguindo o jogador), limites estáticos de mundo (árvores), pilhagem espacial (baús) e transições físicas instantâneas em áreas de impacto (*Overlap Zones*), escalando a infraestrutura completa do RPG.

### Fase 12 (Open-World Hub e Streaming Bidirecional de Mapas)
- **Status:** Concluído
- **Detalhes:** Arquitetura máxima de exploração alcançada via Singleton `WorldManager.js`, controlando injeções de matriz vetorial estrita (`getSpawn()`) e efetuando *fade outs/ins* globais interceptando o escalonador de entrada (travando o jogador preventivamente e evitando loop de colisões). Implementação do centro nervoso da *lore*, a colossal cidade em `RastphenCityScene.js` (2400x1800), atuando como um eixo magnético que conecta nativamente a Taverna, o Templo e os Portões Sul em trânsito bidirecional 100% orgânico sem bloqueios narrativos sintéticos.

### Correção de Fluxo (Ato 1)
- **Status:** Concluído
- **Detalhes:** Correção do loop infinito do Flashback. O estado das missões agora avança na *RewardScene* de forma explícita e repassa ao WorldManager. Condicional de `joseph_sylven` estritamente ligada ao `QuestManager`, alterando seu diálogo e não re-iniciando cenas acidentalmente. Adicionado um HUD de acompanhamento de missão.

### Fase 12.1 (Interface de Mapa e Refatoração de Diálogos)
- **Status:** Concluído
- **Detalhes:** Expansão técnica do `DialogueBox.js` englobando suporte nativo a encadeamento e varredura de *arrays* canônicos (Múltiplas falas contínuas). Criação e acoplamento do modal visual e informativo `WorldMapUI.js` para mapeamento das regiões (Forest, Rastphen, Ravinas), habilitado via interação com o quadro de avisos. As portas da taverna (Saída Sul) foram refinadas para zonas de colisões reais em `TavernScene.js`, operando restritamente quando a cena não está estagnada por interações passivas.

## Fase 14: Expansão do Ato II
- Criado json de diálogos (act2_interactions.json)
- Implementada TempleScene (Altares, NPCs, portas)
- Expandidas as cenas da Floresta (Fazenda Halfling) e Cidade (Mercador e Guardas)
- Integrado QuestManager para progressão do celeiro.

## Fase 15: Escolhas Ramificadas e Flexibilidade de Combate
- Refatorado DialogueBox.js para suportar a tag 'choices', listagem interativa (UP/DOWN/CONFIRM).
- Atualizado tavern_interactions.json com escolhas morais para cada NPC.
- Implementado visitedNPCs na TavernScene para forçar exploração.
- BattleScene adaptada para retornar 'defeat' no Flashback ao invés de forçar GameOver.

## Correção: Estado Inicial e Fluxo do Joseph
- **Status:** Concluído
- **Detalhes:** O manifesto de missões (quests.json) agora inicia com a Quest 1 ativa explicitamente e as demais trancadas. Adicionado QuestManager.resetQuests() acionado pelo Novo Jogo (MenuScene), limpando cache em memória para evitar que o Flashback seja pulado. Refatoração do HUD e do gatilho de Flashback na TavernScene para garantir que o fluxo do Joseph acione a batalha corretamente.

## Correção: Transição de Câmera e Inicialização de Batalha
- **Status:** Concluído
- **Detalhes:** Ajuste do encerramento de diálogo na `GameScene` para realizar *fade* e `delayedCall` seguros em direção à `BattleScene`. Incluído fallback defensivo no método `init` e `fadeIn` explícito no `create` da `BattleScene`. Atualizado evento de vitória na `RewardScene` retornando o `battleOutcome` apropriado. Transição de derrota adaptada para ser despachada pelo `WorldManager`.

## Correção Definitiva: Câmera FX e Fluxo da GameScene
- **Status:** Concluído
- **Detalhes:** Implementado `resetFX()` seguido de `fadeIn(400)` no topo do `create()` de todas as cenas principais para blindar a câmera contra falhas de renderização (transição incompleta) oriundas da cena anterior. Total refatoração de `GameScene.js` (corte das dependências cíclicas de loop de diálogo) e injeção do fallback visual seguro `intro_iksar`. Adicionada proteção rigorosa ao `DialogueBox.js` mapeando `name` e `text` vazios, evitando Unhandled TypeErrors e congelamentos acidentais.

## Fase 16 (Ato II: Templo de Palmem, Rastphen Hub e Fazenda dos Halflings)
- **Status:** Concluído
- **Detalhes:** O Ato II foi inteiramente materializado e as áreas conectadas via `WorldManager`. A nova `TempleScene` foi construída com interações curativas e progresso narrativo (Gruther e Sacerdotisa). O Hub principal de `RastphenCityScene` foi preenchido com mercador e guardas ativos no portão sul, agora transicionando organicamente. Por fim, a Estrada Sul (`ForestRouteScene`) ganhou a Fazenda Halfling e seu celeiro macabro, conectando o fluxo de missões diretamente até o limiar da Masmorra do Bosque Cinzento.

## Correção: Tropas e Seleção de Alvos na Batalha
- **Status:** Concluído
- **Detalhes:** Solucionado o travamento na Batalha (`BattleScene.js`) gerado pela inicialização nula da matriz de inimigos. Criada estrutura baseada em *fallback* estrito de posições absolutas (`x`, `y`) permitindo renderização imediata caso os metadados do monstro estejam omissos. A mira (`targeting`) foi recalibrada para respeitar as coordenadas da entidade dinamicamente, permitindo navegação entre vivos livre de *crashes*.

## Polimento: Suporte Total a Teclado no Combate
- **Status:** Concluído
- **Detalhes:** O sistema UI da Batalha foi refatorado para operar como uma máquina de estados discreta (`SELECTING_ACTION` e `SELECTING_TARGET`). Os controles `InputManager` aglutinam-se centralizados gerenciando a troca dinâmica do cursor de botões para os inimigos com feedback de borda dourada para seleção. Foi validado e certificado o sumiço absoluto de qualquer tela cinza ou vazia pertinente ao Ato II.

## Refatoração: Bloqueio de Transição e Zonas de Spawn (Rastphen Hub)
- **Status:** Concluído
- **Detalhes:** Solucionado o *loop* infinito entre mapas integrando a flag `isTransitioning` atômica no `WorldManager.js` e em cada Scene (`RastphenCityScene`, `TavernScene`, `TempleScene`, `ForestRouteScene`). Todas as portas e transições receberam buffers de coordenadas seguras (offsets de distanciamento), evitando engatilhar zonas logo no instante de spawn.

## Correção: Texturas da DialogueBox e Quest no Templo
- **Status:** Concluído
- **Detalhes:** Inserida trava lógica para detectar dinamicamente a presença de texturas de retrato na `DialogueBox.js`, redimensionando as margens e a largura do `wordWrap` graciosamente e omitindo o quadrado verde nativo do Phaser caso a imagem não exista. A `TempleScene` foi estabilizada, controlando a *flag* de movimento interativo corretamente e acionando com sucesso o objetivo visual do HUD após conversar com a sacerdotisa e Gruther.

## Correção: UI Fixa no Camera Tracking (ForestRoute)
- **Status:** Concluído
- **Detalhes:** Padronizado o uso de `setScrollFactor(0)` e profundidades rigorosas para o HUD de Objetivos e `DialogueBox` nas cenas externas com *Camera Follow* ativo, impedindo que interações com o Fazendeiro ou o Celeiro renderizassem a UI fora do limite visual e congelassem o input do jogador. A Quest principal do Bosque Cinzento flui perfeitamente engatilhando o acesso à nova `DungeonScene`.

## Nova Feature: Sistema de Gating Narrativo (Monólogos de Rhogar)
- **Status:** Concluído
- **Detalhes:** Projetado o arquivo `thought_interactions.json` contendo alertas mentais canônicos que impedem exploração desordenada dos mapas. Engastado nas cenas `TavernScene`, `RastphenCityScene`, `ForestRouteScene` e `DungeonScene`, o sistema aplica um recuo dinâmico (*pushback*) na coordenada `y` do jogador e ativa imediatamente a UI da `DialogueBox` notificando o jogador de que ele precisa terminar a Quest pendente antes de avançar para um Ato que ele ainda não desvendou.

## Correção Crítica: Progressão Pós-Flashback e Interação NPC (v0.16.5)
- **Status:** Concluído
- **Detalhes:** Consertado o avanço da Missão `quest_01_flashback` que não persistia na cena de recompensa, impedindo o avanço livre na `TavernScene`. Além disso, configuramos a inicialização correta da `DialogueBox` na `RastphenCityScene` (`setScrollFactor`, `setVisible(true)`) garantindo que interações robustas como a dos Guardas da Muralha abram a interface e restaurem a flag de controle limpa ao fechar.

## Nova Feature: Masmorra do Bosque Cinzento (Ato III)
- **Status:** Concluído
- **Detalhes:** Cenário massivo (1600x1200) desenvolvido. A lógica de exploração avança do RPG tradicional (NPCs) para o sistema de *Dungeon Crawler*, mesclando interações dinâmicas (Fogueiras que acionam `SaveManager`) e Puzzles Ambientais em tempo real (Purificação de Runas disparando terremotos em cadeia antes de abrir as portas do chefe). A `ForestRouteScene` foi vinculada com sucesso à dungeon recém-instanciada.

