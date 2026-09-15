import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Award,
  Eye,
  FileText,
  Paperclip,
  Save,
  Send,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { TextoFormatado } from "@/components/entrega/EditorTextoRico";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/data/store";
import type { AnexoPortfolio, EstadoApp } from "@/data/types";
import {
  coordenadorPrincipalDoDocente,
  formatarData,
  novoId,
  prazoDaEtapa,
  tipoParticipacaoDaPessoa,
} from "@/lib/ciclo";
import { formatarDataHora } from "@/lib/conteudo";
import { formatarTamanho } from "@/lib/entrega";
import {
  conquistasDoDocente,
  etapaDePortfolio,
  itensDoCiclo,
  portfolioDoDocente,
  reflexoesConfiguradas,
} from "@/lib/portfolio";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      {
        title: "Portfólio de Inovação Docente — Jornada Pedagógica",
      },
      {
        name: "description",
        content:
          "Reúna as entregas do ciclo, registre reflexões, anexe materiais e envie o portfólio para devolutiva.",
      },
      { property: "og:title", content: "Portfólio de Inovação Docente" },
      {
        property: "og:description",
        content:
          "Reúna as entregas do ciclo, registre reflexões, anexe materiais e envie o portfólio para devolutiva.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PortfolioPage,
});

function PortfolioPage() {
  const { estado, pessoaAtiva, atualizar } = useStore();
  const etapa = etapaDePortfolio(estado, pessoaAtiva);
  const campos = reflexoesConfiguradas(estado);
  const salvo = portfolioDoDocente(estado, pessoaAtiva.id);
  const itens = itensDoCiclo(estado, pessoaAtiva.id);
  const conquistas = conquistasDoDocente(estado, pessoaAtiva.id);

  const [reflexoes, setReflexoes] = useState<Record<string, string>>(
    salvo?.reflexoes ?? {},
  );
  const [anexos, setAnexos] = useState<AnexoPortfolio[]>(salvo?.anexos ?? []);
  const [previa, setPrevia] = useState(false);

  if (!etapa) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl">Portfólio de Inovação Docente</h1>
        <p className="mt-2 text-muted-foreground">
          A trilha configurada para você ainda não tem uma etapa de portfólio.
        </p>
      </div>
    );
  }

  const enviado = salvo?.status === "enviado";
  const preenchidos = campos.filter((c) => (reflexoes[c.id] ?? "").trim());

  function anexar(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    // Anexo simulado: guardamos apenas os metadados do arquivo.
    setAnexos((a) => [
      ...a,
      {
        id: novoId("anx"),
        nome: f.name,
        arquivoTipo: f.type || "arquivo",
        tamanhoBytes: f.size,
        anexadoEmISO: new Date().toISOString(),
      },
    ]);
    e.target.value = "";
    toast.success("Material anexado ao portfólio.");
  }

  function gravar(status: "rascunho" | "enviado") {
    if (status === "enviado" && preenchidos.length < campos.length) {
      toast.error("Responda todos os campos de reflexão antes de enviar.");
      return;
    }
    const agora = new Date().toISOString();

    atualizar((anterior: EstadoApp): EstadoApp => {
      const registro = {
        id: salvo?.id ?? novoId("port"),
        pessoaId: pessoaAtiva.id,
        etapaId: etapa!.id,
        reflexoes,
        anexos,
        status,
        atualizadoEmISO: agora,
        enviadoEmISO: status === "enviado" ? agora : salvo?.enviadoEmISO,
      };
      const portfolios = salvo
        ? anterior.portfolios.map((p) => (p.id === salvo.id ? registro : p))
        : [...anterior.portfolios, registro];

      if (status === "rascunho") return { ...anterior, portfolios };

      // Envio fecha a etapa e encaminha para devolutiva.
      const existe = anterior.progressoEtapas.some(
        (p) => p.pessoaId === pessoaAtiva.id && p.etapaId === etapa!.id,
      );
      const progressoEtapas = existe
        ? anterior.progressoEtapas.map((p) =>
            p.pessoaId === pessoaAtiva.id && p.etapaId === etapa!.id
              ? { ...p, status: "concluida" as const, atualizadoEmISO: agora }
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
            },
          ];

      const destinoId =
        tipoParticipacaoDaPessoa(estado, pessoaAtiva.id) === "corregente"
          ? "equipe-central"
          : (coordenadorPrincipalDoDocente(estado, pessoaAtiva.id)?.id ??
            "equipe-central");

      return {
        ...anterior,
        portfolios,
        progressoEtapas,
        entregas: [
          ...anterior.entregas.filter(
            (e) => !(e.pessoaId === pessoaAtiva.id && e.etapaId === etapa!.id),
          ),
          {
            id: novoId("ent"),
            pessoaId: pessoaAtiva.id,
            etapaId: etapa!.id,
            texto: campos
              .map((c) => `${c.pergunta}\n${reflexoes[c.id] ?? ""}`)
              .join("\n\n"),
            arquivoNome: anexos[0]?.nome,
            arquivoTipo: anexos[0]?.arquivoTipo,
            arquivoTamanho: anexos[0]?.tamanhoBytes,
            enviadaEmISO: agora,
            destino:
              tipoParticipacaoDaPessoa(estado, pessoaAtiva.id) === "corregente"
                ? ("equipe_central" as const)
                : ("coordenador" as const),
            status: "enviada" as const,
          },
        ],
        notificacoes: [
          {
            id: novoId("not"),
            pessoaId: pessoaAtiva.id,
            titulo: "Portfólio enviado",
            descricao: `Seu portfólio de "${etapa!.nome}" foi encaminhado para devolutiva.`,
            criadaEmISO: agora,
            lida: false,
            tipo: "entrega_recebida" as const,
          },
          {
            id: novoId("not"),
            pessoaId: destinoId,
            titulo: `Portfólio de ${pessoaAtiva.nome}`,
            descricao: `Portfólio de Inovação Docente disponível para devolutiva.`,
            criadaEmISO: agora,
            lida: false,
            tipo: "entrega_recebida" as const,
          },
          ...anterior.notificacoes,
        ],
      };
    });

    toast.success(
      status === "enviado"
        ? "Portfólio enviado para devolutiva."
        : "Rascunho salvo neste navegador.",
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Encerramento do ciclo
        </p>
        <h1 className="text-2xl sm:text-3xl">{etapa.nome}</h1>
        <p className="text-muted-foreground">
          {etapa.descricao} Prazo:{" "}
          {formatarData(prazoDaEtapa(estado.cicloConfig, etapa))}.
        </p>
        {enviado && salvo?.enviadoEmISO && (
          <Badge className="mt-1 bg-sucesso text-primary-foreground">
            Enviado em {formatarDataHora(salvo.enviadoEmISO)}
          </Badge>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="size-4 text-primary" aria-hidden />
                Reflexões do ciclo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {campos.map((campo, i) => (
                <div key={campo.id} className="space-y-1.5">
                  <Label htmlFor={campo.id}>
                    {i + 1}. {campo.pergunta}
                  </Label>
                  <p className="text-xs text-muted-foreground">{campo.ajuda}</p>
                  <Textarea
                    id={campo.id}
                    rows={4}
                    value={reflexoes[campo.id] ?? ""}
                    disabled={enviado}
                    onChange={(e) =>
                      setReflexoes((r) => ({
                        ...r,
                        [campo.id]: e.target.value,
                      }))
                    }
                    placeholder="Escreva aqui…"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Paperclip className="size-4 text-primary" aria-hidden />
                Materiais anexados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {anexos.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nenhum material anexado ainda.
                </p>
              )}
              <ul className="space-y-2">
                {anexos.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <FileText
                        className="size-4 text-muted-foreground"
                        aria-hidden
                      />
                      {a.nome}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatarTamanho(a.tamanhoBytes)}
                    </span>
                  </li>
                ))}
              </ul>
              {!enviado && (
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-primary/50 px-4 py-2 text-sm font-medium text-primary">
                  <Paperclip className="size-4" aria-hidden />
                  Anexar material do ciclo
                  <input type="file" className="sr-only" onChange={anexar} />
                </label>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => setPrevia((p) => !p)}
              className="gap-2"
            >
              <Eye className="size-4" aria-hidden />
              {previa ? "Fechar pré-visualização" : "Pré-visualizar portfólio"}
            </Button>
            {!enviado && (
              <>
                <Button
                  variant="secondary"
                  onClick={() => gravar("rascunho")}
                  className="gap-2"
                >
                  <Save className="size-4" aria-hidden />
                  Salvar rascunho
                </Button>
                <Button onClick={() => gravar("enviado")} className="gap-2">
                  <Send className="size-4" aria-hidden />
                  Enviar para devolutiva
                </Button>
              </>
            )}
            <Button variant="ghost" asChild>
              <Link to="/jornada">Voltar para Minha Jornada</Link>
            </Button>
          </div>

          {previa && (
            <Card className="border-primary/40">
              <CardHeader>
                <CardTitle className="text-base">
                  Pré-visualização — {pessoaAtiva.nome}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {campos.map((c) => (
                  <div key={c.id}>
                    <p className="font-medium">{c.pergunta}</p>
                    <p className="text-muted-foreground">
                      {reflexoes[c.id]?.trim() || "— sem resposta —"}
                    </p>
                  </div>
                ))}
                <div>
                  <p className="font-medium">Entregas reunidas</p>
                  <ul className="list-disc pl-5 text-muted-foreground">
                    {itens.map((i, k) => (
                      <li key={k}>
                        {i.etapaNome} · {formatarDataHora(i.quando)}
                      </li>
                    ))}
                    {itens.length === 0 && <li>Nenhuma entrega neste ciclo</li>}
                  </ul>
                </div>
                <div>
                  <p className="font-medium">Materiais</p>
                  <p className="text-muted-foreground">
                    {anexos.map((a) => a.nome).join(", ") || "— nenhum —"}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Entregas deste ciclo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {itens.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Assim que você enviar uma tarefa, ela aparece aqui
                  automaticamente.
                </p>
              )}
              {itens.map((item, k) => (
                <div key={k} className="rounded-lg border border-border p-3">
                  <p className="text-sm font-medium">{item.etapaNome}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatarDataHora(item.quando)}
                    {item.arquivoNome ? ` · ${item.arquivoNome}` : ""}
                  </p>
                  <div className="mt-2 text-xs text-muted-foreground">
                    <TextoFormatado texto={item.texto} />
                  </div>
                  {item.devolutiva && (
                    <p className="mt-2 rounded-md bg-secondary p-2 text-xs">
                      <span className="font-medium">
                        Devolutiva de {item.autorDevolutiva}:{" "}
                      </span>
                      {item.devolutiva}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Award className="size-4 text-conquista" aria-hidden />
                Conquistas do ciclo
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {conquistas.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nenhuma conquista acesa ainda.
                </p>
              )}
              {conquistas.map((c) => (
                <Badge key={c} variant="secondary">
                  {c}
                </Badge>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
