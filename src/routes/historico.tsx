import { createFileRoute } from "@tanstack/react-router";
import { Award, BookMarked, MessageSquareQuote, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/data/store";

export const Route = createFileRoute("/historico")({
  head: () => ({
    meta: [
      { title: "Jornadas anteriores — Jornada Pedagógica de Desenvolvimento" },
      {
        name: "description",
        content:
          "Linha do tempo com macrotemas cumpridos, turmas, entregas, devolutivas e conquistas de jornadas anteriores.",
      },
      { property: "og:title", content: "Jornadas anteriores" },
      {
        property: "og:description",
        content:
          "Macrotemas cumpridos, turmas, entregas, devolutivas e conquistas das jornadas anteriores.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HistoricoPage,
});

function HistoricoPage() {
  const { estado, pessoaAtiva } = useStore();
  const registros = estado.historicoTemas
    .filter((h) => h.pessoaId === pessoaAtiva.id)
    .sort((a, b) => b.ano - a.ano);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Seu percurso na rede
        </p>
        <h1 className="text-2xl sm:text-3xl">Jornadas anteriores</h1>
        <p className="text-muted-foreground">
          Estes macrotemas já foram cumpridos e, por isso, aparecem bloqueados
          na escolha do percurso desta jornada.
        </p>
      </header>

      {registros.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Você ainda não tem jornadas anteriores registradas.
          </CardContent>
        </Card>
      )}

      <ol className="relative space-y-6 border-l border-border pl-6">
        {registros.map((h) => (
          <li key={h.id} className="relative">
            <span
              className="absolute -left-[31px] top-4 size-3 rounded-full bg-primary ring-4 ring-background"
              aria-hidden
            />
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BookMarked className="size-4 text-primary" aria-hidden />
                    {h.temaNome}
                  </CardTitle>
                  <Badge variant="secondary">
                    {h.ciclo} · {h.ano}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {(h.turmaNome || h.modalidadeNome) && (
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Users className="size-4" aria-hidden />
                    {[h.turmaNome, h.modalidadeNome]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
                {h.entregaTitulo && (
                  <div>
                    <p className="font-medium">{h.entregaTitulo}</p>
                    {h.entregaResumo && (
                      <p className="text-muted-foreground">{h.entregaResumo}</p>
                    )}
                  </div>
                )}
                {h.devolutivaTexto && (
                  <div className="rounded-lg bg-secondary p-3">
                    <p className="flex items-center gap-2 font-medium">
                      <MessageSquareQuote className="size-4" aria-hidden />
                      Devolutiva de {h.devolutivaAutor ?? "coordenação"}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      {h.devolutivaTexto}
                    </p>
                  </div>
                )}
                {h.conquistas && h.conquistas.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <Award className="size-4 text-conquista" aria-hidden />
                    {h.conquistas.map((c) => (
                      <Badge key={c} variant="outline">
                        {c}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </li>
        ))}
      </ol>
    </div>
  );
}
