import { useMemo } from "react";
import { BellRing } from "lucide-react";
import { toast } from "sonner";

import { FunilEtapas } from "@/components/acompanhamento/FunilEtapas";
import { PainelEquipe } from "@/components/coordenador/PainelEquipe";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/data/store";
import { novoId } from "@/lib/ciclo";
import { contadores, linhasDaEquipe, type LinhaEquipe } from "@/lib/equipe";

interface GrupoCoordenador {
  coordenadorId: string;
  coordenadorNome: string;
  linhas: LinhaEquipe[];
}

/**
 * Painel do diretor de unidade (D18): o diretor acompanha coordenadores,
 * não docentes diretamente — o coordenador segue como líder principal.
 * Agrupa por Pessoa.coordenadorId do docente, não pela unidade do
 * coordenador: um coordenador pode liderar docentes de mais de uma unidade.
 */
export function PainelUnidade() {
  const { estado, pessoaAtiva, atualizar } = useStore();

  const linhas = useMemo(
    () => linhasDaEquipe(estado, { unidade: pessoaAtiva.unidade }),
    [estado, pessoaAtiva.unidade],
  );

  const grupos = useMemo(() => {
    const mapa = new Map<string, LinhaEquipe[]>();
    linhas.forEach((l) => {
      const coordenadorId = l.pessoa.coordenadorId;
      if (!coordenadorId) return;
      const atual = mapa.get(coordenadorId) ?? [];
      atual.push(l);
      mapa.set(coordenadorId, atual);
    });
    return [...mapa.entries()]
      .map(([coordenadorId, linhasDoGrupo]): GrupoCoordenador => ({
        coordenadorId,
        coordenadorNome:
          estado.pessoas.find((p) => p.id === coordenadorId)?.nome ??
          "Coordenador removido",
        linhas: linhasDoGrupo,
      }))
      .sort((a, b) =>
        a.coordenadorNome.localeCompare(b.coordenadorNome, "pt-BR"),
      );
  }, [linhas, estado.pessoas]);

  function cobrarCoordenador(grupo: GrupoCoordenador) {
    const c = contadores(grupo.linhas);
    const pendentes = c.pendentes + c.atrasados;
    const agora = new Date().toISOString();
    atualizar((anterior) => ({
      ...anterior,
      notificacoes: [
        {
          id: novoId("not"),
          pessoaId: grupo.coordenadorId,
          titulo: `Cobrança do diretor de ${pessoaAtiva.unidade}`,
          descricao: `${pessoaAtiva.nome} sinalizou: ${pendentes} de ${grupo.linhas.length} docente(s) da unidade sob sua liderança estão pendentes ou atrasados.`,
          criadaEmISO: agora,
          lida: false,
          tipo: "pendencia" as const,
        },
        ...anterior.notificacoes,
      ],
    }));
    toast.success(`Cobrança enviada a ${grupo.coordenadorNome}.`);
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold md:text-3xl">
          {pessoaAtiva.unidade}
        </h1>
        <p className="text-muted-foreground">
          Acompanhamento por etapa dos docentes desta unidade, organizado por
          coordenador.
        </p>
      </header>

      <FunilEtapas estado={estado} linhas={linhas} />

      {grupos.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-4 text-sm text-muted-foreground">
            Nenhum docente vinculado a esta unidade no momento.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {grupos.map((grupo) => {
            const c = contadores(grupo.linhas);
            return (
              <Card key={grupo.coordenadorId}>
                <CardHeader>
                  <CardTitle className="text-base">
                    {grupo.coordenadorNome}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                    <p>Em dia: {c.emDia}</p>
                    <p>Pendentes: {c.pendentes}</p>
                    <p className={c.atrasados > 0 ? "text-atraso" : undefined}>
                      Atrasados: {c.atrasados}
                    </p>
                    <p>Concluídos: {c.concluidos}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => cobrarCoordenador(grupo)}
                  >
                    <BellRing className="size-4" aria-hidden />
                    Cobrar coordenador
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <PainelEquipe escopo="diretor" />
    </div>
  );
}
