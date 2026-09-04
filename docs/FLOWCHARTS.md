# Sombras de Brentel — Fluxogramas do Prólogo

## 1. Fluxo macro

```mermaid
flowchart TD
    A[IntroSplash] --> B[Menu / Novo Jogo]
    B --> C[IntroStory]
    C --> D[Act I — Taverna]
    D --> E{Exploração obrigatória}
    E --> F[Conversar com NPCs]
    F --> G[Verificar ouro / cerveja]
    G --> H[Falar com Joseph]
    H --> I[Flashback — Estayler]
    I --> J[Batalha Tutorial]
    J --> K[RewardScene]
    K --> L[Quest 1 concluída]
    L --> M[Quest 2 ativa]
    M --> N[Act II — Rastphen]
    N --> O[Templo de Palmem]
    O --> P[Gruther / Ala Norte]
    P --> Q[Retorno à cidade]
    Q --> R[Portão Sul]
    R --> S[Estrada Sul]
    S --> T[Fazenda Halfling]
    T --> U[Investigar celeiro]
    U --> V[Act III — Dungeon]
    V --> W[Purificar Runa 1]
    W --> X[Purificar Runa 2]
    X --> Y[Purificar Runa 3]
    Y --> Z[Grande Portão]
    Z --> FIM[Fim do Prólogo]
```

## 2. Ato I — decisão do jogador

```mermaid
flowchart TD
    A[Rhogar desperta] --> B[Falar com Joseph]
    B --> C{Já conversou com NPCs?}
    C -- Não --> D[Explorar Taverna]
    D --> E[John]
    E --> F[Verônica]
    F --> G[Traudon + Alícia]
    G --> C
    C -- Sim --> H{Tem dinheiro?}
    H -- Sim --> I[Comprar cerveja com Hilda]
    H -- Não --> J[Interagir com Alícia ou Gisela]
    J --> K[Obter ouro / alternativa]
    K --> I
    I --> L[Beber cerveja]
    L --> M[Falar com Joseph novamente]
    M --> N[Flashback liberado]
    N --> O[Cutscene Estayler]
    O --> P[Batalha]
    P --> Q{Resultado}
    Q -- Vitória --> R[Reward]
    Q -- Derrota --> R
    R --> S[Retorno à Taverna]
```

## 3. Máquina de estado da Quest 1

```mermaid
stateDiagram-v2
    [*] --> ACTIVE
    ACTIVE --> NPC_CHECK: exploração
    NPC_CHECK --> READY: requisitos cumpridos
    READY --> FLASHBACK: Joseph + cerveja
    FLASHBACK --> BATTLE
    BATTLE --> REWARD: vitória
    BATTLE --> REWARD: derrota narrativa
    REWARD --> COMPLETED
    COMPLETED --> [*]
```

## 4. Progressão das quests

```mermaid
flowchart LR
    Q1[Q1 Memórias de Estayler] --> Q2[Q2 O Templo de Palmem]
    Q2 --> Q3[Q3 Rastros na Névoa]
    Q3 --> Q4[Q4 A Trilha do Bosque Cinzento]
    Q4 --> Q5[Q5 O Pesadelo Abissal]
```

## 5. Gating narrativo

```mermaid
flowchart TD
    A[Tentar avançar] --> B{Requisito da área cumprido?}
    B -- Sim --> C[Transição de mapa]
    B -- Não --> D[Rhogar bloqueia o avanço]
    D --> E[DialogueBox com pensamento]
    E --> F[Quest anterior]
    F --> A
```

### Gatilhos conhecidos

| Bloqueio | Requisito | Mensagem de Rhogar |
|---|---|---|
| Saída inicial | concluir/avançar Quest 1 | falar com Joseph antes de sair |
| Portão Sul | Quest 2 | visitar Templo de Palmem / Gruther |
| Entrada da dungeon | Quest 3 | investigar celeiro da fazenda |
| Grande Portão | 3 runas | purificar as 3 Runas de Pestilência |

## 6. Fluxo de mapas

```mermaid
flowchart TD
    T[TavernScene] <--> R[RastphenCityScene]
    R <--> P[TempleScene]
    P <--> PN[TempleNorthScene]
    R <--> F[ForestRouteScene]
    F <--> D[DungeonScene]
```

## 7. Fluxo de combate

```mermaid
flowchart TD
    A[Trigger de combate] --> B[BattleScene]
    B --> C[Inicializar jogador/inimigos]
    C --> D[SELECTING_ACTION]
    D --> E{Ação}
    E --> F[Ataque]
    E --> G[Defesa]
    E --> H[Sopro Elétrico]
    F --> I[Selecionar alvo]
    H --> I
    I --> J[Resolver dano]
    J --> K[Gerar/consumir Fúria]
    K --> L[Turno inimigo]
    G --> L
    L --> M{Rhogar vivo?}
    M -- Não --> N[GameOver ou derrota narrativa]
    M -- Sim --> O{Inimigos derrotados?}
    O -- Não --> D
    O -- Sim --> P[Reward / retorno]
```

## 8. Flashback — exceção narrativa

```mermaid
flowchart TD
    A[Taverna] --> B[GameScene]
    B --> C[Diálogo Iksar / Rhogar]
    C --> D[BattleScene]
    D --> E{Resultado}
    E --> F[RewardScene]
    F --> G[+20 ATQ / arma / XP]
    G --> H[hasCompletedFlashback = true]
    H --> I[Q1 completed]
    I --> J[Q2 active]
    J --> K[TavernScene]
```

**Importante:** a derrota do flashback é tratada como resultado narrativo, não como encerramento definitivo da campanha.

## 9. Dungeon — estado do puzzle

```mermaid
stateDiagram-v2
    [*] --> Entrada
    Entrada --> Exploração
    Exploração --> Runa1
    Exploração --> Runa2
    Exploração --> Runa3
    Runa1 --> Exploração: purificada
    Runa2 --> Exploração: purificada
    Runa3 --> Exploração: purificada
    Exploração --> Portao: 3 runas purificadas
    Exploração --> Combate: contato com inimigo
    Combate --> Exploração: vitória
    Portao --> FimPrologo: selo rompido / evento final
```

## 10. Fluxo técnico de dados

```mermaid
flowchart LR
    GDD[GDD] --> DATA[JSON de dados]
    DATA --> QM[QuestManager]
    DATA --> DB[DialogueBox]
    DATA --> WM[WorldManager]
    QM --> STATE[Game State / Registry]
    WM --> SCENES[Cenas Phaser]
    DB --> SCENES
    STATE --> SCENES
    SCENES --> PLAYER[Rhogar]
    SCENES --> BATTLE[BattleScene]
    BATTLE --> REWARD[RewardScene]
    REWARD --> SAVE[SaveManager]
    SAVE --> STATE
```

## 11. Fluxo de decisão de design

Toda nova decisão narrativa deve seguir:

```text
IDEIA
 ↓
CANON DO LIVRO?
 ├─ SIM → ADAPTAÇÃO PARA GAMEPLAY
 └─ NÃO → JUSTIFICAR DIVERGÊNCIA
             ↓
         IMPACTO NO JOGADOR?
             ↓
         NOVA FLAG/QUEST?
             ↓
         CONSEQUÊNCIA VISÍVEL?
             ↓
         TESTE AUTOMATIZÁVEL?
             ↓
         IMPLEMENTAÇÃO
             ↓
         DOCUMENTAÇÃO
```

## 12. Critério de fechamento de uma cena

Uma cena só deve ser considerada concluída quando tiver:

- entrada definida;
- objetivo do jogador;
- NPCs/objetos relevantes;
- diálogos;
- decisões;
- condições de bloqueio;
- saída/transição;
- flags alteradas;
- recompensa ou consequência;
- estado de save quando necessário;
- teste de regressão.
