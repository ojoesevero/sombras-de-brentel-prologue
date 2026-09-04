# Documentação de Cenas (Scene Fiches)

Este documento atua como a **Fonte da Verdade (Source of Truth)** para a implementação de cada cena no jogo. Ele vincula as intenções de Game Design (Narrativa/Level Design) com as implementações de Código (Classes Phaser e JSONs).

---

## TAVERNA_001: Taverna Cauda do Dragão

### 1. Visão Geral
*   **Classe Phaser:** `TavernScene.js`
*   **Arquivo de Tilemap:** `tavern_map.json` / `tileset_tavern.png`
*   **Música:** `bgm_tavern_loop.mp3` (Atmosfera aconchegante, fogo crepitando)
*   **Função Narrativa:** Hub inicial do jogo. Estabelecer o tom de exaustão do protagonista e introduzir os companheiros. Servir como tutorial seguro de interação e economia.

### 2. Entidades e Atores (NPCs)
*   **Joseph Sylven**
    *   *Posição:* Perto da Lareira.
    *   *Comportamento:* Estático.
    *   *Função:* Entrega a Quest Principal ("O Prólogo").
*   **Hilda Barba-de-Ferro**
    *   *Posição:* Atrás do Balcão.
    *   *Comportamento:* Estático. Interação requer raio ampliado (115px) devido à colisão do balcão.
    *   *Função:* Abre o `ShopUI` para compra de itens.
*   **Verônica Stinfy**
    *   *Posição:* Sentada em uma mesa ao norte.
    *   *Função:* Diálogo condicional. Só avança após falar com Joseph.
*   **John Bardem**
    *   *Posição:* Encostado em uma pilastra.
    *   *Função:* Informações sobre sobrevivência. Condicional a Joseph.
*   **Gisela**
    *   *Posição:* Caminhando pelo salão (Patrulha).
    *   *Função:* Imersão. Pode ceder uma Cerveja Anã gratuita se o jogador interagir 3 vezes consecutivas (Easter Egg).

### 3. Gatilhos (Triggers) e Portais
*   **Portal de Saída (Sul)**
    *   *Destino:* `RastphenCityScene`
    *   *Condição:* Liberado. (Opcional: Pode ser bloqueado pelo QuestManager se o jogador não tiver falado com Joseph primeiro).
*   **Gatilho de Flashback**
    *   *Ação:* Beber a primeira "Cerveja Anã" no bar de Hilda.
    *   *Efeito:* Inicia transição de câmera (Fade Out/Distorção) e pausa a cena atual. Escuta o evento `dialogue-complete` do monólogo interno antes de lançar a `GameScene` (Flashback).

### 4. Integração Data-Driven (JSONs)
*   **`quests.json`**
    *   Define a flag `quest_prologue_started` após o primeiro diálogo com Joseph.
*   **`dialogues.json`**
    *   Usa chaves como `tavern_joseph_intro`, `tavern_veronica_blocked`, `tavern_veronica_open`.
*   **`map_transitions.json`**
    *   Mapeia o portal na borda inferior da sala para spawnar Rhogar na porta da Taverna na Cena da Cidade.

### 5. Notas de Implementação & Histórico de Correções
*   [CORRIGIDO] A colisão do balcão impedia a interação com Hilda. O `Phaser.Math.Distance.Between` no método `checkInteractions` foi ajustado para `115px` especificamente para a entidade `hilda`.
*   [CORRIGIDO] Transição de Cena (Flashback) sobrepunha o balão de diálogo. Implementado listener `EventBus.once('dialogue-complete')` para deferir a mudança de cena.

---

## CIDADE_001: Cidade de Rastphen (Praça Central)

### 1. Visão Geral
*   **Classe Phaser:** `RastphenCityScene.js`
*   **Função Narrativa:** O primeiro vislumbre do mundo aberto. Mostrar a tensão civil e apresentar caminhos ramificados (Templo ao Norte, Rota ao Sul, Lojas a Leste/Oeste).

### 2. Entidades e Atores (Em Planejamento)
*   Guardas Patrulhando (Movimento via Pathfinding Simples).
*   Yanil Resty (Mercador de rua).

### 3. Gatilhos (Triggers) e Portais
*   **Portal de Retorno (Norte-Centro):** Volta para a Taverna (`TavernScene`).
*   **Portal Norte (Norte-Leste):** Leva ao Templo de Palmem (`TempleScene`).
*   **Portal Sul:** Leva para a Rota da Floresta (`ForestRouteScene`). Condicionado a `quest_temple_visited` = `true`.

---

*(Novas cenas como TEMPLO_001, ESTRADA_001 e MASMORRA_001 serão documentadas aqui conforme a produção avançar).*
