# Especificação da lapidação v3

Decorrente de D39 a D59. Ordem de execução pensada para que cada pacote se apoie no anterior e para que nenhuma decisão de schema seja tomada depois de haver tela escrita em cima dela.

**Antes de qualquer pacote:** `CLAUDE.md` no repositório e a lista final de `TipoEtapa` / `FaseCanonica` fechada.

---

## Pacote 0 — Schema e correção de acesso

Nada de interface. Só os campos que precisam nascer antes das telas, porque adicioná-los depois obriga a reescrever o que já estiver pronto.

**Entregas:**
1. `TemaVersao` e `linhagemId`; conclusão, progresso e certificado apontando para a versão
2. `FormularioVersao`; respostas apontando para a versão
3. `cargaHorariaCongelada` no registro de conclusão
4. `temaId` opcional em `EtapaTrilha` (escopo de trilha por tema — D59)
5. `faseCanonica` em `EtapaTrilha`
6. `preveEncontroAoVivo` em `Modalidade`
7. Entidade `Auditoria`
8. **Gap D33c:** acrescentar `"moderador"` ao array `PERFIS` em `src/components/layout/AppShell.tsx`

**Fechado.** Todos os 8 itens implementados (commits `692aa04`, `b265bb5`..`9853c1f`). Notas:

- O rename `Macrotema`→`Tema` nos dados (não previsto originalmente como item deste pacote) subiu para cá como commit isolado, por decisão do cliente: adiar deixaria o Pacote 1 misturando rename de dado com feature nova de macrociclo/mesociclo. Só dado — nenhum rótulo de interface mudou.
- `FormularioVersao` é snapshot por origem (`enquete`/`portfolio`/`autoavaliacao`), não unificação num `Formulario` genérico — as três telas de configuração continuam como estão.
- `DIMENSOES_AUTOAVALIACAO` saiu do hardcode em `src/data/autoavaliacao.ts` e virou `CicloConfig.dimensoesAutoavaliacao`, pela mesma regra de ouro que já regia o resto da config.
- `TipoEtapa` e `FaseCanonica` fechados como dois enums separados, não um só — ver CLAUDE.md §5.
- Efeito colateral avaliado e aprovado pelo cliente: o Portfólio de Inovação Docente usava `tipo: "entrega"` por mistipagem; corrigido para `tipo: "portfolio"`. Isso faz o seletor de etapas em `/entrega` deixar de aparecer (só sobra uma etapa do tipo `entrega`) — comportamento novo aceito, não revertido. O parecer do coordenador (`pareceresDaEtapa`) foi mantido para `portfolio`, porque a função já estava em uso.

**Critério de aceite:** nenhuma referência direta a `Tema` ou `Formulario` em código de conclusão, certificado ou resposta. O perfil moderador abre pelo seletor de demonstração.

---

## Pacote 1 — Macrociclo, mesociclo e temas

O maior da rodada. Não é ajuste de tela: insere um nível inteiro acima da configuração existente.

**Decisões:** D39, D40, D41, D54, D56

**Entregas:**
- Tela nova de **macrociclo**: nome, descrição, quantos mesociclos
- **Temas** migram para o macrociclo; cada mesociclo os herda
- Painel próprio por mesociclo, com configuração isolada — data de início, modalidades, turmas, etapas
- Renomear "macrotema" → "tema" na interface (rótulos, toasts, aria-labels — o rename de dados já saiu no Pacote 0)
- Renomear "Configuração do ciclo" → "Configuração de ciclos"
- Exclusão de tema bloqueada com participante vinculado; edição de nome com auditoria
- Carga horária como campo aberto, por tema dentro do mesociclo
- Versionamento de tema entre macrociclos: duplicar ou atualizar preservando a linhagem

**Critério de aceite:** criar dois mesociclos no mesmo macrociclo, com datas de início distintas, sem que um sobrescreva o outro. Atualizar um tema no macrociclo seguinte sem perder a versão anterior.

---

## Pacote 2 — Menu, trilha e composição

**Decisões:** D45, D46, D52, D43

**Entregas:**
- Menu em afunilamento: **Geral → Temas → Modalidades → Turmas → Etapas da trilha → Conteúdo**
- Agrupador **"Configurações"** para o que está fora dessa sequência
- "Alertas de pendência" → **"Notificações do ciclo"**, agrupado com o Geral
- **Encerramento** vira etapa da trilha (tipicamente a última), com bloco de configuração de certificado e botão manual de emissão com confirmação (D42)
- Trilha vertical em ordem crescente; etapa nova entra **ao final**
- Sem limite de ocorrências por tipo; rótulo de cada etapa visível na trilha do docente
- Trava de edição de etapa iniciada

**Critério de aceite:** montar uma trilha com duas autoavaliações e dois blocos de conteúdo, distinguíveis pelo rótulo. Tentar editar uma etapa já iniciada e receber o bloqueio.

---

## Pacote 3 — Turmas e encontros

**Decisões:** D44, D51

**Entregas:**
- Remover da criação de turma: **período**, **horário** e **link único**
- **Lista de encontros**: cada linha com data, horário e link próprios
- Dois caminhos de criação aceitos: informar a quantidade e o sistema abrir N linhas, ou adicionar um a um
- Professor responsável vindo da base, nunca digitado
- Turma assíncrona sem data, horário ou encontros
- Tema e modalidade bloqueados quando a turma já tem participantes
- Atributo "prevê encontro ao vivo" no cadastro de modalidade

**Critério de aceite:** turma com quatro encontros, cada um em horário e link diferentes. Turma assíncrona sem nenhum campo de agenda.

**Fora desta rodada:** recorrência por frequência fixa (D44).

---

## Pacote 4 — Alocações

**Decisões:** D48, que fecha o desenho de D35 e D37

**Entregas:**
- **Botão visível** na linha, no lugar do duplo clique
- Barra de busca por nome ou matrícula
- Filtros de unidade e segmento, no padrão do PoseGest
- Filtro **"liderado: sim/não"**, para ver e remover na mesma tela
- Botão de editar/remover ao final da linha
- Na Gestão do ciclo, filtro **"com líder / sem líder"**

**Critério de aceite:** o coordenador aloca, revisa e remove liderados sem sair da tela. A operadora isola em um clique quem não foi reivindicado por ninguém.

**Avaliar antes de manter:** o botão de cobrança em "Minha equipe" não foi pedido por ninguém — veio da geração por IA.

---

## Pacote 5 — Moderador

**Decisões:** D49, D50, D58

**Entregas:**
- **Tabela central** abaixo do resumo, no lugar do drawer lateral
- Detalhe (entrega longa, lista de presenças) abre **centralizado e maior**
- "Lançar presença" e "Validar entregas" como botões de **mesmo nível**, trocando o conteúdo da tabela
- **Colunas dinâmicas** conforme o conteúdo cadastrado: vídeo → visto; texto-base → lido; encontro → presença como progresso; tarefa → status e nota. Item não cadastrado, coluna inexistente
- Coluna de presença **só** quando a modalidade prevê encontro ao vivo
- **Dois status na entrega**: do docente e do moderador
- Remover "etapa atual" e progresso da trilha completa
- Renomear e redesenhar "liberação manual" como **justificativa de ausência**
- Filtro por turma em "Minhas turmas"
- Vídeo: botão de play próprio sobre o iframe, registrando a marcação no clique

**Critério de aceite:** duas turmas com conteúdos diferentes exibem conjuntos de colunas diferentes, sem ajuste manual. Turma assíncrona não mostra coluna de presença.

---

## Pacote 6 — Painéis agregados

**Bloqueado** até o cliente validar as fases canônicas de D59.

**Decisões:** D18, D59, RF32

**Entregas:**
- Painel agregado indexado por **fase canônica**, nunca por etapa nomeada
- Painel individual por **percentual de trilha concluída**
- Fases obrigatórias declaradas no mesociclo; trilha específica de tema precisa contê-las

**Por que está por último:** implementar o funil por etapa nomeada e migrar depois custa mais do que esperar a validação.

---

## Fora desta rodada

Enquete 360° (stand-by, D47) · recorrência de encontros (D44) · interface de trilha específica por tema — só o modelo entra (D59) · tempo de permanência no texto-base (sem decisão) · calendário integrado (ideia futura) · emissão real de certificado (fora do MVP de dezembro, D05/D17)

---

## Ponto de controle

Os pacotes 1 e 2 mexem em código já entregue nas rodadas P1 e P2. Se o pacote 1 consumir mais tempo do que o previsto, é sinal de alerta para o cronograma, não ruído — o plano de degradê de D07 existe para essa situação e é melhor acioná-lo em outubro, com dado na mão, do que em novembro sob pressão.
