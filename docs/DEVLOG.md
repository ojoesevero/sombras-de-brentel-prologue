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

## Nova Feature e Polimento: Sistema Global de BGM e SFX
- **Status:** Concluído
- **Detalhes:** Arquitetura centralizada de áudio (BGM e Foley) orquestrada em `AudioManager.js` via nova API global segura (`window.playBGM`), evitando reinicializações espúrias e contornando exceções de estado selado (`Object.freeze`). O pacote inclui SFX imersivo mapeado para UI (*Hover*, *Confirm*), economia (beber, pilhar) e combate responsivo (*Slash*, *Zap*, *Hurt*, *Death*). Solucionado também o efeito nocivo de *Input Bubbling* na leitura de diálogos mediante um bloqueio temporal de ciclo rápido na `UIScene`, solidificando a experiência final do Prólogo.

## Correção Crítica: Progressão Pós-Flashback e Interação NPC (v0.16.5)
- **Status:** Concluído
- **Detalhes:** Consertado o avanço da Missão `quest_01_flashback` que não persistia na cena de recompensa, impedindo o avanço livre na `TavernScene`. Além disso, configuramos a inicialização correta da `DialogueBox` na `RastphenCityScene` (`setScrollFactor`, `setVisible(true)`) garantindo que interações robustas como a dos Guardas da Muralha abram a interface e restaurem a flag de controle limpa ao fechar.

## Nova Feature: Masmorra do Bosque Cinzento (Ato III)
- **Status:** Concluído
- **Detalhes:** Cenário massivo (1600x1200) desenvolvido. A lógica de exploração avança do RPG tradicional (NPCs) para o sistema de *Dungeon Crawler*, mesclando interações dinâmicas (Fogueiras que acionam `SaveManager`) e Puzzles Ambientais em tempo real (Purificação de Runas disparando terremotos em cadeia antes de abrir as portas do chefe). A `ForestRouteScene` foi vinculada com sucesso à dungeon recém-instanciada.

## Correção Crítica: Transição do Portão Sul e Desacoplamento de Triggers (v0.16.6)
- **Status:** Concluído
- **Detalhes:** Identificado e resolvido o congelamento do jogo ao tentar cruzar o Portão Sul rumo à estrada da floresta. Havia uma sobreposição física entre a área de interação dos guardas e a zona de transição de mapa, causando *race conditions*. A área do portão foi reposicionada estrategicamente. A `ForestRouteScene.js` recebeu blindagem no recebimento de metadados (`spawnX` e `spawnY`) e correção na iniciação do `resetFX` da câmera e fade, mitigando carregamentos silenciosos defeituosos.
Adicionalmente, injetamos uma camada de instrumentação de telemetria refinada no `Logger.js` (input, dialogue, transition, quest) para traçar o mapa mental das sessões em tempo real. Por fim, democratizamos o acesso aos controles de front-end com navegação 100% Keyboard no modal da Hilda (Loja), RewardScene e DialogueBox (escolhas), sincronizados com a API de eventos do Phaser para um fluxo livre do mouse.

## Correção Arquitetural: IPC ContextBridge e Preload.js (v0.16.8)
- **Status:** Concluído
- **Detalhes:** O módulo `Logger.js` havia recebido suas implementações de escrita em disco, porém os objetos `contextBridge` e `electronAPI` persistiam como *undefined* no Chromium DevTools. Isso se dava devido à flag `nodeIntegration` configurada como `true` no `electron/main.js`, aliada a um pathing obsoleto no `preload.js`. Forçamos `contextIsolation: true` e `nodeIntegration: false`, roteando tudo corretamente através de `path.join(__dirname, 'preload.js')`. O utilitário Logger também recebeu um log mestre imediato de inicialização (`[INIT] Logger inicializado...`).

## Softlock e Resolutividade: Portão Sul - Desobstrução de Callbacks (v0.16.8)
- **Status:** Concluído
- **Detalhes:** A zona física sul de Rastphen ainda se mostrava instável. O problema base encontrava-se na chamada do método `startDialogue()`, que não convertia objetos simples `thoughtData` nativamente caso os metadados do JSON não possuíssem formato de array estrito na raiz. Retificamos o fluxo de eventos `overlap` com a reatribuição da propriedade `isInteracting` de forma mútua, além de aplicar `[thoughtData]` para garantir que o contêiner de diálogo empacote os nós narrativos de forma polimórfica e à prova de falhas.

## Alinhamento Físico de Zona: Portão Sul de Rastphen (v0.16.9)
- **Status:** Concluído
- **Detalhes:** Foi diagnosticada uma discrepância grave entre o hitbox físico da `southGateTrigger` e a arte (render pass) verde pintada no chão, resultando em "vácuos" não detectáveis pelo gerenciador de colisão do Arcade Physics. Reposicionamos e forçamos a instanciação conjunta gráfica-física, blindando o overlap para que o callback ocorra de imediato assim que a hitbox do player transpor o limite geométrico visual, destravando totalmente o fluxo para a `ForestRouteScene`.

## Resolução de Diálogo Fantasma: Reset Atômico (v0.16.9)
- **Status:** Concluído
- **Detalhes:** O módulo `DialogueBox.js` não estava propagando sua finalização para as variáveis de estado booleanas (deixando `isOpen = true`), o que tornava o input `CONFIRM` escravo de uma rotina invisível em cenas de alto adensamento de NPCs (como `TempleScene`). Centralizamos o *teardown* do componente na função `closeDialogue()`, injetando de maneira destrutiva a invalidação das interações (`this.scene.isInteracting = false`), erradicando a falha de input Z consecutiva.

## Refatoração da Física de Transição: Portão Sul (v0.16.10)
- **Status:** Concluído
- **Detalhes:** O problema persistente de transição no Portão Sul foi definitivamente solucionado. A abordagem baseada em uma Zone invisível sobreposta ao visual causava desalinhamentos. A zona invisível foi removida, e o próprio retângulo verde visual foi promovido a um corpo físico estático da Phaser (`STATIC_BODY`). Isso garante que a detecção de *overlap* dispare exatamente na área desenhada, estabilizando as transições para a `ForestRouteScene`. Em conjunto, a cena de floresta recebeu ajustes no fluxo de `create()` garantindo telemetria e o correto inicializar do `fadeIn()`.

## Pacote de Diagnóstico e Blindagem de Cenas (v0.16.11)
- **Status:** Concluído
- **Detalhes:** Foi injetada uma camada de diagnóstico profundo abrindo o `DevTools` de forma destacada diretamente no `electron/main.js` e implementados gatilhos `window.onerror` e `unhandledrejection` repassando a carga para o Logger em arquivo, prevenindo silêncios no caso de crashes invisíveis. O `QuestManager` ganhou tolerância com retornos polimórficos de `getQuestStatus()`. Na cena de `RastphenCityScene`, a transição do portão sul obteve envolventes de `try/catch`. Caso o JSON das missões falhe, o jogador recebe acesso irrestrito por fallback; se o `WorldManager` engasgar na gestão direcional de spawn, o fallback final empurra brutalmente a câmera para a cena da floresta (direct boot).

## Resolução de Deadlock de Transição e Gatilhos (v0.16.12)
- **Status:** Concluído
- **Detalhes:** Rastreada e neutralizada a *race condition* (deadlock) que ocorria na transição inter-cenas do `WorldManager`. Cenas como `RastphenCityScene` hasteavam `this.isTransitioning = true` instantes antes da chamada, disparando a defesa interna do `WorldManager` que abortava silenciosamente a transição (pois ele abortava se a flag já estivesse verdadeira). O motor foi refatorado para operar por bloqueio de eventos da câmera (`_fadeRunning`), tornando `WorldManager.transitionTo()` perfeitamente idempotente sem devorar os inputs. Adicionalmente, corrigiu-se falha de inicialização em `ForestRouteScene` devido a restrição de default export e o gatilho físico inferior de transição na metrópole de Rastphen foi redimensionado (y: 550, altura 80px) de forma estrita para evitar que a barreira elidisse jogadores.

## Matriz Visual Universal e Proteção Final de Transição (v0.16.13)
- **Status:** Concluído
- **Detalhes:** Aplicação estrita da Paleta de Cores (Color Palette Matrix) criando uma taxonomia visual coesa nas cenas de exploração (Tavern, Temple, Rastphen e ForestRoute): Jogador em Azul (`0x2980b9`), Portas e Transições em Verde (`0x27ae60`) e NPCs em Amarelo (`0xf1c40f`), normalizando e padronizando todas as *Zones* (áreas invisíveis) em retângulos visuais renderizados nativamente pela engine física para combater descompassos de colisão. O motor de trânsito bidirecional obteve o conserto resolutivo do erro de compilação `Phaser is not defined` injetando o contexto local via *import*, além da blindagem estrita na `RewardScene.js`, assegurando invulnerabilidade contra múltiplos despachos assíncronos durante o encerramento do combate de tutorial (Flashback).

## Correção Definitiva da Transição de Mapa (Portão Sul) (v0.16.14)
- **Status:** Concluído
- **Detalhes:** Diagnóstico e erradicação do travamento fatal de portão na `RastphenCityScene.js` (overlap loop). A flag de bloqueio anterior suprimia a transição indefinidamente enquanto a área estava ativa, e o hitbox com altura de 40px no topo impedia que o jogador penetrasse adequadamente a área. O evento de colisão do Portão Sul foi refatorado adotando um hitbox profundo (80px) perfeitamente alinhado (X: 1200, Y: 1750), garantindo overlap absoluto com o jogador parado entre os guardas. A lógica interna agora repassa diretamente o controle ao `WorldManager.transitionTo` restabelecido.
## Padronização do Portão Sul (v0.16.15)
- **Status:** Concluído
- **Detalhes:** O evento de colisão do Portão Sul na metrópole de Rastphen foi completamente refatorado para espelhar a arquitetura de bloqueio unificado já comprovada nas portas da Taverna e do Templo. Expurgamos todas as checagens híbridas de flags e callbacks locais, delegando a responsabilidade de trava unicamente a `isDialogueOpen` e terceirizando a execução de *fade* e carregamento de malha para a camada madura do `WorldManager`. O vetor topológico de entrada na `ForestRouteScene` também foi reconfigurado (X: 800, Y: 100), pousando precisamente o jogador no centro visível da estrada de terra e encerrando o ciclo de bugs de interface.

## Reset de Estado e Transição Temporizada Segura (v0.16.16)
- **Status:** Concluído
- **Detalhes:** Identificado e corrigido o bloqueio das portas de Rastphen causado pelo acúmulo de estado de diálogo e dependência do callback de câmera do Phaser. Implementou-se o reset explícito das variáveis de controle (`isDialogueOpen`, `isInteracting`, `_fadeRunning`) e ocultação preventiva do `dialogueBox` no `create()` de `RastphenCityScene.js`. Todas as zonas de transição (Taverna, Templo e Portão Sul) foram liberadas da trava de `isDialogueOpen`, direcionando para o `WorldManager.transitionTo()`. Por fim, o `WorldManager` foi aprimorado para usar `time.delayedCall(220)` em vez de `FADE_OUT_COMPLETE`, garantindo a troca de cenas sem travamento por fade pendente.

## Overhaul Arquitetural: FSM, UIScene e Portais Data-Driven (v0.17.0)
- **Status:** Concluído
- **Detalhes:** Realizado um profundo refatoramento arquitetural no ecossistema do jogo:
  1. **Data-Driven Transitions:** Portas e zonas de transição mapeadas em `public/data/map_transitions.json` e geradas dinamicamente com corpos estáticos por `WorldManager.buildTransitions(scene)`.
  2. **UIScene Global:** Criação da `UIScene.js` rodando em paralelo como overlay perene, centralizando a `DialogueBox` e HUD de objetivos via EventBus (`game.events`), eliminando acoplamentos locais de `setScrollFactor(0)` e vazamento de instâncias.
  3. **Player FSM:** O modelo `Player.js` agora controla o estado de movimento/interação via enumeração `PlayerState` (`IDLE`, `WALKING`, `INTERACTING`, `TRANSITIONING`, `PAUSED`), garantindo anulação de velocidade e bloqueio de novos gatilhos durante diálogos ou transições.
  4. **DevShortcuts:** Utilitário global com hotkeys (`F1` para depuração física, `F2` para destravar quests e teclas `1-5` para teletransporte direto entre os cenários).
  5. **Higienização Geral:** Expurgados códigos legados e instâncias repetidas em todas as cenas de exploração (`TavernScene`, `RastphenCityScene`, `TempleScene`, `ForestRouteScene` e `DungeonScene`).

## Game Juice, Mitigação Tática e Suíte de Testes Unitários (v0.17.1)
- **Status:** Concluído
- **Detalhes:** Implementado o pacote integral de melhorias de Game Feel, balanceamento tático e automação de testes:
  1. **Mitigação de Defesa e Variância:** Implementado método `calculateDamage(rawAttack, targetDefense, variance = 0.1)` com garantia mínima de 1 de dano. Aplicado no ataque básico de Rhogar, nas investidas das tropas inimigas e no Sopro Elétrico (com 50% de penetração de armadura).
  2. **Screen Shake Escalonado & Hit-Stop:** `FXManager` aprimorado com `applyScreenShake(scene, damage)` em 3 camadas de intensidade (<20, 20-50, >=50) e `playHitStop(scene, duration, callback)` gerando micro-congelamentos de 80ms~90ms para dar peso e impacto cinético aos golpes.
  3. **Emissores de Partículas:** Implementados `createSlashParticles` e `createLightningParticles` que instanciam emissores temporários (`particle_star` e `particle_lightning`) com auto-destruição para golpes físicos e mágicos.
  4. **Ciclo de Vida do InputManager:** Método `cleanListeners()` integrado ao `init()` e acoplado aos eventos `SHUTDOWN` e `DESTROY` das cenas Phaser, eliminando permanentemente memory leaks e listeners pendentes.
  5. **Testes Unitários Automatizados:** Configurado o test runner nativo do Node.js (`node --test`) via `npm test` e criados os arquivos `tests/QuestManager.test.js` e `tests/InventoryManager.test.js`, com 100% de aprovação (9/9 testes passando) de forma desacoplada do DOM.


