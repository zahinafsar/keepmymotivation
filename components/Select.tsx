"use client";

import { useEffect, useRef, useState } from "react";

type Option<T extends string | number> = { value: T; label: string };

type Props<T extends string | number> = {
  value: T;
  onChange: (v: T) => void;
  options: Option<T>[];
  placeholder?: string;
};

export default function Select<T extends string | number>({
  value,
  onChange,
  options,
  placeholder,
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(() =>
    Math.max(0, options.findIndex((o) => o.value === value))
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => Math.min(options.length - 1, i + 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => Math.max(0, i - 1));
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const opt = options[activeIdx];
        if (opt) {
          onChange(opt.value);
          setOpen(false);
        }
      }
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, activeIdx, options, onChange]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.children[activeIdx] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIdx, open]);

  function toggle() {
    setOpen((o) => !o);
    setActiveIdx(Math.max(0, options.findIndex((o) => o.value === value)));
  }

  return (
    <div ref={rootRef} className="select-root">
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="select-trigger"
      >
        <span className={selected ? "" : "select-placeholder"}>
          {selected?.label ?? placeholder ?? "Select…"}
        </span>
        <svg
          className={`select-chevron ${open ? "open" : ""}`}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <ul ref={listRef} role="listbox" className="select-panel">
          {options.map((opt, i) => {
            const isSelected = opt.value === value;
            const isActive = i === activeIdx;
            return (
              <li
                key={String(opt.value)}
                role="option"
                aria-selected={isSelected}
                className={`select-option ${isActive ? "active" : ""} ${
                  isSelected ? "selected" : ""
                }`}
                onMouseEnter={() => setActiveIdx(i)}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                <span>{opt.label}</span>
                {isSelected && (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
