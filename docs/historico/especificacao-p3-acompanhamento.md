# Especificação — Rodada P3: Acompanhamento (painéis pendentes)

Complementa `CLAUDE.md` e a especificação P1+P2. Leia os dois antes deste documento — as convenções, a regra de ouro e o mapa do código não se repetem aqui.

## 1. Por que esta rodada existe

A reunião de lapidação com o Lucas tinha uma terceira prioridade que ainda não foi endereçada: **acompanhamento**. Não foi esquecimento — foi adiada de propósito para não arriscar a rodada anterior num prazo apertado. Com a reunião remarcada para segunda-feira, dá para fazer com o mesmo cuidado da rodada de conteúdo/configuração.

Base documental, para não inventar nada aqui:

- **D18** (Registro de Decisões): *"O diretor de unidade permanece como perfil do sistema, com acesso de acompanhamento aos docentes da sua unidade. [...] O coordenador segue como líder principal do acompanhamento [...]; o diretor acompanha os coordenadores e pode cobrá-los a partir do que vê. Escopo do perfil: visão dos docentes da unidade por etapa — quantos avançaram, quantos pararam e em qual ponto. [...] a tela mínima do protótipo precisa virar um painel real."*
- **RF32** (originado nesta mesma reunião): *"Apresentar acompanhamento por etapa, com detalhamento e ação de cobrança, em todo perfil de acompanhamento"* — ou seja, diretor, coordenador **e** operadora.
- Ata da reunião, seção 4.3 (Prioridade 3 — acompanhamento), lista literalmente:
  1. Visão por etapa em todo perfil de acompanhamento (diretor, coordenador, operadora): quantos avançaram, quantos pararam, com detalhamento clicável e a ação "avisar todos".
  2. Conferências por etapa, sem duplicar o que o funil já mostra. Validar se a lista cobre as etapas e se é configurável ou fixa.
  3. Exibir macrotema e turma na listagem da equipe e na Minha Jornada.
  4. Painel do diretor: sai de espaço reservado para acompanhamento real da unidade por etapa.
  5. Painel inicial ("/"): ainda é espaço reservado para todos os perfis.

Esta especificação cobre exatamente esses cinco pontos. Nada além disso.

## 2. O que já existe — não recriar

Antes de escrever qualquer linha, confirme que já leu isto, porque a maior parte da fundação já está pronta:

- `src/lib/gestao.ts` já tem `funilDeEtapas()`, `porUnidade()`, `porSegmento()`, `porMacrotema()` e `aplicarFiltro()` — todos genéricos, sem nome ou contagem de etapa hardcoded. É reaproveitável tal como está.
- `src/lib/equipe.ts` já calcula, em `LinhaEquipe`, os campos `macrotemaNome` e `turmaNome` — eles só não são renderizados em lugar nenhum ainda. Não precisa de nova leitura de dado, só de UI.
- `src/components/operadora/PainelGestaoCiclo.tsx` (aba "Visão do ciclo" de `/gestao`) já tem o funil das etapas, agregados por segmento/macrotema/unidade e exportação — é o componente mais completo hoje, e a referência de qualidade para os outros dois perfis.
- `src/components/operadora/PainelConferencias.tsx` já é dirigido por `etapa.tipo`, não por nome ou contagem fixa de etapa (`l.trilha.find(i => i.etapa.tipo === "entrega")`, por exemplo) — a dúvida do Lucas sobre "a lista cobre as 8 etapas e é configurável ou fixa" já está resolvida arquiteturalmente. **Não precisa mudar nada aqui.** É só um ponto para explicar na reunião de segunda: conferência não é "uma por etapa", é um conjunto fixo de verificações (inscrição, tarefa, presença, devolutiva, ciência) que consultam etapas pelo tipo funcional, então continuam corretas não importa quantas etapas o ciclo tenha.
- `src/components/coordenador/PainelEquipe.tsx` já existe e é usado tanto por `/equipe` (coordenador) quanto pela aba "Docentes" de `/gestao` (operadora), com a prop `escopo`.

O que falta, então, é mais estreito do que parece: nenhuma mudança no modelo de dados, `VERSAO_ESTADO` continua igual. É praticamente tudo composição de UI sobre dados que já existem.

## 3. O que esta rodada entrega

### 3.1 Componente compartilhado: funil com detalhamento e ação

Hoje o funil de `PainelGestaoCiclo.tsx` é só uma barra de progresso por etapa — não tem "detalhamento clicável" nem "avisar todos" (RF32 pede os dois, para os três perfis).

Extraia o funil para `src/components/acompanhamento/FunilEtapas.tsx` (pasta nova — é o primeiro componente que os três perfis de acompanhamento compartilham igualmente; não force isso dentro de `operadora/` nem `coordenador/`).

```ts
interface FunilEtapasProps {
  estado: EstadoApp;
  linhas: LinhaEquipe[];
}
```

Comportamento:
- Mesma barra por etapa que já existe hoje (nome, tipo, concluídas/em andamento/não começaram, barra de progresso).
- Clicar numa etapa expande, abaixo dela, a lista dos docentes que estão hoje **nessa** etapa (nome + `EstadoBadge` de status) — reaproveite o mesmo estilo de lista que `PainelConferencias` já usa para seus itens, não invente um terceiro padrão visual.
- Um botão "Avisar todos" na etapa expandida, visível só quando há alguém para avisar. Alvo do aviso: docentes daquela etapa cujo status não é `concluida` (ou seja, pendente, em andamento ou atrasado — não só atrasado). Reaproveite o texto e o padrão de notificação que `cobrar()` já usa em `PainelEquipe.tsx`, adaptando a mensagem para "está na etapa X" em vez de "está atrasado".

Depois de criar o componente, troque o bloco de funil hoje inline em `PainelGestaoCiclo.tsx` por `<FunilEtapas estado={estado} linhas={filtradas} />`. Resultado esperado: a operadora ganha "detalhamento clicável" e "avisar todos" que hoje não tem, sem perder nada do que já existe (filtros, agregados por segmento/macrotema/unidade, exportação continuam exatamente como estão).

### 3.2 Minha equipe (coordenador) ganha o funil

Em `src/routes/equipe.tsx`, calcule `linhasDaEquipe(estado, { coordenadorId: pessoaAtiva.id })` no próprio componente da rota e renderize `<FunilEtapas estado={estado} linhas={linhas} />` acima de `<PainelEquipe escopo="coordenador" />`. Não precisa (nem deve) unificar esse cálculo com o que `PainelEquipe` já faz internamente — duplicar uma leitura derivada é aceitável aqui; não vale o risco de mexer no componente que já funciona.

### 3.3 Exibir macrotema e turma

- `PainelEquipe.tsx`: na célula do docente (hoje mostra nome + "unidade · cargo" como subtítulo), acrescente uma segunda linha de subtítulo com `${l.macrotemaNome ?? "Sem escolha"} · ${l.turmaNome ?? "—"}`. Não abra coluna nova — a tabela já é apertada em 375px.
- `src/routes/jornada.tsx` (Minha Jornada, docente): resolva a inscrição do próprio docente (`estado.inscricoes.find(i => i.pessoaId === pessoaAtiva.id)`) e, se existir, mostre "Turma · Macrotema" como uma linha extra logo abaixo do cabeçalho (`{estado.cicloConfig.nome} · {estado.cicloConfig.periodo}`). Quando não há inscrição ainda (docente não passou pela etapa de escolha), não mostre nada — sem texto tipo "—" nem erro.

### 3.4 Painel do diretor — real, por D18

Novo componente `src/components/diretor/PainelUnidade.tsx`, usado por `src/routes/unidade.tsx` no lugar do `Placeholder` atual.

D18 é explícito: o diretor acompanha **coordenadores**, o coordenador continua líder principal do docente. Isso muda a estrutura da tela em relação ao painel do coordenador — não é só "a mesma tabela filtrada por unidade", é organizada por coordenador:

1. Cabeçalho com o nome da unidade do diretor (`pessoaAtiva.unidade`).
2. `<FunilEtapas estado={estado} linhas={linhas} />`, com `linhas = linhasDaEquipe(estado, { unidade: pessoaAtiva.unidade })` (ver 3.6 para o que muda em `linhasDaEquipe`).
3. Um cartão por coordenador que tem pelo menos um docente na unidade — agrupe `linhas` pelo `coordenadorId` de cada docente (**não** pela `unidade` do próprio coordenador: no seed atual, e por desenho, um coordenador pode liderar docentes de mais de uma unidade — o que importa para o diretor é "quem coordena os docentes que estão sob o meu teto", não onde o coordenador está fisicamente lotado). Cada cartão mostra o nome do coordenador, os contadores (`contadores()`) do grupo, e um botão "Cobrar coordenador" que manda uma notificação para aquele `Pessoa` (perfil coordenador), no mesmo padrão de `notificacoes` que os outros `cobrar()` já usam — mensagem citando quantos docentes da unidade estão pendentes/atrasados.
4. Abaixo, a tabela completa de docentes da unidade, reaproveitando `<PainelEquipe escopo="diretor" />` (ver 3.6) — é o mesmo componente que já serve coordenador e operadora, só filtrando diferente.

Atualize `src/routes/unidade.tsx`: mantenha a `head()` só ajustando a descrição, troque o `component` para `PainelUnidade`.

### 3.5 Painel inicial ("/") deixa de ser genérico

Hoje `index.tsx` sempre termina com um `<Placeholder titulo="Painel do perfil" .../>`, para todos os perfis, dizendo "isso vem numa próxima etapa" — o que deixou de ser verdade para coordenador e operadora desde que `/equipe` e `/gestao` foram construídos, e agora fica mais estranho ainda com `/unidade` virando real.

Troque esse `Placeholder` por um resumo compacto e um atalho, específico por perfil — não duplique o painel completo aqui, é só a porta de entrada:

- `coordenador`: contadores de `linhasDaEquipe(estado, { coordenadorId: pessoaAtiva.id })` + botão "Ver minha equipe" → `/equipe`.
- `operadora`: contadores de `linhasDaEquipe(estado)` (todos) + botão "Ver gestão do ciclo" → `/gestao`.
- `diretor`: contadores de `linhasDaEquipe(estado, { unidade: pessoaAtiva.unidade })` + botão "Ver minha unidade" → `/unidade`.
- `docente`/`docente-corregente`: remova o `Placeholder` também — "Minha Jornada" já cobre isso. Por consistência com os outros perfis, troque por um botão simples "Ver Minha Jornada" → `/jornada` (o card "Sua situação no ciclo", que já existe acima, continua como está).

O bloco de 4 cartões-resumo do topo (`Resumo`: docentes na base, turmas, inscrições, entregas) continua igual para todos — é informação de ciclo, não de perfil.

### 3.6 Pequenas generalizações em `lib/equipe.ts`

- `linhasDaEquipe(estado, filtro)`: hoje `filtro` só aceita `{ coordenadorId?: string }`. Estenda para `{ coordenadorId?: string; unidade?: string }`. Quando `unidade` é passado (e `coordenadorId` não), filtre `estado.pessoas` por `perfil === "docente" && p.unidade === unidade` em vez de `docentesDoCoordenador`.
- `PainelEquipe`: troque o tipo da prop `escopo` de `"coordenador" | "operadora"` para `"coordenador" | "operadora" | "diretor"`. Quando `"diretor"`, chame `linhasDaEquipe(estado, { unidade: pessoaAtiva.unidade })`.

## 4. Não fazer nesta rodada

- Não implemente controle de acesso real (RNF05 continua fora do protótipo). O diretor só vê a própria unidade porque a tela pergunta por `pessoaAtiva.unidade` — não porque há permissão de fato. Isso é intencional e já é assim em todo o resto do protótipo.
- Não altere `src/data/types.ts` nem `VERSAO_ESTADO`. Nada neste round precisa de campo novo em `EstadoApp` — se você achar que precisa, pare e pergunte antes de mudar o modelo, porque provavelmente é sinal de que a leitura dos dados existentes está sendo feita errado.
- Não mexa na etapa de conteúdo, na configuração do ciclo, no menu lateral ou no link do encontro ao vivo — já lapidados e já corrigidos hoje.
- Não duplique "conferências" dentro do funil, nem o contrário. São dois eixos diferentes (tipo de pendência vs. progresso por etapa) e a ata pede os dois de pé.
- Não invente indicador, gráfico ou ação que não esteja nem em RF32, nem na seção 4.3 da ata, nem neste documento.

## 5. Critérios de aceite

1. `/gestao`, aba "Visão do ciclo": o funil de etapas continua mostrando os mesmos números de antes (nenhuma regressão), e agora cada etapa é clicável, revelando a lista de docentes que estão nela.
2. Na etapa expandida do funil, o botão "Avisar todos" só aparece quando há pelo menos um docente não concluído nela, e desaparece (ou fica sem alvo) quando todos concluíram.
3. `/equipe` (coordenador) mostra o mesmo funil, agora escopado só à própria equipe — os números batem com a tabela de docentes já existente.
4. `PainelEquipe`, nos três escopos, mostra macrotema e turma na linha do docente (ou "Sem escolha"/"—" quando ainda não houver inscrição).
5. `/jornada` (docente) mostra "Turma · Macrotema" quando o docente já se inscreveu, e não mostra nada quando ainda não se inscreveu — sem quebrar layout nos dois casos.
6. `/unidade` (diretor) deixa de mostrar o `Placeholder` e passa a mostrar: nome da unidade, funil escopado à unidade, um cartão por coordenador com docentes na unidade (contadores + botão de cobrança), e a tabela completa de docentes da unidade.
7. Trocar o perfil de demonstração para `diretor` e navegar para `/unidade` funciona sem erro mesmo se, por acaso, a unidade do diretor não tiver nenhum docente vinculado (mostra estado vazio, não quebra).
8. O botão "Cobrar coordenador" no painel do diretor gera uma notificação para a pessoa certa (verificável trocando o perfil para aquele coordenador e abrindo a central de notificações).
9. `/` (painel inicial) não mostra mais "Tela ainda não construída" para nenhum perfil.
10. `/` para `coordenador`, `operadora` e `diretor` mostra contadores corretos (batendo com o que `/equipe`, `/gestao` e `/unidade` mostram, respectivamente) e um botão que leva à tela completa correspondente.
11. `/` para `docente`/`docente-corregente` mostra um botão para "Minha Jornada" no lugar do antigo placeholder, sem remover o card "Sua situação no ciclo" que já existia.
12. Trocar macrotemas, remover uma etapa ou renomear uma etapa na Configuração do Ciclo não quebra nenhuma tela nova desta rodada (regra de ouro) — teste ao menos uma dessas mudanças antes de considerar concluído.
13. `npm run lint` e `npm run build` limpos ao final de cada bloco da seção 6.
14. Tudo funciona em 375px — preste atenção especial aos cartões por coordenador em `/unidade` (podem empilhar) e à linha extra de macrotema/turma em `PainelEquipe` (não pode estourar a tabela).
15. Nenhum texto pedagógico novo (nome de etapa, macrotema etc.) hardcoded em componente — tudo deriva de `estado.cicloConfig` ou dos dados já existentes.

## 6. Decisões tomadas por interpretação — confirmar com o cliente na segunda

Registre as três no `CLAUDE.md`, seção de pendências, exatamente como fizemos na rodada anterior:

- **Agrupamento do painel do diretor é por `coordenadorId` do docente, não pela `unidade` do coordenador.** É a única leitura consistente com o modelo de dados atual (um coordenador pode liderar docentes de mais de uma unidade). Se o cliente esperava que cada unidade tivesse "seus" coordenadores fixos, isso muda o desenho.
- **"Avisar todos" no funil alcança todo mundo que não concluiu a etapa** (pendente, em andamento e atrasado), não só quem está atrasado. Se o Lucas quiser um botão separado só para atrasados, é ajuste pequeno.
- **O painel inicial ("/") virou um resumo com atalho, não um dashboard completo.** A ideia é não duplicar `/equipe`, `/gestao` e `/unidade` — mas se o cliente esperava ver o funil já na tela inicial, isso é uma adição pequena de trazer, não uma mudança de estrutura.

## 7. Ordem de trabalho recomendada

Um commit por bloco, `npm run lint` e `npm run build` ao final de cada um, nesta ordem (por dependência de código, como na rodada anterior):

1. `lib/equipe.ts` — estende `linhasDaEquipe` com `unidade`.
2. `components/acompanhamento/FunilEtapas.tsx` — extraído de `PainelGestaoCiclo`, com detalhamento clicável e "avisar todos".
3. `PainelGestaoCiclo.tsx` passa a usar `FunilEtapas` — confira que a aba "Visão do ciclo" de `/gestao` não regrediu visualmente.
4. `equipe.tsx` ganha `FunilEtapas` escopado ao coordenador.
5. `PainelEquipe.tsx` mostra macrotema/turma; `escopo` ganha `"diretor"`.
6. `jornada.tsx` mostra turma/macrotema do próprio docente.
7. `components/diretor/PainelUnidade.tsx` (novo) + `routes/unidade.tsx` usando-o.
8. `routes/index.tsx` — resumo e atalho por perfil, no lugar do `Placeholder` único.
9. Percorrer os 15 critérios de aceite da seção 5, um por um.

## 8. Quando parar e perguntar

Se aparecer uma decisão de produto que nem este documento, nem `CLAUDE.md`, nem a ata da reunião (seção 4.3) cobrem, pare e registre na seção 6 deste documento — não decida sozinho e não invente regra pedagógica nova.
