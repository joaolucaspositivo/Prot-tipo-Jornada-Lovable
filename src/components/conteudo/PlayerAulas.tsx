import { useState } from "react";
import { Check, CirclePlay, Play, Video } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AulaConteudo } from "@/data/conteudos";
import { cn } from "@/lib/utils";

interface Props {
  aulas: AulaConteudo[];
  concluidas: Set<string>;
  aoConcluir: (aulaId: string) => void;
}

/**
 * Vídeo considerado assistido NO CLIQUE do play (D58) — não existe
 * rastreamento de tempo assistido, e isso não é lacuna a preencher, é
 * decisão. No MVP, este clique carrega o iframe real do vídeo hospedado no
 * Drive institucional; o protótipo não tem um vídeo de verdade para
 * apontar, então simula só esse passo — revela esta mesma área com outra
 * aparência, sem fingir ser um embed do Drive que não é.
 */
export function PlayerAulas({ aulas, concluidas, aoConcluir }: Props) {
  const [aulaId, setAulaId] = useState<string>(
    aulas.find((a) => !concluidas.has(a.id))?.id ?? aulas[0]?.id ?? "",
  );
  const aula = aulas.find((a) => a.id === aulaId) ?? aulas[0];

  if (!aula) return null;

  const assistida = concluidas.has(aula.id);

  return (
    <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
      <div>
        <div className="relative overflow-hidden rounded-2xl border border-border bg-foreground/90">
          <div className="flex aspect-video flex-col items-center justify-center gap-3 p-6 text-center">
            <Video className="size-10 text-background/70" aria-hidden />
            <p className="text-lg leading-snug text-background">
              {aula.titulo}
            </p>
            {assistida ? (
              <p className="max-w-sm text-sm text-background/70">
                Vídeo carregado do Drive institucional da rede —{" "}
                {aula.duracaoMin} min.
              </p>
            ) : (
              <>
                <p className="max-w-sm text-sm text-background/70">
                  Vídeo hospedado no Drive institucional da rede,{" "}
                  {aula.duracaoMin} min. Reprodução dentro do sistema, sem login
                  e sem sair desta tela.
                </p>
                <Button
                  variant="secondary"
                  className="mt-1 gap-1.5"
                  onClick={() => aoConcluir(aula.id)}
                >
                  <Play className="size-4" aria-hidden />
                  Assistir aula
                </Button>
              </>
            )}
          </div>
        </div>

        <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
          {assistida && <Check className="size-4 text-sucesso" aria-hidden />}
          {assistida ? "Aula assistida" : "Ainda não assistida"} ·{" "}
          {aula.arquivoDrive}
        </p>

        <p className="mt-3 text-sm text-muted-foreground">{aula.resumo}</p>
      </div>

      <ol className="space-y-2">
        {aulas.map((a, i) => {
          const feita = concluidas.has(a.id);
          const ativa = a.id === aula.id;
          return (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => setAulaId(a.id)}
                aria-current={ativa}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors",
                  ativa
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-sm",
                    feita
                      ? "bg-sucesso-suave text-sucesso"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {feita ? (
                    <Check className="size-4" aria-hidden />
                  ) : (
                    <span>{i + 1}</span>
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium leading-snug">
                    {a.titulo}
                  </span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CirclePlay className="size-3.5" aria-hidden />
                    {a.duracaoMin} min · {feita ? "assistida" : "não assistida"}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
