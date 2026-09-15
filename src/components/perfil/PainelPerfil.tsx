import { BadgeCheck, Search, UserCheck, Users } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useStore } from "@/data/store";
import type { TipoParticipacao } from "@/data/types";
import { coordenadoresDoDocente, novoId } from "@/lib/ciclo";

/**
 * Área "Perfil" (D35), acessível a todo usuário: confirma dados fixos (vindos
 * da base, só leitura) e, por perfil, o que cada um precisa gerenciar —
 * regente/corregente e líderes para o docente, alocações para o coordenador.
 */
export function PainelPerfil() {
  const { pessoaAtiva } = useStore();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Perfil
        </p>
        <h1 className="text-2xl sm:text-3xl">Meus dados</h1>
      </header>

      <Card>
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <UserCheck className="size-5 text-primary" aria-hidden />
          <CardTitle className="text-base">
            Dados da base institucional
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Dado rotulo="Nome" valor={pessoaAtiva.nome} />
            <Dado rotulo="Matrícula" valor={pessoaAtiva.matricula} />
            <Dado rotulo="Unidade" valor={pessoaAtiva.unidade} />
          </dl>
          <p className="mt-3 text-xs text-muted-foreground">
            Estes dados vêm da base institucional — nada aqui é editável.
          </p>
        </CardContent>
      </Card>

      {pessoaAtiva.perfil === "docente" && <SecaoDocente />}
      {pessoaAtiva.perfil === "coordenador" && <SecaoAlocacoes />}
    </div>
  );
}

function Dado({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">
        {rotulo}
      </dt>
      <dd className="mt-0.5 font-medium">{valor}</dd>
    </div>
  );
}

/** Docente: confirma regente/corregente (D34) e vê quem o alocou (D35). */
function SecaoDocente() {
  const { estado, pessoaAtiva, atualizar } = useStore();
  const inscricao = estado.inscricoes.find(
    (i) => i.pessoaId === pessoaAtiva.id,
  );
  const lideres = coordenadoresDoDocente(estado, pessoaAtiva.id);

  function mudarParticipacao(v: TipoParticipacao) {
    if (!inscricao) return;
    atualizar((anterior) => ({
      ...anterior,
      inscricoes: anterior.inscricoes.map((i) =>
        i.id === inscricao.id ? { ...i, tipoParticipacao: v } : i,
      ),
    }));
  }

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <BadgeCheck className="size-5 text-primary" aria-hidden />
          <CardTitle className="text-base">Tipo de participação</CardTitle>
        </CardHeader>
        <CardContent>
          {inscricao ? (
            <RadioGroup
              value={inscricao.tipoParticipacao}
              onValueChange={(v) => mudarParticipacao(v as TipoParticipacao)}
              className="flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="regente" id="perfil-part-regente" />
                <Label htmlFor="perfil-part-regente">Regente</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem
                  value="corregente"
                  id="perfil-part-corregente"
                />
                <Label htmlFor="perfil-part-corregente">Corregente</Label>
              </div>
            </RadioGroup>
          ) : (
            <p className="text-sm text-muted-foreground">
              Você ainda não se inscreveu em nenhuma turma — o tipo de
              participação fica disponível depois da Escolha do percurso.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <Users className="size-5 text-primary" aria-hidden />
          <CardTitle className="text-base">Líder(es)</CardTitle>
        </CardHeader>
        <CardContent>
          {lideres.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum coordenador te alocou como liderado ainda.
            </p>
          ) : (
            <ul className="space-y-2">
              {lideres.map((l) => (
                <li key={l.id} className="text-sm">
                  <span className="font-medium">{l.nome}</span>{" "}
                  <span className="text-muted-foreground">· {l.unidade}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}

/** Coordenador: busca na base completa de docentes e marca liderados (D35). */
function SecaoAlocacoes() {
  const { estado, pessoaAtiva, atualizar } = useStore();
  const docentes = [...estado.pessoas]
    .filter((p) => p.perfil === "docente")
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  const meusLideradosIds = new Set(
    estado.alocacoes
      .filter((a) => a.coordenadorId === pessoaAtiva.id)
      .map((a) => a.docenteId),
  );

  function alternar(docenteId: string, nome: string) {
    atualizar((anterior) => {
      const existente = anterior.alocacoes.find(
        (a) => a.coordenadorId === pessoaAtiva.id && a.docenteId === docenteId,
      );
      if (existente) {
        return {
          ...anterior,
          alocacoes: anterior.alocacoes.filter((a) => a.id !== existente.id),
        };
      }
      return {
        ...anterior,
        alocacoes: [
          ...anterior.alocacoes,
          {
            id: novoId("aloc"),
            coordenadorId: pessoaAtiva.id,
            docenteId,
            criadaEmISO: new Date().toISOString(),
          },
        ],
      };
    });
    toast.success(
      meusLideradosIds.has(docenteId)
        ? `${nome} removido(a) dos seus liderados.`
        : `${nome} alocado(a) como seu(sua) liderado(a).`,
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3 space-y-0">
        <Search className="size-5 text-primary" aria-hidden />
        <div>
          <CardTitle className="text-base">Alocações</CardTitle>
          <p className="text-sm text-muted-foreground">
            Busque por nome ou matrícula e marque quem você lidera.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Command className="rounded-lg border border-border">
          <CommandInput placeholder="Buscar docente por nome ou matrícula" />
          <CommandList>
            <CommandEmpty>Nenhum docente encontrado.</CommandEmpty>
            <CommandGroup>
              {docentes.map((d) => {
                const alocado = meusLideradosIds.has(d.id);
                return (
                  <CommandItem
                    key={d.id}
                    value={`${d.nome} ${d.matricula}`}
                    onSelect={() => alternar(d.id, d.nome)}
                    className="justify-between"
                  >
                    <span>
                      {d.nome}{" "}
                      <span className="text-muted-foreground">
                        · {d.matricula} · {d.unidade}
                      </span>
                    </span>
                    {alocado ? (
                      <Badge variant="secondary">Liderado</Badge>
                    ) : null}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
        <p className="text-sm text-muted-foreground">
          {meusLideradosIds.size} docente(s) alocado(s) como seus liderados.
        </p>
      </CardContent>
    </Card>
  );
}
