import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  ExternalLink,
  Send,
  Video,
} from "lucide-react";
import { toast } from "sonner";

import { AvisoConteudoIndisponivel } from "@/components/conteudo/AvisoConteudoIndisponivel";
import { LeituraTextoBase } from "@/components/conteudo/LeituraTextoBase";
import { PlayerAulas } from "@/components/conteudo/PlayerAulas";
import { EstadoBadge } from "@/components/EstadoBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { AulaConteudo, TextoBase } from "@/data/conteudos";
import { materialDaEtapa } from "@/data/conteudos";
import { useStore } from "@/data/store";
import type { EstadoApp, ItemConteudo } from "@/data/types";
import {
  criteriosDoDocente,
  encontrosRegistrados,
  etapaConcluidaPorCriterios,
  itensDaOferta,
  ofertaDoDocente,
} from "@/lib/avanco";
import {
  ROTULO_DIA_SEMANA,
  formatarData,
  novoId,
  prazoDaEtapa,
  tipoParticipacaoDaPessoa,
} from "@/lib/ciclo";
import {
  aulasConcluidas,
  entregaDaEtapa,
  etapasDeConteudo,
  formatarDataHora,
  leituraDaEtapa,
  percursoDoDocente,
  presencaDaEtapa,
} from "@/lib/conteudo";
import { trilhaDoDocente } from "@/lib/jornada";

export const Route = createFileRoute("/aulas")({
  head: () => ({
    meta: [
      { title: "Conteúdo da etapa — Jornada Pedagógica de Desenvolvimento" },
      {
        name: "description",
        content:
          "Aulas em vídeo, texto-base e envio da tarefa da etapa de conteúdo do docente.",
      },
      { property: "og:title", content: "Conteúdo da etapa" },
      {
        property: "og:description",
        content:
          "Aulas em vídeo, texto-base e envio da tarefa da etapa de conteúdo do docente.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AulasPage,
});

function AulasPage() {
  const { estado, pessoaAtiva, atualizar } = useStore();
  const etapas = etapasDeConteudo(estado);
  const [etapaId, setEtapaId] = useState<string>(etapas[0]?.id ?? "");
  const etapa = etapas.find((e) => e.id === etapaId) ?? etapas[0];

  const { turma, modalidade, macrotemaNome } = percursoDoDocente(
    estado,
    pessoaAtiva,
  );
  const material = useMemo(
    () => materialDaEtapa(macrotemaNome),
    [macrotemaNome],
  );
  const [tarefa, setTarefa] = useState("");
  const [abaConteudoBruta, setAbaConteudoBruta] = useState("");

  if (!etapa) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl">Conteúdo da etapa</h1>
        <p className="mt-2 text-muted-foreground">
          A trilha configurada para você não tem, neste momento, nenhuma etapa
          de conteúdo.
        </p>
      </div>
    );
  }

  const feitas = aulasConcluidas(estado, pessoaAtiva.id, etapa.id);
  const leitura = leituraDaEtapa(estado, pessoaAtiva.id, etapa.id);
  const percentualLeitura = leitura?.percentual ?? 0;
  const entrega = entregaDaEtapa(estado, pessoaAtiva.id, etapa.id);
  const presenca = presencaDaEtapa(estado, pessoaAtiva.id, etapa.id);
  const progresso = estado.progressoEtapas.find(
    (p) => p.pessoaId === pessoaAtiva.id && p.etapaId === etapa.id,
  );
  const percentualAulas = Math.round(
    (feitas.size / Math.max(1, material.aulas.length)) * 100,
  );

  // Oferta configurada pela operadora para a combinação (etapa, macrotema,
  // modalidade) do docente. Sem oferta, a tela segue no comportamento
  // anterior (material mock acima, três abas fixas) — "acrescida, não
  // redesenhada".
  const oferta = ofertaDoDocente(estado, pessoaAtiva, etapa);
  const itensOferta = oferta ? itensDaOferta(estado, oferta.id) : [];
  const usaOferta = itensOferta.length > 0;
  const criterios = usaOferta
    ? criteriosDoDocente(estado, pessoaAtiva, etapa)
    : [];

  const trilha = trilhaDoDocente(estado, pessoaAtiva);
  const itemTrilha = trilha.find((i) => i.etapa.id === etapa.id);
  const etapaConcluidaPeloCriterio =
    usaOferta && etapaConcluidaPorCriterios(estado, pessoaAtiva, etapa);

  // Adapta ItemConteudo + Midia para os tipos que PlayerAulas/LeituraTextoBase
  // já exigem, para os dois componentes ficarem intactos ("acrescida, não
  // redesenhada"). Item sem mídia resolvível é filtrado — se TODOS falharem,
  // a aba mostra o aviso de conteúdo indisponível (D11) em vez de um player
  // vazio ou quebrado.
  const aulasResolvidas: AulaConteudo[] = itensOferta
    .filter((i) => i.tipo === "video")
    .map((item): AulaConteudo | null => {
      const midia = estado.midias.find((m) => m.id === item.midiaId);
      if (!midia) return null;
      return {
        id: item.id,
        titulo: item.titulo,
        resumo: item.descricao,
        duracaoMin: midia.duracaoMin ?? 0,
        arquivoDrive: midia.referenciaDrive ?? midia.nome,
      };
    })
    .filter((a): a is AulaConteudo => a !== null);

  const itemTexto = itensOferta.find((i) => i.tipo === "texto");
  const midiaTexto = itemTexto
    ? estado.midias.find((m) => m.id === itemTexto.midiaId)
    : undefined;
  const textoResolvido: TextoBase | null =
    itemTexto && midiaTexto?.corpo
      ? {
          titulo: itemTexto.titulo,
          autoria: "Equipe operadora",
          tempoLeituraMin: Math.max(
            1,
            Math.round(midiaTexto.corpo.split(/\s+/).length / 200),
          ),
          paragrafos: midiaTexto.corpo
            .split(/\n{2,}/)
            .map((p) => p.trim())
            .filter((p) => p.length > 0),
        }
      : null;

  const itemWebconferencia = itensOferta.find(
    (i) => i.tipo === "webconferencia",
  );
  const midiaWebconferencia = itemWebconferencia
    ? estado.midias.find((m) => m.id === itemWebconferencia.midiaId)
    : undefined;

  const itemTarefa = itensOferta.find((i) => i.tipo === "tarefa");
  const itemQuestionario = itensOferta.find((i) => i.tipo === "questionario");

  const abasDisponiveis = [
    itensOferta.some((i) => i.tipo === "video")
      ? { valor: "video", rotulo: "Aulas em vídeo" }
      : null,
    itemTexto ? { valor: "texto", rotulo: "Texto-base" } : null,
    itemWebconferencia
      ? { valor: "webconferencia", rotulo: "Encontro ao vivo" }
      : null,
    itemTarefa ? { valor: "tarefa", rotulo: "Tarefa da etapa" } : null,
    itemQuestionario ? { valor: "questionario", rotulo: "Questionário" } : null,
  ].filter((a): a is { valor: string; rotulo: string } => a !== null);

  const abaConteudoAtiva = abasDisponiveis.some(
    (a) => a.valor === abaConteudoBruta,
  )
    ? abaConteudoBruta
    : (abasDisponiveis[0]?.valor ?? "");

  function marcarProgressoEtapa(estadoAtual: EstadoApp): EstadoApp {
    const existe = estadoAtual.progressoEtapas.some(
      (p) => p.pessoaId === pessoaAtiva.id && p.etapaId === etapa!.id,
    );
    const agora = new Date().toISOString();
    return {
      ...estadoAtual,
      progressoEtapas: existe
        ? estadoAtual.progressoEtapas.map((p) =>
            p.pessoaId === pessoaAtiva.id && p.etapaId === etapa!.id
              ? {
                  ...p,
                  status: p.status === "concluida" ? p.status : "em_andamento",
                  atualizadoEmISO: agora,
                }
              : p,
          )
        : [
            ...estadoAtual.progressoEtapas,
            {
              id: novoId("prog"),
              pessoaId: pessoaAtiva.id,
              etapaId: etapa!.id,
              status: "em_andamento" as const,
              atualizadoEmISO: agora,
            },
          ],
    };
  }

  function concluirAula(aulaId: string) {
    atualizar((anterior) => {
      if (
        anterior.progressoAulas.some(
          (p) =>
            p.pessoaId === pessoaAtiva.id &&
            p.etapaId === etapa!.id &&
            p.aulaId === aulaId,
        )
      ) {
        return anterior;
      }
      return marcarProgressoEtapa({
        ...anterior,
        progressoAulas: [
          ...anterior.progressoAulas,
          {
            id: novoId("paula"),
            pessoaId: pessoaAtiva.id,
            etapaId: etapa!.id,
            aulaId,
            concluidaEmISO: new Date().toISOString(),
          },
        ],
      });
    });
  }

  function avancarLeitura(valor: number) {
    atualizar((anterior) => {
      const existente = anterior.progressoLeituras.find(
        (p) => p.pessoaId === pessoaAtiva.id && p.etapaId === etapa!.id,
      );
      if (existente && existente.percentual >= valor) return anterior;
      const registro = {
        id: existente?.id ?? novoId("leit"),
        pessoaId: pessoaAtiva.id,
        etapaId: etapa!.id,
        percentual: valor,
        concluidaEmISO:
          valor >= 100 ? new Date().toISOString() : existente?.concluidaEmISO,
      };
      return marcarProgressoEtapa({
        ...anterior,
        progressoLeituras: existente
          ? anterior.progressoLeituras.map((p) =>
              p.id === existente.id ? registro : p,
            )
          : [...anterior.progressoLeituras, registro],
      });
    });
  }

  function enviarTarefa() {
    const texto = tarefa.trim();
    if (texto.length < 10) {
      toast.error(
        "Escreva um registro um pouco mais completo antes de enviar.",
      );
      return;
    }
    const agora = new Date().toISOString();
    const registraPresenca = modalidade?.presencaAutomatica ?? false;

    atualizar((anterior) => {
      const base = marcarProgressoEtapa(anterior);
      const comEntrega: EstadoApp = {
        ...base,
        entregas: [
          ...base.entregas,
          {
            id: novoId("ent"),
            pessoaId: pessoaAtiva.id,
            etapaId: etapa!.id,
            texto,
            enviadaEmISO: agora,
            destino:
              tipoParticipacaoDaPessoa(estado, pessoaAtiva.id) === "corregente"
                ? ("equipe_central" as const)
                : ("coordenador" as const),
            status: "enviada" as const,
          },
        ],
      };

      // Sem oferta ou sem nenhum critério ativo: mantém o comportamento
      // sequencial (envio conclui a etapa). Com critério ativo, só conclui
      // se todos os critérios — inclusive os que não são a própria tarefa,
      // como aulas assistidas ou nota de corte — já estiverem atendidos.
      const oferta = ofertaDoDocente(comEntrega, pessoaAtiva, etapa!);
      const temCriterioAtivo = oferta?.criterios.some((c) => c.ativo) ?? false;
      const concluidaAgora = temCriterioAtivo
        ? etapaConcluidaPorCriterios(comEntrega, pessoaAtiva, etapa!)
        : true;

      return {
        ...comEntrega,
        progressoEtapas: comEntrega.progressoEtapas.map((p) =>
          p.pessoaId === pessoaAtiva.id && p.etapaId === etapa!.id
            ? {
                ...p,
                status: concluidaAgora
                  ? ("concluida" as const)
                  : ("em_andamento" as const),
                atualizadoEmISO: agora,
                presencaEmISO: registraPresenca ? agora : p.presencaEmISO,
              }
            : p,
        ),
        notificacoes: [
          {
            id: novoId("not"),
            pessoaId: pessoaAtiva.id,
            titulo: registraPresenca
              ? "Tarefa enviada e presença registrada"
              : "Tarefa da etapa enviada",
            descricao: concluidaAgora
              ? `Etapa "${etapa!.nome}" concluída.`
              : `Tarefa da etapa "${etapa!.nome}" recebida. Ainda falta atender aos demais critérios de avanço.`,
            criadaEmISO: agora,
            lida: false,
            tipo: "mudanca_etapa" as const,
          },
          ...comEntrega.notificacoes,
        ],
      };
    });

    setTarefa("");
    toast.success(
      registraPresenca
        ? "Tarefa enviada. Sua presença foi registrada automaticamente."
        : "Tarefa enviada ao seu coordenador.",
    );
  }

  function cardTarefa(instrucoes: React.ReactNode, valorAba: string) {
    return (
      <TabsContent value={valorAba} className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Registro da etapa{" "}
              {modalidade?.presencaAutomatica && "· presença automática"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{instrucoes}</p>

            {entrega ? (
              <div className="rounded-xl border border-border bg-muted/40 p-3 text-sm">
                <p className="font-medium">
                  Tarefa enviada em {formatarDataHora(entrega.enviadaEmISO)}
                </p>
                <p className="mt-1 text-muted-foreground">{entrega.texto}</p>
              </div>
            ) : (
              <>
                <Textarea
                  value={tarefa}
                  onChange={(e) => setTarefa(e.target.value)}
                  rows={6}
                  placeholder="O que você vai experimentar na sua sala nas próximas duas semanas?"
                  aria-label="Registro da tarefa da etapa"
                />
                <Button onClick={enviarTarefa} className="gap-1.5">
                  <Send className="size-4" aria-hidden />
                  Enviar tarefa da etapa
                </Button>
              </>
            )}

            <Button asChild variant="ghost" className="gap-1.5 px-0">
              <Link to="/jornada">
                Voltar para Minha Jornada
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {estado.cicloConfig.nome} · {estado.cicloConfig.periodo}
      </p>
      <h1 className="mt-1 text-2xl sm:text-3xl">{etapa.nome}</h1>
      <p className="mt-1 text-muted-foreground">{etapa.descricao}</p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <EstadoBadge status={progresso?.status ?? "nao_iniciada"} />
        <Badge variant="outline">
          Prazo: {formatarData(prazoDaEtapa(estado.cicloConfig, etapa))}
        </Badge>
        {turma && <Badge variant="outline">{turma.nome}</Badge>}
        {modalidade && <Badge variant="outline">{modalidade.nome}</Badge>}
      </div>

      {etapas.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {etapas.map((e) => (
            <Button
              key={e.id}
              size="sm"
              variant={e.id === etapa.id ? "default" : "outline"}
              onClick={() => setEtapaId(e.id)}
            >
              {e.nome}
            </Button>
          ))}
        </div>
      )}

      {presenca && modalidade?.presencaAutomatica && (
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-sucesso/30 bg-sucesso-suave p-3 text-sm text-sucesso">
          <CalendarCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            Presença registrada automaticamente em {formatarDataHora(presenca)},
            pelo envio da sua tarefa. Você não precisa fazer mais nada.
          </span>
        </p>
      )}

      {usaOferta && (
        <p
          className={`mt-4 rounded-xl border p-3 text-sm ${
            etapaConcluidaPeloCriterio
              ? "border-sucesso/30 bg-sucesso-suave text-sucesso"
              : "border-border bg-muted/40 text-foreground"
          }`}
        >
          {etapaConcluidaPeloCriterio
            ? "Você já atendeu a todos os critérios desta etapa — ela está concluída."
            : (itemTrilha?.oQueFalta ?? "Continue para concluir esta etapa.")}
        </p>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {usaOferta ? (
          criterios.map((c) => (
            <ResumoProgresso
              key={c.tipo}
              titulo={c.rotulo}
              detalhe={c.detalhe}
              valor={c.percentual}
              atendido={c.atendido}
            />
          ))
        ) : (
          <>
            <ResumoProgresso
              titulo="Aulas assistidas"
              detalhe={`${feitas.size} de ${material.aulas.length}`}
              valor={percentualAulas}
            />
            <ResumoProgresso
              titulo="Leitura do texto-base"
              detalhe={`${percentualLeitura}% lido`}
              valor={percentualLeitura}
            />
          </>
        )}
      </div>

      {usaOferta ? (
        <Tabs
          value={abaConteudoAtiva}
          onValueChange={setAbaConteudoBruta}
          className="mt-6"
        >
          <TabsList>
            {abasDisponiveis.map((a) => (
              <TabsTrigger key={a.valor} value={a.valor}>
                {a.rotulo}
              </TabsTrigger>
            ))}
          </TabsList>

          {abasDisponiveis.some((a) => a.valor === "video") && (
            <TabsContent value="video" className="mt-4">
              {aulasResolvidas.length > 0 ? (
                <PlayerAulas
                  aulas={aulasResolvidas}
                  concluidas={feitas}
                  aoConcluir={concluirAula}
                />
              ) : (
                <AvisoConteudoIndisponivel titulo="O vídeo não carregou">
                  Tente novamente mais tarde ou avise a equipe operadora — o
                  material desta etapa pode ter sido movido no Drive
                  institucional.
                </AvisoConteudoIndisponivel>
              )}
            </TabsContent>
          )}

          {itemTexto && (
            <TabsContent value="texto" className="mt-4">
              {textoResolvido ? (
                <LeituraTextoBase
                  texto={textoResolvido}
                  percentual={percentualLeitura}
                  aoAvancar={avancarLeitura}
                />
              ) : (
                <AvisoConteudoIndisponivel titulo="Este texto-base ainda não pode ser lido aqui">
                  Foi anexado como arquivo, e este protótipo não abre arquivos
                  embutidos na tela. Peça à equipe operadora a referência no
                  Drive institucional.
                </AvisoConteudoIndisponivel>
              )}
            </TabsContent>
          )}

          {itemWebconferencia && (
            <TabsContent value="webconferencia" className="mt-4">
              {turma?.linkAcesso ? (
                <Card>
                  <CardHeader className="flex-row items-center gap-3 space-y-0">
                    <Video className="size-5 text-primary" aria-hidden />
                    <CardTitle className="text-base">
                      {itemWebconferencia.titulo}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {turma.nome}
                      {turma.professorNome
                        ? ` · Professor: ${turma.professorNome}`
                        : ""}
                      {turma.horario ? ` · ${turma.horario}` : ""}
                    </p>
                    {turma.diasSemana.length > 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {turma.diasSemana
                          .map((d) => ROTULO_DIA_SEMANA[d])
                          .join(", ")}
                      </p>
                    ) : null}
                    <Button asChild className="gap-1.5">
                      {/* Link é da turma em que o docente está inscrito, não
                          da oferta — cada turma tem o seu (D13/reunião de
                          lapidação): "a turma 1 vai usar esse link, a turma
                          2 usa outro link". */}
                      <a
                        href={turma.linkAcesso}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Entrar no encontro
                        <ExternalLink className="size-4" aria-hidden />
                      </a>
                    </Button>
                    {midiaWebconferencia?.url ? (
                      <p className="text-sm">
                        <a
                          href={midiaWebconferencia.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-accent-foreground underline underline-offset-2"
                        >
                          Material complementar do encontro
                        </a>
                      </p>
                    ) : null}
                    <p className="text-sm text-muted-foreground">
                      {encontrosRegistrados(
                        estado,
                        pessoaAtiva.id,
                        turma.id,
                        etapa.id,
                      )}{" "}
                      de {turma.encontrosPrevistos} encontro(s) registrados
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <AvisoConteudoIndisponivel titulo="O link do encontro não está disponível">
                  Avise a equipe operadora para cadastrar o link de acesso desta
                  turma na aba Turmas.
                </AvisoConteudoIndisponivel>
              )}
            </TabsContent>
          )}

          {itemTarefa &&
            cardTarefa(
              <>
                {itemTarefa.enunciado ??
                  "Escreva a prática que você escolheu experimentar a partir das aulas e do texto-base."}
                {modalidade?.presencaAutomatica
                  ? " Na modalidade assíncrona, este envio registra a sua presença na hora."
                  : ""}
              </>,
              "tarefa",
            )}

          {itemQuestionario && (
            <TabsContent value="questionario" className="mt-4">
              <QuestionarioInterativo item={itemQuestionario} />
            </TabsContent>
          )}
        </Tabs>
      ) : (
        <Tabs defaultValue="aulas" className="mt-6">
          <TabsList>
            <TabsTrigger value="aulas">Aulas em vídeo</TabsTrigger>
            <TabsTrigger value="texto">Texto-base</TabsTrigger>
            <TabsTrigger value="tarefa">Tarefa da etapa</TabsTrigger>
          </TabsList>

          <TabsContent value="aulas" className="mt-4">
            <PlayerAulas
              aulas={material.aulas}
              concluidas={feitas}
              aoConcluir={concluirAula}
            />
          </TabsContent>

          <TabsContent value="texto" className="mt-4">
            <LeituraTextoBase
              texto={material.texto}
              percentual={percentualLeitura}
              aoAvancar={avancarLeitura}
            />
          </TabsContent>

          {cardTarefa(
            <>
              Escreva a prática que você escolheu experimentar a partir das
              aulas e do texto-base.
              {modalidade?.presencaAutomatica
                ? " Na modalidade assíncrona, este envio registra a sua presença na hora."
                : " Nesta modalidade, a presença é registrada no encontro ao vivo."}
            </>,
            "tarefa",
          )}
        </Tabs>
      )}
    </div>
  );
}

/**
 * Questionário de múltipla escolha (D31), sem resposta aberta. Autoexploração
 * do docente — sem gabarito no modelo, então não há certo/errado a apontar.
 */
function QuestionarioInterativo({ item }: { item: ItemConteudo }) {
  const perguntas = [...(item.perguntas ?? [])].sort(
    (a, b) => a.ordem - b.ordem,
  );
  const [respostas, setRespostas] = useState<Record<string, string>>({});

  if (perguntas.length === 0) {
    return (
      <AvisoConteudoIndisponivel titulo="Este questionário ainda não tem perguntas">
        Peça à equipe operadora para cadastrar as perguntas na aba Conteúdo.
      </AvisoConteudoIndisponivel>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{item.titulo}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {perguntas.map((pergunta, i) => (
          <div key={pergunta.id} className="space-y-2">
            <p className="text-sm font-medium">
              {i + 1}. {pergunta.enunciado}
            </p>
            <RadioGroup
              value={respostas[pergunta.id] ?? ""}
              onValueChange={(v) =>
                setRespostas((atual) => ({ ...atual, [pergunta.id]: v }))
              }
            >
              {pergunta.opcoes.map((opcao, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <RadioGroupItem id={`${pergunta.id}-${oi}`} value={opcao} />
                  <Label htmlFor={`${pergunta.id}-${oi}`}>{opcao}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        ))}
        <p className="text-sm text-muted-foreground">
          {Object.keys(respostas).length} de {perguntas.length} pergunta(s)
          respondida(s).
        </p>
      </CardContent>
    </Card>
  );
}

function ResumoProgresso({
  titulo,
  detalhe,
  valor,
  atendido,
}: {
  titulo: string;
  detalhe: string;
  valor: number;
  /** critério de avanço já atendido — some/omite o selo se não vier (medidores antigos) */
  atendido?: boolean | undefined;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        atendido
          ? "border-sucesso/30 bg-sucesso-suave"
          : "border-border bg-card"
      }`}
    >
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span className="flex items-center gap-1.5 text-sm font-medium">
          {atendido ? (
            <CheckCircle2
              className="size-4 shrink-0 text-sucesso"
              aria-hidden
            />
          ) : null}
          {titulo}
        </span>
        <span
          className={`text-sm ${atendido ? "text-sucesso" : "text-muted-foreground"}`}
        >
          {detalhe}
        </span>
      </div>
      <Progress value={valor} aria-label={titulo} />
    </div>
  );
}
