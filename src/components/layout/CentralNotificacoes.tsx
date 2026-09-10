import { Bell, BellOff, CheckCheck } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStore } from "@/data/store";
import {
  ROTULO_TIPO_NOTIFICACAO,
  marcarLida,
  marcarTodasLidas,
  naoLidas,
  notificacoesDaPessoa,
  tempoRelativo,
} from "@/lib/notificacoes";
import { cn } from "@/lib/utils";

export function CentralNotificacoes() {
  const { estado, pessoaAtiva, atualizar } = useStore();
  const [aberto, setAberto] = useState(false);
  const [somenteNaoLidas, setSomenteNaoLidas] = useState(false);

  const lista = useMemo(
    () => notificacoesDaPessoa(estado, pessoaAtiva),
    [estado, pessoaAtiva],
  );
  const pendentes = naoLidas(lista);
  const visiveis = somenteNaoLidas ? lista.filter((n) => !n.lida) : lista;

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-primary-foreground hover:bg-primary-foreground/10"
          aria-label={
            pendentes > 0
              ? `Avisos: ${pendentes} não lidos`
              : "Avisos: nenhum não lido"
          }
        >
          <Bell className="size-5" />
          {pendentes > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex min-w-5 items-center justify-center rounded-full bg-atraso px-1 text-[0.7rem] font-bold leading-5 text-background">
              {pendentes > 99 ? "99+" : pendentes}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-[min(22rem,calc(100vw-1.5rem))] p-0"
      >
        <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
          <p className="font-semibold">Seus avisos</p>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs"
            disabled={pendentes === 0}
            onClick={() => atualizar((e) => marcarTodasLidas(e, lista))}
          >
            <CheckCheck className="mr-1 size-3.5" aria-hidden />
            Marcar todos como lidos
          </Button>
        </div>

        <div className="flex gap-2 border-b border-border px-3 py-2">
          <Button
            variant={somenteNaoLidas ? "outline" : "secondary"}
            size="sm"
            className="h-8 text-xs"
            onClick={() => setSomenteNaoLidas(false)}
          >
            Todos ({lista.length})
          </Button>
          <Button
            variant={somenteNaoLidas ? "secondary" : "outline"}
            size="sm"
            className="h-8 text-xs"
            onClick={() => setSomenteNaoLidas(true)}
          >
            Não lidos ({pendentes})
          </Button>
        </div>

        <ScrollArea className="max-h-[24rem]">
          {visiveis.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <BellOff className="size-6 text-muted-foreground" aria-hidden />
              <p className="text-sm font-medium">
                {somenteNaoLidas
                  ? "Você já leu todos os avisos"
                  : "Nenhum aviso por aqui"}
              </p>
              <p className="text-xs text-muted-foreground">
                Avisos aparecem quando uma etapa muda, uma tarefa é recebida,
                uma devolutiva fica disponível ou um prazo se aproxima.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {visiveis.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => atualizar((e) => marcarLida(e, n))}
                    className={cn(
                      "w-full px-3 py-3 text-left transition-colors hover:bg-muted",
                      !n.lida && "bg-accent/40",
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {!n.lida && (
                        <span
                          className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
                          aria-hidden
                        />
                      )}
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-sm font-semibold leading-snug">
                          {n.titulo}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {n.descricao}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 pt-0.5">
                          <Badge variant="secondary" className="text-[0.7rem]">
                            {ROTULO_TIPO_NOTIFICACAO[n.tipo]}
                          </Badge>
                          <span className="text-[0.7rem] text-muted-foreground">
                            {tempoRelativo(n.criadaEmISO)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
