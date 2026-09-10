import { useEffect, useRef, useState } from "react";
import { BookOpenText, Clock, Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { TextoBase } from "@/data/conteudos";

interface Props {
  texto: TextoBase;
  percentual: number;
  aoAvancar: (percentual: number) => void;
}

const TAMANHOS = [
  { rotulo: "Padrão", classe: "text-base leading-8" },
  { rotulo: "Grande", classe: "text-lg leading-9" },
  { rotulo: "Maior", classe: "text-xl leading-10" },
];

/** Leitura confortável em coluna estreita, com progresso pelo scroll. */
export function LeituraTextoBase({ texto, percentual, aoAvancar }: Props) {
  const [tamanho, setTamanho] = useState(0);
  const area = useRef<HTMLDivElement | null>(null);
  const maior = useRef(percentual);

  useEffect(() => {
    const el = area.current;
    if (!el) return;
    function medir() {
      const alvo = area.current;
      if (!alvo) return;
      const total = alvo.scrollHeight - alvo.clientHeight;
      const lido =
        total <= 0 ? 100 : Math.round((alvo.scrollTop / total) * 100);
      if (lido > maior.current) {
        maior.current = Math.min(100, lido);
        aoAvancar(maior.current);
      }
    }
    medir();
    el.addEventListener("scroll", medir, { passive: true });
    return () => el.removeEventListener("scroll", medir);
  }, [aoAvancar, tamanho]);

  const estilo = TAMANHOS[tamanho] ?? TAMANHOS[0]!;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="size-4" aria-hidden />
          Cerca de {texto.tempoLeituraMin} min de leitura · {texto.autoria}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Tamanho do texto</span>
          <Button
            size="icon"
            variant="outline"
            aria-label="Diminuir tamanho do texto"
            onClick={() => setTamanho((t) => Math.max(0, t - 1))}
            disabled={tamanho === 0}
          >
            <Minus className="size-4" aria-hidden />
          </Button>
          <span className="min-w-16 text-center text-sm">{estilo.rotulo}</span>
          <Button
            size="icon"
            variant="outline"
            aria-label="Aumentar tamanho do texto"
            onClick={() => setTamanho((t) => Math.min(TAMANHOS.length - 1, t + 1))}
            disabled={tamanho === TAMANHOS.length - 1}
          >
            <Plus className="size-4" aria-hidden />
          </Button>
        </div>
      </div>

      <div
        ref={area}
        className="max-h-[26rem] overflow-y-auto rounded-2xl border border-border bg-card p-5 sm:p-7"
      >
        <div className="mx-auto max-w-[38rem]">
          <h3 className="flex items-start gap-2 text-xl leading-snug">
            <BookOpenText className="mt-1 size-5 shrink-0 text-primary" aria-hidden />
            {texto.titulo}
          </h3>
          <div className={`mt-4 space-y-5 ${estilo.classe}`}>
            {texto.paragrafos.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            Fim do texto-base. Ele fica sempre disponível aqui dentro, na sua
            trilha — não é preciso baixar arquivo nenhum.
          </p>
        </div>
      </div>

      <div className="mt-3">
        <div className="mb-1.5 flex items-baseline justify-between text-sm text-muted-foreground">
          <span>Leitura acompanhada conforme você avança</span>
          <span>{percentual}%</span>
        </div>
        <Progress value={percentual} aria-label="Progresso da leitura" />
      </div>
    </div>
  );
}
