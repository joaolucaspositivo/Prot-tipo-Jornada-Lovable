import { useRef, useState } from "react";
import { CheckCircle2, CloudUpload, FileText, Film } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStore } from "@/data/store";
import type { ArquivoConteudo } from "@/data/types";
import { macrotemasAtivos, novoId, ROTULO_TIPO_ETAPA } from "@/lib/ciclo";
import { formatarDataHora } from "@/lib/conteudo";

function tamanhoLegivel(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Upload simulado: o arquivo não sai do navegador. O sistema registra a
 * referência no Drive institucional sozinho — o operador nunca copia URL.
 */
export function GestaoConteudo() {
  const { estado, pessoaAtiva, atualizar } = useStore();
  const etapas = [...estado.cicloConfig.etapas].sort(
    (a, b) => a.ordem - b.ordem,
  );
  const macrotemas = macrotemasAtivos(estado.cicloConfig);
  const arquivos = estado.arquivosConteudo ?? [];

  const [etapaId, setEtapaId] = useState(etapas[0]?.id ?? "");
  const [macrotemaId, setMacrotemaId] = useState(macrotemas[0]?.id ?? "");
  const [progresso, setProgresso] = useState<number | null>(null);
  const [enviando, setEnviando] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function selecionar(file: File | undefined) {
    if (!file) return;
    if (!etapaId || !macrotemaId) {
      toast.error("Escolha a etapa e o macrotema antes de enviar.");
      return;
    }
    setEnviando(file.name);
    setProgresso(0);
    const ehVideo = file.type.startsWith("video");
    const passo = () =>
      setProgresso((p) => {
        const atual = (p ?? 0) + 12 + Math.random() * 10;
        if (atual >= 100) {
          concluir(file, ehVideo ? "video" : "texto");
          return 100;
        }
        setTimeout(passo, 180);
        return atual;
      });
    setTimeout(passo, 180);
  }

  function concluir(file: File, tipo: ArquivoConteudo["tipo"]) {
    const etapa = etapas.find((e) => e.id === etapaId);
    const macro = macrotemas.find((m) => m.id === macrotemaId);
    const registro: ArquivoConteudo = {
      id: novoId("arq"),
      nome: file.name,
      tipo,
      arquivoTipo: file.type || "application/octet-stream",
      tamanhoBytes: file.size,
      etapaId,
      macrotemaId,
      referenciaDrive: `drive-institucional/${macro?.id ?? "geral"}/${etapa?.id ?? "etapa"}/${file.name}`,
      enviadoEmISO: new Date().toISOString(),
      enviadoPorId: pessoaAtiva.id,
    };
    atualizar((anterior) => ({
      ...anterior,
      arquivosConteudo: [registro, ...(anterior.arquivosConteudo ?? [])],
    }));
    setTimeout(() => {
      setProgresso(null);
      setEnviando(null);
      if (inputRef.current) inputRef.current.value = "";
      toast.success(
        "Arquivo enviado ao Drive institucional e referência registrada automaticamente.",
      );
    }, 500);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <CloudUpload className="size-5 text-primary" aria-hidden />
          <CardTitle className="text-base">
            Enviar vídeo ou texto-base
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Escolha a etapa e o macrotema, envie o arquivo e pronto. O sistema
            guarda a referência sozinho — nenhum link é copiado à mão.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="min-w-0 space-y-1.5">
              <Label htmlFor="etapa-conteudo">Etapa da trilha</Label>
              <Select value={etapaId} onValueChange={setEtapaId}>
                <SelectTrigger
                  id="etapa-conteudo"
                  className="[&>span]:truncate"
                >
                  <SelectValue placeholder="Escolha a etapa" />
                </SelectTrigger>
                <SelectContent>
                  {etapas.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.nome} · {ROTULO_TIPO_ETAPA[e.tipo]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-0 space-y-1.5">
              <Label htmlFor="macro-conteudo">Macrotema</Label>
              <Select value={macrotemaId} onValueChange={setMacrotemaId}>
                <SelectTrigger
                  id="macro-conteudo"
                  className="[&>span]:truncate"
                >
                  <SelectValue placeholder="Escolha o macrotema" />
                </SelectTrigger>
                <SelectContent>
                  {macrotemas.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <input
              ref={inputRef}
              id="arquivo-conteudo"
              type="file"
              className="sr-only"
              onChange={(e) => selecionar(e.target.files?.[0])}
            />
            <Button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={progresso !== null}
            >
              <CloudUpload className="size-4" aria-hidden />
              Escolher arquivo do computador
            </Button>
          </div>

          {progresso !== null && (
            <div className="rounded-xl border border-border bg-secondary/40 p-4">
              <p className="text-sm font-medium">{enviando}</p>
              <Progress value={progresso} className="mt-2 h-2" />
              <p className="mt-1 text-xs text-muted-foreground">
                {progresso >= 100
                  ? "Enviado ao Drive institucional. Registrando referência…"
                  : `Enviando ao Drive institucional… ${Math.round(progresso)}%`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Conteúdo publicado ({arquivos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {arquivos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum arquivo enviado até agora.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {arquivos.map((a) => {
                const etapa = etapas.find((e) => e.id === a.etapaId);
                const macro = estado.cicloConfig.macrotemas.find(
                  (m) => m.id === a.macrotemaId,
                );
                const Icone = a.tipo === "video" ? Film : FileText;
                return (
                  <li
                    key={a.id}
                    className="flex flex-wrap items-start justify-between gap-3 py-3"
                  >
                    <div className="flex min-w-0 gap-3">
                      <Icone
                        className="mt-0.5 size-5 shrink-0 text-primary"
                        aria-hidden
                      />
                      <div className="min-w-0">
                        <p className="break-words text-sm font-medium">
                          {a.nome}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {etapa?.nome ?? "Etapa removida"} ·{" "}
                          {macro?.nome ?? "Macrotema removido"}
                        </p>
                        <p className="flex items-start gap-1.5 break-all text-xs text-sucesso">
                          <CheckCircle2 className="size-3.5" aria-hidden />
                          Referência registrada: {a.referenciaDrive}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">
                        {a.tipo === "video" ? "Vídeo" : "Texto-base"}
                      </Badge>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {tamanhoLegivel(a.tamanhoBytes)} ·{" "}
                        {formatarDataHora(a.enviadoEmISO)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
