import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Clock,
  Lock,
  Repeat,
  Sparkles,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dimensaoMaisFragil } from "@/data/autoavaliacao";
import { useStore } from "@/data/store";
import type { EstadoApp, Macrotema, Turma } from "@/data/types";
import { macrotemasAtivos, novoId } from "@/lib/ciclo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/percurso")({
  head: () => ({
    meta: [
      { title: "Escolha do percurso — Jornada Pedagógica de Desenvolvimento" },
      {
        name: "description",
        content: "Escolha de macrotema, modalidade e turma com autoinscrição.",
      },
      { property: "og:title", content: "Escolha do percurso da jornada" },
      {
        property: "og:description",
        content: "Escolha de macrotema, modalidade e turma com autoinscrição.",
      },
    ],
  }),
  component: PercursoPage,
});

function PercursoPage() {
  const { estado, pessoaAtiva, atualizar } = useStore();
  const config = estado.cicloConfig;

  const inscricao = estado.inscricoes.find(
    (i) => i.pessoaId === pessoaAtiva.id,
  );
  const [macrotemaEscolhido, setMacrotemaEscolhido] = useState<string | null>(
    null,
  );
  const [trocando, setTrocando] = useState(false);

  const ativos = macrotemasAtivos(config);
  const historico = estado.historicoMacrotemas.filter(
    (h) => h.pessoaId === pessoaAtiva.id,
  );
  const cumprido = (macrotemaId: string) =>
    historico.find((h) => h.macrotemaId === macrotemaId);

  // Sugestão vinda da autoavaliação: nunca bloqueia nem obriga.
  const autoavaliacao = estado.autoavaliacoes.find(
    (a) => a.pessoaId === pessoaAtiva.id && a.concluidaEmISO,
  );
  const fragil = autoavaliacao
    ? dimensaoMaisFragil(autoavaliacao.dimensoes)
    : null;
  const sugerido = fragil
    ? (ativos.find(
        (m) => m.dimensaoRelacionada === fragil.id && !cumprido(m.id),
      )?.id ?? null)
    : null;

  const etapaConteudo = config.etapas.find((e) => e.tipo === "conteudo");
  const conteudoIniciado = etapaConteudo
    ? estado.progressoEtapas.some(
        (p) =>
          p.pessoaId === pessoaAtiva.id &&
          p.etapaId === etapaConteudo.id &&
          p.status !== "nao_iniciada",
      )
    : false;

  // Etapa da trilha que representa a escolha do percurso, vinda da configuração.
  const etapasOrdenadas = [...config.etapas].sort((a, b) => a.ordem - b.ordem);
  const etapaEscolha =
    etapasOrdenadas.find((e) => e.tela === "percurso") ?? null;

  function inscrever(turma: Turma, turmaAnteriorId?: string) {
    const agora = new Date().toISOString();
    atualizar((anterior: EstadoApp) => {
      const turmas = anterior.turmas.map((t) => {
        if (t.id === turma.id)
          return { ...t, vagasOcupadas: t.vagasOcupadas + 1 };
        if (t.id === turmaAnteriorId)
          return { ...t, vagasOcupadas: Math.max(0, t.vagasOcupadas - 1) };
        return t;
      });

      // Preserva o tipo de participação já escolhido (D34): trocar de turma
      // não deveria resetar se o docente é regente ou corregente.
      const tipoParticipacao =
        anterior.inscricoes.find((i) => i.pessoaId === pessoaAtiva.id)
          ?.tipoParticipacao ?? "regente";
      const semAntiga = anterior.inscricoes.filter(
        (i) => i.pessoaId !== pessoaAtiva.id,
      );
      const inscricoes = [
        ...semAntiga,
        {
          id: novoId("insc"),
          pessoaId: pessoaAtiva.id,
          turmaId: turma.id,
          macrotemaId: turma.macrotemaId,
          tipoParticipacao,
          criadaEmISO: agora,
        },
      ];

      let progressoEtapas = anterior.progressoEtapas;
      let notificacoes = anterior.notificacoes;

      if (etapaEscolha && !turmaAnteriorId) {
        const existe = progressoEtapas.some(
          (p) => p.pessoaId === pessoaAtiva.id && p.etapaId === etapaEscolha.id,
        );
        progressoEtapas = existe
          ? progressoEtapas.map((p) =>
              p.pessoaId === pessoaAtiva.id && p.etapaId === etapaEscolha.id
                ? { ...p, status: "concluida" as const, atualizadoEmISO: agora }
                : p,
            )
          : [
              ...progressoEtapas,
              {
                id: novoId("prog"),
                pessoaId: pessoaAtiva.id,
                etapaId: etapaEscolha.id,
                status: "concluida" as const,
                atualizadoEmISO: agora,
              },
            ];
      }

      notificacoes = [
        {
          id: novoId("not"),
          pessoaId: pessoaAtiva.id,
          titulo: turmaAnteriorId ? "Turma alterada" : "Inscrição confirmada",
          descricao: `${turma.nome} — sua vaga está garantida, sem etapa de aprovação.`,
          criadaEmISO: agora,
          lida: false,
          tipo: "mudanca_etapa" as const,
        },
        ...notificacoes,
      ];

      return { ...anterior, turmas, inscricoes, progressoEtapas, notificacoes };
    });

    setTrocando(false);
    setMacrotemaEscolhido(null);
    toast.success(
      turmaAnteriorId ? "Turma alterada" : "Inscrição confirmada na hora",
      { description: `${turma.nome}. A vaga já está reservada para você.` },
    );
  }

  // ---- já inscrito ----
  if (inscricao && !trocando) {
    const turma = estado.turmas.find((t) => t.id === inscricao.turmaId);
    const macrotema = config.macrotemas.find(
      (m) => m.id === inscricao.macrotemaId,
    );
    const modalidade = config.modalidades.find(
      (m) => m.id === turma?.modalidadeId,
    );

    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Cabecalho />
        <Card className="border-sucesso/40 bg-sucesso-suave">
          <CardHeader className="flex-row items-start gap-3 space-y-0">
            <CheckCircle2
              className="mt-0.5 size-6 shrink-0 text-sucesso"
              aria-hidden
            />
            <div>
              <CardTitle className="text-lg">Inscrição confirmada</CardTitle>
              <p className="text-sm text-muted-foreground">
                Sem aprovação e sem espera: sua vaga já está reservada.
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <dl className="grid gap-3 sm:grid-cols-2">
              <Resumo rotulo="Macrotema" valor={macrotema?.nome ?? "—"} />
              <Resumo rotulo="Turma" valor={turma?.nome ?? "—"} />
              <Resumo rotulo="Modalidade" valor={modalidade?.nome ?? "—"} />
              <Resumo
                rotulo="Encontros"
                valor={`${turma?.periodo ?? "—"} · ${turma?.horario ?? ""}`}
              />
            </dl>
            <div className="flex flex-wrap gap-3 pt-1">
              <Button asChild size="lg">
                <Link to="/jornada">Ir para Minha Jornada</Link>
              </Button>
              {conteudoIniciado ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Lock className="size-4" aria-hidden />A troca de turma não
                  está mais disponível: o conteúdo já começou.
                </p>
              ) : (
                <Button variant="outline" onClick={() => setTrocando(true)}>
                  <Repeat className="size-4" aria-hidden />
                  Trocar de turma
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---- troca de turma dentro da mesma modalidade ----
  if (inscricao && trocando) {
    const turmaAtual = estado.turmas.find((t) => t.id === inscricao.turmaId);
    const opcoes = estado.turmas.filter(
      (t) =>
        t.macrotemaId === inscricao.macrotemaId &&
        t.modalidadeId === turmaAtual?.modalidadeId &&
        t.id !== turmaAtual?.id,
    );

    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Cabecalho />
        <Button variant="ghost" onClick={() => setTrocando(false)}>
          <ArrowLeft className="size-4" aria-hidden />
          Manter minha turma atual
        </Button>
        <p className="text-muted-foreground">
          A troca vale dentro da mesma modalidade
          {turmaAtual
            ? ` (${
                config.modalidades.find((m) => m.id === turmaAtual.modalidadeId)
                  ?.nome ?? ""
              })`
            : ""}
          . A vaga da turma atual volta a ficar disponível na hora.
        </p>
        {opcoes.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-muted-foreground">
              Não há outra turma desta modalidade neste macrotema.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {opcoes.map((t) => (
              <CardTurma
                key={t.id}
                turma={t}
                modalidadeNome={
                  config.modalidades.find((m) => m.id === t.modalidadeId)
                    ?.nome ?? "Modalidade"
                }
                aoEscolher={() => inscrever(t, turmaAtual?.id)}
                rotulo="Trocar para esta turma"
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ---- passo 2: turmas do macrotema escolhido ----
  if (macrotemaEscolhido) {
    const macrotema = ativos.find((m) => m.id === macrotemaEscolhido);
    const turmas = estado.turmas.filter(
      (t) => t.macrotemaId === macrotemaEscolhido,
    );

    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Cabecalho />
        <Button variant="ghost" onClick={() => setMacrotemaEscolhido(null)}>
          <ArrowLeft className="size-4" aria-hidden />
          Trocar de macrotema
        </Button>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Passo 2 de 2 · Modalidade e turma
          </p>
          <h2 className="font-display text-2xl">{macrotema?.nome}</h2>
        </div>
        {turmas.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-muted-foreground">
              Ainda não há turmas abertas para este macrotema.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {turmas.map((t) => (
              <CardTurma
                key={t.id}
                turma={t}
                modalidadeNome={
                  config.modalidades.find((m) => m.id === t.modalidadeId)
                    ?.nome ?? "Modalidade"
                }
                aoEscolher={() => inscrever(t)}
                rotulo="Inscrever-me nesta turma"
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ---- passo 1: macrotemas ----
  return (
    <div className="space-y-6">
      <Cabecalho />
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Passo 1 de 2 · Escolha do macrotema
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {ativos.map((m) => (
          <CardMacrotema
            key={m.id}
            macrotema={m}
            bloqueio={cumprido(m.id)}
            sugerido={m.id === sugerido}
            aoEscolher={() => setMacrotemaEscolhido(m.id)}
          />
        ))}
      </div>
      {ativos.length === 0 && (
        <Card>
          <CardContent className="py-6 text-muted-foreground">
            Nenhum macrotema ativo na configuração desta jornada.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Cabecalho() {
  const { estado } = useStore();
  return (
    <header className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {estado.cicloConfig.nome} · {estado.cicloConfig.periodo}
      </p>
      <h1 className="text-3xl">Escolha do seu percurso</h1>
      <p className="text-muted-foreground">
        Você escolhe o tema e a turma e já fica inscrito. Não há fila de
        aprovação.
      </p>
    </header>
  );
}

function CardMacrotema({
  macrotema,
  bloqueio,
  sugerido,
  aoEscolher,
}: {
  macrotema: Macrotema;
  bloqueio: { ciclo: string; ano: number } | undefined;
  sugerido: boolean;
  aoEscolher: () => void;
}) {
  return (
    <Card
      className={cn(
        "flex flex-col justify-between transition-colors",
        bloqueio && "border-dashed bg-muted/60",
        sugerido && !bloqueio && "border-primary ring-1 ring-primary/30",
      )}
    >
      <CardHeader className="space-y-2">
        {sugerido && !bloqueio && (
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-conquista-suave px-2.5 py-1 text-xs font-semibold text-conquista">
            <Sparkles className="size-3.5" aria-hidden />
            Sugerido pela sua autoavaliação
          </span>
        )}
        {bloqueio && (
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-bloqueado/30 bg-bloqueado-suave px-2.5 py-1 text-xs font-semibold text-bloqueado">
            <Lock className="size-3.5" aria-hidden />
            Cumprido na jornada anterior ({bloqueio.ano})
          </span>
        )}
        <CardTitle className="text-base leading-snug">
          {macrotema.nome}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{macrotema.descricao}</p>
      </CardHeader>
      <CardContent>
        {bloqueio ? (
          <p className="text-sm text-muted-foreground">
            Você concluiu este macrotema no {bloqueio.ciclo}, em {bloqueio.ano}.
            Por isso ele não pode ser escolhido de novo.
          </p>
        ) : (
          <Button className="w-full" onClick={aoEscolher}>
            Escolher este macrotema
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function CardTurma({
  turma,
  modalidadeNome,
  aoEscolher,
  rotulo,
}: {
  turma: Turma;
  modalidadeNome: string;
  aoEscolher: () => void;
  rotulo: string;
}) {
  const restantes = Math.max(0, turma.vagas - turma.vagasOcupadas);
  const esgotada = restantes === 0;

  return (
    <Card className={cn(esgotada && "border-dashed bg-muted/60")}>
      <CardHeader className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-primary">
          {modalidadeNome}
        </span>
        <CardTitle className="text-base">{turma.nome}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CalendarClock className="size-4" aria-hidden />
            {turma.periodo}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="size-4" aria-hidden />
            {turma.horario}
          </span>
          <span
            className={cn(
              "flex items-center gap-1.5",
              esgotada ? "text-bloqueado" : "text-sucesso",
            )}
          >
            <Users className="size-4" aria-hidden />
            {esgotada
              ? "Turma esgotada"
              : `${restantes} de ${turma.vagas} vagas disponíveis`}
          </span>
        </div>
        <Button className="w-full" onClick={aoEscolher} disabled={esgotada}>
          {esgotada ? "Sem vagas nesta turma" : rotulo}
        </Button>
      </CardContent>
    </Card>
  );
}

function Resumo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {rotulo}
      </dt>
      <dd className="mt-1 font-medium">{valor}</dd>
    </div>
  );
}
