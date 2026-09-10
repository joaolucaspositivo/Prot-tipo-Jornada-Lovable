import { useEffect, useRef, useState } from "react";
import { Check, CirclePlay, Pause, Play, Video } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { AulaConteudo } from "@/data/conteudos";
import { cn } from "@/lib/utils";

interface Props {
  aulas: AulaConteudo[];
  concluidas: Set<string>;
  aoConcluir: (aulaId: string) => void;
}

/**
 * Player simulado: o vídeo está hospedado no Drive institucional e roda dentro
 * do próprio sistema, sem pedir login e sem abrir outra ferramenta.
 */
export function PlayerAulas({ aulas, concluidas, aoConcluir }: Props) {
  const [aulaId, setAulaId] = useState<string>(
    aulas.find((a) => !concluidas.has(a.id))?.id ?? aulas[0]?.id ?? "",
  );
  const aula = aulas.find((a) => a.id === aulaId) ?? aulas[0];

  const [tocando, setTocando] = useState(false);
  const [posicao, setPosicao] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setPosicao(concluidas.has(aulaId) ? 100 : 0);
    setTocando(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aulaId]);

  useEffect(() => {
    if (!tocando) return;
    timer.current = setInterval(() => {
      setPosicao((p) => Math.min(100, p + 2));
    }, 120);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [tocando]);

  useEffect(() => {
    if (posicao >= 100 && aula && !concluidas.has(aula.id)) {
      setTocando(false);
      aoConcluir(aula.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posicao]);

  if (!aula) return null;

  const minutoAtual = Math.round((posicao / 100) * aula.duracaoMin);

  return (
    <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
      <div>
        <div className="relative overflow-hidden rounded-2xl border border-border bg-foreground/90">
          <div className="flex aspect-video flex-col items-center justify-center gap-3 p-6 text-center">
            <Video className="size-10 text-background/70" aria-hidden />
            <p className="text-background text-lg leading-snug">{aula.titulo}</p>
            <p className="max-w-sm text-sm text-background/70">
              Vídeo hospedado no Drive institucional da rede. Reprodução dentro
              do sistema, sem login e sem sair desta tela.
            </p>
            <Button
              variant="secondary"
              className="mt-1 gap-1.5"
              onClick={() => setTocando((t) => !t)}
              disabled={posicao >= 100}
            >
              {tocando ? (
                <Pause className="size-4" aria-hidden />
              ) : (
                <Play className="size-4" aria-hidden />
              )}
              {posicao >= 100
                ? "Aula assistida"
                : tocando
                  ? "Pausar"
                  : posicao > 0
                    ? "Continuar"
                    : "Reproduzir aula"}
            </Button>
          </div>
        </div>

        <div className="mt-3">
          <Progress
            value={posicao}
            aria-label={`Progresso da aula ${aula.titulo}`}
          />
          <div className="mt-1.5 flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {minutoAtual} min de {aula.duracaoMin} min
            </span>
            <span className="truncate pl-3 text-xs">{aula.arquivoDrive}</span>
          </div>
        </div>

        <p className="mt-3 text-sm text-muted-foreground">{aula.resumo}</p>

        {!concluidas.has(aula.id) && (
          <Button
            variant="outline"
            className="mt-3 gap-1.5"
            onClick={() => aoConcluir(aula.id)}
          >
            <Check className="size-4" aria-hidden />
            Marcar aula como assistida
          </Button>
        )}
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
