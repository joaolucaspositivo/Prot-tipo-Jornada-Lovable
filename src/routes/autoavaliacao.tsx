import { createFileRoute, Link } from "@tanstack/react-router";
import { RotateCcw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { FormularioAutoavaliacao } from "@/components/autoavaliacao/FormularioAutoavaliacao";
import { ResultadoAutoavaliacao } from "@/components/autoavaliacao/ResultadoAutoavaliacao";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calcularDimensoes } from "@/data/autoavaliacao";
import { useStore } from "@/data/store";
import type { Autoavaliacao, EstadoApp } from "@/data/types";
import {
  cicloDoDocente,
  etapasEmOrdem,
  formularioVersaoVigente,
  novoId,
} from "@/lib/ciclo";

export const Route = createFileRoute("/autoavaliacao")({
  head: () => ({
    meta: [
      { title: "Autoavaliação — Jornada Pedagógica de Desenvolvimento" },
      {
        name: "description",
        content: "Autoavaliação da prática pedagógica na abertura da jornada.",
      },
      { property: "og:title", content: "Autoavaliação da prática pedagógica" },
      {
        property: "og:description",
        content: "Autoavaliação da prática pedagógica na abertura da jornada.",
      },
    ],
  }),
  component: AutoavaliacaoPage,
});

function AutoavaliacaoPage() {
  const { estado, pessoaAtiva, atualizar } = useStore();
  // D61: a configuração vem do mesociclo da turma do docente, nunca do
  // vigente — sem inscrição ainda, cicloDoDocente cai no vigente sozinho.
  const { config } = cicloDoDocente(estado, pessoaAtiva.id);

  const etapas = etapasEmOrdem(config).filter(
    (e) => e.tipo === "autoavaliacao",
  );
  const [etapaId, setEtapaId] = useState<string>(etapas[0]?.id ?? "");
  const etapa = etapas.find((e) => e.id === etapaId) ?? etapas[0];

  const registro = etapa
    ? estado.autoavaliacoes.find(
        (a) => a.pessoaId === pessoaAtiva.id && a.etapaId === etapa.id,
      )
    : undefined;
  const respostas = registro?.respostas ?? {};

  function salvarRegistro(mudanca: Partial<Autoavaliacao>) {
    if (!etapa) return;
    atualizar((anterior: EstadoApp) => {
      const existente = anterior.autoavaliacoes.find(
        (a) => a.pessoaId === pessoaAtiva.id && a.etapaId === etapa.id,
      );
      const base: Autoavaliacao = existente ?? {
        id: novoId("aa"),
        pessoaId: pessoaAtiva.id,
        etapaId: etapa.id,
        respostas: {},
        dimensoes: {},
      };
      const atualizado = { ...base, ...mudanca };
      return {
        ...anterior,
        autoavaliacoes: existente
          ? anterior.autoavaliacoes.map((a) =>
              a.pessoaId === pessoaAtiva.id && a.etapaId === etapa.id
                ? atualizado
                : a,
            )
          : [...anterior.autoavaliacoes, atualizado],
      };
    });
  }

  function responder(afirmacaoId: string, valor: number) {
    const novas = { ...respostas, [afirmacaoId]: valor };
    // rascunho gravado a cada clique
    salvarRegistro({
      respostas: novas,
      dimensoes: calcularDimensoes(novas, config.dimensoesAutoavaliacao),
    });
  }

  function concluir() {
    if (!etapa) return;
    const dimensoes = calcularDimensoes(
      respostas,
      config.dimensoesAutoavaliacao,
    );
    const agora = new Date().toISOString();

    atualizar((anterior: EstadoApp) => {
      const existente = anterior.autoavaliacoes.find(
        (a) => a.pessoaId === pessoaAtiva.id && a.etapaId === etapa.id,
      );
      const registroFinal: Autoavaliacao = {
        ...(existente ?? {
          id: novoId("aa"),
          pessoaId: pessoaAtiva.id,
          etapaId: etapa.id,
          respostas,
        }),
        respostas,
        dimensoes,
        concluidaEmISO: agora,
        formularioVersaoId: formularioVersaoVigente(anterior, "autoavaliacao")
          ?.id,
      };

      const autoavaliacoes = existente
        ? anterior.autoavaliacoes.map((a) =>
            a.pessoaId === pessoaAtiva.id && a.etapaId === etapa.id
              ? registroFinal
              : a,
          )
        : [...anterior.autoavaliacoes, registroFinal];

      let progressoEtapas = anterior.progressoEtapas;
      let notificacoes = anterior.notificacoes;

      if (etapa) {
        const temProgresso = progressoEtapas.some(
          (p) => p.pessoaId === pessoaAtiva.id && p.etapaId === etapa.id,
        );
        progressoEtapas = temProgresso
          ? progressoEtapas.map((p) =>
              p.pessoaId === pessoaAtiva.id && p.etapaId === etapa.id
                ? { ...p, status: "concluida" as const, atualizadoEmISO: agora }
                : p,
            )
          : [
              ...progressoEtapas,
              {
                id: novoId("prog"),
                pessoaId: pessoaAtiva.id,
                etapaId: etapa.id,
                status: "concluida" as const,
                atualizadoEmISO: agora,
              },
            ];

        notificacoes = [
          {
            id: novoId("not"),
            pessoaId: pessoaAtiva.id,
            titulo: "Etapa concluída",
            descricao: `"${etapa.nome}" foi concluída. Você já pode seguir para a próxima etapa da sua trilha.`,
            criadaEmISO: agora,
            lida: false,
            tipo: "mudanca_etapa" as const,
          },
          ...notificacoes,
        ];
      }

      return { ...anterior, autoavaliacoes, progressoEtapas, notificacoes };
    });

    toast.success("Autoavaliação concluída", {
      description: "Sua etapa foi marcada como concluída na trilha.",
    });
  }

  function refazer() {
    salvarRegistro({ respostas: {}, dimensoes: {}, concluidaEmISO: undefined });
  }

  if (!etapa) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Nenhuma autoavaliação configurada nesta jornada
          </CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          A equipe operadora ainda não incluiu uma etapa de autoavaliação na
          trilha.
        </CardContent>
      </Card>
    );
  }

  const concluida = Boolean(registro?.concluidaEmISO);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Abertura da jornada · {pessoaAtiva.nome}
        </p>
        <h1 className="text-3xl">{etapa.nome}</h1>
        <p className="text-muted-foreground">{etapa.descricao}</p>
      </header>

      {etapas.length > 1 && (
        <div className="flex flex-wrap gap-2">
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

      {concluida ? (
        <div className="space-y-5">
          <ResultadoAutoavaliacao
            dimensoes={registro?.dimensoes ?? {}}
            todasDimensoes={config.dimensoesAutoavaliacao}
            concluidaEmISO={registro?.concluidaEmISO}
          />
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/jornada">Ver minha trilha</Link>
            </Button>
            <Button variant="outline" onClick={refazer}>
              <RotateCcw className="size-4" aria-hidden />
              Refazer autoavaliação
            </Button>
          </div>
        </div>
      ) : (
        <FormularioAutoavaliacao
          respostas={respostas}
          dimensoes={config.dimensoesAutoavaliacao}
          aoResponder={responder}
          aoConcluir={concluir}
        />
      )}
    </div>
  );
}
