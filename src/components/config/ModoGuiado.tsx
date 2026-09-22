import {
  Check,
  ChevronLeft,
  ChevronRight,
  ListChecks,
  Lock,
} from "lucide-react";

import { useCicloConfig } from "./comum";
import { Button } from "@/components/ui/button";
import { resumoConferenciaCiclo } from "@/lib/ciclo";

/** As 8 abas, na ordem de dependência (3.3), mais o passo de síntese final. */
export const PASSOS_GUIADOS = [
  "geral",
  "temas",
  "modalidades",
  "turmas",
  "etapas",
  "conteudo",
  "alertas",
  "encerramento",
  "conferencia",
] as const;

export type PassoGuiado = (typeof PASSOS_GUIADOS)[number];

export const TITULO_PASSO_GUIADO: Record<PassoGuiado, string> = {
  geral: "Geral",
  temas: "Macrotemas",
  modalidades: "Modalidades",
  turmas: "Turmas",
  etapas: "Etapas da trilha",
  conteudo: "Conteúdo",
  alertas: "Alertas de pendência",
  encerramento: "Encerramento",
  conferencia: "Conferência",
};

interface Props {
  guiado: boolean;
  aoAlternarGuiado: (v: boolean) => void;
  passoAtual: PassoGuiado;
  passosConcluidos: Set<PassoGuiado>;
  passoTravado: (p: PassoGuiado) => boolean;
  aoIrParaPasso: (p: PassoGuiado) => void;
  aoAvancar: () => void;
  aoVoltar: () => void;
}

export function CabecalhoModoGuiado({
  guiado,
  aoAlternarGuiado,
  passoAtual,
  passosConcluidos,
  passoTravado,
  aoIrParaPasso,
  aoAvancar,
  aoVoltar,
}: Props) {
  const indiceAtual = PASSOS_GUIADOS.indexOf(passoAtual);
  const temAnterior = indiceAtual > 0;
  const proximo = PASSOS_GUIADOS[indiceAtual + 1];

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium">Modo guiado</p>
          <p className="text-sm text-muted-foreground">
            Percorre a configuração do ciclo passo a passo, na ordem de
            dependência.
          </p>
        </div>
        <Button
          type="button"
          variant={guiado ? "default" : "outline"}
          onClick={() => aoAlternarGuiado(!guiado)}
        >
          <ListChecks className="size-4" />
          {guiado ? "Sair do modo guiado" : "Ativar modo guiado"}
        </Button>
      </div>

      {guiado ? (
        <>
          <ol className="mt-4 flex flex-wrap gap-2">
            {PASSOS_GUIADOS.map((passo, i) => {
              const travado = passoTravado(passo);
              const concluido = passosConcluidos.has(passo);
              const atual = passo === passoAtual;
              return (
                <li key={passo}>
                  <button
                    type="button"
                    disabled={travado}
                    onClick={() => aoIrParaPasso(passo)}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      atual
                        ? "border-primary bg-primary text-primary-foreground"
                        : concluido
                          ? "border-sucesso/40 bg-sucesso-suave text-sucesso"
                          : travado
                            ? "cursor-not-allowed border-border text-muted-foreground/50"
                            : "border-border text-foreground hover:bg-secondary"
                    }`}
                  >
                    {concluido ? (
                      <Check className="size-3.5" aria-hidden />
                    ) : travado ? (
                      <Lock className="size-3.5" aria-hidden />
                    ) : (
                      <span className="flex size-3.5 items-center justify-center text-[0.65rem]">
                        {i + 1}
                      </span>
                    )}
                    {TITULO_PASSO_GUIADO[passo]}
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="mt-3 flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={!temAnterior}
              onClick={aoVoltar}
            >
              <ChevronLeft className="size-4" /> Voltar
            </Button>
            <p className="text-xs text-muted-foreground">
              Passo {indiceAtual + 1} de {PASSOS_GUIADOS.length}
            </p>
            <Button
              type="button"
              disabled={!proximo || passoTravado(proximo)}
              onClick={aoAvancar}
            >
              Próximo <ChevronRight className="size-4" />
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}

/** Passo final do modo guiado: resumo do ciclo, sem edição. */
export function ResumoConferencia() {
  const { estado, config, mesociclo } = useCicloConfig();
  const turmas = estado.turmas.filter((t) => t.mesocicloId === mesociclo.id);
  const resumo = resumoConferenciaCiclo(estado, config, turmas);

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div>
        <p className="font-medium">Conferência do ciclo</p>
        <p className="text-sm text-muted-foreground">
          Resumo de tudo o que foi configurado. Nada aqui é editável — volte a
          um passo anterior para mudar algo.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Macrotemas ativos
          </p>
          <p className="text-2xl font-semibold">{resumo.temasAtivos}</p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Modalidades ativas
          </p>
          <p className="text-2xl font-semibold">{resumo.modalidadesAtivas}</p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Turmas
          </p>
          <p className="text-2xl font-semibold">{resumo.totalTurmas}</p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Vagas totais
          </p>
          <p className="text-2xl font-semibold">{resumo.totalVagas}</p>
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-sm font-medium">Etapas, na ordem da trilha</p>
        <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
          {resumo.etapasEmOrdem.map((nome) => (
            <li key={nome}>{nome}</li>
          ))}
        </ol>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-sucesso/30 bg-sucesso-suave p-3">
          <p className="text-xs uppercase tracking-wide text-sucesso">
            Ofertas com conteúdo
          </p>
          <p className="text-2xl font-semibold text-sucesso">
            {resumo.ofertasComConteudo}
          </p>
        </div>
        <div className="rounded-lg border border-atraso/30 bg-atraso-suave p-3">
          <p className="text-xs uppercase tracking-wide text-atraso">
            Ofertas ainda vazias
          </p>
          <p className="text-2xl font-semibold text-atraso">
            {resumo.ofertasVazias}
          </p>
        </div>
      </div>
    </div>
  );
}
