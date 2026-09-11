# Especificação — Lapidação do protótipo, rodada P1 + P2

**Origem:** reunião de lapidação com o cliente (Lucas), registrada no Notion como *Reunião de Lapidação do Protótipo — João e Lucas*, e decisões **D13 a D16** e **D19** do *Registro de Decisões — D01 a D20*.

**Objetivo desta rodada:** deixar o protótipo capaz de mostrar, de ponta a ponta, que **o docente síncrono e o docente assíncrono percorrem caminhos diferentes**, e que **a equipe operadora define esses caminhos sem sair do sistema**.

**Fora desta rodada:** P3 (acompanhamento por etapa, painéis do diretor e inicial, conferências) e P4 (navegação e acabamento). O tipo de etapa `curso` com `referenciaExterna` também fica para o MVP.

> **Frase do cliente que resume a rodada:** *"a gente só tem que trazer essa essência da jornada, que é esse vínculo de macrotema, modalidade e o que ele tem que fazer."*

---

## 0. O que está errado hoje

| Hoje | Por que está errado |
|---|---|
| Conteúdo vinculado a `(etapa, macrotema)` | Síncrono e assíncrono recebem o mesmo conteúdo. No processo real, quem escolhe assíncrono precisa de vídeo gravado; quem escolhe síncrono precisa do link da aula ao vivo |
| Só dois tipos de conteúdo: vídeo e texto-base | Faltam o **link de webconferência** e a **tarefa** |
| Avanço de etapa por regra sequencial fixa no código | O critério real varia por oferta: presença, entrega, nota de corte |
| Turmas nascem no seed, pré-cadastradas | A criação de turma é um dos maiores gargalos do processo atual (hoje feita no Liceu/TEIA) |
| Alerta só dispara depois do atraso | O cliente pediu aviso **antes** do prazo, no vencimento e depois |
| `ArquivoConteudo` já nasce preso a uma etapa | D11 exige biblioteca de mídia reutilizável entre turmas e ciclos |
| Abas da configuração fora da ordem de dependência | Não dá para definir etapas antes de decidir se a trilha é única ou por segmento |
| `lib/jornada.ts` decide a tela da etapa por trecho do **nome** | Renomear uma etapa na configuração quebra o botão que leva à tela |

---

## 1. Modelo de dados

Todas as mudanças em `src/data/types.ts`. **Incremente `VERSAO_ESTADO` para 7** em `src/data/seed.ts` — o estado salvo é descartado e o seed é recriado, que é o comportamento correto para o protótipo.

### 1.1 Tipos novos

```ts
/**
 * Arquivo na biblioteca de mídia (D11). Existe independentemente de etapa,
 * turma ou ciclo, para poder ser reaproveitado. O upload ao Drive
 * institucional é simulado: o operador nunca copia URL.
 */
export interface Midia {
  id: string;
  nome: string;
  tipo: "video" | "texto" | "link";
  arquivoTipo?: string | undefined;
  tamanhoBytes?: number | undefined;
  /** referência gerada automaticamente no Drive institucional (simulada) */
  referenciaDrive?: string | undefined;
  /** endereço externo — só para tipo `link` (webconferência) */
  url?: string | undefined;
  duracaoMin?: number | undefined;
  enviadaEmISO: string;
  enviadaPorId: string;
}

export type TipoItemConteudo = "video" | "texto" | "webconferencia" | "tarefa";

/**
 * Oferta: o que existe para um macrotema, em uma modalidade, dentro de uma
 * etapa de conteúdo (D14). É aqui que moram os itens e os critérios de avanço.
 */
export interface OfertaConteudo {
  id: string;
  etapaId: string;
  macrotemaId: string;
  modalidadeId: string;
  criterios: CriterioAvanco[];
}

/** Item de conteúdo de uma oferta, na ordem em que o docente o encontra. */
export interface ItemConteudo {
  id: string;
  ofertaId: string;
  tipo: TipoItemConteudo;
  titulo: string;
  descricao: string;
  ordem: number;
  /** aponta para a biblioteca de mídia; ausente em itens do tipo `tarefa` */
  midiaId?: string | undefined;
  /** enunciado, só para itens do tipo `tarefa` */
  enunciado?: string | undefined;
}

export type TipoCriterioAvanco =
  | "aulas_assistidas"
  | "leitura_concluida"
  | "presenca"
  | "tarefa_entregue"
  | "tarefa_validada";

/** Critério que libera o avanço de fase (D15). */
export interface CriterioAvanco {
  tipo: TipoCriterioAvanco;
  ativo: boolean;
  /** `presenca`: percentual mínimo de encontros (0 a 100) */
  percentualMinimo?: number | undefined;
  /** `tarefa_validada`: nota de corte de 0 a 10 */
  notaCorte?: number | undefined;
}

/**
 * Presença lançada pelo professor da turma (D16, modalidade síncrona).
 * Na assíncrona a presença continua vindo do envio da tarefa (RF15).
 */
export interface Presenca {
  id: string;
  pessoaId: string;
  turmaId: string;
  etapaId: string;
  /** número do encontro, de 1 até `Turma.encontrosPrevistos` */
  encontro: number;
  presente: boolean;
  lancadaEmISO: string;
  lancadaPorId: string;
  /** liberação manual — atestado, por exemplo */
  justificada?: boolean | undefined;
  observacao?: string | undefined;
}
```

### 1.2 Tipos alterados

```ts
/** Tela do docente que uma etapa abre. Substitui a inferência por nome. */
export type TelaEtapa =
  | "autoavaliacao"
  | "percurso"
  | "conteudo"
  | "entrega"
  | "portfolio"
  | "enquete"
  | "painel";

export interface Etapa {
  // ... campos atuais mantidos ...
  /** tela que esta etapa abre para o docente */
  tela: TelaEtapa;
  /** carga horária declarada da etapa (D10) */
  cargaHoraria?: number | undefined;
}

export interface Turma {
  // ... campos atuais mantidos ...
  /** professor responsável — o docente não escolhe e não precisa ver */
  professorNome: string;
  /** link de acesso; só faz sentido na modalidade síncrona */
  linkAcesso?: string | undefined;
  /** dias da semana, 0 = domingo ... 6 = sábado. Vazio na assíncrona */
  diasSemana: number[];
  /** total de encontros previstos — base do cálculo de presença */
  encontrosPrevistos: number;
}

export interface AlertaPendencia {
  /** dias ANTES do prazo para avisar o docente. 0 = não avisa antes */
  diasAntes: number;
  /** avisa também no dia do vencimento */
  noVencimento: boolean;
  /** dias de atraso até alertar o coordenador */
  diasParaCoordenador: number;
  /** o docente também é alertado no atraso */
  alertarDocente: boolean;
}

export interface Devolutiva {
  // ... campos atuais mantidos ...
  /** nota de 0 a 10 atribuída pelo professor — base do critério tarefa_validada */
  nota?: number | undefined;
}

export interface EstadoApp {
  // ... campos atuais mantidos, EXCETO arquivosConteudo ...
  midias: Midia[];
  ofertas: OfertaConteudo[];
  itensConteudo: ItemConteudo[];
  presencas: Presenca[];
}
```

### 1.3 Tipos removidos

- `ArquivoConteudo` e `EstadoApp.arquivosConteudo` — substituídos por `Midia` + `ItemConteudo`.

> **Decisão de modelagem a registrar, e a confirmar com o Lucas:** os critérios de avanço ficam na **oferta** (`etapa × macrotema × modalidade`), não em cada turma. Na reunião ele usou "turma" e "macrotema com modalidade" como sinônimos. Amarrar na oferta evita reconfigurar critérios turma a turma quando o mesmo macrotema tem três turmas síncronas. Se ele quiser critério por turma, a mudança é mover o campo — o resto da especificação não muda.

---

## 2. P1 — A etapa de conteúdo

### 2.1 Nova aba "Conteúdo" na Configuração do Ciclo

Novo componente `src/components/config/AbaConteudo.tsx`, registrado em `src/routes/configuracao.tsx`.

O fluxo da tela, na ordem em que o cliente descreveu:

1. **Três seletores no topo**, em cascata: **Etapa** (só etapas de tipo `conteudo`) → **Macrotema** (só ativos) → **Modalidade** (só ativas). Os três juntos identificam a oferta. Se a oferta ainda não existe, ela é criada no primeiro item adicionado.
2. **Lista dos itens já cadastrados** para a combinação selecionada, reordenável (use `ItemArrastavel` de `components/config/comum.tsx`, como as demais abas), com edição de título e descrição e remoção.
3. **Quatro botões de adicionar**, lado a lado:

| Botão | O que abre | O que grava |
|---|---|---|
| Aula em vídeo | Seletor de arquivo, com upload simulado e barra de progresso | `Midia` tipo `video` + `ItemConteudo` tipo `video` |
| Texto-base | Escolha entre escrever no sistema ou anexar arquivo | `Midia` tipo `texto` + `ItemConteudo` tipo `texto` |
| Link de webconferência | Campo de URL + rótulo do encontro | `Midia` tipo `link` + `ItemConteudo` tipo `webconferencia` |
| Tarefa | Título + enunciado | `ItemConteudo` tipo `tarefa`, sem `midiaId` |

4. **Bloco final "Critérios de avanço de fase"** — um interruptor por critério, listando apenas os critérios que **fazem sentido para os itens cadastrados**:

| Critério | Só aparece se | Configuração extra |
|---|---|---|
| Assistir a todas as aulas | existe item `video` | — |
| Concluir a leitura do texto-base | existe item `texto` | — |
| Presença no encontro | existe item `webconferencia` **ou** a modalidade não tem presença automática | percentual mínimo |
| Entregar a tarefa | existe item `tarefa` | — |
| Ter a tarefa validada pelo professor | existe item `tarefa` | nota de corte |

5. **Resumo em uma frase**, abaixo do bloco, escrito a partir do que está ligado — por exemplo: *"O docente avança quando assistir às 4 aulas, concluir a leitura e tiver a tarefa validada com nota 7 ou mais."* Se nenhum critério estiver ativo, a frase diz que a etapa avança pela ordem da trilha.

O reaproveitamento de mídia (D11) aparece como um link discreto **"usar arquivo já enviado"** ao lado do botão de vídeo ou texto, abrindo a lista de `Midia` existentes. É o que demonstra a biblioteca sem construir uma tela inteira para ela.

**Migração da tela atual:** `src/components/operadora/GestaoConteudo.tsx` é a base do upload simulado — reaproveite a mecânica de progresso e de geração da `referenciaDrive`, mas o destino agora é `Midia` + `ItemConteudo`. A rota `/conteudo` sai do menu lateral (ver 3.3) e a tela vira esta aba.

### 2.2 Novo módulo `src/lib/avanco.ts`

Funções puras sobre `EstadoApp`. É aqui que mora toda a regra de avanço — nenhum componente calcula critério por conta própria.

```ts
export interface StatusCriterio {
  tipo: TipoCriterioAvanco;
  /** "Aulas assistidas" */
  rotulo: string;
  /** "2 de 4", "80% lido", "3 de 4 encontros" */
  detalhe: string;
  /** 0 a 100, para a barra de progresso */
  percentual: number;
  atendido: boolean;
}

/** A oferta do docente nesta etapa, conforme a turma em que ele se inscreveu. */
export function ofertaDoDocente(
  estado: EstadoApp, pessoa: Pessoa, etapa: Etapa,
): OfertaConteudo | undefined;

export function itensDaOferta(
  estado: EstadoApp, ofertaId: string,
): ItemConteudo[];

/** Situação de cada critério ativo da oferta, para renderizar os medidores. */
export function criteriosDoDocente(
  estado: EstadoApp, pessoa: Pessoa, etapa: Etapa,
): StatusCriterio[];

/** true quando todos os critérios ativos estão atendidos. */
export function etapaConcluidaPorCriterios(
  estado: EstadoApp, pessoa: Pessoa, etapa: Etapa,
): boolean;

/** Percentual de presença do docente na turma, para a etapa. */
export function percentualPresenca(
  estado: EstadoApp, pessoa: Pessoa, etapa: Etapa,
): number;
```

Regras de cálculo:

- `aulas_assistidas` — `progressoAulas` do docente na etapa contra o número de itens `video` da oferta.
- `leitura_concluida` — `progressoLeituras.percentual >= 100`.
- `presenca` — na modalidade com `presencaAutomatica`, atendido quando existe `presencaEmISO` no `ProgressoEtapa`. Caso contrário, encontros com `presente: true` **ou** `justificada: true`, sobre `Turma.encontrosPrevistos`, comparado ao `percentualMinimo`.
- `tarefa_entregue` — existe `Entrega` do docente na etapa.
- `tarefa_validada` — existe `Devolutiva` da entrega com `nota` maior ou igual a `notaCorte`.

### 2.3 `src/lib/jornada.ts`

Duas mudanças, e **nada além disso** — esta função sustenta a trilha inteira.

1. `rotaDaEtapa()` deixa de inspecionar o nome e passa a ler `etapa.tela`. Mapa direto de `TelaEtapa` para rota.
2. Em `trilhaDoDocente()`, uma etapa de tipo `conteudo` que tenha oferta configurada é considerada concluída quando `etapaConcluidaPorCriterios()` devolve `true` — em vez de depender só do `ProgressoEtapa`. Quando não há oferta, o comportamento atual permanece.

O bloqueio sequencial das demais etapas continua como está. `motivoBloqueio` de uma etapa de conteúdo passa a citar o critério que falta, em linguagem direta: *"Falta concluir a leitura do texto-base."*

### 2.4 Tela do docente — `src/routes/aulas.tsx`

A tela foi o ponto mais elogiado da reunião. **Ela é acrescida, não redesenhada.**

- As abas passam a ser **geradas a partir dos itens da oferta**, e não fixas. Uma aba por tipo presente: `Aulas em vídeo`, `Texto-base`, `Encontro ao vivo`, `Tarefa da etapa`. Tipos sem item não geram aba.
- Nova aba **"Encontro ao vivo"** (itens `webconferencia`): cartão com o nome da turma, professor, dias e horário, um botão grande **"Entrar no encontro"** apontando para `Midia.url`, e a situação de presença do docente — quantos encontros registrados de quantos previstos.
- A linha de medidores deixa de ser os dois fixos (`Aulas assistidas`, `Leitura do texto-base`) e passa a renderizar `criteriosDoDocente()`. Um `ResumoProgresso` por critério ativo.
- Acima dos medidores, uma frase única dizendo o que falta para avançar. Quando tudo está atendido, ela vira a confirmação de que a etapa está concluída.
- O cabeçalho já mostra as etiquetas de turma e modalidade — mantenha.

### 2.5 Tratamento de erro exigido por D11

Se o link de webconferência ou o vídeo não carregarem, a tela mostra orientação em texto, nunca um quadro vazio. No protótipo isso é simulado, mas o componente precisa existir — é requisito registrado.

---

## 3. P2 — Configuração do ciclo

### 3.1 Turmas dentro do sistema (D13)

Nova aba **"Turmas"** — `src/components/config/AbaTurmas.tsx` — posicionada logo após Modalidades.

- Agrupamento visível por **macrotema × modalidade**. Para cada combinação, a lista de turmas e um botão "Adicionar turma".
- Campos de cada turma: nome, professor responsável, vagas, e — **só quando a modalidade não tem presença automática** — link de acesso, dias da semana e horário, e número de encontros previstos.
- Mostrar ocupação (`vagasOcupadas` de `vagas`) e bloquear a redução de vagas abaixo da ocupação atual, com o aviso de impacto do padrão já usado (`useAvisoImpacto` em `components/config/comum.tsx`).
- Remoção de turma com inscritos exige confirmação com aviso de impacto, como nas demais abas.

**Regra de alocação, já existente e que deve continuar valendo:** a autoinscrição em `src/routes/percurso.tsx` preenche a primeira turma até esgotar as vagas e só então oferece a seguinte. O docente não escolhe o professor.

### 3.2 Lançamento de presença (D16)

Sem isso, o critério de presença não tem como ser demonstrado.

Em `src/components/operadora/OcupacaoTurmas.tsx`, cada turma síncrona ganha a ação **"Lançar presença"**, que abre um painel lateral (`Sheet`) com:

- a lista dos docentes inscritos naquela turma;
- um seletor do encontro (1 até `encontrosPrevistos`);
- um interruptor de presente/ausente por docente;
- uma ação de **liberação manual** por docente, com campo de observação, que grava `justificada: true` — é o caso do atestado, citado explicitamente na reunião.

Cada lançamento grava um registro em `presencas` e dispara notificação ao docente, pelo padrão já usado em `src/lib/notificacoes.ts`.

### 3.3 Ordem das abas e hierarquia

`src/routes/configuracao.tsx` passa a ter, nesta ordem:

```
Macrotemas → Modalidades → Turmas → Segmentos → Etapas da trilha → Conteúdo → Alertas de pendência → Encerramento
```

A ordem não é estética: é a ordem de dependência. Não se cria modalidade sem macrotema, nem turma sem as duas, nem etapa antes de decidir se a trilha é única ou por segmento, nem conteúdo antes das etapas existirem.

Em `src/components/layout/navegacao.ts`, **remova o item "Conteúdo do ciclo"** do menu do perfil `operadora` — ele agora é aba da Configuração. A rota `/conteudo` pode redirecionar para `/configuracao`.

### 3.4 Modo guiado de criação do ciclo

O cliente pediu um fluxo passo a passo, no modelo da criação de demanda do PoseGest. **Não construa um assistente separado** — seria trabalho duplicado sobre as abas que já existem.

Em vez disso, adicione um **cabeçalho de etapas** no topo da Configuração do Ciclo, com um botão **"Modo guiado"**:

- ligado, o cabeçalho mostra os 8 passos na ordem acima, marca os concluídos, **desabilita os passos cujo pré-requisito não foi cumprido** e oferece "Voltar" e "Próximo";
- cada passo renderiza a aba correspondente, sem componente novo;
- o último passo é **"Conferência"**: um resumo do ciclo — quantos macrotemas ativos, modalidades, turmas e vagas totais, etapas na ordem, ofertas com conteúdo e ofertas ainda vazias;
- desligado, tudo funciona como hoje, com as abas livres.

Pré-requisitos que travam um passo: Modalidades exige ao menos um macrotema ativo; Turmas exige macrotema e modalidade ativos; Etapas exige a decisão de segmentação tomada; Conteúdo exige ao menos uma etapa de tipo `conteudo`.

### 3.5 Alertas antes, no e depois do prazo

`src/components/config/AbaAlertas.tsx` passa a expor os quatro campos de `AlertaPendencia`: dias antes, aviso no vencimento, dias de atraso até o coordenador e aviso ao docente.

`src/lib/gestao.ts` — a função que calcula alertas disparados passa a considerar os três momentos. O histórico em `PainelAlertas.tsx` deve distinguir o momento de cada disparo.

---

## 4. Seed — o roteiro da demonstração

`src/data/seed.ts`. Isto não é detalhe: **o que não está no seed não existe na reunião.**

1. `VERSAO_ESTADO = 7`.
2. Todas as etapas ganham `tela` preenchido, e a etapa de conteúdo ganha `cargaHoraria`.
3. Todas as turmas ganham `professorNome`, `encontrosPrevistos` e `diasSemana`; as síncronas ganham `linkAcesso`.
4. **Duas ofertas completas e contrastantes para o mesmo macrotema**, que é o ponto central da demonstração:

| | Macrotema 1 · Síncrona | Macrotema 1 · Assíncrona |
|---|---|---|
| Itens | 1 link de webconferência + 1 texto-base + 1 tarefa | 4 vídeos + 1 texto-base + 1 tarefa |
| Critérios | presença 75% + tarefa entregue | todas as aulas + leitura + tarefa validada, nota 7 |

5. Ao menos uma oferta para um segundo macrotema, para que trocar de macrotema na configuração mostre conteúdo diferente.
6. Registros em `presencas` para a turma síncrona, com um docente em 2 de 4 encontros — assim o medidor de presença aparece parcialmente preenchido, e não zerado.
7. Ao menos uma `Devolutiva` com `nota`, para que o critério de tarefa validada apareça atendido em um docente e pendente em outro.
8. Alertas do seed usando os campos novos, com ao menos um aviso "antes do prazo" já disparado.

---

## 5. Critérios de aceite

A rodada está pronta quando **todos** os itens abaixo passam. Este é o roteiro da demonstração — teste nesta ordem.

**Configurabilidade — a regra de ouro**

1. Trocar de 6 para 4 macrotemas ativos não quebra nenhuma tela.
2. Renomear uma etapa mantém o botão que leva à tela do docente funcionando.
3. Reordenar as etapas reflete imediatamente na prévia da trilha e na Minha Jornada.
4. Alternar entre trilha única e trilha por segmento continua funcionando.

**Conteúdo**

5. Na aba Conteúdo, escolher etapa, macrotema e modalidade e cadastrar os quatro tipos de item.
6. Os itens cadastrados aparecem na tela do docente inscrito naquela combinação, e **só** nela.
7. Um docente síncrono e um assíncrono do **mesmo macrotema** veem telas diferentes.
8. Nenhuma URL é copiada à mão em nenhum momento do fluxo de conteúdo.
9. "Usar arquivo já enviado" reaproveita uma mídia da biblioteca em outra oferta.

**Avanço de fase**

10. Os medidores da tela do docente correspondem exatamente aos critérios ligados na configuração.
11. Ligar o critério de nota de corte faz a etapa deixar de avançar com a tarefa apenas entregue.
12. Concluídos todos os critérios ativos, a etapa aparece como concluída na Minha Jornada e a seguinte é liberada.
13. Com nenhum critério ativo, o comportamento sequencial anterior permanece.

**Turmas e presença**

14. Criar uma turma síncrona com professor, vagas, link, dias e número de encontros.
15. A autoinscrição do docente preenche a primeira turma e só depois oferece a seguinte.
16. Lançar presença pela tela de Turmas move o medidor de presença do docente.
17. A liberação manual com justificativa conta como presença.
18. Na modalidade assíncrona, a presença continua sendo registrada pelo envio da tarefa — sem ninguém lançar nada.

**Configuração**

19. As abas estão na ordem de dependência e "Conteúdo do ciclo" saiu do menu lateral.
20. O modo guiado impede avançar sem cumprir o pré-requisito e termina em uma tela de conferência.
21. O alerta configurado para 3 dias antes do prazo aparece no histórico de alertas.

**Saúde do código**

22. `npm run lint` e `npm run build` passam sem erro.
23. Nenhuma cor literal foi introduzida em componente.
24. Todo texto novo de interface está em português do Brasil.
25. Tudo acima funciona em 375px de largura.

---

## 6. Perguntas a levar para a reunião

Estas são decisões de produto que a especificação tomou por conta própria. Nenhuma bloqueia a implementação, mas todas devem ser confirmadas:

1. Os critérios de avanço ficam na **oferta** (macrotema × modalidade) e valem para todas as turmas dela — ou precisam ser por turma?
2. O **encontro formativo** é etapa própria ou é a mesma coisa que a aula da turma síncrona? Se for a mesma, sobra uma etapa na trilha.
3. Aula em vídeo serve **apenas** ao assíncrono, ou uma turma síncrona também pode ter vídeo de apoio?
4. A presença é por **encontro** (a especificação assumiu isso) ou um lançamento único por etapa?
5. A nota de corte é de 0 a 10? Existe escala institucional a respeitar?
