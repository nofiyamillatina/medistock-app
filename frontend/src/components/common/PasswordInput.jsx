import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function PasswordInput({
  id,
  value,
  onChange,
  autoComplete = 'current-password',
  required = false,
  minLength,
  maxLength,
  placeholder,
  disabled = false,
  ariaDescribedBy,
  ariaInvalid,
  className = ''
}) {
  const [visible, setVisible] = useState(false);

  return <div className="relative">
    <input
      id={id}
      type={visible ? 'text' : 'password'}
      autoComplete={autoComplete}
      required={required}
      minLength={minLength}
      maxLength={maxLength}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      aria-describedby={ariaDescribedBy}
      aria-invalid={ariaInvalid}
      className={`${className} pr-12`}
    />
    <button
      type="button"
      onClick={() => setVisible((current) => !current)}
      aria-label={visible ? 'Sembunyikan password' : 'Tampilkan password'}
      aria-pressed={visible}
      aria-controls={id}
      className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-slate-500 transition hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
    </button>
  </div>;
}
