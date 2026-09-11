import { TriangleAlert } from "lucide-react";

/**
 * D11: se o vídeo ou o link de webconferência não carregar, a tela mostra
 * orientação em texto — nunca um quadro vazio. No protótipo isso é
 * simulado (mídia sem referência resolvida), mas o componente é real.
 */
export function AvisoConteudoIndisponivel({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-atraso/30 bg-atraso-suave p-4 text-sm text-foreground">
      <TriangleAlert
        className="mt-0.5 size-5 shrink-0 text-atraso"
        aria-hidden
      />
      <div>
        <p className="font-medium text-atraso">{titulo}</p>
        <p className="mt-1 text-muted-foreground">{children}</p>
      </div>
    </div>
  );
}
