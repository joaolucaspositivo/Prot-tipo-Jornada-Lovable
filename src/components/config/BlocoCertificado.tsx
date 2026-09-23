import { useState } from "react";
import { Award, TriangleAlert } from "lucide-react";

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  elegibilidadeCertificadoDoCiclo,
  emitirCertificados,
} from "@/lib/certificado";

import { useCicloConfig } from "./comum";

/**
 * Emissão manual de certificado (D42, dentro da etapa de encerramento) — o
 * gatilho combinado no Pacote 0. A confirmação avisa que os nomes de tema
 * travam a partir da emissão (D42); quem faz esse bloqueio valer de fato é
 * `temaTravadoPorCertificado`, consultada em AbaTemas.
 */
export function BlocoCertificado() {
  const { estado, mesociclo, atualizar, pessoaAtiva } = useCicloConfig();
  const elegiveis = elegibilidadeCertificadoDoCiclo(estado, mesociclo);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());

  const marcaveis = elegiveis.filter((e) => e.elegivel);
  const todosMarcados =
    marcaveis.length > 0 &&
    marcaveis.every((e) => selecionados.has(e.pessoa.id));

  function alternar(pessoaId: string) {
    setSelecionados((anterior) => {
      const novo = new Set(anterior);
      if (novo.has(pessoaId)) novo.delete(pessoaId);
      else novo.add(pessoaId);
      return novo;
    });
  }

  function alternarTodos() {
    setSelecionados(
      todosMarcados ? new Set() : new Set(marcaveis.map((e) => e.pessoa.id)),
    );
  }

  function emitir() {
    const { conclusoes, certificados } = emitirCertificados(
      elegiveis,
      [...selecionados],
      estado,
      pessoaAtiva.id,
    );
    atualizar((anterior) => ({
      ...anterior,
      conclusoes: [...anterior.conclusoes, ...conclusoes],
      certificados: [...anterior.certificados, ...certificados],
    }));
    setSelecionados(new Set());
  }

  return (
    <div className="space-y-3 rounded-xl border border-dashed border-border p-4">
      <div>
        <h3 className="flex items-center gap-2 font-medium">
          <Award className="size-4 text-conquista" aria-hidden />
          Emissão de certificado
        </h3>
        <p className="text-sm text-muted-foreground">
          Trilha completa e carga horária declarada (aba Geral) — quem falha um
          critério aparece aqui mesmo assim, com o motivo.
        </p>
      </div>

      {elegiveis.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum docente inscrito neste ciclo ainda.
        </p>
      ) : (
        <>
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <Checkbox
              checked={todosMarcados}
              disabled={marcaveis.length === 0}
              onCheckedChange={alternarTodos}
              aria-label="Selecionar todos os elegíveis"
            />
            <span className="text-xs text-muted-foreground">
              {selecionados.size} selecionado(s) de {marcaveis.length}{" "}
              elegível(is)
            </span>
          </div>

          <ul className="max-h-80 space-y-2 overflow-y-auto">
            {elegiveis.map((e) => (
              <li
                key={e.pessoa.id}
                className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border p-2.5 ${
                  e.elegivel ? "border-border" : "border-border/60 opacity-60"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selecionados.has(e.pessoa.id)}
                    disabled={!e.elegivel}
                    onCheckedChange={() => alternar(e.pessoa.id)}
                    aria-label={`Selecionar ${e.pessoa.nome}`}
                  />
                  <div>
                    <p className="text-sm font-medium">{e.pessoa.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {e.temaNome ?? "Sem tema"} · {e.percentualTrilha}% da
                      trilha
                      {e.cargaHoraria !== undefined
                        ? ` · ${e.cargaHoraria}h`
                        : ""}
                    </p>
                  </div>
                </div>
                {!e.elegivel && (
                  <Badge variant="outline" className="text-xs">
                    {e.motivoInelegivel}
                  </Badge>
                )}
              </li>
            ))}
          </ul>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={selecionados.size === 0} className="gap-2">
                <Award className="size-4" aria-hidden />
                Emitir certificado ({selecionados.size})
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <TriangleAlert className="size-5 text-atraso" aria-hidden />
                  Emitir {selecionados.size} certificado(s)?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  A carga horária declarada agora fica congelada no registro de
                  conclusão de cada docente selecionado (D56). A partir desta
                  emissão, o NOME do tema deles trava — não poderá mais ser
                  editado (D42).
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={emitir}>
                  Emitir mesmo assim
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}
