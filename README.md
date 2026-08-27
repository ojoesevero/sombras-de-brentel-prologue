# Sombras de Brentel - Prologue

## Visão Geral e Escopo
**Sombras de Brentel - Prologue** é um prelúdio interativo e base arquitetural desenvolvida nativamente para distribuição em Desktop (Steam). O escopo deste prólogo introduz mecânicas centrais de diálogos estruturados baseados em dados (Data-Driven Architecture) e combates estratégicos. O sistema ambiciona sustentar e comunicar profundamente o *lore* atmosférico das sombras e conflitos, pela perspectiva de figuras centrais da narrativa como Rhogar e Iksar.

## Stack Tecnológica
- **Motor Gráfico (Engine):** [Phaser 3](https://phaser.io/) (Renderização ultrarrápida em HTML5, WebGL/Canvas, pipeline de Cenas)
- **Bundler:** [Vite](https://vitejs.dev/) (Otimização, Build veloz e HMR)
- **Distribuição Desktop:** [Electron](https://www.electronjs.org/) (BrowserWindow Chromium nativa para Steam)
- **Runtime e Backend Auxiliar:** [Node.js](https://nodejs.org/)

## Instruções de Instalação e Execução

### Pré-requisitos
Certifique-se de ter o **Node.js** e o **npm** (Node Package Manager) instalados na sua máquina.

### Instalação
Em seu terminal, inicialize o ambiente baixando as ramificações de dependência do projeto.
```bash
npm install
```

### Scripts de Acesso Rápido

- `npm run dev`
  Inicia localmente o servidor de testes Vite na porta 3000 (visualização em abas do browser comum, ideal para debug mobile ou testes responsivos genéricos).
  
- `npm run electron:dev`
  Abre simultaneamente o servidor local e o invólucro (wrapper) Window do Electron, executando o jogo de fato nos moldes de Desktop, forçando o Aspect Ratio nativo de 4:3.
  
- `npm run electron:build`
  Prepara a pasta e a minificação final (`/dist/`) via Vite e chama imediatamente o processo do `electron-builder` para criar o binário executável final de produção (.exe/.dmg).

## Arquitetura de Pastas e Boas Práticas (Governança)

O projeto adere rigorosamente a padrões de mercado, **Clean Code, Singleton Utilities e Documentação Viva (Keep a Changelog, DevLogs)**.

- **`/electron/`**: Mantém as diretrizes e regras nativas do processo principal isoladas.
- **`/public/`**: Pasta aberta para injeção de assets estáticos puros (ex: imagens, MP3).
  - **`/public/data/`**: Alojamento dos repositórios descritivos em JSON brutos que guiam toda lógica e roteiro, permitindo modificação sem tocar na base de código.
- **`/src/`**: Motor interno do jogo.
  - **`/src/scenes/`**: Estados fundamentais, gerenciando ciclos de vida e máquinas de estados (`PreloadScene`, `GameScene`).
  - **`/src/ui/`**: Componentes reutilizáveis isolados e estendidos da Engine visual.
  - **`/src/utils/`**: Controladores auxiliares utilitários centralizados para evitar código redundante (ex: `Logger.js`).
- **`/docs/`**: Governança em markdown registrando cada fase arquitetural para rastreabilidade limpa da evolução do software.
