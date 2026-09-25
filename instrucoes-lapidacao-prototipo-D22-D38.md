# Instruções de lapidação do protótipo — Jornada Pedagógica de Desenvolvimento

**Origem:** decisões D22 a D38, registradas em "Registro de Decisões — D01 a D38" (Notion), a partir da reunião de apresentação e lapidação do protótipo v2 com Lucas, Sinclair, Alana e Douglas.
**Como usar este documento:** cole este arquivo (ou cada seção, uma de cada vez) como instrução para o Claude Code no repositório do protótipo. Cada item traz o que mudar, o comportamento esperado e um critério de aceite para autoverificação. As seções seguem uma ordem sugerida de execução — a 1 é pré-requisito estrutural das demais.

Protótipo sem back-end, sem banco de dados: toda alteração de modelo é sobre a estrutura dos dados em `localStorage`, não sobre persistência real (D03).

---

## 1. Modelo de dados — ajustes estruturais (pré-requisito)

Antes de mexer em telas, ajustar a estrutura de dados no `localStorage` para suportar os itens abaixo:

- **Turma** passa a referenciar `macroTemaId` e `modalidadeId` (não mais texto livre concatenado no título). `nome` continua sendo campo aberto, sem prefixo automático. *(D23, D24)*
- **Modalidade** deixa de ser limitada a síncrona/assíncrona — vira cadastro livre (`nome`, `ativa`, `presencaAutomatica`), permitindo valores como "mista" ou "presencial". *(D25)*
- **Etapa** ganha dois níveis: `tipoEtapa` (genérico: ex. `avaliacao`, `conteudo`, `entrega`) e `subtipoId` (referência a um formulário/tela previamente cadastrado dentro daquele tipo). A etapa não cria mais o formulário inline — só seleciona um já existente. *(D30)*
- **ItemConteudo** ganha o tipo `questionario` como item distinto de `tarefa` (que já existe). `tarefa` ganha campo opcional `linkExterno`/`materialApoio`. Avaliar se `textoBase` também recebe esse campo opcional de link de apoio. *(D31)*
- **CriterioAvanco** da turma/etapa ganha um sexto critério: `notaCorte` (numérico, opcional). *(D32)*
- **Perfil de usuário** ganha um novo tipo: `moderador` (nome provisório — usar "moderador" no código, mas deixar o rótulo de interface fácil de trocar para "mediador" depois), vinculado a uma lista de `turmaIds`. *(D33)*
- **Inscrição do docente** ganha campo `tipoParticipacao`: `regente` ou `corregente` — hoje um dado avulso, passa a ser parte do cadastro do usuário. **Etapa** ganha campo `perfisParticipantes` (array: quais tipos de participação passam por aquela etapa). *(D34)*
- **Alocação líder-liderado**: nova entidade `Alocacao` (coordenadorId, docenteId), criada pelo próprio coordenador — não mais um campo livre preenchido pela equipe operadora. *(D35)*
- **Base de docentes**: no protótipo, simular como dado "importado" (somente leitura pela equipe operadora — sem tela de cadastro/criação de novo docente). *(D36)*
- **Ciclo**: campo de prazo de cada etapa muda de `diasAposAberturaCiclo` (absoluto) para `prazoDias` (relativo ao término da etapa anterior), mais um campo `dataInicioCiclo` na configuração geral do ciclo. *(D38)*

**Critério de aceite da seção 1:** os dados de exemplo (seed) do protótipo refletem essa estrutura nova; nenhuma tela quebra ao carregar com os dados de exemplo atualizados.

---

## 2. Configuração do ciclo

- **Manter** macrotemas, modalidades e turmas configurados **dentro** do ciclo atual — não criar um cadastro global de macrotemas fora do ciclo nem uma tela de "configurações gerais" para isso. *(D22 — não é uma mudança de código, é uma confirmação: não implementar a ideia alternativa que havia sido cogitada.)*
- **Remover** o campo/seção de "segmentos" da configuração do ciclo. *(D26)*
- Adicionar, antes da lista de macrotemas, uma **tela/seção geral do ciclo** com: nome da jornada (campo aberto, ex. "Jornada 2027 a 2030"), descrição e `dataInicioCiclo`. *(D27, D38)*
- Nos campos de prazo de cada etapa (dentro de "Etapas da trilha"), trocar o rótulo e o cálculo de "dias após a abertura do ciclo" para "prazo da etapa" contado a partir do término da etapa anterior, encadeado sequencialmente a partir de `dataInicioCiclo`. *(D38)*
- **Não implementar nesta rodada:** a hierarquia completa macrociclo/mesociclo (múltiplos anos dentro de um ciclo de 4 anos) — está em aberto, aguardando desenho. Deixar isso fora do escopo desta lapidação.

**Critério de aceite:** ao configurar um ciclo do zero, o usuário vê nome da jornada, descrição e data de início antes de chegar em macrotemas; os prazos das etapas mostram a data calculada em cadeia (etapa 2 começa a contar do fim da etapa 1).

---

## 3. Turmas

- Ao clicar em "adicionar turma", o formulário pede **primeiro** o macrotema, **depois** a modalidade (ambos por lista suspensa, valores já cadastrados), e só então o nome livre da turma e os demais campos (professor responsável, vagas, encontros previstos, link de acesso, horário, dias da semana). *(D23)*
- **Não** adicionar prefixo automático ao nome da turma — o campo continua livre. *(D24)*
- **Remover o agrupamento visual de turmas por macrotema** (blocos separados). A listagem de turmas passa a ser **uma lista única em formato de tabela** (colunas, no padrão PoseGest/PosiMind), com:
  - Filtros por macrotema, modalidade, dia da semana, professor e horário.
  - Botão "Adicionar turma" fixo fora da lista (não dentro de um bloco de macrotema).
  - Criação/edição de turma em **pop-up/modal**, não mais expandindo a página para baixo.
  - Toda turma nova criada aparece **no topo** da lista (ordem decrescente de criação).
  - Menu de três pontos por linha, com opção "Editar".
  *(D24)*

**Critério de aceite:** criar uma turma nova a partir de uma base de ~30 turmas de exemplo é possível sem rolar a página; a turma nova aparece no topo; os filtros reduzem a lista corretamente.

---

## 4. Conteúdo e etapas

- Na configuração de uma etapa, o primeiro campo ("tipo de etapa") mostra só categorias genéricas (ex. "Avaliação", "Área de conteúdo", "Entrega de trabalho"). O segundo campo passa a ser uma lista suspensa **filtrada pelo tipo escolhido**, mostrando apenas formulários/telas já cadastrados daquele tipo (ex.: dentro de "Avaliação" → "Autoavaliação inicial", "Autoavaliação do coordenador"). *(D30)*
  - Se ainda não existir uma tela de "cadastro de formulários/subtipos", criar uma versão mínima só para permitir esse fluxo no protótipo (pode ser simples: nome + tipo genérico associado).
- Na configuração de conteúdo (vinculada a macrotema × modalidade, já existente por D14), separar **tarefa** e **questionário** como dois tipos de item distintos:
  - Tarefa: enunciado + descrição + campo opcional de link externo/material de apoio.
  - Questionário: enunciado + perguntas de múltipla escolha (sem campo de resposta aberta).
  *(D31)*
- Avaliar adicionar o mesmo campo de link de apoio também no item "texto-base" (ainda não confirmado com o cliente — implementar apenas se for simples, marcando como "sujeito a revisão"). *(D31)*
- Na configuração de critérios de avanço de fase da turma, adicionar o sexto critério **nota de corte** (numérico), somado aos cinco já existentes. *(D32)*
- Na visão do docente (dentro da trilha/etapa de conteúdo), mostrar os critérios de avanço como uma **lista de marcações** (feito/não feito) — não apenas um bloqueio silencioso quando a etapa não libera. *(D32)*

**Critério de aceite:** ao configurar uma etapa, a segunda lista suspensa só mostra opções compatíveis com o tipo escolhido; ao criar conteúdo, tarefa e questionário aparecem como opções separadas; a visão do docente mostra os critérios com status individual.

---

## 5. Navegação e nomenclatura

- Nas telas do docente, substituir o termo "ciclo" por "jornada" (ex.: "Ciclos anteriores" → "Jornadas anteriores"). *(D27)*
- Manter "Jornadas anteriores" apenas como tela de apresentação (dado fictício/estático) — não precisa de lógica real de múltiplos ciclos. *(D27, já coerente com D08)*
- **Remover a tela de "Painel"** como conceito compartilhado entre perfis:
  - Para o docente: mover o resumo (percentual concluído, etapa atual) para dentro de "Minha Jornada".
  - Para a equipe operadora: usar "Gestão do ciclo" como tela única de resumo administrativo — não recriar um painel separado.
  *(D28)*
- O seletor "Acesso ao ciclo" (troca de perfil para demonstração) deixa de aparecer para docentes; mantém-se **apenas** para o perfil administrador/equipe operadora, como recurso de suporte. *(D29)*

**Critério de aceite:** um usuário logado como docente não vê mais "Painel" nem "Acesso ao ciclo" no menu; todo o resumo pessoal está em "Minha Jornada"; o termo "ciclo" não aparece mais nas telas do docente.

---

## 6. Perfis e acessos

- Criar o novo perfil **Moderador de turma**: acesso restrito às turmas às quais está vinculado, com permissão apenas para lançar presença e validar entregas/notas. Sem acesso à configuração da turma, do ciclo ou de outras áreas. *(D33)*
- Na configuração de cada etapa, adicionar o campo **perfis participantes** (regente, corregente, estagiário etc.) — controla quem, entre os tipos de inscrição, precisa cumprir aquela etapa. *(D34)*
- No cadastro/inscrição do docente, adicionar o campo **tipo de participação** (regente ou corregente), hoje inexistente como dado estruturado. *(D34)*

**Critério de aceite:** existe um usuário de exemplo com perfil "moderador" vinculado a 1-2 turmas, capaz de lançar presença nelas e nada mais; uma etapa de exemplo configurada para "regente e corregente" e outra só para "regente" mostram comportamento diferente na trilha desses dois tipos de docente.

---

## 7. Atualização de perfil e alocação (processo novo — o item mais estrutural desta rodada)

- Criar uma área **"Perfil"**, acessível a todo usuário (idealmente sinalizada no primeiro acesso).
  - Todo usuário confirma dados fixos (nome, matrícula) — somente leitura, vindos da base.
  - Docente preenche/confirma o campo **regente ou corregente**.
  - Coordenador/líder tem uma aba **"Alocações"**: busca (por nome ou matrícula) na base completa de docentes e marca quem são seus liderados.
  - Docente tem uma aba **"Líder(es)"**, mostrando quem o alocou (pode ter mais de um).
  *(D35)*
- **Não criar** nenhuma tela de cadastro manual de novo docente pela equipe operadora — a base de docentes é somente leitura no protótipo, simulando vir de importação institucional. *(D36)*
- Em "Gestão do ciclo", adicionar dois indicadores:
  - **Pendência de alocação por coordenador** (não por professor): lista coordenadores que ainda não alocaram nenhum liderado.
  - **Alerta de docente não alocado**: docentes da base que não foram marcados como liderados por nenhum coordenador.
  *(D37)*
- **Não implementar** (deixar como ponto em aberto, sem tela): fluxo de "solicitar inclusão de professor não encontrado na base" — ainda não decidido como deve funcionar.

**Critério de aceite:** um usuário de exemplo com perfil coordenador consegue, na área "Perfil → Alocações", buscar e alocar 2-3 docentes da base como liderados; "Gestão do ciclo" reflete corretamente quantos coordenadores ainda não alocaram ninguém e quais docentes estão sem líder.

---

## 8. Explicitamente fora de escopo desta rodada

Não mexer nestes pontos agora — foram adiados ou seguem em aberto:

- Tela de **encerramento** (pesquisa de satisfação) — discussão explicitamente adiada para a próxima reunião de lapidação.
- **Calendário integrado** (visão de encontros/tarefas/prazos) — ideia mencionada, não decidida.
- Fluxo de **solicitação de inclusão de professor** fora da base — em aberto.
- Hierarquia completa de **macrociclo/mesociclo** (múltiplos anos dentro do ciclo de 4 anos) — em aberto, aguardando desenho.
- Qualquer generalização para suportar múltiplas jornadas simultâneas — confirmado fora de escopo (D19/D21/D22).

---

## Checklist rápido para o Claude Code marcar como concluído

- [ ] Seção 1 — modelo de dados ajustado
- [ ] Seção 2 — configuração do ciclo (nome da jornada, descrição, data de início, prazos relativos, sem segmentos)
- [ ] Seção 3 — turmas (vínculo, lista plana com filtros, pop-up, sem prefixo)
- [ ] Seção 4 — etapas (tipo/subtipo) e conteúdo (tarefa vs questionário, nota de corte, visibilidade de critérios)
- [ ] Seção 5 — nomenclatura "jornada", painel removido, acesso ao ciclo restrito ao admin
- [ ] Seção 6 — perfil moderador de turma, perfis participantes por etapa
- [ ] Seção 7 — área de Perfil/Alocações, base somente leitura, indicadores de pendência por coordenador
- [ ] Seção 8 — confirmado que nada fora de escopo foi tocado
