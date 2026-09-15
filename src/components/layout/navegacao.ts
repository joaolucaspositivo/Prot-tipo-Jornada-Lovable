import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  Compass,
  FileUp,
  Gauge,
  History,
  Map,
  MessagesSquare,
  Notebook,
  PlayCircle,
  Settings2,
  ShieldCheck,
  Users,
} from "lucide-react";

import type { PerfilId } from "@/data/types";

export interface ItemNav {
  para: string;
  rotulo: string;
  Icone: typeof Users;
}

// "Painel" deixou de existir como conceito compartilhado entre perfis (D28):
// o resumo do docente mora em Minha Jornada, e cada outro perfil já cai
// direto na própria tela de referência (Equipe, Gestão do ciclo, Unidade).
export const NAVEGACAO_POR_PERFIL: Record<PerfilId, ItemNav[]> = {
  "docente-regente": [
    { para: "/jornada", rotulo: "Minha Jornada", Icone: Map },
    { para: "/autoavaliacao", rotulo: "Autoavaliação", Icone: ClipboardList },
    { para: "/percurso", rotulo: "Escolha do percurso", Icone: Compass },
    { para: "/aulas", rotulo: "Aulas e texto-base", Icone: PlayCircle },
    { para: "/entrega", rotulo: "Envio da tarefa", Icone: FileUp },
    { para: "/portfolio", rotulo: "Portfólio da jornada", Icone: Notebook },
    { para: "/enquete", rotulo: "Enquete 360°", Icone: MessagesSquare },
    { para: "/historico", rotulo: "Jornadas anteriores", Icone: History },
  ],
  "docente-corregente": [
    { para: "/jornada", rotulo: "Minha Jornada", Icone: Map },
    { para: "/autoavaliacao", rotulo: "Autoavaliação", Icone: ClipboardList },
    { para: "/percurso", rotulo: "Escolha do percurso", Icone: Compass },
    { para: "/aulas", rotulo: "Aulas e texto-base", Icone: PlayCircle },
    { para: "/entrega", rotulo: "Envio da tarefa", Icone: FileUp },
    { para: "/portfolio", rotulo: "Portfólio da jornada", Icone: Notebook },
    { para: "/enquete", rotulo: "Enquete 360°", Icone: MessagesSquare },
    { para: "/historico", rotulo: "Jornadas anteriores", Icone: History },
  ],
  coordenador: [
    { para: "/equipe", rotulo: "Minha equipe", Icone: Users },
    { para: "/agenda", rotulo: "Agenda de observações", Icone: CalendarDays },
    { para: "/enquete", rotulo: "Enquete 360°", Icone: MessagesSquare },
  ],
  operadora: [
    {
      para: "/configuracao",
      rotulo: "Configuração do Ciclo",
      Icone: Settings2,
    },
    { para: "/gestao", rotulo: "Gestão do ciclo", Icone: Gauge },
    { para: "/enquete", rotulo: "Enquete 360°", Icone: MessagesSquare },
    // Suporte (D29): a operadora pode abrir a jornada como um docente
    // qualquer para ajudar — deixou de aparecer no menu do próprio docente.
    {
      para: "/acesso",
      rotulo: "Acesso à jornada (suporte)",
      Icone: ShieldCheck,
    },
  ],
  diretor: [{ para: "/unidade", rotulo: "Minha unidade", Icone: BookOpen }],
  // Área restrita às turmas do moderador chega no Bloco 6 (D33); por ora,
  // só o suficiente para o perfil existir sem quebrar a navegação.
  moderador: [],
};
