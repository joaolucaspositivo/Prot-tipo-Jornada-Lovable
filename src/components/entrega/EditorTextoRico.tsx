import { useRef, type ReactNode } from "react";
import { Bold, Italic, List } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

/**
 * Campo de texto com formatação simples (negrito, itálico e lista).
 * O conteúdo é guardado como texto marcado e renderizado por um leitor
 * próprio — nenhum HTML do usuário é interpretado.
 */
export function EditorTextoRico({
  valor,
  aoMudar,
  placeholder,
  desabilitado = false,
}: {
  valor: string;
  aoMudar: (v: string) => void;
  placeholder?: string;
  desabilitado?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function envolver(marca: string) {
    const el = ref.current;
    if (!el) return;
    const inicio = el.selectionStart;
    const fim = el.selectionEnd;
    const selecionado = valor.slice(inicio, fim) || "texto";
    aoMudar(
      `${valor.slice(0, inicio)}${marca}${selecionado}${marca}${valor.slice(fim)}`,
    );
    requestAnimationFrame(() => el.focus());
  }

  function listar() {
    const el = ref.current;
    if (!el) return;
    const inicio = valor.lastIndexOf("\n", Math.max(0, el.selectionStart - 1)) + 1;
    aoMudar(`${valor.slice(0, inicio)}- ${valor.slice(inicio)}`);
    requestAnimationFrame(() => el.focus());
  }

  return (
    <div className="rounded-xl border border-input bg-background">
      <div className="flex flex-wrap items-center gap-1 border-b border-border p-1.5">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={desabilitado}
          onClick={() => envolver("**")}
          aria-label="Negrito"
        >
          <Bold className="size-4" aria-hidden />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={desabilitado}
          onClick={() => envolver("_")}
          aria-label="Itálico"
        >
          <Italic className="size-4" aria-hidden />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={desabilitado}
          onClick={listar}
          aria-label="Lista"
        >
          <List className="size-4" aria-hidden />
        </Button>
        <span className="ml-auto pr-2 text-xs text-muted-foreground">
          **negrito** · _itálico_ · - lista
        </span>
      </div>
      <Textarea
        ref={ref}
        value={valor}
        disabled={desabilitado}
        onChange={(e) => aoMudar(e.target.value)}
        placeholder={placeholder ?? ""}
        className="min-h-44 resize-y border-0 focus-visible:ring-0"
      />
    </div>
  );
}

function inline(texto: string, chave: string): ReactNode[] {
  const partes = texto.split(/(\*\*[^*]+\*\*|_[^_]+_)/g).filter(Boolean);
  return partes.map((parte, i) => {
    if (parte.startsWith("**") && parte.endsWith("**")) {
      return <strong key={`${chave}-${i}`}>{parte.slice(2, -2)}</strong>;
    }
    if (parte.startsWith("_") && parte.endsWith("_")) {
      return <em key={`${chave}-${i}`}>{parte.slice(1, -1)}</em>;
    }
    return <span key={`${chave}-${i}`}>{parte}</span>;
  });
}

/** Leitura segura do texto formatado: só negrito, itálico e listas. */
export function TextoFormatado({ texto }: { texto: string }) {
  const linhas = texto.split("\n");
  const blocos: ReactNode[] = [];
  let itens: string[] = [];

  const fecharLista = (chave: string) => {
    if (itens.length === 0) return;
    blocos.push(
      <ul key={`ul-${chave}`} className="list-disc space-y-1 pl-5">
        {itens.map((item, i) => (
          <li key={`${chave}-${i}`}>{inline(item, `${chave}-${i}`)}</li>
        ))}
      </ul>,
    );
    itens = [];
  };

  linhas.forEach((linha, i) => {
    if (linha.trimStart().startsWith("- ")) {
      itens.push(linha.trimStart().slice(2));
      return;
    }
    fecharLista(String(i));
    if (linha.trim()) {
      blocos.push(<p key={`p-${i}`}>{inline(linha, `p-${i}`)}</p>);
    }
  });
  fecharLista("fim");

  return <div className="space-y-2 text-sm leading-relaxed">{blocos}</div>;
}
