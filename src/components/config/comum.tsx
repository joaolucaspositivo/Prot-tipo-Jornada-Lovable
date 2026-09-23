import {
  GripVertical,
  ChevronDown,
  ChevronUp,
  TriangleAlert,
} from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useStore } from "@/data/store";
import type { CicloConfig, Mesociclo } from "@/data/types";
import { temasDoMesociclo } from "@/lib/ciclo";

/**
 * Qual mesociclo a tela de Configuração de ciclos está editando agora —
 * não é o mesmo conceito de "ciclo vigente" (`cicloAtivo`, lib/ciclo.ts).
 * A operadora pode configurar um ciclo futuro sem que ele esteja rodando.
 */
const MesocicloEmEdicaoCtx = createContext<string | null>(null);

export function MesocicloEmEdicaoProvider({
  mesocicloId,
  children,
}: {
  mesocicloId: string;
  children: ReactNode;
}) {
  return (
    <MesocicloEmEdicaoCtx.Provider value={mesocicloId}>
      {children}
    </MesocicloEmEdicaoCtx.Provider>
  );
}

/** Lê e grava a configuração do mesociclo em edição (persistida em localStorage pelo store). */
export function useCicloConfig() {
  const { estado, atualizar, pessoaAtiva } = useStore();
  const mesocicloId = useContext(MesocicloEmEdicaoCtx);
  if (!mesocicloId) {
    throw new Error(
      "useCicloConfig precisa estar dentro de MesocicloEmEdicaoProvider",
    );
  }

  const config =
    estado.cicloConfigs.find((c) => c.mesocicloId === mesocicloId) ??
    estado.cicloConfigs[0]!;
  const mesociclo =
    estado.mesociclos.find((m) => m.id === mesocicloId) ??
    estado.mesociclos[0]!;
  // Herdados do macrociclo (D40) — o mesmo conjunto para todo mesociclo dele.
  const temas = temasDoMesociclo(estado, mesociclo.id);

  const salvarConfig = useCallback(
    (mudanca: (c: CicloConfig) => CicloConfig) => {
      atualizar((anterior) => ({
        ...anterior,
        cicloConfigs: anterior.cicloConfigs.map((c) =>
          c.mesocicloId === mesocicloId ? mudanca(c) : c,
        ),
      }));
    },
    [atualizar, mesocicloId],
  );

  const salvarMesociclo = useCallback(
    (mudanca: (m: Mesociclo) => Mesociclo) => {
      atualizar((anterior) => ({
        ...anterior,
        mesociclos: anterior.mesociclos.map((m) =>
          m.id === mesocicloId ? mudanca(m) : m,
        ),
      }));
    },
    [atualizar, mesocicloId],
  );

  return {
    estado,
    config,
    mesociclo,
    temas,
    salvarConfig,
    salvarMesociclo,
    atualizar,
    pessoaAtiva,
  };
}

interface PedidoConfirmacao {
  titulo: string;
  descricao: string;
  impacto?: string | undefined;
  rotuloAcao?: string | undefined;
  aoConfirmar: () => void;
}

/**
 * Aviso de impacto: alerta antes de aplicar, mas nunca bloqueia a operadora.
 */
export function useAvisoImpacto() {
  const [pedido, setPedido] = useState<PedidoConfirmacao | null>(null);

  const confirmar = useCallback(
    (p: PedidoConfirmacao & { precisaAviso?: boolean }) => {
      if (p.precisaAviso === false) {
        p.aoConfirmar();
        return;
      }
      setPedido(p);
    },
    [],
  );

  const dialogo = (
    <AlertDialog
      open={pedido !== null}
      onOpenChange={(aberto) => !aberto && setPedido(null)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <TriangleAlert className="size-5 text-atraso" aria-hidden />
            {pedido?.titulo}
          </AlertDialogTitle>
          <AlertDialogDescription>{pedido?.descricao}</AlertDialogDescription>
        </AlertDialogHeader>
        {pedido?.impacto ? (
          <p className="rounded-lg border border-atraso/30 bg-atraso-suave px-3 py-2 text-sm text-foreground">
            {pedido.impacto}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              pedido?.aoConfirmar();
              setPedido(null);
            }}
          >
            {pedido?.rotuloAcao ?? "Aplicar mesmo assim"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { confirmar, dialogo };
}

interface ItemArrastavelProps {
  indice: number;
  total: number;
  aoMover: (de: number, para: number) => void;
  children: ReactNode;
  rotulo: string;
  /** false trava o arraste deste item (D43) — as setas continuam visíveis, mas `aoMover` é quem decide se o movimento é aceito */
  arrastavel?: boolean;
}

/**
 * Item de lista reordenável: arrastar com o mouse ou usar as setas
 * (público com familiaridade tecnológica variada precisa das duas formas).
 */
export function ItemArrastavel({
  indice,
  total,
  aoMover,
  children,
  rotulo,
  arrastavel = true,
}: ItemArrastavelProps) {
  const [sobre, setSobre] = useState(false);

  return (
    <li
      draggable={arrastavel}
      onDragStart={(e) => e.dataTransfer.setData("text/plain", String(indice))}
      onDragOver={(e) => {
        e.preventDefault();
        setSobre(true);
      }}
      onDragLeave={() => setSobre(false)}
      onDrop={(e) => {
        e.preventDefault();
        setSobre(false);
        const de = Number(e.dataTransfer.getData("text/plain"));
        if (!Number.isNaN(de) && de !== indice) aoMover(de, indice);
      }}
      className={`rounded-xl border bg-card p-4 shadow-sm transition ${
        sobre ? "border-accent ring-2 ring-accent/40" : "border-border"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-1 pt-1">
          <GripVertical
            className="size-5 cursor-grab text-muted-foreground"
            aria-hidden
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            disabled={indice === 0}
            aria-label={`Mover ${rotulo} para cima`}
            onClick={() => aoMover(indice, indice - 1)}
          >
            <ChevronUp className="size-4" />
          </Button>
          <span className="text-xs font-semibold text-muted-foreground">
            {indice + 1}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            disabled={indice === total - 1}
            aria-label={`Mover ${rotulo} para baixo`}
            onClick={() => aoMover(indice, indice + 1)}
          >
            <ChevronDown className="size-4" />
          </Button>
        </div>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </li>
  );
}
