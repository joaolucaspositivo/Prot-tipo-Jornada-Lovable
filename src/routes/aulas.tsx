import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, CalendarCheck, Send } from "lucide-react";
import { toast } from "sonner";

import { LeituraTextoBase } from "@/components/conteudo/LeituraTextoBase";
import { PlayerAulas } from "@/components/conteudo/PlayerAulas";
import { EstadoBadge } from "@/components/EstadoBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { materialDaEtapa } from "@/data/conteudos";
import { useStore } from "@/data/store";
import type { EstadoApp } from "@/data/types";
import { etapaConcluidaPorCriterios, ofertaDoDocente } from "@/lib/avanco";
import { formatarData, novoId, prazoDaEtapa } from "@/lib/ciclo";
import {
  aulasConcluidas,
  entregaDaEtapa,
  etapasDeConteudo,
  formatarDataHora,
  leituraDaEtapa,
  percursoDoDocente,
  presencaDaEtapa,
} from "@/lib/conteudo";

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
  const etapas = etapasDeConteudo(estado, pessoaAtiva);
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
              pessoaAtiva.cargo === "corregente"
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

      {presenca && (
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-sucesso/30 bg-sucesso-suave p-3 text-sm text-sucesso">
          <CalendarCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            Presença registrada automaticamente em {formatarDataHora(presenca)},
            pelo envio da sua tarefa. Você não precisa fazer mais nada.
          </span>
        </p>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
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
      </div>

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

        <TabsContent value="tarefa" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Registro da etapa{" "}
                {modalidade?.presencaAutomatica && "· presença automática"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Escreva a prática que você escolheu experimentar a partir das
                aulas e do texto-base.
                {modalidade?.presencaAutomatica
                  ? " Na modalidade assíncrona, este envio registra a sua presença na hora."
                  : " Nesta modalidade, a presença é registrada no encontro ao vivo."}
              </p>

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
      </Tabs>
    </div>
  );
}

function ResumoProgresso({
  titulo,
  detalhe,
  valor,
}: {
  titulo: string;
  detalhe: string;
  valor: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-sm font-medium">{titulo}</span>
        <span className="text-sm text-muted-foreground">{detalhe}</span>
      </div>
      <Progress value={valor} aria-label={titulo} />
    </div>
  );
}
