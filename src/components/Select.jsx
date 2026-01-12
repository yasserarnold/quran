
import React, { useState, useEffect, useRef } from "react";

export default function Select({ label, value, options, onChange, getLabel }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((option) => option.value === value);
  const selectedLabel = selectedOption
    ? getLabel(selectedOption)
    : "اختر من القائمة";

  return (
    <div className="select" ref={containerRef}>
      <span className="select__label">{label}</span>
      <button
        className="select__button"
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="select__value">{selectedLabel}</span>
        <span className="select__chevron">▾</span>
      </button>
      {open && (
        <div className="select__menu" role="listbox">
          {options.map((option) => (
            <button
              key={option.key}
              type="button"
              className="select__option"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              role="option"
              aria-selected={option.value === value}
            >
              {getLabel(option)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
