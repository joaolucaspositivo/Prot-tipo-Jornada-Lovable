# CLAUDE.md — Jornada Pedagógica de Desenvolvimento

> Arquivo de contexto para o Claude Code. Leia antes de qualquer alteração.
> Fonte de verdade das decisões: Notion → Tecnologia Educacional → Galeria de Projetos → Jornada → Menu do Projeto → Reuniões, Decisões e Aprovações → **Registro de Decisões — D01 a D62**.
> Onde aparecer `<preencher>`, complete com o dado do repositório. Se você já preencheu numa versão anterior, mantenha o seu valor.

---

## 1. O que é este projeto

Sistema de trilha formativa para ~1.000 docentes do Grupo Positivo, percorrendo uma jornada de quatro anos (2027–2030). Substitui um processo hoje manual, espalhado entre TEIA, Google Sites, planilhas e formulários.

O ativo central do sistema é o **histórico do percurso do docente**. Toda decisão de modelagem que colidir com a preservação desse histórico está errada, por mais conveniente que pareça.

**Estado atual:** protótipo navegável, sem back-end, com persistência em `localStorage` (D03).

**Restrições duras:**
- Um único desenvolvedor, com apoio do Claude Code, sem harness (D06)
- Feature freeze em 1º/12/2026; entrega em 20/12/2026 (D07)
- Ciclo real começa entre fevereiro e março de 2027 (D05)

**Stack:** React 19.2 · TanStack Router 1.170 + TanStack Start 1.168 · Vite 8.1 ·
TypeScript 5.8 · Tailwind · lucide-react 0.575 · npm.
Scripts: `dev`, `build`, `build:dev`, `preview`, `lint`, `format`.
Renderização com SSR. Estado em `store.tsx`, com `VERSAO_ESTADO` — ver §7.

---

## 2. Estado do desenvolvimento

| Pacote | Escopo | Situação |
|---|---|---|
| 0 | Schema de versionamento e correção de acesso | Concluído (D60) |
| 1 | Macrociclo, mesociclo e temas | Concluído (D61, D62) |
| 2 | Menu, trilha e composição | Concluído (D63) |
| 2B | Configuração de ciclos como lista e detalhe | Concluído (D64) |
| 3 | Turmas e encontros | Concluído (D65) |
| 4 | Alocações | Concluído (D66) |
| 5 | Moderador | Concluído (D67) |
| 6 | Painéis agregados | Bloqueado até validação de D59 |
| 7 | Temas descem para o ciclo | Próximo |
| 8 | Trilha por tema, com interface | Pendente |
| 9 | Menu em dois grupos e modalidade na turma | Pendente |
| 10 | Conteúdo com checkpoints e progresso contínuo | Pendente |

Atualize esta tabela ao fechar cada pacote. Ela é a primeira coisa que
você lê para saber o que já existe.

Pacotes 7-10 vêm de R04 (lapidação v4) e **revogam decisões da v3** já
implementadas — D40 (temas no macrociclo), D54/D62 (versionamento de tema
entre macrociclos), D56 (carga por tema × mesociclo), D25 (modalidade como
cadastro próprio) e D46/D63 (menu em seis itens). Isso já está refletido
nas seções 4.2 e 6 abaixo; não é um erro de leitura se algo aqui parecer
contradizer uma nota antiga de rodada anterior — a nota antiga é que ficou
para trás. Ver `ESPECIFICACAO-LAPIDACAO-V4.md` para o detalhe de cada
pacote.

---

## 3. Vocabulário — use exatamente estes termos

| Termo interno | Significado | Aparece na interface? |
|---|---|---|
| **Macrociclo** | A jornada inteira, 2027–2030 | Não |
| **Mesociclo** | Cada ano dentro do macrociclo | Não |
| **Microciclo** | Cada etapa da trilha | Não |
| **Tema** | Antigo "macrotema" | Sim |
| **Jornada** | Como o docente chama o percurso | Sim |

Regras (D39, D40, D27):

- "Macrotema" **não existe mais** — nem no código nem em string visível. O rename foi concluído nos Pacotes 0 e 1.
- "Macrociclo", "mesociclo" e "microciclo" são vocabulário de equipe. **Nunca** vão para a tela. A operadora vê "Ciclo 2027", "Ciclo 2028".
- Na interface do docente, o percurso se chama **jornada**, nunca "ciclo".
- O menu da operadora usa **"Configuração de ciclos"**, no plural.

---

## 4. Regras invioláveis

Estas regras existem para proteger o histórico. Não as contorne por conveniência de implementação; se uma delas parecer impedir algo necessário, pare e pergunte.

### 4.1 Precedência de resolução de configuração (D61)

> **Havendo turma em mãos, a configuração vem sempre do mesociclo da turma — nunca do ciclo vigente.** `cicloConfigAtivo()` só vale onde não existe turma nem inscrição: a escolha inicial, antes de a inscrição existir.

Resolvedores centrais em `lib/ciclo.ts`:
- `cicloDaTurma(estado, turmaId)`
- `cicloDoDocente(estado, pessoaId)` — percorre inscrição → turma → mesociclo, com fallback para o vigente quando não há turma
- `cicloAtivo(estado)` / `cicloConfigAtivo(estado)` — lêem `Macrociclo.mesocicloVigenteId`, sem calcular nada

Funções que atendem vários docentes de uma vez (`entregasRecebidas`, `conferencias`, `compromissosDeObservacao`, `presencasAutomaticas`) resolvem **por item, dentro do laço** — docentes de ciclos distintos podem aparecer na mesma lista.

Fora da regra, deliberadamente: filtros e agregados de página, cabeçalho geral, tela de identificação e `funilDeEtapas` — agregado de vários docentes não tem "uma turma" a seguir.

### 4.2 Versionamento (D53)

**Duas referências que nunca apontam para o objeto vivo, sempre para um retrato congelado:**

1. Resposta de formulário referencia `FormularioVersao` — nunca `Formulario`.
2. A carga horária é **congelada no registro de conclusão**, não lida do tema no momento da emissão.

Editar as perguntas de um formulário entre mesociclos **cria uma versão nova**; não sobrescreve.

**Revogado por R04 (v4):** conclusão e certificado passavam por `TemaVersao`. Isso caiu porque o tema **desceu para o ciclo** (Pacote 7) — ele nasce e morre naquele ano, e a imutabilidade dentro do ciclo (D41) mais a trava após a primeira emissão (D42) já garantem que o certificado reflita o que a pessoa fez, sem precisar de uma cadeia de versões para protegê-lo. Conclusão e certificado passam a referenciar `Tema` **diretamente**. `TemaVersao` foi removido do modelo — ver §6.

A capacidade de saber que um tema de 2029 é a evolução de um de 2027 se preserva, mas não por estrutura obrigatória: é um `linhagemId` opcional em `Tema`, preenchido quando a operadora marca "este é o mesmo tema de X".

### 4.3 Imutabilidade (D41, D42, D43)

- Tema com participante vinculado **não pode ser excluído** — bloqueio de fato, não aviso.
- Dentro do ciclo, o tema é imutável. Edição de nome é permitida apenas por erro de cadastro, **com auditoria**, e fica travada após a primeira emissão de certificado.
- Uma etapa é editável **enquanto nenhum participante a tiver iniciado**. Havendo qualquer dado de execução, trava.
- **Nenhum registro com dado de execução pode ser excluído.** Em nenhuma tela, por nenhum perfil.

### 4.4 Integridade estrutural (D57, nível 3)

Hierarquia macro/meso/micro. Ordem crescente da trilha. Base de docentes só por importação — sem cadastro manual (D36). Alocação líder-liderado feita pelo próprio coordenador (D35). Auditoria de alterações em tudo que afeta histórico.

---

## 5. Fronteira de configurabilidade (D57)

O princípio: **a área compõe livremente, com um vocabulário que ela não inventa.**

O custo não está na quantidade de coisas criadas — está na variedade de tipos que o sistema precisa tratar. A décima turma custa zero. O décimo tipo de etapa custa uma tela, um modelo de progresso, uma regra de conclusão e um tratamento em cada painel.

**Nível 1 — a área configura sozinha:** macrociclo, temas (com carga horária própria), modalidades, turmas e encontros, etapas da trilha (quantas, ordem, tipo, rótulo, prazo), conteúdo, critérios de avanço, formulários, notificações, encerramento.

**Nível 2 — fixo no código, com abertura prevista:** tipos de etapa, tipos de item de conteúdo, perfis de acesso, motor de progresso, modelo do certificado, escala da Enquete 360°, trilha específica por tema (existe no modelo, sem interface no MVP).

**Nível 3 — não abre:** tudo da seção 4.

### Teste de fronteira

Diante de qualquer pedido novo: **é uma combinação nova das peças existentes, ou uma peça nova?**

Combinação → configuração, implementa. Peça nova (tela nova, progresso novo, visibilidade nova) → **pare e sinalize**; entra na fila e disputa prazo com o resto.

Não crie tipos de etapa, tipos de item de conteúdo ou perfis novos por iniciativa própria. Não invente funcionalidade que não foi pedida — na rodada anterior, um botão de cobrança apareceu numa tela sem ter sido solicitado por ninguém.

---

## 6. Modelo de dados

> Reflete o que foi implementado nos Pacotes 0 e 1, já com as revogações de R04/v4 (Pacote 7) incorporadas nas seções de Temas e Trilha — ver §2 e §4.2. Preserve as relações — especialmente as referências a versão que ainda valem.

### Estrutura de ciclos

```
Macrociclo
  id, nome, descricao
  mesocicloVigenteId        // explícito, declarado pela área (D61)

Mesociclo
  id, macrocicloId
  nome, dataInicio          // fonte única da data; base dos prazos relativos
  fasesObrigatorias: FaseCanonica[]   // schema pronto, sem consumidor (D59)

EstadoApp.cicloConfigs: CicloConfig[]   // uma por mesociclo
CicloConfig
  id, mesocicloId, nome, descricao, periodo
  modalidades, etapas, subtipos, conquistas
  reflexoesPortfolio, dimensoesAutoavaliacao, enquete
  // NÃO tem temas: array próprio em EstadoApp.temas, não aninhado aqui
  // (Pacote 7 — desceram do macrociclo para o ciclo, mas continuam fora
  // de CicloConfig). Também não tem dataInicioCiclo.
```

### Temas

```
EstadoApp.temas: Tema[]     // array único, pertence ao CICLO (Pacote 7, revoga D40)
Tema
  id, mesocicloId, nome, descricao, ativo, ordem
  cargaHoraria              // atributo próprio do tema (revoga D56/TemaNoMesociclo)
  linhagemId?               // opcional — preenchido ao marcar "mesmo tema de X"
```

`TemaVersao` e `TemaNoMesociclo` foram **removidos do modelo** (Pacote 7) — ver §4.2. `versionarTema()` passa a ser acionada na criação de um tema dentro de um ciclo, com a opção "é o mesmo tema de X" — deixou de ser função sem acionador.

### Trilha

```
Etapa   (nome mantido; "EtapaTrilha" era descritivo, não prescritivo)
  id, mesocicloId, temaId  // pertence ao PAR ciclo + tema (Pacote 8) — não mais opcional
  ordem                   // crescente; nova etapa entra ao final (D45)
  rotulo                  // legível na trilha do docente (D52 + D45)
  tipo: TipoEtapa
  faseCanonica            // eixo do acompanhamento agregado (D59)
  subtipoId?
  prazoDias               // relativo, contado da dataInicio do MESOCICLO
  perfisParticipantes[]
  cargaHoraria?           // carga por etapa, anterior a esta rodada.
                          // NÃO confundir com Tema.cargaHoraria
```

Sem limite de ocorrências por tipo dentro de um mesociclo (D52). Duas autoavaliações, três blocos de conteúdo, duas entregas — tudo válido. O que as distingue é o `rotulo` e a `ordem`.

**`TipoEtapa`** (fechado): `escolha` · `autoavaliacao` · `conteudo` · `encontro` · `entrega` · `enquete` · `portfolio` · `encerramento`

O antigo `"avaliacao"` foi removido — estava sobrecarregado, servindo à escolha de tema e à Enquete 360° sob o mesmo valor.

**`FaseCanonica`** (fechado, **provisório** até validação de D59): `inscricao` · `autoavaliacao` · `formacao` · `entrega` · `encerramento`

São dois enums separados de propósito. `TipoEtapa` governa tela e motor de progresso (código); `FaseCanonica` governa o eixo do funil (relatório). Colapsá-los faria uma categoria nova de relatório exigir uma tela nova.

### Conteúdo e critérios

```
ItemConteudo
  id, etapaId, temaId, modalidadeId          // vínculo tema × modalidade (D14)
  tipo: video | textoBase | linkWebconferencia | tarefa | questionario
  midiaId?, linkApoio?

Midia
  id, driveFileId, metadados                 // biblioteca reutilizável (D11)

CriterioAvanco
  id, etapaId, modalidadeId                  // padrão (D55)
  turmaId?                                   // override da exceção (D55)
  regras: { videosAssistidos, leituraConcluida,
            presencaMinima, tarefaEntregue,
            tarefaValidada, notaDeCorte }
```

### Turmas e encontros

```
Turma
  id, mesocicloId, temaId, modalidadeId
  nome                    // livre, sem prefixo automático (D24)
  professorResponsavelId  // vem da base, nunca digitado (D44)
  vagas
  encontros: Encontro[]   // Pacote 3

Modalidade
  id, mesocicloId, nome, ativa
  preveEncontroAoVivo     // governa a presença (D51)
  presencaAutomatica

Inscricao
  pessoaId, turmaId, temaId, tipoParticipacao
  // sem mesocicloId: deriva pela turma, não duplica (D61)
```

### Formulários, execução e certificação

```
FormularioVersao          // snapshot por origem, não unificação (D60)
  id, origem: "enquete" | "portfolio" | "autoavaliacao"
  perguntas               // cópia congelada
  criadaEmISO
  // TODO: mesocicloId — o Mesociclo já existe desde o Pacote 1, avaliar

RespostaEnquete / Portfolio / Autoavaliacao
  → formularioVersaoId

ProgressoEtapa
  docenteId, etapaId, itensConcluidos[], iniciadoEm

Conclusao
  id, docenteId, temaVersaoId, cargaHorariaCongelada, concluidoEmISO

Certificado
  id, conclusaoId, emitidoEmISO, emitidoPorId

HistoricoTema            // entidade SEPARADA de Conclusao:
                         // dado importado de ciclos anteriores (D27)

Alocacao                 lider, liderado, mesocicloId       (D35)
Auditoria                entidade, campo, valorAnterior, autor, data
```

---

## 7. Convenções

- Commits pequenos e frequentes, **por camada** (núcleo → bibliotecas → rotas → componentes).
- Persistência em `localStorage`, via `store.tsx`. `VERSAO_ESTADO` governa
  a compatibilidade — ver a nota de migração abaixo.
- **Não há suíte de testes automatizados.** A verificação é manual no
  navegador, ao vivo, a cada pacote — e foi assim que apareceram a
  impossibilidade circular do Pacote 2 e o progresso duplicado na emissão.
  Antes de fechar qualquer pacote, rode `lint` e `build` e percorra as
  telas tocadas. Não presuma que ler o código substitui isso.
- Nada de dado mockado apresentado como real numa tela de demonstração.

**Migração de estado.** Hoje o carregamento **descarta o estado salvo por inteiro** quando `VERSAO_ESTADO` não bate, recriando tudo a partir do seed. Correto no protótipo, onde o estado é descartável. **Deixa de valer no MVP** — dado de docente não pode ser jogado fora, e a partir daí toda mudança de schema exige migração real, com preenchimento retroativo das referências de versão.

---

## 8. Pontos em aberto — pergunte antes de decidir sozinho

1. `FaseCanonica` ainda não validada pelo cliente (D59). Os painéis agregados dependem disso — Pacote 6 bloqueado.
2. Texto-base: tempo de permanência na tela vira informação para o moderador ou nada (D58).
3. Refinamento de D43: separar campo cosmético (editável com auditoria) de campo que altera significado ou pontuação (trava). Hoje é bloqueio duro.
4. Enquete 360° em stand-by até as perguntas chegarem (D47).
5. Unificação das três fontes de pergunta (enquete, portfólio, autoavaliação) num modelo único — pacote futuro, peça nova pelo teste de fronteira.

---

## 9. Notas de implementação que já custaram discussão

**`usoDoTema` protege a exclusão, e a premissa dela já mudou uma vez (D62, revisto no Pacote 7).** Ela varre turmas e inscrições globalmente por `temaId`, sem filtrar ciclo. Isso foi correto por dois motivos diferentes em dois modelos diferentes: antes, porque o id era único no macrociclo; agora, porque o id já nasce escopado ao ciclo — um tema de 2027 e um de 2029 são registros distintos.

O que a função protege é a regra de D41: tema com participante vinculado não se exclui. Ao mexer nela, confira contra a regra, não contra a implementação anterior.

**Ponto ainda não decidido:** se a exclusão deve considerar a LINHAGEM — bloquear "Bilinguismo 2029" porque "Bilinguismo 2027" tem participantes. Hoje não considera, e provavelmente está certo: são temas de anos distintos, com cargas e trilhas próprias. Mas é decisão, não conclusão óbvia. Não implemente linhagem aqui sem perguntar.

**Ciclo vigente é declarado, não calculado (D61).** `mesocicloVigenteId` é campo explícito. Derivar da menor data de início devolveria 2027 para sempre: em 2028 todo docente continuaria vendo a configuração do ano anterior, sem erro e sem aviso.

**Trilha vazia não é trilha concluída (D61).** `proximaEtapa()` devolvia `undefined` por duas razões diferentes. Com dois ciclos coexistindo, trilha vazia é o estado normal de todo ciclo antes de ser configurado.

**Vídeo (D58).** Considerado assistido **no clique**. Como o iframe do Drive é de outra origem, a página não enxerga o clique dentro dele: renderize um **botão de play próprio sobre o vídeo**, registre a marcação nesse clique e só então carregue o iframe. Não existe rastreamento de tempo assistido, e isso não é lacuna a preencher — é decisão (D10, D58).

**Acompanhamento (D59).** O painel agregado indexa por **fase canônica**, nunca por etapa nomeada. O painel individual usa **percentual de trilha concluída**.

**Portfólio.** Tem `TipoEtapa` próprio desde o Pacote 0 — estava mistipado como `"entrega"`. O seletor de parecer que ele herdava por acidente foi **mantido deliberadamente**, com `case "portfolio"` explícito: a função está em uso pelo coordenador.

**Duas cargas horárias com o mesmo nome.** `Etapa.cargaHoraria` (por etapa, anterior a esta rodada) e `TemaNoMesociclo.cargaHoraria` (D56, por tema × mesociclo) são coisas diferentes. Não unifique.

**Documentos históricos em `docs/historico/` — não são instruções vigentes.**
Quatro arquivos descrevem rodadas anteriores e estão superados:
`instrucoes-lapidacao-prototipo-D22-D38.md`, `especificacao-lapidacao-p1-p2.md`,
`especificacao-p3-acompanhamento.md` e `correcoes-validacao-D22-D38.md`.
Um deles instrui explicitamente a lê-los antes de começar — ignore.
Valem apenas `CLAUDE.md` e `ESPECIFICACAO-LAPIDACAO-V3.md`, na raiz.