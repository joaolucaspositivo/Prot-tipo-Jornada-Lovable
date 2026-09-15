import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  CalendarCheck,
  CalendarClock,
  FileText,
  Send,
  Upload,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";

import {
  EditorTextoRico,
  TextoFormatado,
} from "@/components/entrega/EditorTextoRico";
import { EstadoBadge } from "@/components/EstadoBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/data/store";
import type { EstadoApp } from "@/data/types";
import { formatarData, novoId, prazoDaEtapa } from "@/lib/ciclo";
import { formatarDataHora, percursoDoDocente } from "@/lib/conteudo";
import {
  DESTINO_EQUIPE_CENTRAL,
  ROTULO_STATUS_ENTREGA,
  destinoDaEntrega,
  devolutivaDaEntrega,
  entregaDoDocente,
  etapasDeEntrega,
  formatarTamanho,
  janelaDaAula,
  paraInputDateTime,
  validarDataAula,
} from "@/lib/entrega";

export const Route = createFileRoute("/entrega")({
  head: () => ({
    meta: [
      { title: "Envio da tarefa — Jornada Pedagógica de Desenvolvimento" },
      {
        name: "description",
        content:
          "Envie a tarefa, o planejamento de aula e a data da aula a ser observada.",
      },
      { property: "og:title", content: "Envio da tarefa e do planejamento" },
      {
        property: "og:description",
        content:
          "Envie a tarefa, o planejamento de aula e a data da aula a ser observada.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EntregaPage,
});

interface ArquivoSimulado {
  nome: string;
  tipo: string;
  tamanho: number;
}

function EntregaPage() {
  const { estado, pessoaAtiva, atualizar } = useStore();
  const etapas = etapasDeEntrega(estado);
  const [etapaId, setEtapaId] = useState<string>(etapas[0]?.id ?? "");
  const etapa = etapas.find((e) => e.id === etapaId) ?? etapas[0];

  const { turma, modalidade } = percursoDoDocente(estado, pessoaAtiva);
  const destino = destinoDaEntrega(estado, pessoaAtiva);

  const entrega = etapa
    ? entregaDoDocente(estado, pessoaAtiva.id, etapa.id)
    : undefined;
  const devolutiva = devolutivaDaEntrega(estado, entrega?.id);

  const [texto, setTexto] = useState(entrega?.texto ?? "");
  const [arquivo, setArquivo] = useState<ArquivoSimulado | null>(
    entrega?.arquivoNome
      ? {
          nome: entrega.arquivoNome,
          tipo: entrega.arquivoTipo ?? "",
          tamanho: entrega.arquivoTamanho ?? 0,
        }
      : null,
  );
  const [dataAula, setDataAula] = useState(
    entrega?.dataAulaISO
      ? paraInputDateTime(new Date(entrega.dataAulaISO))
      : "",
  );
  const [erroData, setErroData] = useState<string | null>(null);
  const [editando, setEditando] = useState(!entrega);

  const janela = useMemo(
    () => (etapa ? janelaDaAula(estado, etapa) : null),
    [estado, etapa],
  );

  if (!etapa || !janela) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl">Envio da tarefa</h1>
        <p className="mt-2 text-muted-foreground">
          A trilha configurada para você não tem, neste momento, nenhuma etapa
          de entrega.
        </p>
      </div>
    );
  }

  const bloqueadoPorDevolutiva = Boolean(devolutiva);
  const registraPresenca = modalidade?.presencaAutomatica ?? false;

  function selecionarArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    // Upload simulado: guardamos apenas nome, tipo e tamanho.
    setArquivo({ nome: f.name, tipo: f.type || "arquivo", tamanho: f.size });
    e.target.value = "";
  }

  function enviar() {
    const conteudo = texto.trim();
    if (conteudo.length < 10) {
      toast.error("Escreva a tarefa antes de enviar.");
      return;
    }
    if (!arquivo) {
      toast.error("Anexe o arquivo do planejamento de aula.");
      return;
    }
    const erro = validarDataAula(dataAula, janela!);
    setErroData(erro);
    if (erro) return;

    const agora = new Date().toISOString();
    const dataAulaISO = new Date(dataAula).toISOString();
    const reenvio = Boolean(entrega);

    atualizar((anterior: EstadoApp): EstadoApp => {
      const registro = {
        id: entrega?.id ?? novoId("ent"),
        pessoaId: pessoaAtiva.id,
        etapaId: etapa!.id,
        texto: conteudo,
        arquivoNome: arquivo!.nome,
        arquivoTipo: arquivo!.tipo,
        arquivoTamanho: arquivo!.tamanho,
        dataAulaISO,
        enviadaEmISO: agora,
        destino: destino.tipo,
        status: "enviada" as const,
      };

      const entregas = entrega
        ? anterior.entregas.map((e) => (e.id === entrega.id ? registro : e))
        : [...anterior.entregas, registro];

      // Progresso da etapa + presença automática quando a modalidade previr.
      const existeProgresso = anterior.progressoEtapas.some(
        (p) => p.pessoaId === pessoaAtiva.id && p.etapaId === etapa!.id,
      );
      const progressoEtapas = existeProgresso
        ? anterior.progressoEtapas.map((p) =>
            p.pessoaId === pessoaAtiva.id && p.etapaId === etapa!.id
              ? {
                  ...p,
                  status: "concluida" as const,
                  atualizadoEmISO: agora,
                  presencaEmISO: registraPresenca ? agora : p.presencaEmISO,
                }
              : p,
          )
        : [
            ...anterior.progressoEtapas,
            {
              id: novoId("prog"),
              pessoaId: pessoaAtiva.id,
              etapaId: etapa!.id,
              status: "concluida" as const,
              atualizadoEmISO: agora,
              presencaEmISO: registraPresenca ? agora : undefined,
            },
          ];

      // A data informada entra automaticamente na agenda de quem observa.
      const etapaEncontro = anterior.cicloConfig.etapas
        .filter((e) => e.tipo === "encontro" && e.ordem > etapa!.ordem)
        .sort((a, b) => a.ordem - b.ordem)[0];
      const responsavelId =
        destino.tipo === "coordenador"
          ? destino.responsavelId
          : DESTINO_EQUIPE_CENTRAL;
      const jaAgendada = anterior.observacoes.find(
        (o) => o.pessoaId === pessoaAtiva.id && !o.realizadaEmISO,
      );
      const agendamento = {
        id: jaAgendada?.id ?? novoId("obs"),
        pessoaId: pessoaAtiva.id,
        coordenadorId: responsavelId,
        etapaId: etapaEncontro?.id ?? etapa!.id,
        dataAulaISO,
      };
      const observacoes = jaAgendada
        ? anterior.observacoes.map((o) =>
            o.id === jaAgendada.id ? { ...o, ...agendamento } : o,
          )
        : [...anterior.observacoes, agendamento];

      const notificacoes = [
        {
          id: novoId("not"),
          pessoaId: pessoaAtiva.id,
          titulo: reenvio ? "Entrega reenviada" : "Entrega recebida",
          descricao: `Sua tarefa de "${etapa!.nome}" foi encaminhada a ${destino.rotulo}. Aula agendada para ${formatarDataHora(dataAulaISO)}.`,
          criadaEmISO: agora,
          lida: false,
          tipo: "entrega_recebida" as const,
        },
        {
          id: novoId("not"),
          pessoaId: responsavelId,
          titulo: `Nova entrega de ${pessoaAtiva.nome}`,
          descricao: `Etapa "${etapa!.nome}". Aula a observar em ${formatarDataHora(dataAulaISO)}.`,
          criadaEmISO: agora,
          lida: false,
          tipo: "entrega_recebida" as const,
        },
        ...(registraPresenca
          ? [
              {
                id: novoId("not"),
                pessoaId: pessoaAtiva.id,
                titulo: "Presença registrada automaticamente",
                descricao: `Registrada em ${formatarDataHora(agora)} pelo envio da tarefa.`,
                criadaEmISO: agora,
                lida: false,
                tipo: "mudanca_etapa" as const,
              },
            ]
          : []),
        ...anterior.notificacoes,
      ];

      return {
        ...anterior,
        entregas,
        progressoEtapas,
        observacoes,
        notificacoes,
      };
    });

    setEditando(false);
    toast.success(
      `Entrega enviada a ${destino.rotulo}. A data da aula já entrou na agenda.`,
    );
  }

  const prazo = prazoDaEtapa(estado.cicloConfig, etapa);
  const progresso = estado.progressoEtapas.find(
    (p) => p.pessoaId === pessoaAtiva.id && p.etapaId === etapa.id,
  );

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {estado.cicloConfig.descricao} · {estado.cicloConfig.periodo}
      </p>
      <h1 className="mt-1 text-2xl sm:text-3xl">{etapa.nome}</h1>
      <p className="mt-1 text-muted-foreground">{etapa.descricao}</p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <EstadoBadge status={progresso?.status ?? "nao_iniciada"} />
        <Badge variant="outline">Prazo: {formatarData(prazo)}</Badge>
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
              onClick={() => {
                setEtapaId(e.id);
                setEditando(true);
                setTexto("");
                setArquivo(null);
                setDataAula("");
              }}
            >
              {e.nome}
            </Button>
          ))}
        </div>
      )}

      <p className="mt-5 flex items-start gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm">
        <UserCheck
          className="mt-0.5 size-4 shrink-0 text-primary"
          aria-hidden
        />
        <span>
          <strong>Quem vai receber: {destino.rotulo}.</strong>{" "}
          {destino.explicacao}
        </span>
      </p>

      {/* Status da própria entrega */}
      {entrega && (
        <Card className="mt-5">
          <CardHeader className="flex-row items-center gap-3 space-y-0">
            <Send className="size-5 text-primary" aria-hidden />
            <CardTitle className="text-base">Status da sua entrega</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={
                  entrega.status === "devolutiva_disponivel"
                    ? "secondary"
                    : "outline"
                }
              >
                {ROTULO_STATUS_ENTREGA[entrega.status]}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Enviada em {formatarDataHora(entrega.enviadaEmISO)}
              </span>
            </div>
            {entrega.dataAulaISO && (
              <p className="flex items-center gap-2 text-sm">
                <CalendarClock className="size-4 text-primary" aria-hidden />
                Aula a ser observada em {formatarDataHora(
                  entrega.dataAulaISO,
                )}{" "}
                — já na agenda de {destino.rotulo}.
              </p>
            )}
            {progresso?.presencaEmISO && (
              <p className="flex items-center gap-2 text-sm text-sucesso">
                <CalendarCheck className="size-4" aria-hidden />
                Presença registrada automaticamente em{" "}
                {formatarDataHora(progresso.presencaEmISO)}.
              </p>
            )}
            {devolutiva ? (
              <div className="rounded-lg border border-border p-3">
                <p className="text-sm font-medium">Devolutiva disponível</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {devolutiva.texto}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Você ainda pode reenviar esta entrega enquanto não houver
                devolutiva.
              </p>
            )}
            {!editando && !bloqueadoPorDevolutiva && (
              <Button variant="outline" onClick={() => setEditando(true)}>
                Reenviar entrega
              </Button>
            )}
            {!editando && (
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                  O que você enviou
                </p>
                <TextoFormatado texto={entrega.texto} />
                {entrega.arquivoNome && (
                  <p className="mt-2 flex items-center gap-2 text-sm">
                    <FileText className="size-4 text-primary" aria-hidden />
                    {entrega.arquivoNome}
                    <span className="text-muted-foreground">
                      {formatarTamanho(entrega.arquivoTamanho)}
                    </span>
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {editando && !bloqueadoPorDevolutiva && (
        <Card className="mt-5">
          <CardHeader>
            <CardTitle className="text-base">
              {entrega ? "Reenviar tarefa" : "Enviar tarefa"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="tarefa">Tarefa da etapa</Label>
              <EditorTextoRico
                valor={texto}
                aoMudar={setTexto}
                placeholder="Descreva a tarefa desenvolvida a partir do macrotema da jornada."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="planejamento">
                Planejamento de aula (arquivo)
              </Label>
              <div className="flex flex-wrap items-center gap-3">
                <Button asChild variant="outline">
                  <label htmlFor="planejamento" className="cursor-pointer">
                    <Upload className="size-4" aria-hidden />
                    Escolher arquivo
                  </label>
                </Button>
                <input
                  id="planejamento"
                  type="file"
                  className="sr-only"
                  onChange={selecionarArquivo}
                />
                {arquivo ? (
                  <span className="flex items-center gap-2 text-sm">
                    <FileText className="size-4 text-primary" aria-hidden />
                    {arquivo.nome}
                    <span className="text-muted-foreground">
                      {formatarTamanho(arquivo.tamanho)} · {arquivo.tipo}
                    </span>
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    Nenhum arquivo escolhido
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="data-aula">
                Data e horário da aula a ser observada (obrigatório)
              </Label>
              <Input
                id="data-aula"
                type="datetime-local"
                value={dataAula}
                min={paraInputDateTime(janela.inicio)}
                max={paraInputDateTime(janela.fim)}
                onChange={(e) => {
                  setDataAula(e.target.value);
                  setErroData(validarDataAula(e.target.value, janela));
                }}
                className="max-w-xs"
                aria-invalid={Boolean(erroData)}
              />
              <p className="text-sm text-muted-foreground">
                Janela válida: de {formatarData(janela.inicio)} até{" "}
                {formatarData(janela.fim)}.
              </p>
              {erroData && <p className="text-sm text-erro">{erroData}</p>}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={enviar}>
                <Send className="size-4" aria-hidden />
                {entrega ? "Reenviar para " : "Enviar para "}
                {destino.rotulo}
              </Button>
              {entrega && (
                <Button variant="ghost" onClick={() => setEditando(false)}>
                  Cancelar
                </Button>
              )}
            </div>
            {registraPresenca && (
              <p className="text-sm text-muted-foreground">
                Nesta modalidade, o envio registra sua presença automaticamente.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <p className="mt-6">
        <Button asChild variant="outline">
          <Link to="/jornada">Voltar para Minha Jornada</Link>
        </Button>
      </p>
    </div>
  );
}
