import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Clock,
  Lock,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { StatusEtapa } from "@/data/types";

// Todo estado combina cor + ícone + texto. Nunca apenas cor.
const MAPA: Record<
  StatusEtapa,
  { texto: string; classe: string; Icone: typeof CheckCircle2 }
> = {
  concluida: {
    texto: "Concluída",
    classe: "bg-sucesso-suave text-sucesso border-sucesso/30",
    Icone: CheckCircle2,
  },
  em_andamento: {
    texto: "Em andamento",
    classe: "bg-andamento-suave text-andamento border-andamento/30",
    Icone: Clock,
  },
  bloqueada: {
    texto: "Bloqueada",
    classe: "bg-bloqueado-suave text-bloqueado border-bloqueado/30",
    Icone: Lock,
  },
  pendente: {
    texto: "Pendente",
    classe: "bg-conquista-suave text-conquista border-conquista/30",
    Icone: Clock,
  },
  atrasada: {
    texto: "Atrasada",
    classe: "bg-atraso-suave text-atraso border-atraso/30",
    Icone: AlertTriangle,
  },
  nao_iniciada: {
    texto: "Não iniciada",
    classe: "bg-muted text-muted-foreground border-border",
    Icone: CircleDashed,
  },
};

export function EstadoBadge({
  status,
  className,
}: {
  status: StatusEtapa;
  className?: string;
}) {
  const { texto, classe, Icone } = MAPA[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm font-medium",
        classe,
        className,
      )}
    >
      <Icone className="size-4 shrink-0" aria-hidden />
      {texto}
    </span>
  );
}
