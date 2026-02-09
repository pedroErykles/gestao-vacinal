import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";

interface Option {
  id: string | number;
  label: string;
}

interface ModernSelectProps {
  label: string;
  options: Option[];
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

export function OptionSelect({
  label,
  options,
  value,
  onChange,
  placeholder = "Selecione...",
  disabled = false,
  required = false,
}: ModernSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickFora = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickFora);
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, []);

  const selectedOption = options.find(
    (opt) => String(opt.id) === String(value),
  );

  return (
    <div className="relative group" ref={containerRef}>
      <label className="block text-sm mb-2 font-medium">
        {label} {required && "*"}
      </label>

      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`
            w-full flex items-center justify-between 
            px-4 py-[9px]
            border rounded-lg
            transition-all duration-200 shadow-sm outline-none
            ${
                disabled
                ? "bg-gray-50 border-gray-200 text-gray-400"
                : "bg-white border-gray-300 hover:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
            }
            `}
        >
          <span
            className={selectedOption ? "text-slate-900" : "text-slate-400"}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        {isOpen && !disabled && (
          <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="py-1 max-h-60 overflow-y-auto">
              {options.length === 0 ? (
                <div className="px-4 py-3 text-sm text-slate-500 italic">
                  Nenhuma opção disponível
                </div>
              ) : (
                options.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onChange(String(opt.id));
                      setIsOpen(false);
                    }}
                    className={`
                      w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between
                      ${String(opt.id) === String(value) ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-700 hover:bg-slate-50"}
                    `}
                  >
                    {opt.label}
                    {String(opt.id) === String(value) && (
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
