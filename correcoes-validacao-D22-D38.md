# Correções — validação de código pós D22-D38

**Origem:** validação de código do repositório `Prot-tipo-Jornada-Lovable` após os commits dos blocos 1–8 (D22–D38). Revisão feita por leitura estática do código (sem `npm install`/lint/build — registry bloqueado no ambiente de revisão). 14 dos 17 itens foram confirmados corretos; os 3 abaixo têm gap real, já registrados como pendência no Notion.

Este documento é só sobre esses 3 pontos — não repetir trabalho já validado (D22-D26, D28-D30, D32, D34-D38 estão corretos e não precisam de mudança).

---

## Correção 1 — "Ciclo" ainda aparece nas telas do docente (D27)

**Achado:** `cicloConfig.nome` (seed: `"Ciclo 2"`) é exibido como o cabeçalho de identificação em `routes/jornada.tsx:80`, `routes/percurso.tsx:385`, `routes/aulas.tsx:418` e `routes/entrega.tsx:274` — sempre no formato `{estado.cicloConfig.nome} · {estado.cicloConfig.periodo}`, ou seja, hoje mostra literalmente **"Ciclo 2 · 2027–2030"** para o docente. `cicloConfig.descricao` (seed: `"Jornada 2027 a 2030"`) existe no modelo e é editável em `AbaGeral.tsx`, mas não é lido em lugar nenhum do app.

**O que corrigir:** nas quatro rotas do docente listadas acima, trocar a exibição de `cicloConfig.nome` por `cicloConfig.descricao` (mantendo `· {periodo}` ao lado, se fizer sentido visualmente). `cicloConfig.nome` continua existindo como identificador interno/técnico do ciclo — não precisa mudar seu valor no seed, só parar de aparecer para o docente.

**Não mexer:** `routes/acesso.tsx`, `routes/gestao.tsx`, `routes/configuracao.tsx` são telas da equipe operadora — lá "ciclo" continua correto e não faz parte de D27.

**Critério de aceite:** logado como docente-regente ou docente-corregente, abrir `/jornada`, `/percurso`, `/aulas` e `/entrega` e confirmar que o cabeçalho mostra "Jornada 2027 a 2030" (ou o texto atual de `descricao`), nunca "Ciclo 2".

---

## Correção 2 — Perfil moderador incompleto (D33)

Dois problemas distintos no mesmo perfil:

**2a. Validação de entrega/devolutiva não existe.** `PainelModeracao.tsx` só lança presença (via `PainelLancamentoPresenca`, reaproveitado de `components/operadora/OcupacaoTurmas.tsx`). A decisão original pedia que o moderador também valide entregas de tarefa e dê devolutiva/nota.
- Adicionar em `PainelModeracao.tsx` uma seção (ou aba) que liste as entregas pendentes de validação das turmas em `pessoaAtiva.turmaIds`, reaproveitando a lógica que já existe para o coordenador (ver como `PainelEquipe`/detalhe do docente monta a validação de `Entrega`/`Devolutiva` — mesmo padrão, só escopado às turmas do moderador em vez de aos liderados do coordenador).
- O moderador continua **sem** acesso à configuração da turma/ciclo — só presença + validação de entrega das turmas vinculadas a ele.

**2b. Sem UI para atribuir turmas a um moderador.** `turmaIds` só existe hardcoded em `data/seed.ts:509-518` (`moderadoresSeed`). Não há tela onde a equipe operadora crie um moderador ou edite quais turmas ele cobre.
- Adicionar, na Configuração do Ciclo (provavelmente uma nova aba, ou dentro de `AbaTurmas.tsx` como ação por turma — "atribuir moderador"), uma forma de a operadora escolher, para uma pessoa com perfil moderador, quais `turmaIds` ela cobre. Pode ser simples: lista de pessoas com perfil `moderador` + seleção múltipla de turmas por pessoa, sem precisar de tela de cadastro de nova pessoa (a base de pessoas continua somente leitura, D36 — isso não muda; só a atribuição de turmas a quem já é moderador).

**Critério de aceite:** um moderador de exemplo consegue, na própria tela, validar/dar devolutiva em pelo menos uma entrega de uma turma vinculada a ele; a equipe operadora consegue, pela interface, mudar quais turmas um moderador cobre sem editar `localStorage`/seed manualmente.

---

## Correção 3 — `linkApoio` nunca aparece para o docente (D31)

**Achado:** `ItemConteudo.linkApoio` é capturado nos formulários de tarefa e texto-base em `components/config/AbaConteudo.tsx` (linhas ~793-893 e ~1086-1147), mas nenhuma tela do docente (`routes/aulas.tsx`, `components/conteudo/*`) lê esse campo. O dado é salvo no `localStorage` e nunca chega à interface de quem precisa dele — era justamente o pedido do Sinclair (material de apoio/link quando a modalidade é assíncrona).

**O que corrigir:** em `routes/aulas.tsx` (e/ou no componente de conteúdo correspondente, ex. `components/conteudo/` para tarefa e texto-base), quando o item renderizado tiver `linkApoio` preenchido, mostrar um link visível — algo como "Material de apoio" ou "Link complementar", clicável, próximo ao enunciado da tarefa ou ao final do texto-base.

**Critério de aceite:** configurar (via `AbaConteudo`) uma tarefa ou texto-base de exemplo com `linkApoio` preenchido; ao acessar `/aulas` como docente, o link aparece e é clicável.

---

## Checklist

- [ ] Correção 1 — telas do docente mostram `cicloConfig.descricao`, não `cicloConfig.nome`
- [ ] Correção 2a — moderador consegue validar entrega/devolutiva
- [ ] Correção 2b — operadora consegue atribuir turmas a um moderador pela interface
- [ ] Correção 3 — `linkApoio` visível para o docente em tarefa e texto-base
- [ ] `npm run lint` e `npm run build` passam após as três correções
