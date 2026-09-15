import {
  BookOpen,
  CalendarCheck,
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
  UserCircle,
  Users,
} from "lucide-react";

import type { PerfilId } from "@/data/types";

export interface ItemNav {
  para: string;
  rotulo: string;
  Icone: typeof Users;
}

// Toda pessoa tem acesso à própria área de Perfil (D35) — dados da base,
// tipo de participação, líderes ou alocações, conforme o perfil.
const perfil: ItemNav = {
  para: "/perfil",
  rotulo: "Perfil",
  Icone: UserCircle,
};

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
    perfil,
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
    perfil,
  ],
  coordenador: [
    { para: "/equipe", rotulo: "Minha equipe", Icone: Users },
    { para: "/agenda", rotulo: "Agenda de observações", Icone: CalendarDays },
    { para: "/enquete", rotulo: "Enquete 360°", Icone: MessagesSquare },
    perfil,
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
    perfil,
  ],
  diretor: [
    { para: "/unidade", rotulo: "Minha unidade", Icone: BookOpen },
    perfil,
  ],
  // Acesso restrito às turmas vinculadas (D33) — só lança presença.
  moderador: [
    { para: "/moderacao", rotulo: "Minhas turmas", Icone: CalendarCheck },
    perfil,
  ],
};
