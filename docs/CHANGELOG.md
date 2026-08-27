# Changelog
Todos as mudanças notáveis nesse projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0-alpha] - 2026-08-27
### Added
- Setup inicial do projeto Vite, Electron e Phaser 3.
- Script de automação e integração `npm run electron:dev`.
- Componente Orientado a Objetos `DialogueBox` renderizando diálogos via efeito Typewriter.
- Separação da arquitetura de dados (Data-Driven): `public/data/dialogues.json` e `public/data/enemies.json`.
- Classe base estruturada de Cena `PreloadScene` para pipeline unificado de carregamento de assets.
- Singleton utilitário universal de Logging (`src/utils/Logger.js`) com especificação rigorosa de JSDoc.
- Modelos fundamentais da documentação técnica e viva: `DEVLOG.md`, `CHANGELOG.md` e `README.md`.
- Arquitetura de entidades orientadas a objeto (ex: `Player.js`).
- Máquina de estados para combates em turnos (`BattleScene.js`) incluindo HUD de combate (HP, Fúria) e transições entre cenas.
- Sistema unificado de orquestração de Áudio (`AudioManager.js`) com crossfade.
- Gerenciador de Persistência (SaveGame) multi-ambiente (Node FileSystem + Web LocalStorage) ofuscado em Base64 (`SaveManager.js`).
- Implementação narrativa da cena final e lore de recompensa (`RewardScene.js`).
- Singleton centralizador para leitura cruzada de Gamepad/Teclado via Event Emitters (`InputManager.js`).
- Máquinas de estado de UI front-end: `MenuScene.js` e `SettingsScene.js` para gerenciar progressão e opções nativas do *player*.
- Cena dramática de `GameOverScene.js` com redirecionamento de save state.
- Sistema nativo de Overlay de Pausa em Cenas concorrentes (`PauseScene.js`).
- Upgrade da Batalha: Suporte Multi-Target dinâmico, setas de indicação para o jogador e turnos conjuntos inimigos.
- **VFX e Game Juice**: Classe `FXManager.js` orquestrando *Floating Combat Texts*, feixes procedurais de raios e *Slash Effects*.
- Implementação de **Retratos (Portraits)** deslizantes orientados a dados JSON nativos do `DialogueBox.js`.
- Arquivo central de rotas de Assets `config/assets.js` e mock-up automático de texturas gráficas pela PreloadScene.
- Novo modo Top-Down de RPG (*Overworld Exploration*) através do motor `Phaser.Physics.Arcade` (`TavernScene.js`).
- Dicionário extensível de interações (`tavern_interactions.json`) alimentando gatilhos espaciais baseados em cálculo euclidiano.
- Mudança do Ciclo de Jogo (Game Loop): A Taverna Cauda do Dragão tornou-se o palco principal do jogo, servindo de transição para o combate como *Flashback* em Estayler.
- **Sistema de Economia**: `InventoryManager.js` persistente operando lógica transacional (Ouro e Poções).
- Nova interface comercial em *overlay* gráfico (`ShopUI.js`) associada a interações de mapa.
- Ramificação de botões de turno do jogador (`BattleScene.js`), provendo consumo estratégico de itens.
- Clímax de interrupção canônica com CTA (Call To Action) orgânico apontando para a Steam (`DemoEndScene.js`).
- **Sistema de Missões Baseado em Eventos**: O motor `QuestManager.js` coordena chaves JSON (`quests.json`) limitando progressão sistêmica (Lock/Unlock).
- Overworld Expandido (`ForestRouteScene.js`): Exploração com câmera dinâmica seguindo o jogador (Tracking 1600x1200).
- Instâncias espaciais: Zonas invisíveis (*Overlap Zones*) para desencadear encontros de combate (Emboscadas) e espólio físico em mundo aberto (Baús interativos).
- **Mundo Aberto Bidirecional**: O arquiteto subjacente `WorldManager.js` rastreia vetores de *Spawn* nas passagens, abolindo as restrições e ligando livremente as instâncias de mundo.
- Metrópole de Rastphen gerada e integrada: `RastphenCityScene.js` é agora a cena maciça (2400x1800) que une organicamente as docas da Taverna aos bosques do Ato II.
- Correção de Loop de História e HUD: *RewardScene* avança o progresso global via *QuestManager*. Dialogos na taverna agora checam as *Quests* e mudam dinamicamente ao invés de repetição bruta, informando o jogador via interface em tempo real.
- **Lore Canônica e Múltiplos Diálogos**: Interface `DialogueBox.js` reestruturada para Arrays dinâmicos de texto. Total reestruturação no repositório de diálogos de todos os NPCs da Taverna.
- **World Map In-Game**: Interface gráfica `WorldMapUI.js` renderizando as expansões e regiões (Rastphen, Estayler, Florestas, Ravinas), acessível pelo Mural de Avisos da Taverna.

## [0.14.0] - Ato II Expandido
### Added
- TempleScene, NPCs interativos em Rastphen, Fazenda Halfling em ForestRoute.

## [0.15.0] - Escolhas de Diálogo e Flashback Seguro
### Added
- Sistema de escolhas no DialogueBox.
- Diálogos ramificados na taverna e checklist de NPCs.
### Fixed
- Flashback não causa mais Game Over imediato se Rhogar for derrotado.

## [0.15.1] - Correção do Fluxo Inicial
### Fixed
- Corrigido o bug onde o combate inicial (Flashback) era pulado ao iniciar um Novo Jogo, causado pelo cache de missões persistindo em memória.
- Ajustado estado inicial das missões (`quests.json`) garantindo que a Quest 1 inicie ativa e o restante travado.
- Refatorada lógica de interação com Joseph Sylven para assegurar a transição para cena de combate.

## [0.15.2] - Correção de Transição de Cenas
### Fixed
- Corrigido travamento de tela preta ao sair do diálogo de `GameScene` para a `BattleScene` usando `delayedCall`.
- Otimizadas chamadas de *fadeIn* em `BattleScene.js` e `RewardScene.js`.
- Adicionado *fallback* nas propriedades de `init` da batalha para prevenir exceções na inicialização.

## [0.15.3] - Câmera e Fallback de Diálogo
### Fixed
- Congelamento definitivo (tela preta/branca) solucionado adicionando `this.cameras.main.resetFX()` em todas as cenas centrais.
- `GameScene` reescrita com fallback de JSON injetado (Cenário, Iksar e Ilídiz).
- Prevenção de travamento (TypeError) em `DialogueBox.js` ao ler nós incompletos.

## [0.16.0] - Ato II Completo
### Added
- Instanciado banco de dados canônico narrativo `act2_interactions.json`.
- Adicionada cena `TempleScene.js` (Templo de Palmem) contendo Sacerdotisa e o convalescente Gruther.
- Expandido o ecossistema de Rastphen com NPCs ativos (Mercador e Guardas) com trânsito bidirecional de zona para o Templo.
- Evolução da `ForestRouteScene.js` contendo arquiteturas rústicas, NPC Halfling e o celeiro interativo.
- Atualização do motor de *Quests* para rastreamento progressivo até a Masmorra do Bosque Cinzento.

## [0.16.1] - Targeting e Fallback de Combate
### Fixed
- Corrigida matriz `this.enemies` que congelava quando os *arrays* não retornavam monstros válidos.
- Sistema de mira (*targetIndicator*) agora atualiza e rastreia o HP estritamente sob as coordenadas do inimigo.
## [0.16.2] - Battle Keyboard Controls & Polimento Ato II
### Added
- Implementada Máquina de Estados (SELECTING_ACTION, SELECTING_TARGET) na `BattleScene.js`.
- Total suporte a navegação por teclado (Setas, WASD, Z, Espaço, Esc) nos menus da batalha.
- Feedback visual constante (bordas douradas) para os botões do menu focados.
### Fixed
- Confirmadas as implementações físicas e estruturais do Templo e Estrada Sul (ausência de placeholder). Ajustadas coordenadas de transição diretas (X:400, Y:100).
- Refatorado `WorldManager.js` com trava atômica `isTransitioning` protegendo contra loops infinitos de transição entre mapas. Reajuste matemático das zonas de spawn bidirecionais (com offset seguro).
- Correção de quebra de renderização na `DialogueBox.js` ao tentar desenhar *portraits* não oxigenados pelo cache de texturas do Phaser (substituição dinâmica de margens do texto).
- Correção da máquina de input do jogador (`this.isInteracting`) na `TempleScene.js` permitindo a progressão do QuestManager.

## [0.16.3] - Câmera Tracking Fix e Portal da Masmorra
### Fixed
- HUD de Objetivos e `DialogueBox` da `ForestRouteScene` agora operam fluidamente ignorando o paralaxe da câmera de rastreamento (`setScrollFactor(0)`), evitando que os painéis desaparecessem do *viewport* ao interagir com o celeiro e halfling.
- Gatilho do final da floresta renomeado e corrigido; interagir com a placa desbloqueia o fluxo rumo à `DungeonScene`.

## [0.16.4] - Sistema de Gating Narrativo e Monólogos Internos
### Added
- Implantada inteligência de monólogos invisíveis (paredes invisíveis baseadas em QuestManager) para travar progressão prematura em `TavernScene` (Porta Sul), `RastphenCityScene` (Estrada Sul), `ForestRouteScene` (Entrada da Masmorra) e `DungeonScene` (Portão do Chefe).
- Carregamento assíncrono de `thought_interactions.json` no `PreloadScene`. O sistema aplica *pushback* de coordenadas físicas retrocedendo o personagem antes de travar os movimentos e engatilhar as caixas de pensamento, evitando encavalamento no colisor físico.

## [0.16.5] - Estabilização de Progressão e NPCs
### Fixed
- A `RewardScene` agora avança explicitamente a missão `quest_01_flashback` para concluída, além de invocar nativamente a transição da cena através do `WorldManager.transitionTo()`, prevenindo que a taverna recarregue o diálogo bloqueador do tutorial.
- Resolvido travamento silencioso (caixa de diálogo oculta) ao interagir com guardas em Rastphen graças ao repasse explícito de configurações fixas (`setScrollFactor(0)` e `setVisible(true)`) na `DialogueBox` da cidade.

## [0.17.0] - A Masmorra do Bosque Cinzento (Ato III)
### Added
- Introduzida a `DungeonScene.js` (Masmorra), estruturada com iluminação sombria, barreiras arquitetônicas e overlay de névoa translúcida.
- Mecânica de Puzzle "Runas de Pestilência" implantada: purificar três pedestais trancados usando a *hotkey* de interação balança a câmera (`cameras.main.shake`) e destranca o portão do Boss Sul.
- Fogueira de Checkpoint integrada: ao descansar, recupera HP e ativa o `SaveManager.saveGame()`.
- Novo arquivo estrutural JSON `dungeon_enemies.json` embutindo dados literais do Corruptor Abissal, Cultista das Sombras e Goblin Emboscador.
