import React from 'react';
import { Check, ChevronDown } from 'lucide-react';

export default function StyledDropdown({ id, value, onChange, options, ariaLabel, className = '' }) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef(null);
  const selected = options.find((option) => option.value === value);

  React.useEffect(() => {
    const closeWhenOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', closeWhenOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeWhenOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  return (
    <div ref={rootRef} className={`relative w-full ${className}`}>
      <button
        id={id}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((visible) => !visible)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-xs text-slate-700 shadow-sm transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        <span className="truncate">{selected?.label ?? ''}</span>
        <ChevronDown size={15} className={`shrink-0 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <div role="listbox" aria-labelledby={id} className="absolute left-0 top-full z-30 mt-1 max-h-64 w-full min-w-max overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => { onChange(option.value); setOpen(false); }}
                className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-xs transition ${isSelected ? 'bg-blue-50 font-semibold text-blue-700' : 'text-slate-700 hover:bg-slate-50'}`}
              >
                <span>{option.label}</span>
                {isSelected && <Check size={14} className="shrink-0" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
