"use client";

import { useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Mail,
  MessageCircle,
  MoreVertical,
  Phone,
  RotateCcw,
  Trash2,
  UserPlus
} from "lucide-react";
import { Badge, EmptyState } from "@/components/crm/ui";
import {
  KANBAN_LABELS,
  PRIORITY_DOT,
  SOURCE_ICONS,
  SOURCE_LABELS,
  SOURCE_VARIANTS,
  TYPE_LABELS,
  deriveTags,
  formatDateTime
} from "./appointment-ui";
import type { DrawerAction } from "./AppointmentDrawer";
import type { EnrichedAppointment, KanbanColumn } from "./types";

export function KanbanView({
  columns,
  busyId,
  onOpen,
  onMove,
  onAction
}: {
  columns: KanbanColumn[];
  busyId: string | null;
  onOpen: (id: string) => void;
  onMove: (appointment: EnrichedAppointment, column: KanbanColumn) => void;
  onAction: (id: string, action: DrawerAction) => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);

  if (columns.every((c) => c.cards.length === 0)) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="Aucun rendez-vous"
        description="Les demandes prises depuis le chatbot, le téléphone ou créées manuellement apparaîtront ici."
      />
    );
  }

  const allCards = columns.flatMap((c) => c.cards);

  const handleDrop = (column: KanbanColumn) => {
    setOverColumn(null);
    if (!dragId) return;
    const card = allCards.find((c) => c.id === dragId);
    setDragId(null);
    if (!card || card.kanbanColumn === column.id) return;
    onMove(card, column);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {columns.map((column) => (
        <div
          key={column.id}
          onDragOver={(e) => {
            e.preventDefault();
            setOverColumn(column.id);
          }}
          onDragLeave={() => setOverColumn((c) => (c === column.id ? null : c))}
          onDrop={() => handleDrop(column)}
          className={`flex w-[280px] shrink-0 flex-col rounded-3xl border bg-loden-pearl/60 p-3 transition ${
            overColumn === column.id ? "border-loden-400 ring-2 ring-loden-200" : "border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between px-1 pb-2">
            <p className="text-sm font-semibold text-loden-ink">{KANBAN_LABELS[column.id]}</p>
            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-loden-muted shadow-soft">
              {column.cards.length}
            </span>
          </div>
          <div className="flex max-h-[68vh] flex-col gap-2 overflow-y-auto pr-0.5">
            {column.cards.map((card) => (
              <KanbanCard
                key={card.id}
                card={card}
                columns={columns}
                busy={busyId === card.id}
                dragging={dragId === card.id}
                onDragStart={() => setDragId(card.id)}
                onDragEnd={() => setDragId(null)}
                onOpen={() => onOpen(card.id)}
                onMove={(col) => onMove(card, col)}
                onAction={(action) => onAction(card.id, action)}
              />
            ))}
            {column.cards.length === 0 ? (
              <p className="px-1 py-6 text-center text-xs text-loden-muted">—</p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function KanbanCard({
  card,
  columns,
  busy,
  dragging,
  onDragStart,
  onDragEnd,
  onOpen,
  onMove,
  onAction
}: {
  card: EnrichedAppointment;
  columns: KanbanColumn[];
  busy: boolean;
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onOpen: () => void;
  onMove: (column: KanbanColumn) => void;
  onAction: (action: DrawerAction) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const SourceIcon = SOURCE_ICONS[card.source];
  const tags = deriveTags(card);
  const assignee = card.advisorName || card.instructorName;
  const wa = card.phone;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      style={{ borderLeftColor: card.color }}
      className={`group relative rounded-2xl border border-l-4 border-slate-200 bg-white p-3 shadow-soft transition ${
        dragging ? "opacity-50" : "hover:shadow-premium"
      } ${busy ? "pointer-events-none opacity-60" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <button type="button" onClick={onOpen} className="focus-ring min-w-0 flex-1 text-left">
          <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-loden-ink">
            <span className={`h-2 w-2 shrink-0 rounded-full ${PRIORITY_DOT[card.priority]}`} aria-hidden="true" />
            {card.fullName}
          </p>
          <p className="mt-0.5 truncate text-xs text-loden-muted">{card.phone}</p>
          {card.email ? <p className="truncate text-xs text-loden-muted">{card.email}</p> : null}
        </button>
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Actions"
            className="focus-ring inline-flex h-7 w-7 items-center justify-center rounded-lg text-loden-muted hover:bg-loden-50"
          >
            <MoreVertical className="h-4 w-4" aria-hidden="true" />
          </button>
          {menuOpen ? (
            <>
              <button type="button" className="fixed inset-0 z-10 cursor-default" aria-hidden="true" tabIndex={-1} onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 z-20 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-sm shadow-premium">
                <MenuItem icon={CheckCircle2} label="Confirmer" onClick={() => { setMenuOpen(false); onAction({ kind: "status", status: "confirmed" }); }} />
                <MenuItem icon={RotateCcw} label="Relancer" onClick={() => { setMenuOpen(false); onAction({ kind: "status", status: "to_follow_up" }); }} />
                <MenuItem icon={CalendarClock} label="Ouvrir le détail" onClick={() => { setMenuOpen(false); onOpen(); }} />
                <MenuItem icon={MessageCircle} label="Ouvrir WhatsApp" onClick={() => { setMenuOpen(false); onAction({ kind: "notify", channel: "whatsapp" }); }} />
                <MenuItem icon={Mail} label="Envoyer un email" onClick={() => { setMenuOpen(false); onAction({ kind: "notify", channel: "client" }); }} />
                <a href={`tel:${wa}`} className="flex items-center gap-2 px-3 py-2 text-loden-ink hover:bg-loden-50" onClick={() => setMenuOpen(false)}>
                  <Phone className="h-4 w-4" aria-hidden="true" /> Appeler
                </a>
                <MenuItem icon={UserPlus} label="Transformer en élève" onClick={() => { setMenuOpen(false); onAction({ kind: "transform" }); }} />
                <MenuItem icon={Trash2} label="Annuler / Supprimer" tone="danger" onClick={() => { setMenuOpen(false); onAction({ kind: "delete" }); }} />
                <div className="my-1 border-t border-slate-100" />
                <p className="px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wide text-loden-muted">Déplacer vers</p>
                {columns
                  .filter((col) => col.id !== card.kanbanColumn)
                  .map((col) => (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => { setMenuOpen(false); onMove(col); }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-loden-ink hover:bg-loden-50"
                    >
                      {KANBAN_LABELS[col.id]}
                    </button>
                  ))}
              </div>
            </>
          ) : null}
        </div>
      </div>

      <button type="button" onClick={onOpen} className="focus-ring mt-2 block w-full text-left">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant={SOURCE_VARIANTS[card.source]}>
            <SourceIcon className="h-3 w-3" aria-hidden="true" />
            {SOURCE_LABELS[card.source]}
          </Badge>
          <Badge variant="neutral">{TYPE_LABELS[card.type]}</Badge>
          {card.formationLabel || card.formation ? (
            <Badge variant="brand">{card.formationLabel || card.formation}</Badge>
          ) : null}
        </div>
        {tags.length ? (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {tags.map((tag) => (
              <span key={tag} className="rounded-full bg-loden-fog px-2 py-0.5 text-[10px] font-semibold text-loden-700">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
        <p className="mt-2 text-xs text-loden-muted">{formatDateTime(card.startsAt)}</p>
        {assignee ? <p className="mt-0.5 truncate text-xs font-medium text-loden-ink">{assignee}</p> : null}
      </button>
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  tone = "default",
  onClick
}: {
  icon: typeof CheckCircle2;
  label: string;
  tone?: "default" | "danger";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-loden-50 ${tone === "danger" ? "text-rose-600" : "text-loden-ink"}`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  );
}
