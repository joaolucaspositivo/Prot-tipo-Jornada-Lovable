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

**Stack:** `<preencher: framework, build, roteamento, gerenciador de pacotes, comando de testes>`
Renderização com SSR. Estado em `store.tsx`, com `VERSAO_ESTADO` — ver §7.

---

## 2. Estado do desenvolvimento

| Pacote | Escopo | Situação |
|---|---|---|
| 0 | Schema de versionamento e correção de acesso | Concluído (D60) |
| 1 | Macrociclo, mesociclo e temas | Concluído (D61, D62) |
| 2 | Menu, trilha e composição | Próximo |
| 3 | Turmas e encontros | Pendente |
| 4 | Alocações | Pendente |
| 5 | Moderador | Pendente |
| 6 | Painéis agregados | Bloqueado até validação de D59 |

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

### 4.2 Versionamento (D53, D54, D56, D62)

**Três referências que nunca apontam para o objeto, sempre para a versão:**

1. Conclusão e certificado referenciam `TemaVersao` — nunca `Tema`.
2. Resposta de formulário referencia `FormularioVersao` — nunca `Formulario`.
3. A carga horária é **congelada no registro de conclusão**, não lida do tema no momento da emissão.

Editar um tema entre macrociclos **cria uma versão nova**; não sobrescreve. Editar as perguntas de um formulário entre mesociclos **cria uma versão nova**; não sobrescreve.

Consequência prática: um docente que concluiu em 2027 e reemite o certificado em 2031 recebe o nome, a carga e o conteúdo **de 2027**. É a lógica de universidade — o certificado é do curso daquele ano.

**Exceção que não é exceção:** a **carga horária de configuração** é chaveada por `temaId`, não por `temaVersaoId` (D62). Ela muda de ano para ano sem que o tema mude; chavear por versão obrigaria a criar versão só para alterar carga, poluindo a linhagem. A carga do certificado continua sendo a congelada na conclusão.

### 4.3 Imutabilidade (D41, D42, D43)

- Tema com participante vinculado **não pode ser excluído** — bloqueio de fato, não aviso.
- Dentro do macrociclo, o tema é imutável. Edição de nome é permitida apenas por erro de cadastro, **com auditoria**, e fica travada após a primeira emissão de certificado.
- Uma etapa é editável **enquanto nenhum participante a tiver iniciado**. Havendo qualquer dado de execução, trava.
- **Nenhum registro com dado de execução pode ser excluído.** Em nenhuma tela, por nenhum perfil.

### 4.4 Integridade estrutural (D57, nível 3)

Hierarquia macro/meso/micro. Ordem crescente da trilha. Base de docentes só por importação — sem cadastro manual (D36). Alocação líder-liderado feita pelo próprio coordenador (D35). Auditoria de alterações em tudo que afeta histórico.

---

## 5. Fronteira de configurabilidade (D57)

O princípio: **a área compõe livremente, com um vocabulário que ela não inventa.**

O custo não está na quantidade de coisas criadas — está na variedade de tipos que o sistema precisa tratar. A décima turma custa zero. O décimo tipo de etapa custa uma tela, um modelo de progresso, uma regra de conclusão e um tratamento em cada painel.

**Nível 1 — a área configura sozinha:** macrociclo, temas, carga horária por tema × mesociclo, modalidades, turmas e encontros, etapas da trilha (quantas, ordem, tipo, rótulo, prazo), conteúdo, critérios de avanço, formulários, notificações, encerramento.

**Nível 2 — fixo no código, com abertura prevista:** tipos de etapa, tipos de item de conteúdo, perfis de acesso, motor de progresso, modelo do certificado, escala da Enquete 360°, trilha específica por tema (existe no modelo, sem interface no MVP).

**Nível 3 — não abre:** tudo da seção 4.

### Teste de fronteira

Diante de qualquer pedido novo: **é uma combinação nova das peças existentes, ou uma peça nova?**

Combinação → configuração, implementa. Peça nova (tela nova, progresso novo, visibilidade nova) → **pare e sinalize**; entra na fila e disputa prazo com o resto.

Não crie tipos de etapa, tipos de item de conteúdo ou perfis novos por iniciativa própria. Não invente funcionalidade que não foi pedida — na rodada anterior, um botão de cobrança apareceu numa tela sem ter sido solicitado por ninguém.

---

## 6. Modelo de dados

> Reflete o que foi implementado nos Pacotes 0 e 1. Preserve as relações — especialmente as referências a versão.

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
  // NÃO tem mais: temas (subiram para o macrociclo), dataInicioCiclo
```

### Temas

```
EstadoApp.temas: Tema[]     // array único, no macrociclo
Tema
  id, macrocicloId, linhagemId, nome, descricao, ativo, ordem

TemaVersao
  id, temaId, linhagemId, numeroVersao
  nome, descricao, criadaEmISO, criadaPorId

TemaNoMesociclo
  id, mesocicloId, temaId, cargaHoraria    // chave é temaId, não a versão
```

`versionarTema()` existe e está correta, mas **não tem acionador** — não há tela de criar macrociclo. Não é código morto.

### Trilha

```
Etapa   (nome mantido; "EtapaTrilha" era descritivo, não prescritivo)
  id, mesocicloId
  temaId?                 // null = trilha padrão; preenchido = específica (D59)
  ordem                   // crescente; nova etapa entra ao final (D45)
  rotulo                  // legível na trilha do docente (D52 + D45)
  tipo: TipoEtapa
  faseCanonica            // eixo do acompanhamento agregado (D59)
  subtipoId?
  prazoDias               // relativo, contado da dataInicio do MESOCICLO
  perfisParticipantes[]
  cargaHoraria?           // carga por etapa, anterior a esta rodada.
                          // NÃO confundir com TemaNoMesociclo.cargaHoraria
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
- Persistência em `localStorage`. Esquema: `<preencher>`
- Comando de testes: `<preencher>`
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

**`usoDoTema` está correta porque o modelo mudou, não porque a função mudou (D62).** Ela varre turmas e inscrições **globalmente por `temaId`**, sem filtrar mesociclo. Antes da migração isso funcionava por acidente — os ids colidiam entre as cópias. Com array único no macrociclo, passou a ser correto por desenho: o id de um tema é único no macrociclo, logo qualquer uso em qualquer mesociclo impede a exclusão. **Não "corrija" acrescentando filtro por mesociclo** — seria regressão de D41.

**Ciclo vigente é declarado, não calculado (D61).** `mesocicloVigenteId` é campo explícito. Derivar da menor data de início devolveria 2027 para sempre: em 2028 todo docente continuaria vendo a configuração do ano anterior, sem erro e sem aviso.

**Trilha vazia não é trilha concluída (D61).** `proximaEtapa()` devolvia `undefined` por duas razões diferentes. Com dois ciclos coexistindo, trilha vazia é o estado normal de todo ciclo antes de ser configurado.

**Vídeo (D58).** Considerado assistido **no clique**. Como o iframe do Drive é de outra origem, a página não enxerga o clique dentro dele: renderize um **botão de play próprio sobre o vídeo**, registre a marcação nesse clique e só então carregue o iframe. Não existe rastreamento de tempo assistido, e isso não é lacuna a preencher — é decisão (D10, D58).

**Acompanhamento (D59).** O painel agregado indexa por **fase canônica**, nunca por etapa nomeada. O painel individual usa **percentual de trilha concluída**.

**Portfólio.** Tem `TipoEtapa` próprio desde o Pacote 0 — estava mistipado como `"entrega"`. O seletor de parecer que ele herdava por acidente foi **mantido deliberadamente**, com `case "portfolio"` explícito: a função está em uso pelo coordenador.

**Duas cargas horárias com o mesmo nome.** `Etapa.cargaHoraria` (por etapa, anterior a esta rodada) e `TemaNoMesociclo.cargaHoraria` (D56, por tema × mesociclo) são coisas diferentes. Não unifique.