# CLAUDE.md — Jornada Pedagógica de Desenvolvimento (protótipo)

Contexto permanente do repositório. Leia este arquivo inteiro antes de tocar em qualquer código.
Criado para atender a decisão **D06** (desenvolvimento solo com Claude Code, apoiado em documentação estruturada, sem harness).

---

## 1. O que é este projeto

Sistema que substitui o processo manual da **Jornada Pedagógica de Desenvolvimento** — a trilha de formação docente de 4 anos do Colégio Positivo, com ~1.000 professores e ~12 turmas por ciclo.

O desenho pedagógico já funciona e tem engajamento alto (98,3%). **O problema é inteiramente operacional:** o fluxo atravessa seis ferramentas desconectadas (Google Forms, Google Sites, TEIA, Smart Leader, planilhas e e-mail), com toda transição de dados feita à mão.

As quatro dores que o sistema existe para eliminar, em ordem de impacto:

1. Matrícula digitada errada — a identidade passa a vir da base institucional.
2. Cadastro manual de ~1.000 docentes em 12 turmas — passa a ser autoinscrição.
3. ~1.000 links de tarefa colados à mão — o líder acessa a entrega direto.
4. ~64 uploads de vídeo por ciclo abrindo o Drive — o upload acontece de dentro do sistema.

**Critério para qualquer decisão de produto:** se a mudança faz um bloco inteiro de trabalho manual deixar de existir, ela é valiosa. Se apenas acelera o trabalho manual, não é.

---

## 2. O que este repositório é — e o que não é

Este repositório é o **protótipo navegável**, não o MVP.

| É | Não é |
|---|---|
| Interface funcional, fidelidade média-alta | Sistema em produção |
| Estado no `localStorage` do navegador | Back-end, banco de dados, API |
| Perfis alternáveis por um seletor | Login, autenticação, permissões reais |
| Dados fictícios de demonstração | Dados institucionais |
| Fluxo completo da Jornada, ponta a ponta | Escopo do MVP de dezembro |

O protótipo cobre o **fluxo completo** (D03). O MVP de dezembro entrega apenas o que abre o ciclo em fevereiro (D05). Não confunda os dois escopos ao decidir o que construir.

**Público atual do protótipo:** alinhamento interno entre João (guardião do projeto) e Lucas (Coordenador de TE, cliente inicial). Por **D12**, o protótipo **não será apresentado ao setor responsável** — a área verá o MVP 1.

---

## 3. A regra de ouro

> **Nenhuma regra pedagógica no código.** Macrotemas, modalidades, turmas, etapas, tipos de etapa, segmentos, prazos, conquistas, perguntas do portfólio e da enquete vêm **sempre** de `estado.cicloConfig`, editável em tempo de execução pela tela da equipe operadora.

Isso não é preferência de arquitetura — é a restrição **R06**: o desenho do Ciclo 2 ainda tem decisões pedagógicas abertas (6 ou 4 macrotemas; três cenários de divisão por segmento; textos-base; questões da enquete). A interface não pode fixar nenhuma dessas escolhas.

Teste prático, que precisa passar sempre: **trocar 6 macrotemas por 4, reordenar etapas, renomear uma etapa ou remover um segmento não pode quebrar nenhuma tela.**

Corolários:

- Nunca conte elementos assumindo um número (`macrotemas[5]`, "as 8 etapas").
- Nunca infira comportamento a partir do **nome** de um item configurável. Se uma etapa precisa abrir uma tela específica, isso é um **campo** da etapa, não um `nome.includes(...)`.
- Nunca escreva um rótulo pedagógico direto no JSX se ele existe na configuração.

---

## 4. Decisões que restringem o código

Referência completa: Notion → Jornada → Reuniões, Decisões e Aprovações → *Registro de Decisões — D01 a D20*.

| ID | O que amarra no código |
|---|---|
| **D01** | Jornada é independente do TEIA. A etapa de tipo curso, se existir, guarda status próprio e referência externa. |
| **D03** | Sem back-end, sem banco. Persistência em `localStorage`. Protótipo cobre o fluxo completo. |
| **D05** | O MVP é faseado pelo calendário de uso. Não antecipe o que só é usado no fim do ciclo. |
| **D08** | O sistema roda **apenas o Ciclo 2 (2027–2030)**. Não modele o Ciclo 1. |
| **D10** | O curso acontece **dentro** do sistema, pela etapa de tipo `conteudo`. Fronteira: **módulo de conteúdo, não LMS** — sem player próprio, sem rastreio de tempo assistido, sem gestor de notas. `cargaHoraria` é configuração da etapa. |
| **D11** | Vídeo mora no Drive institucional; o upload acontece de dentro do sistema (simulado no protótipo). **Separe `Midia` de item de conteúdo** — a biblioteca é reutilizável entre turmas e ciclos. O operador nunca copia URL. |
| **D13** | **Turmas são criadas dentro do sistema**, na configuração do ciclo. |
| **D14** | Conteúdo é vinculado a **etapa × macrotema × modalidade**, com quatro tipos de item: vídeo, texto-base, link de webconferência e tarefa. |
| **D15** | **Critérios de avanço de fase são configuráveis.** A regra sequencial fixa deixa de valer para a etapa de conteúdo. |
| **D16** | Presença: **automática na assíncrona** (pelo envio da tarefa, RF15); **lançada pelo professor na síncrona**, com liberação manual de exceção. |
| **D17** | Certificação sai **ao final da jornada**, não por curso. Fora do MVP de dezembro. |
| **D18** | O diretor de unidade é perfil real, com acompanhamento por etapa da sua unidade. |
| **D19** | Arquitetura prevê múltiplos ciclos. Mas **um ciclo só** continua sendo o caso de uso demonstrado. |
| **D20** | Enquete 360°: escala Likert de **5 pontos**; recorte Grupo → unidade → segmento → ano de ensino; notas de docentes e coordenadores separadas. |

**Risco nº 1 registrado, que exige vigilância ativa:** *escopo silencioso do módulo de curso*. "Curso no sistema" começa como conteúdo embarcado e termina como gestor de turmas, notas, fóruns e relatórios. Com um desenvolvedor e prazo em 20/12/2026, qualquer ampliação precisa ser recusada por padrão.

---

## 5. Stack e convenções

**Stack:** TanStack Start · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · lucide-react · recharts · sonner.

- **O roteador é o TanStack Router e não pode ser trocado.** Roteamento por arquivo em `src/routes/`. `src/routeTree.gen.ts` é **gerado** — nunca edite à mão.
- Sem biblioteca de estado global. O estado é um contexto React sobre `localStorage`.
- `npm run dev` · `npm run build` · `npm run lint` · `npm run format`.

**Convenções obrigatórias:**

- **Todo o código é em português do Brasil** — nomes de arquivos, tipos, funções, variáveis, comentários e texto de interface. Siga o que já existe (`cicloConfig`, `trilhaDoDocente`, `etapasDoSegmento`).
- **Cores só por token semântico** de `src/styles.css`: `sucesso`, `sucesso-suave`, `andamento`, `andamento-suave`, `atraso`, `atraso-suave`, `bloqueado`, `bloqueado-suave`, além dos tokens do shadcn. **Nenhuma cor literal em componente.**
- **Estado nunca é comunicado só por cor**: sempre cor + ícone + texto. Use `EstadoBadge`.
- `localStorage` só é lido **depois da hidratação** (`useEffect`), nunca durante a renderização — o app roda em SSR e quebra se essa regra for violada.
- Toda rota define seu próprio `head()` com título e descrição em português.
- Tudo precisa funcionar em **375px de largura**.

**Armadilha conhecida — `vite.config.ts`:** o export do Lovable **não traz** este arquivo. Sem ele, `npm run dev`/`build` nem sobem — o projeto depende de `@lovable.dev/vite-tanstack-config` (já listado em `devDependencies`) para existir. Se o protótipo for reexportado do Lovable, recrie o arquivo na raiz com:
  ```ts
  import { defineConfig } from "@lovable.dev/vite-tanstack-config";
  export default defineConfig();
  ```
  Isso é infraestrutura de build, não faz parte do desenho do protótipo — não é uma mudança a "preservar" na lógica do app, é um arquivo que sempre falta e sempre precisa voltar.

**Armadilha conhecida — `eslint.config.js`:** o export do Lovable também **não traz** este arquivo, apesar de `tsconfig.json` já listá-lo em `include` e o `package.json` já ter o script `"lint": "eslint ."`. Sem ele, `npm run lint` falha com "ESLint couldn't find an eslint.config.(js|mjs|cjs) file" — não por causa de código, por ausência do arquivo. O projeto já tem todas as devDependencies certas para reconstruí-lo (`@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `eslint-plugin-prettier`/`eslint-config-prettier`, `globals`) — é só faltar o arquivo de configuração flat (ESLint 9) que os une.

---

## 6. Mapa do código

```
src/
  data/
    types.ts        Modelo de dados inteiro. Comece por aqui.
    seed.ts         SEED de demonstração. Nada aqui é regra do sistema.
    store.tsx       Contexto React + localStorage. useStore(), atualizar(), resetarDemonstracao().
    conteudos.ts    Material mock — só usado quando a etapa de conteúdo NÃO tem oferta configurada.
  lib/              Leituras derivadas. Sem JSX, sem estado.
    ciclo.ts        etapasDoSegmento, macrotemasAtivos, prazoDaEtapa, moverItem, reindexar, novoId,
                     usoDaTurma, docentesDaTurma, passoGuiadoTravado, resumoConferenciaCiclo
    avanco.ts       Critérios de avanço da etapa de conteúdo (D15): ofertaDoDocente,
                     itensDaOferta, criteriosDoDocente, etapaConcluidaPorCriterios,
                     percentualPresenca. NÃO importa de jornada.ts (evita ciclo — é o inverso).
    jornada.ts      trilhaDoDocente — status de cada etapa do docente, agora OR'd com avanco.ts
                     para etapa de conteúdo com oferta
    conteudo.ts     percursoDoDocente, aulasConcluidas, leituraDaEtapa, presencasAutomaticas
                     (só a automática — a lançada à mão está em estado.presencas)
    entrega.ts      destino da entrega — regente vai ao coordenador, corregente à equipe central
    equipe.ts       linhasDaEquipe — base compartilhada do painel do coordenador, do diretor
                     (filtro por unidade) e da operadora
    gestao.ts       conferências, alertas disparados (lê estado.notificacoes, não recalcula prazo
                     — ver seção 7), ocupação de turmas, docentesDaTurma
    observacao.ts   agenda e parecer de observação de aula
    notificacoes.ts central de notificações
  components/
    ui/             shadcn. NÃO EDITE estes arquivos.
    config/         abas da Configuração do Ciclo (operadora), incluindo AbaTurmas, AbaConteudo
                     e ModoGuiado (cabeçalho de passos + Conferência)
    jornada/        trilha, conquistas, painel de etapa (docente)
    conteudo/       player de aulas, leitura do texto-base, presenças automáticas,
                     AvisoConteudoIndisponivel (D11)
    acompanhamento/ FunilEtapas — funil de etapas com detalhamento clicável e "avisar todos"
                     (RF32), compartilhado por operadora, coordenador e diretor
    coordenador/    painel da equipe (PainelEquipe, escopo coordenador/operadora/diretor),
                     detalhe do docente, agenda de observações
    operadora/      gestão do ciclo, conferências, ocupação/lançamento de presença, alertas
                     (GestaoConteudo.tsx foi removido — virou a aba Conteúdo)
    diretor/        PainelUnidade — acompanhamento da unidade por coordenador (D18)
    layout/         AppShell, navegação por perfil, central de notificações
  routes/           uma rota por arquivo (conteudo.tsx só redireciona para /configuracao)
```

**Padrão de trabalho:** leitura de dados vai para `src/lib/` como função pura sobre `EstadoApp`; componente só renderiza e chama `atualizar()`. Não coloque regra de negócio dentro de JSX.

---

## 7. Estado e persistência

- Chave: `jornada-prototipo-v1` (`CHAVE_STORAGE` em `src/data/seed.ts`).
- Versão: `VERSAO_ESTADO`. Se a versão salva difere da atual, `carregar()` devolve `null` e o seed é recriado do zero.
- **Toda mudança no formato de `EstadoApp` exige incrementar `VERSAO_ESTADO`.** Não existe migração — o protótipo simplesmente recria o seed. Isso é aceitável e intencional.
- Escrita sempre por `atualizar()`, de forma imutável. Nunca mute o estado no lugar.
- O botão de reiniciar demonstração chama `resetarDemonstracao()`.

**O seed é o roteiro da demonstração.** Ele precisa deixar visível, no primeiro carregamento, cada coisa que a reunião vai mostrar — inclusive os dois caminhos (síncrono e assíncrono) e docentes em estágios diferentes do ciclo. Um recurso que só aparece depois de o usuário cadastrar algo não existe na demonstração.

Desde a rodada P1+P2, `EstadoApp` também guarda `midias`, `ofertas`, `itensConteudo` e `presencas` (biblioteca de mídia, oferta de conteúdo por etapa×macrotema×modalidade, itens da oferta e presença lançada à mão na síncrona — D11/D14/D16). `arquivosConteudo`/`ArquivoConteudo` foram removidos.

---

## 8. Perfis

| Perfil | Papel |
|---|---|
| `docente-regente` | Usuário principal; percorre a trilha |
| `docente-corregente` | Professor auxiliar. **Entrega e devolutiva vão para a equipe central, não para o coordenador da unidade** (RF22) |
| `coordenador` | Líder principal do acompanhamento; corrige tarefas, observa aulas |
| `operadora` | Configura o ciclo e opera; equipe da Marilda |
| `diretor` | Acompanha os docentes da sua unidade, por etapa (D18) |

A troca de perfil é do seletor de demonstração. **Não implemente permissões reais** — está explicitamente fora do escopo do protótipo (RNF05 fica para o MVP).

---

## 9. O que está pendente e conhecido

- **Regras de conclusão das demais etapas** (autoavaliação, encontro, avaliação) seguem provisórias — a regra sequencial. Resolvido apenas para a etapa de conteúdo, por D15.
- **Tipo de etapa `curso` com `referenciaExterna`**, previsto em D01/D10 como caminho secundário, ainda não existe. Fica para o MVP.

**Da rodada P1+P2 (lapidação da etapa de conteúdo e configuração do ciclo):**

- **Quem lança a presença da turma síncrona é a equipe operadora**, na aba Turmas da Gestão do Ciclo — foi onde a reunião apontou. D16 fala em "professor da turma", mas **não existe perfil de professor no sistema** (`Turma.professorNome` é texto livre, não `Pessoa`). Pergunta em aberto para a próxima reunião: esse lançamento deveria ser de um perfil novo?
- **`Midia.corpo`** (texto-base escrito direto no sistema) é campo aditivo desta rodada, fora do texto literal da especificação — sem ele não havia onde guardar o texto digitado. Confirmar com o cliente.
- **A regra "primeira turma esgota antes de ofertar a próxima"** (autoinscrição) **não foi implementada** — `percurso.tsx` continua deixando o docente escolher livremente entre as turmas com vaga da modalidade escolhida. Fica para uma próxima rodada se for necessária para a demonstração.
- **Link do encontro ao vivo — resolvido:** o botão "Entrar no encontro" usa `Turma.linkAcesso`, da turma em que o docente está inscrito — decisão de hoje, a favor do que a reunião de lapidação registrou ("a turma 1 vai usar esse link, a turma 2 usa outro link"). `ItemConteudo` tipo `webconferencia` / `Midia.url` viraram complementares (ex.: gravação anexada depois), não a fonte do link principal.
- **`ItemConteudo.ordem`** nasce 0-based ao criar um item pela aba Conteúdo, mas vira 1-based depois de qualquer reordenação (arrasta-e-solta), porque usa `reindexar()` de `ciclo.ts`. Não tem efeito funcional (a ordenação é sempre relativa), só é uma inconsistência cosmética a arrumar se algum dia incomodar.
- **`src/data/conteudos.ts`** (mock de aulas/texto) continua existindo como fallback: quando a etapa de conteúdo não tem oferta configurada, a tela do docente usa o mock, exatamente como antes desta rodada.

**Da rodada P3 (acompanhamento — RF32, D18):**

- **O painel do diretor (`/unidade`) agrupa por `Pessoa.coordenadorId` do docente, não pela `unidade` do coordenador.** É a única leitura consistente com o modelo atual — um coordenador pode liderar docentes de mais de uma unidade. Se o cliente esperava unidades com coordenadores fixos, isso muda o desenho. Confirmar com o cliente.
- **"Avisar todos" no funil (`FunilEtapas`) alcança todo docente que não concluiu a etapa** (pendente, em andamento ou atrasado), não só quem está atrasado. Se o Lucas quiser um botão separado só para atrasados, é ajuste pequeno. Confirmar com o cliente.
- **O painel inicial (`/`) virou um resumo com atalho por perfil, não um dashboard completo** — contadores + botão para a tela cheia (`/equipe`, `/gestao` ou `/unidade`; "Ver Minha Jornada" para o docente). Não duplica o funil nem a tabela. Se o cliente esperava o funil já na tela inicial, é uma adição pequena de trazer, não uma mudança de estrutura. Confirmar com o cliente.

---

## 10. Como trabalhar aqui

1. **Leia antes de escrever.** `src/data/types.ts` e o `src/lib/` relevante, sempre.
2. **Commits pequenos e frequentes**, em português, um assunto por commit.
3. **Rode `npm run lint` e `npm run build`** antes de considerar uma tarefa concluída.
4. **Teste no preview** o caminho que você mexeu, nos dois perfis afetados.
5. **Quando uma decisão de produto não estiver coberta aqui nem na especificação da tarefa, pare e pergunte.** Não invente regra pedagógica — foi exatamente para evitar isso que esta documentação existe.
6. Ao terminar uma mudança estrutural, **atualize este arquivo**.

**Repositório remoto:** `https://github.com/joaolucaspositivo/Prot-tipo-Jornada-Lovable.git`, branch `main`. Autoria dos commits: João Lucas / `joao.duarte@colegiopositivo.com.br`. GitHub CLI (`gh`) não está disponível nesta máquina (ambiente corporativo, instalação depende de liberação do TI) — `git push` funciona normalmente via Git Credential Manager, já configurado no Git for Windows.
