import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, RotateCcw, UserCog } from "lucide-react";
import { useState, type ReactNode } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ROTULO_PERFIL, useStore } from "@/data/store";
import type { PerfilId } from "@/data/types";
import { cn } from "@/lib/utils";

import { CentralNotificacoes } from "./CentralNotificacoes";
import { NAVEGACAO_POR_PERFIL } from "./navegacao";

const PERFIS: PerfilId[] = [
  "docente-regente",
  "docente-corregente",
  "coordenador",
  "operadora",
  "diretor",
];

function SeletorPerfil() {
  const { estado, trocarPerfil } = useStore();
  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed border-primary-foreground/50 bg-primary-foreground/10 px-2 py-1.5">
      <UserCog className="size-4 text-primary-foreground" aria-hidden />
      <div className="hidden text-xs font-semibold uppercase tracking-wide text-primary-foreground sm:block">
        Demonstração
      </div>

      <Select
        value={estado.perfilAtivo}
        onValueChange={(v) => trocarPerfil(v as PerfilId)}
      >
        <SelectTrigger
          className="h-10 w-[13rem] border-0 bg-background text-foreground"
          aria-label="Trocar o perfil de demonstração"
        >
          <SelectValue>{ROTULO_PERFIL[estado.perfilAtivo]}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {PERFIS.map((p) => (
            <SelectItem key={p} value={p}>
              {ROTULO_PERFIL[p]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ListaNav({ aoNavegar }: { aoNavegar?: () => void }) {
  const { estado } = useStore();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const itens = NAVEGACAO_POR_PERFIL[estado.perfilAtivo];

  return (
    <nav className="flex flex-col gap-1 p-3" aria-label="Navegação principal">
      {itens.map(({ para, rotulo, Icone }) => {
        const ativo = pathname === para;
        return (
          <Link
            key={para}
            to={para as "/"}
            onClick={aoNavegar}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-3 text-[0.98rem] font-medium transition-colors",
              ativo
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/85 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            )}
          >
            <Icone className="size-5 shrink-0" aria-hidden />
            {rotulo}
          </Link>
        );
      })}
    </nav>
  );
}

function BotaoReset() {
  const { resetarDemonstracao } = useStore();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button className="flex w-full items-center gap-2 px-3 py-2 text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground">
          <RotateCcw className="size-3.5" aria-hidden />
          Resetar dados de demonstração
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Resetar os dados de demonstração?</AlertDialogTitle>
          <AlertDialogDescription>
            Tudo o que foi preenchido durante a demonstração volta ao estado
            inicial. Nenhum dado real é afetado.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={resetarDemonstracao}>
            Resetar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { estado, pessoaAtiva } = useStore();
  const [menuAberto, setMenuAberto] = useState(false);
  const ciclo = estado.cicloConfig;

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-border bg-primary text-primary-foreground">
        <div className="flex items-center gap-3 px-3 py-2.5 md:px-5">
          <Sheet open={menuAberto} onOpenChange={setMenuAberto}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-foreground hover:bg-primary-foreground/10 md:hidden"
                aria-label="Abrir menu"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-sidebar p-0">
              <SheetTitle className="px-4 pt-4 text-sidebar-foreground">
                Navegação
              </SheetTitle>
              <ListaNav aoNavegar={() => setMenuAberto(false)} />
            </SheetContent>
          </Sheet>

          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-base font-semibold md:text-lg">
              Jornada Pedagógica de Desenvolvimento
            </p>
            <p className="truncate text-xs text-primary-foreground/75">
              {ciclo.nome} · {ciclo.periodo} · {pessoaAtiva.nome}
            </p>
          </div>

          <CentralNotificacoes />

          <div className="hidden md:block">
            <SeletorPerfil />
          </div>
        </div>
        <div className="border-t border-white/10 px-3 py-2 md:hidden">
          <SeletorPerfil />
        </div>
        <p className="border-t border-white/15 bg-primary/95 px-3 py-1 text-center text-[0.7rem] font-medium tracking-wide text-primary-foreground/80 md:px-5">
          Protótipo para validação — dados fictícios, sem back-end
        </p>
      </header>

      <aside className="fixed bottom-0 left-0 top-[6.4rem] z-30 hidden w-64 flex-col justify-between border-r border-sidebar-border bg-sidebar md:flex">
        <ListaNav />
        <div className="border-t border-sidebar-border p-2">
          <BotaoReset />
        </div>
      </aside>

      <main className="px-4 pb-16 pt-[10.9rem] md:ml-64 md:px-8 md:pt-28">
        <div className="mx-auto max-w-6xl">{children}</div>
        <div className="mx-auto mt-2 max-w-6xl md:hidden">
          <BotaoReset />
        </div>
      </main>
    </div>
  );
}
