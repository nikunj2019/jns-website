"use client";

import { useState } from "react";
import {
  useSortable,
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { useDroppable, type DragEndEvent } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { SurveySection, SurveyQuestion, QuestionType } from "../lib/survey-questions";

export const QUESTION_TYPES: QuestionType[] = [
  "text", "email", "tel", "radio", "checkbox", "textarea", "select",
];

export const INPUT =
  "w-full border border-slate-line bg-ivory px-3 py-2 text-sm text-navy placeholder-slate/60 focus:border-navy focus:outline-none transition-colors";

// ─── Drag handle ──────────────────────────────────────────────────────────────

function DragHandle(props: React.HTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="cursor-grab active:cursor-grabbing touch-none p-1 text-slate/30 hover:text-slate/60 transition-colors shrink-0 mt-0.5"
      aria-label="Drag to reorder"
    >
      <svg width="10" height="14" viewBox="0 0 10 14" fill="none">
        <circle cx="2.5" cy="2"  r="1.5" fill="currentColor" />
        <circle cx="7.5" cy="2"  r="1.5" fill="currentColor" />
        <circle cx="2.5" cy="7"  r="1.5" fill="currentColor" />
        <circle cx="7.5" cy="7"  r="1.5" fill="currentColor" />
        <circle cx="2.5" cy="12" r="1.5" fill="currentColor" />
        <circle cx="7.5" cy="12" r="1.5" fill="currentColor" />
      </svg>
    </button>
  );
}

// ─── Question editor form ─────────────────────────────────────────────────────

export function QuestionEditor({
  question, onSave, onCancel,
}: {
  question: SurveyQuestion; onSave: (q: SurveyQuestion) => void; onCancel: () => void;
}) {
  const [draft, setDraft] = useState<SurveyQuestion>({ ...question });
  const needsOptions = ["radio", "checkbox", "select"].includes(draft.type);

  return (
    <div className="bg-cream rounded-lg p-4 space-y-3 border border-slate-line">
      <div>
        <label className="block text-xs font-medium text-slate mb-1 uppercase tracking-wide">Question</label>
        <input value={draft.label} onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))} className={INPUT} placeholder="Question text" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate mb-1 uppercase tracking-wide">Type</label>
          <select value={draft.type} onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value as QuestionType }))} className={INPUT}>
            {QUESTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex items-end pb-0.5">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={draft.required} onChange={(e) => setDraft((d) => ({ ...d, required: e.target.checked }))} className="w-4 h-4 border border-slate-line" />
            <span className="text-sm text-navy">Required</span>
          </label>
        </div>
      </div>
      {["text", "email", "tel", "textarea"].includes(draft.type) && (
        <div>
          <label className="block text-xs font-medium text-slate mb-1 uppercase tracking-wide">Placeholder</label>
          <input value={draft.placeholder ?? ""} onChange={(e) => setDraft((d) => ({ ...d, placeholder: e.target.value }))} className={INPUT} placeholder="Placeholder text" />
        </div>
      )}
      {needsOptions && (
        <div>
          <label className="block text-xs font-medium text-slate mb-1 uppercase tracking-wide">Options (comma-separated)</label>
          <textarea rows={2} value={(draft.options ?? []).join(", ")} onChange={(e) => setDraft((d) => ({ ...d, options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }))} className={`${INPUT} resize-y`} placeholder="Option A, Option B" />
        </div>
      )}
      <div className="flex gap-2 pt-1">
        <button onClick={() => onSave(draft)} className="bg-navy text-ivory text-xs px-4 py-1.5 rounded-full hover:opacity-90 transition-opacity">Save</button>
        <button onClick={onCancel} className="text-xs text-slate hover:text-navy transition-colors">Cancel</button>
      </div>
    </div>
  );
}

// ─── Sortable question item (drag handle + row, or editor when editing) ───────

function SortableQuestionItem({
  question, isEditing, onEdit, onDelete, onSave, onCancelEdit,
}: {
  question: SurveyQuestion;
  isEditing: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onSave: (q: SurveyQuestion) => void;
  onCancelEdit: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: question.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 1 : undefined,
  };

  if (isEditing) {
    return (
      <div ref={setNodeRef} style={style}>
        <QuestionEditor question={question} onSave={onSave} onCancel={onCancelEdit} />
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-1.5 border border-slate-line bg-white px-3 py-3 rounded-lg"
    >
      <DragHandle {...attributes} {...listeners} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-navy font-medium truncate">{question.label}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs bg-cream text-slate px-2 py-0.5 rounded-full">{question.type}</span>
          {question.required && <span className="text-xs text-slate">required</span>}
        </div>
      </div>
      <div className="flex items-center gap-2 ml-2 shrink-0">
        <button onClick={onEdit} className="text-xs text-slate hover:text-navy transition-colors">Edit</button>
        <button onClick={onDelete} className="text-xs text-slate hover:text-red-600 transition-colors">✕</button>
      </div>
    </div>
  );
}

// ─── Drag overlay card (shown floating while dragging) ────────────────────────

export function QuestionDragOverlay({ question }: { question: SurveyQuestion }) {
  return (
    <div className="flex items-start gap-1.5 border border-navy/30 bg-white px-3 py-3 rounded-lg shadow-xl cursor-grabbing">
      <div className="p-1 text-slate/60 shrink-0 mt-0.5">
        <svg width="10" height="14" viewBox="0 0 10 14" fill="none">
          <circle cx="2.5" cy="2"  r="1.5" fill="currentColor" />
          <circle cx="7.5" cy="2"  r="1.5" fill="currentColor" />
          <circle cx="2.5" cy="7"  r="1.5" fill="currentColor" />
          <circle cx="7.5" cy="7"  r="1.5" fill="currentColor" />
          <circle cx="2.5" cy="12" r="1.5" fill="currentColor" />
          <circle cx="7.5" cy="12" r="1.5" fill="currentColor" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-navy font-medium truncate">{question.label}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs bg-cream text-slate px-2 py-0.5 rounded-full">{question.type}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Section block (droppable container + sortable questions) ─────────────────

export function SectionBlock({
  section, onUpdate, onDelete, canDelete,
}: {
  section: SurveySection;
  onUpdate: (s: SurveySection) => void;
  onDelete: () => void;
  canDelete: boolean;
}) {
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelDraft, setLabelDraft] = useState(section.label);
  const [editingQId, setEditingQId] = useState<string | null>(null);

  const { setNodeRef, isOver } = useDroppable({ id: section.id });

  function saveLabel() {
    const t = labelDraft.trim();
    if (t) onUpdate({ ...section, label: t });
    setEditingLabel(false);
  }

  function addQuestion() {
    const q: SurveyQuestion = { id: `q_${Date.now()}`, label: "New question", type: "text", required: false };
    onUpdate({ ...section, questions: [...section.questions, q] });
    setEditingQId(q.id);
  }

  function updateQuestion(updated: SurveyQuestion) {
    onUpdate({ ...section, questions: section.questions.map((q) => (q.id === updated.id ? updated : q)) });
    setEditingQId(null);
  }

  function deleteQuestion(id: string) {
    onUpdate({ ...section, questions: section.questions.filter((q) => q.id !== id) });
  }

  return (
    <div className="mb-6 border border-slate-line rounded-xl overflow-hidden">
      {/* Section header */}
      <div className="flex items-center justify-between px-4 py-3 bg-cream border-b border-slate-line gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-6 h-6 rounded-full bg-navy text-ivory text-xs flex items-center justify-center font-medium shrink-0">§</div>
          {editingLabel ? (
            <input
              autoFocus
              value={labelDraft}
              onChange={(e) => setLabelDraft(e.target.value)}
              onBlur={saveLabel}
              onKeyDown={(e) => { if (e.key === "Enter") saveLabel(); if (e.key === "Escape") setEditingLabel(false); }}
              className="flex-1 text-sm font-medium text-navy bg-white border border-navy px-2 py-0.5 rounded focus:outline-none"
            />
          ) : (
            <button
              onClick={() => { setLabelDraft(section.label); setEditingLabel(true); }}
              className="text-sm font-medium text-navy hover:text-navy/70 transition-colors text-left truncate"
              title="Click to rename"
            >
              {section.label}
              <span className="ml-1 text-xs text-slate font-normal">✏️</span>
            </button>
          )}
        </div>
        {canDelete && (
          <button
            onClick={() => { if (confirm(`Delete "${section.label}" and all its questions?`)) onDelete(); }}
            className="shrink-0 text-xs text-slate hover:text-red-600 transition-colors"
          >
            Delete
          </button>
        )}
      </div>

      {/* Droppable question list */}
      <div
        ref={setNodeRef}
        className={`p-4 space-y-2 min-h-[80px] transition-colors ${isOver ? "bg-navy/5" : ""}`}
      >
        <SortableContext
          items={section.questions.map((q) => q.id)}
          strategy={verticalListSortingStrategy}
        >
          {section.questions.length === 0 && !isOver && (
            <p className="text-sm text-slate/50 text-center py-4">
              No questions — drag one here or click below.
            </p>
          )}
          {section.questions.map((q) => (
            <SortableQuestionItem
              key={q.id}
              question={q}
              isEditing={editingQId === q.id}
              onEdit={() => setEditingQId(q.id)}
              onDelete={() => deleteQuestion(q.id)}
              onSave={updateQuestion}
              onCancelEdit={() => setEditingQId(null)}
            />
          ))}
        </SortableContext>

        <button
          onClick={addQuestion}
          className="w-full border border-dashed border-slate-line text-slate hover:border-navy hover:text-navy text-sm py-2.5 rounded-lg transition-colors"
        >
          + Add Question
        </button>
      </div>
    </div>
  );
}

// ─── Drag-end helper ──────────────────────────────────────────────────────────

export function applyDragEnd(
  event: DragEndEvent,
  sections: SurveySection[]
): SurveySection[] | null {
  const { active, over } = event;
  if (!over) return null;

  const activeId = String(active.id);
  const overId = String(over.id);
  if (activeId === overId) return null;

  // Find source section + index
  let srcSec = -1, srcIdx = -1;
  for (let i = 0; i < sections.length; i++) {
    const idx = sections[i].questions.findIndex((q) => q.id === activeId);
    if (idx !== -1) { srcSec = i; srcIdx = idx; break; }
  }
  if (srcSec === -1) return null;

  // Find destination: over a question or over an empty section container
  let dstSec = -1, dstIdx = -1;
  for (let i = 0; i < sections.length; i++) {
    const idx = sections[i].questions.findIndex((q) => q.id === overId);
    if (idx !== -1) { dstSec = i; dstIdx = idx; break; }
    if (sections[i].id === overId) {
      dstSec = i;
      dstIdx = sections[i].questions.length;
      break;
    }
  }
  if (dstSec === -1) return null;

  const next = sections.map((s) => ({ ...s, questions: [...s.questions] }));

  if (srcSec === dstSec) {
    next[srcSec].questions = arrayMove(next[srcSec].questions, srcIdx, dstIdx);
  } else {
    const [q] = next[srcSec].questions.splice(srcIdx, 1);
    next[dstSec].questions.splice(dstIdx, 0, q);
  }

  return next;
}
