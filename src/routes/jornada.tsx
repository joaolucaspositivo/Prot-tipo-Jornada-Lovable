import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, PartyPopper } from "lucide-react";

import { Conquistas } from "@/components/jornada/Conquistas";
import { PainelEtapa } from "@/components/jornada/PainelEtapa";
import { Trilha } from "@/components/jornada/Trilha";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useStore } from "@/data/store";
import { formatarData } from "@/lib/ciclo";
import {
  conquistasDoDocente,
  progressoDaTrilha,
  proximaEtapa,
  trilhaDoDocente,
} from "@/lib/jornada";

export const Route = createFileRoute("/jornada")({
  head: () => ({
    meta: [
      { title: "Minha Jornada — Jornada Pedagógica de Desenvolvimento" },
      {
        name: "description",
        content:
          "Trilha do docente no Ciclo 2: etapas, prazos, conquistas e próxima ação.",
      },
      { property: "og:title", content: "Minha Jornada" },
      {
        property: "og:description",
        content:
          "Trilha do docente no Ciclo 2: etapas, prazos, conquistas e próxima ação.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: JornadaPage,
});

function JornadaPage() {
  const { estado, pessoaAtiva } = useStore();
  const [etapaAberta, setEtapaAberta] = useState<string | null>(null);

  const trilha = trilhaDoDocente(estado, pessoaAtiva);
  const { concluidas, total, percentual } = progressoDaTrilha(trilha);
  const proxima = proximaEtapa(trilha);
  const conquistas = conquistasDoDocente(estado, pessoaAtiva);

  const inscricao = estado.inscricoes.find(
    (i) => i.pessoaId === pessoaAtiva.id,
  );
  const turmaDoDocente = inscricao
    ? estado.turmas.find((t) => t.id === inscricao.turmaId)
    : undefined;
  const macrotemaDoDocente = inscricao
    ? estado.cicloConfig.macrotemas.find(
        (m) => m.id === (turmaDoDocente?.macrotemaId ?? inscricao.macrotemaId),
      )
    : undefined;
  const preenchidoAte = proxima
    ? trilha.findIndex((i) => i.etapa.id === proxima.etapa.id)
    : trilha.length - 1;

  const itemAberto = trilha.find((i) => i.etapa.id === etapaAberta);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {estado.cicloConfig.nome} · {estado.cicloConfig.periodo}
      </p>
      {inscricao && (
        <p className="text-sm text-muted-foreground">
          {turmaDoDocente?.nome ?? "Turma removida"} ·{" "}
          {macrotemaDoDocente?.nome ?? "Macrotema removido"}
        </p>
      )}
      <h1 className="mt-1 text-2xl sm:text-3xl">Minha Jornada</h1>

      {pessoaAtiva.cargo === "corregente" && (
        <p className="mt-3 rounded-xl border border-accent bg-accent/40 p-3 text-sm">
          Você atua como <strong>corregente</strong>: sua tarefa e a devolutiva
          sobre ela são acompanhadas pela <strong>equipe central</strong>, e não
          pelo coordenador da sua unidade.
        </p>
      )}

      {/* O que falta para concluir */}
      <section
        aria-labelledby="titulo-proxima"
        className="mt-4 rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:p-5"
      >
        <h2 id="titulo-proxima" className="sr-only">
          O que falta para concluir
        </h2>
        {proxima ? (
          <>
            <p className="text-lg leading-snug">
              Sua próxima ação é{" "}
              <strong className="font-semibold">{proxima.etapa.nome}</strong>,
              até {formatarData(proxima.prazo)}.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {proxima.etapa.descricao}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {proxima.acao.para ? (
                <Button asChild className="gap-1.5">
                  <Link to={proxima.acao.para}>
                    {proxima.acao.rotulo}
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </Button>
              ) : (
                <Button
                  className="gap-1.5"
                  onClick={() => setEtapaAberta(proxima.etapa.id)}
                >
                  {proxima.acao.rotulo}
                  <ArrowRight className="size-4" aria-hidden />
                </Button>
              )}
            </div>
          </>
        ) : (
          <p className="flex items-center gap-2 text-lg">
            <PartyPopper className="size-5 text-conquista" aria-hidden />
            Você concluiu todas as etapas do ciclo. Nada pendente por aqui.
          </p>
        )}

        <div className="mt-4">
          <div className="mb-1.5 flex items-baseline justify-between text-sm text-muted-foreground">
            <span>
              {concluidas} de {total} etapas concluídas
            </span>
            <span>{percentual}%</span>
          </div>
          <Progress value={percentual} aria-label="Progresso do ciclo" />
        </div>
      </section>

      <div className="mt-6">
        <Conquistas itens={conquistas} />
      </div>

      <section aria-labelledby="titulo-trilha" className="mt-6">
        <h2 id="titulo-trilha" className="mb-3 text-base">
          Sua trilha, passo a passo
        </h2>
        <Trilha
          itens={trilha}
          preenchidoAte={preenchidoAte}
          aoAbrir={setEtapaAberta}
        />
      </section>

      <PainelEtapa
        item={itemAberto}
        aberto={itemAberto !== undefined}
        aoFechar={() => setEtapaAberta(null)}
      />
    </div>
  );
}
