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

> **Nenhuma regra pedagógica no código.** Macrotemas, modalidades, turmas, etapas, tipos de etapa, subtipos, prazos, conquistas, perguntas do portfólio e da enquete vêm **sempre** de `estado.cicloConfig`, editável em tempo de execução pela tela da equipe operadora.

Isso não é preferência de arquitetura — é a restrição **R06**: o desenho do Ciclo 2 ainda tem decisões pedagógicas abertas (6 ou 4 macrotemas; textos-base; questões da enquete). A interface não pode fixar nenhuma dessas escolhas.

Teste prático, que precisa passar sempre: **trocar 6 macrotemas por 4, reordenar etapas ou renomear uma etapa não pode quebrar nenhuma tela.**

**Segmentos foram removidos do modelo (D26, rodada D22-D38)** — não existe mais `Segmento`, `cenarioSegmentacao` nem trilhas diferentes por segmento. Se essa ideia voltar um dia, é uma reintrodução de conceito, não uma correção.

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

Rodada de lapidação D22-D38 (reunião com Lucas, Sinclair, Alana e Douglas — ver `instrucoes-lapidacao-prototipo-D22-D38.md`):

| ID | O que amarra no código |
|---|---|
| **D26** | Segmentos saem do modelo por completo — sem `Segmento`, sem `cenarioSegmentacao`, sem trilha por segmento. |
| **D27** | Nas telas do docente, o termo é **"jornada"**, não "ciclo". `estado.cicloConfig` continua sendo o nome interno — a troca é só no texto voltado ao usuário. |
| **D28** | **"Painel" não é mais um conceito compartilhado entre perfis.** `/` virou um redirecionamento (client-side, perfilAtivo só existe depois da hidratação) para a tela de referência de cada perfil. O resumo do docente mora dentro de Minha Jornada. |
| **D29** | "Acesso à jornada" (era "Acesso ao ciclo") só aparece no menu da **operadora**, como ferramenta de suporte — não no menu do docente. O seletor "Demonstração" (troca ampla de perfil) é outra coisa e não mudou. |
| **D30** | Etapa escolhe um **subtipo** já cadastrado (nome + tipo genérico + tela) em vez de configurar tipo/tela soltos. `Etapa.tipo`/`Etapa.tela` continuam sendo a fonte real lida pelo app — `subtipoId` só referencia o que foi selecionado, para a tela de configuração reabrir mostrando a escolha. |
| **D31** | `ItemConteudo` tipo `questionario` (perguntas de múltipla escolha, sem resposta aberta) é distinto de `tarefa`. Tarefa e texto-base ganham `linkApoio` opcional. |
| **D32** | 6º critério de avanço: `nota_minima` — mesma mecânica de `tarefa_validada` (nota da devolutiva ≥ corte), mas como gate independente. |
| **D33** | Perfil **`moderador`**: acesso restrito às turmas em `Pessoa.turmaIds`, só para lançar presença. Rótulo "moderador" é provisório (trocar para "mediador" é só mudar `ROTULO_PERFIL`). |
| **D34** | `Pessoa.cargo` sai; **`Inscricao.tipoParticipacao`** (regente/corregente) entra — escolhido pelo docente, não mais fixo na pessoa. `Etapa.perfisParticipantes` controla quem passa por cada etapa (vazio = todos). |
| **D35** | `Pessoa.coordenadorId` sai; **`Alocacao`** (coordenadorId, docenteId) entra — criada pelo próprio coordenador na área "Perfil". Um docente pode ter mais de um líder. |
| **D36** | Base de docentes é **somente leitura** no protótipo — sem tela de cadastro de novo docente. |
| **D37** | "Gestão do ciclo" ganha dois indicadores: coordenadores sem liderados e docentes sem líder. |
| **D38** | `Etapa.prazoDias` conta a partir do **vencimento da etapa anterior**, não mais da abertura do ciclo. `CicloConfig.dataInicioCiclo` (era `aberturaISO`) é o ponto de partida da cadeia. |

---

## 5. Stack e convenções

**Stack:** TanStack Start · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · lucide-react · recharts · sonner.

- **O roteador é o TanStack Router e não pode ser trocado.** Roteamento por arquivo em `src/routes/`. `src/routeTree.gen.ts` é **gerado** — nunca edite à mão.
- Sem biblioteca de estado global. O estado é um contexto React sobre `localStorage`.
- `npm run dev` · `npm run build` · `npm run lint` · `npm run format`.

**Convenções obrigatórias:**

- **Todo o código é em português do Brasil** — nomes de arquivos, tipos, funções, variáveis, comentários e texto de interface. Siga o que já existe (`cicloConfig`, `trilhaDoDocente`, `etapasEmOrdem`).
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

**Armadilha conhecida — deploy fora do Lovable/Cloudflare:** `vite.config.ts` fixa `nitro.defaultPreset: "cloudflare-module"` — é o alvo do build quando nenhuma plataforma é detectada (ex.: `npm run build` local, ou `.output/` com `wrangler.json`). O Nitro detecta a plataforma sozinho por variável de ambiente: quando `NETLIFY=true` está presente (a Netlify seta isso automaticamente durante o build), o preset vira `netlify` e a saída vai para `.netlify/functions-internal/` + `dist/`, sem precisar mexer em código. `netlify.toml` (raiz do repo) só torna isso explícito — comando de build, diretório de publicação (`dist`) e a versão do Node (`nitro`/`vite` exigem `^20.19` ou `>=22.12`; sem fixar, a Netlify pode usar uma imagem mais antiga). Testado localmente com `NETLIFY=true npm run build`: preset `netlify`, build limpo.

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
    ciclo.ts        etapasEmOrdem, macrotemasAtivos, prazoDaEtapa (encadeado, D38), moverItem,
                     reindexar, novoId, usoDaTurma, docentesDaTurma, passoGuiadoTravado,
                     resumoConferenciaCiclo, tipoParticipacaoDaPessoa, coordenadoresDoDocente,
                     coordenadorPrincipalDoDocente (D34/D35)
    avanco.ts       Critérios de avanço da etapa de conteúdo (D15/D32): ofertaDoDocente,
                     itensDaOferta, criteriosDoDocente, etapaConcluidaPorCriterios,
                     percentualPresenca. NÃO importa de jornada.ts (evita ciclo — é o inverso).
    jornada.ts      trilhaDoDocente — status de cada etapa do docente, OR'd com avanco.ts para
                     etapa de conteúdo com oferta, filtrado por perfisParticipantes (D34)
    conteudo.ts     percursoDoDocente, aulasConcluidas, leituraDaEtapa, presencasAutomaticas
                     (só a automática — a lançada à mão está em estado.presencas)
    entrega.ts      destino da entrega — regente vai ao coordenador, corregente à equipe central
    equipe.ts       linhasDaEquipe — base compartilhada do painel do coordenador, do diretor
                     (filtro por unidade), da operadora e do moderador (filtro por turmaIds,
                     correção pós-D33)
    gestao.ts       conferências, alertas disparados (lê estado.notificacoes, não recalcula prazo
                     — ver seção 7), ocupação de turmas, docentesDaTurma, pendenciasDeAlocacao (D37)
    observacao.ts   agenda e parecer de observação de aula
    notificacoes.ts central de notificações
  components/
    ui/             shadcn. NÃO EDITE estes arquivos.
    config/         abas da Configuração do Ciclo (operadora): AbaGeral (nome/descrição/data de
                     início, D27/D38), AbaMacrotemas, AbaModalidades, AbaTurmas (lista única em
                     tabela + modal, D23/D24; card "Moderadores por turma" atribui turmaIds a quem
                     já é moderador, correção pós-D33), AbaEtapas (cascata tipo→subtipo, D30),
                     AbaConteudo (tarefa/questionário distintos, D31), AbaAlertas, AbaEncerramento,
                     ModoGuiado (cabeçalho de passos + Conferência — "geral" é o 1º passo, não
                     "segmentos")
    jornada/        trilha, conquistas, painel de etapa (docente)
    conteudo/       player de aulas, leitura do texto-base, presenças automáticas,
                     AvisoConteudoIndisponivel (D11)
    acompanhamento/ FunilEtapas — funil de etapas com detalhamento clicável e "avisar todos"
                     (RF32), compartilhado por operadora, coordenador e diretor
    coordenador/    painel da equipe (PainelEquipe, escopo coordenador/operadora/diretor/
                     moderador), detalhe do docente (valida entrega e registra devolutiva —
                     reaproveitado pelo moderador), agenda de observações
    operadora/      gestão do ciclo (com indicadores de pendência de alocação, D37), conferências,
                     ocupação/lançamento de presença (PainelLancamentoPresenca, exportado — o
                     moderador reaproveita), alertas
    diretor/        PainelUnidade — acompanhamento da unidade por coordenador (D18)
    moderador/      PainelModeracao — turmas do moderador (D33): lançamento de presença +
                     "Entregas para validar" (PainelEquipe escopo="moderador", correção pós-D33)
    perfil/         PainelPerfil — dados da base, tipo de participação, Líder(es) (docente),
                     Alocações (coordenador, busca por Command/cmdk) (D35)
    layout/         AppShell, navegação por perfil (todo perfil tem "/perfil" no menu), central
                     de notificações
  routes/           uma rota por arquivo (conteudo.tsx só redireciona para /configuracao;
                     index.tsx não é mais uma tela — redireciona por perfil, D28)
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

Desde a rodada D22-D38 (`VERSAO_ESTADO = 8`):

- `EstadoApp` ganha `alocacoes: Alocacao[]` (D35).
- `CicloConfig` ganha `descricao` e `subtipos: Subtipo[]`; `aberturaISO` foi renomeado para `dataInicioCiclo` (D38); `cenarioSegmentacao`/`segmentos` foram **removidos** (D26).
- `Etapa` ganha `subtipoId?` e `perfisParticipantes: TipoParticipacao[]`; perdeu `segmentos: string[]`.
- `Pessoa` perdeu `cargo` (virou `Inscricao.tipoParticipacao`) e `coordenadorId` (virou a entidade `Alocacao`); perdeu `segmentoId`; ganhou `turmaIds?` (só para `moderador`) e o perfil `"moderador"` na união.
- `Inscricao` ganha `tipoParticipacao: TipoParticipacao`.
- `ItemConteudo` ganha o tipo `"questionario"` (+ `perguntas: PerguntaOpcaoMultipla[]`) e `linkApoio?` (tarefa e texto-base).
- `CriterioAvanco`/`TipoCriterioAvanco` ganha `"nota_minima"`.

Como sempre: sem migração. Qualquer estado salvo de uma versão anterior é descartado e o seed é recriado.

---

## 8. Perfis

| Perfil | Papel |
|---|---|
| `docente-regente` | Usuário principal; percorre a trilha |
| `docente-corregente` | Professor auxiliar. **Entrega e devolutiva vão para a equipe central, não para o coordenador da unidade** (RF22) |
| `coordenador` | Líder principal do acompanhamento; corrige tarefas, observa aulas |
| `operadora` | Configura o ciclo e opera; equipe da Marilda |
| `diretor` | Acompanha os docentes da sua unidade, por etapa (D18) |
| `moderador` | Acesso restrito às turmas em `Pessoa.turmaIds`; só lança presença (D33) |

A troca de perfil é do seletor de demonstração. **Não implemente permissões reais** — está explicitamente fora do escopo do protótipo (RNF05 fica para o MVP). O acesso restrito do `moderador` e do `diretor` (só a própria unidade) são filtros de tela por `pessoaAtiva`, não controle de acesso de verdade — mesmo princípio.

---

## 9. O que está pendente e conhecido

- **Regras de conclusão das demais etapas** (autoavaliação, encontro, avaliação) seguem provisórias — a regra sequencial. Resolvido apenas para a etapa de conteúdo, por D15.
- **Tipo de etapa `curso` com `referenciaExterna`**, previsto em D01/D10 como caminho secundário, ainda não existe. Fica para o MVP.

**Da rodada P1+P2 (lapidação da etapa de conteúdo e configuração do ciclo):**

- **Quem lança a presença da turma síncrona — resolvido nesta rodada (D33):** além da equipe operadora (aba Turmas da Gestão do Ciclo), agora existe o perfil `moderador`, restrito às turmas em `Pessoa.turmaIds`, que também lança presença nelas. Os dois caminhos coexistem — nada foi removido da operadora.
- **`Midia.corpo`** (texto-base escrito direto no sistema) é campo aditivo, fora do texto literal da especificação original — sem ele não havia onde guardar o texto digitado. Confirmar com o cliente.
- **A regra "primeira turma esgota antes de ofertar a próxima"** (autoinscrição) **não foi implementada** — `percurso.tsx` continua deixando o docente escolher livremente entre as turmas com vaga da modalidade escolhida. Fica para uma próxima rodada se for necessária para a demonstração.
- **Link do encontro ao vivo — resolvido:** o botão "Entrar no encontro" usa `Turma.linkAcesso`, da turma em que o docente está inscrito. `ItemConteudo` tipo `webconferencia` / `Midia.url` são complementares (ex.: gravação anexada depois), não a fonte do link principal.
- **`ItemConteudo.ordem`** nasce 0-based ao criar um item pela aba Conteúdo, mas vira 1-based depois de qualquer reordenação (arrasta-e-solta), porque usa `reindexar()` de `ciclo.ts`. Não tem efeito funcional, só é uma inconsistência cosmética.
- **`src/data/conteudos.ts`** (mock de aulas/texto) continua existindo como fallback: quando a etapa de conteúdo não tem oferta configurada, a tela do docente usa o mock.

**Da rodada P3 (acompanhamento — RF32, D18):**

- **O painel do diretor (`/unidade`) agrupa por `Pessoa.coordenadorId` do docente** — na rodada D22-D38 isso virou `coordenadoresDoDocente()` sobre a entidade `Alocacao` (D35), já que `Pessoa.coordenadorId` não existe mais. Mesma leitura de fundo: um docente pode ter mais de um líder agora, então pode aparecer em mais de um cartão. Confirmar com o cliente se cada unidade deveria ter coordenadores fixos.
- **"Avisar todos" no funil (`FunilEtapas`) alcança todo docente que não concluiu a etapa** (pendente, em andamento ou atrasado), não só quem está atrasado. Confirmar com o cliente.

**Da rodada D22-D38 (lapidação estrutural — modelo de dados, configuração, perfis):**

- **Painel inicial (`/`) deixou de ser uma tela (D28)** — vira redirecionamento por perfil (`docente`/`moderador` → `/jornada`; `coordenador` → `/equipe`; `operadora` → `/gestao`; `diretor` → `/unidade`). O resumo que ficava lá (contadores, atalho) foi descartado, não migrado — o resumo do docente virou o `EstadoBadge` dentro de Minha Jornada. Se o cliente sentir falta de um resumo por perfil na porta de entrada, é para trazer de volta como conteúdo de cada tela de destino, não recriar `/`.
- **Agrupamento do painel do diretor por `coordenadorId` do docente** (não pela `unidade` do coordenador) — decisão já registrada na rodada P3, reafirmada aqui porque a fonte mudou de `Pessoa.coordenadorId` para `Alocacao`.
- **6º critério de avanço `nota_minima`** usa a mesma mecânica de `tarefa_validada` (nota da devolutiva mais recente ≥ corte) — não é um critério pedagógico novo, é o mesmo mecanismo com um nome diferente, para permitir ativar "nota mínima" sem exigir "tarefa entregue" como critério separado. Confirmar com o cliente se faz sentido como está.
- **Subtipo (D30) só tem cadastro de criação** — a etapa cria um subtipo novo direto da cascata tipo→subtipo, mas não há tela para editar ou excluir um subtipo já existente. "Pode ser simples", como a especificação pediu; editar/excluir fica para uma próxima rodada se for necessário.
- **Tipo de participação (regente/corregente) é editável em dois lugares**: na Escolha do percurso (`/percurso`, no momento da inscrição) e na área Perfil (`/perfil`, a qualquer momento depois). Os dois escrevem no mesmo campo (`Inscricao.tipoParticipacao`) — não há conflito, é a mesma fonte de dado com dois pontos de entrada, como a especificação pedia os dois.
- **Fluxo de "solicitar inclusão de professor não encontrado na base"** — não implementado, como a especificação já previa deixar em aberto.
- **Hierarquia de macrociclo/mesociclo** e **tela de Encerramento (pesquisa de satisfação)** — não tocadas nesta rodada, como pedido; seguem para uma próxima reunião de lapidação.

**Correções pós-validação de código (ver `correcoes-validacao-D22-D38.md`):**

- **"Ciclo" ainda aparecia nas telas do docente (D27) — resolvido.** `/jornada`, `/percurso`, `/aulas` e `/entrega` liam `cicloConfig.nome` (seed: "Ciclo 2") em vez de `cicloConfig.descricao` (seed: "Jornada 2027 a 2030"). `nome` continua sendo o identificador interno; a exibição ao docente agora usa `descricao`. Telas da operadora (`/acesso`, `/gestao`, `/configuracao`) continuam usando "ciclo" normalmente — não fazem parte de D27.
- **Moderador só lançava presença (D33) — resolvido.** `PainelModeracao` agora também reaproveita `PainelEquipe`/`DetalheDocente` (escopo `"moderador"`, filtrando por `linhasDaEquipe(estado, { turmaIds })`) para validar entrega e registrar devolutiva dos docentes das suas turmas — o mesmo padrão do coordenador, sem nenhuma configuração de turma/ciclo exposta ao moderador.
- **Sem UI para atribuir turmas a um moderador (D33) — resolvido.** A aba Turmas da Configuração do Ciclo ganhou o card "Moderadores por turma": a operadora escolhe, por pessoa com perfil `moderador`, quais turmas ela cobre (grava direto em `Pessoa.turmaIds`). A base de pessoas continua só leitura quanto a cadastro (D36) — isso não muda; só a atribuição de turmas a quem já é moderador.
- **`linkApoio` nunca chegava ao docente (D31) — resolvido.** O campo era salvo pela aba Conteúdo (tarefa e texto-base), mas nenhuma tela do docente o lia. `/aulas` agora mostra um link "Material de apoio" clicável, próximo à instrução da tarefa e ao final do texto-base, quando `linkApoio` está preenchido.
- **Perfil moderador inacessível pelo seletor de demonstração (D33) — resolvido.** `ROTULO_PERFIL`, `PESSOA_PADRAO_POR_PERFIL` e `NAVEGACAO_POR_PERFIL` já tinham a entrada de `"moderador"`, mas o array `PERFIS` de `components/layout/AppShell.tsx` (que popula o `<Select>` "Demonstração") ficou faltando — encontrado depois do commit `2076379`, já com toda a implementação (rota `/moderacao`, "Entregas para validar", atribuição de turmas) pronta e sem como chegar lá pela UI. `PERFIS` agora inclui `"moderador"`.

---

## 10. Como trabalhar aqui

1. **Leia antes de escrever.** `src/data/types.ts` e o `src/lib/` relevante, sempre.
2. **Commits pequenos e frequentes**, em português, um assunto por commit.
3. **Rode `npm run lint` e `npm run build`** antes de considerar uma tarefa concluída.
4. **Teste no preview** o caminho que você mexeu, nos dois perfis afetados.
5. **Quando uma decisão de produto não estiver coberta aqui nem na especificação da tarefa, pare e pergunte.** Não invente regra pedagógica — foi exatamente para evitar isso que esta documentação existe.
6. Ao terminar uma mudança estrutural, **atualize este arquivo**.

**Repositório remoto:** `https://github.com/joaolucaspositivo/Prot-tipo-Jornada-Lovable.git`, branch `main`. Autoria dos commits: João Lucas / `joao.duarte@colegiopositivo.com.br`. GitHub CLI (`gh`) não está disponível nesta máquina (ambiente corporativo, instalação depende de liberação do TI) — `git push` funciona normalmente via Git Credential Manager, já configurado no Git for Windows.
