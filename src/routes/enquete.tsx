import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, ClipboardList, Send } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ResumoEnquete } from "@/components/enquete/ResumoEnquete";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/data/store";
import type { EstadoApp } from "@/data/types";
import { cicloConfigAtivo, formularioVersaoVigente, novoId } from "@/lib/ciclo";
import {
  etapasDeEnquete,
  perguntasDoPublico,
  publicosDaEnquete,
  respostasDoDocente,
} from "@/lib/enquete";

export const Route = createFileRoute("/enquete")({
  head: () => ({
    meta: [
      { title: "Enquete 360° — Jornada Pedagógica de Desenvolvimento" },
      {
        name: "description",
        content:
          "Coleta da Enquete 360° com docentes, coordenação, estudantes e famílias, dentro do próprio sistema.",
      },
      { property: "og:title", content: "Enquete 360°" },
      {
        property: "og:description",
        content:
          "Coleta e resumo agregado da Enquete 360° sobre a prática do docente.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EnquetePage,
});

function EnquetePage() {
  const { estado, pessoaAtiva, atualizar } = useStore();
  const config = cicloConfigAtivo(estado).enquete;
  const publicos = publicosDaEnquete(estado);
  const docentes = useMemo(
    () => estado.pessoas.filter((p) => p.perfil.startsWith("docente")),
    [estado.pessoas],
  );

  const ehDocente = pessoaAtiva.perfil.startsWith("docente");

  const [docenteId, setDocenteId] = useState(
    ehDocente ? pessoaAtiva.id : (docentes[0]?.id ?? ""),
  );
  const [publicoId, setPublicoId] = useState(publicos[0]?.id ?? "");
  const [nome, setNome] = useState("");
  const [escalas, setEscalas] = useState<Record<string, number>>({});
  const [textos, setTextos] = useState<Record<string, string>>({});

  const perguntas = perguntasDoPublico(estado, publicoId);
  const jaColetadas = respostasDoDocente(estado, docenteId).length;

  function enviar() {
    const faltando = perguntas.filter(
      (p) => p.tipo === "escala" && !escalas[p.id],
    );
    if (faltando.length > 0) {
      toast.error("Responda todas as afirmações antes de enviar.");
      return;
    }
    const agora = new Date().toISOString();
    const publico = publicos.find((p) => p.id === publicoId);

    atualizar((anterior: EstadoApp): EstadoApp => {
      // Quando o próprio docente responde, a etapa configurada é concluída
      // — a etapa é do CICLO DO DOCENTE avaliado, não da vigente. Com mais
      // de uma etapa de enquete (D52), a resposta conta para a primeira
      // ainda não concluída — sem seletor de rodada nesta tela, que a
      // Enquete não tem por estar em stand-by (D47).
      const etapasDocente = etapasDeEnquete(anterior, docenteId);
      const etapa =
        etapasDocente.find(
          (e) =>
            !anterior.progressoEtapas.some(
              (p) =>
                p.pessoaId === docenteId &&
                p.etapaId === e.id &&
                p.status === "concluida",
            ),
        ) ?? etapasDocente[0];

      const resposta = {
        id: novoId("enq"),
        docenteId,
        etapaId: etapa?.id ?? "",
        respondenteTipoId: publicoId,
        respondenteNome:
          nome.trim() || `${publico?.nome ?? "Respondente"} (anônimo)`,
        escalas,
        textos,
        enviadaEmISO: agora,
        formularioVersaoId: formularioVersaoVigente(anterior, "enquete")?.id,
      };

      const concluiEtapa = etapa && publicoId === publicos[0]?.id && docenteId;
      const progressoEtapas =
        concluiEtapa && etapa
          ? anterior.progressoEtapas.some(
              (p) => p.pessoaId === docenteId && p.etapaId === etapa.id,
            )
            ? anterior.progressoEtapas.map((p) =>
                p.pessoaId === docenteId && p.etapaId === etapa.id
                  ? {
                      ...p,
                      status: "concluida" as const,
                      atualizadoEmISO: agora,
                    }
                  : p,
              )
            : [
                ...anterior.progressoEtapas,
                {
                  id: novoId("prog"),
                  pessoaId: docenteId,
                  etapaId: etapa.id,
                  status: "concluida" as const,
                  atualizadoEmISO: agora,
                },
              ]
          : anterior.progressoEtapas;

      return {
        ...anterior,
        respostasEnquete: [...anterior.respostasEnquete, resposta],
        progressoEtapas,
        notificacoes: [
          {
            id: novoId("not"),
            pessoaId: docenteId,
            titulo: "Nova resposta na Enquete 360°",
            descricao: `Uma resposta do público "${publico?.nome ?? ""}" foi registrada.`,
            criadaEmISO: agora,
            lida: false,
            tipo: "mudanca_etapa" as const,
          },
          ...anterior.notificacoes,
        ],
      };
    });

    setEscalas({});
    setTextos({});
    setNome("");
    toast.success("Resposta registrada.");
  }

  if (publicos.length === 0) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Encerramento da jornada
        </p>
        <h1 className="mt-1 text-2xl">{config.titulo}</h1>
        <p className="mt-2 text-muted-foreground">
          A Enquete 360° deste ciclo ainda não foi configurada.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Encerramento da jornada
        </p>
        <h1 className="text-2xl sm:text-3xl">{config.titulo}</h1>
        <p className="text-muted-foreground">{config.instrucao}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="size-4 text-primary" aria-hidden />
              Responder a enquete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Sobre qual docente</Label>
                <Select value={docenteId} onValueChange={setDocenteId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha o docente" />
                  </SelectTrigger>
                  <SelectContent>
                    {docentes.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Quem está respondendo</Label>
                <Select value={publicoId} onValueChange={setPublicoId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha o público" />
                  </SelectTrigger>
                  <SelectContent>
                    {publicos.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="nome-resp">Identificação (opcional)</Label>
              <Input
                id="nome-resp"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Deixe em branco para responder sem se identificar"
              />
            </div>

            <div className="space-y-5">
              {perguntas.map((pg) =>
                pg.tipo === "escala" ? (
                  <fieldset key={pg.id} className="space-y-2">
                    <legend className="text-sm font-medium">{pg.texto}</legend>
                    <div className="flex flex-wrap gap-2">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          aria-pressed={escalas[pg.id] === n}
                          onClick={() =>
                            setEscalas((s) => ({ ...s, [pg.id]: n }))
                          }
                          className={`size-11 rounded-lg border text-sm font-semibold transition ${
                            escalas[pg.id] === n
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border hover:border-primary"
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                      <span className="self-center text-xs text-muted-foreground">
                        1 = discordo · 5 = concordo
                      </span>
                    </div>
                  </fieldset>
                ) : (
                  <div key={pg.id} className="space-y-1.5">
                    <Label htmlFor={pg.id}>{pg.texto}</Label>
                    <Textarea
                      id={pg.id}
                      rows={3}
                      value={textos[pg.id] ?? ""}
                      onChange={(e) =>
                        setTextos((t) => ({ ...t, [pg.id]: e.target.value }))
                      }
                    />
                  </div>
                ),
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={enviar} className="gap-2">
                <Send className="size-4" aria-hidden />
                Enviar resposta
              </Button>
              <Badge variant="secondary" className="gap-1">
                <CheckCircle2 className="size-3" aria-hidden />
                {jaColetadas} resposta(s) já coletada(s) sobre este docente
              </Badge>
            </div>
          </CardContent>
        </Card>

        <ResumoEnquete docenteId={docenteId} />
      </div>
    </div>
  );
}
