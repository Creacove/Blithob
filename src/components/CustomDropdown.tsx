import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export interface DropdownOption {
  value: string;
  label: string;
}

export function CustomDropdown({
  value,
  onChange,
  options,
  placeholder = "Select...",
  ariaLabel,
  className = "",
  buttonClassName = "",
  menuClassName = ""
}: {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [placement, setPlacement] = useState<"down" | "up">("down");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  const toggleOpen = () => {
    if (!isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 220 && rect.top > spaceBelow) {
        setPlacement("up");
      } else {
        setPlacement("down");
      }
    }
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <button
        type="button"
        onClick={toggleOpen}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        className={`flex w-full min-h-[47px] items-center justify-between gap-2 rounded-xl border border-[#e2e8ea] bg-white px-3.5 py-2 text-left text-sm font-medium text-[#15202b] outline-none transition-all duration-200 hover:border-[#b8c9d1] focus:border-[#0b86d7] ${buttonClassName}`}
      >
        <span className={`block truncate ${!selectedOption && value === "" ? "text-[#7a8c98]" : "text-[#15202b]"}`}>
          {displayLabel}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-[#8c9ca6] transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#0b86d7]" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label={ariaLabel}
          className={`absolute left-0 ${
            placement === "up" ? "bottom-[calc(100%+6px)]" : "top-[calc(100%+6px)]"
          } z-[9999] max-h-60 w-full min-w-[200px] overflow-y-auto rounded-2xl border border-[#e2e8ea] bg-white p-1.5 shadow-[0_20px_50px_rgba(15,35,55,0.18),0_4px_12px_rgba(0,0,0,0.08)] outline-none animate-in fade-in duration-150 ${menuClassName}`}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value || "__all__"}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition-colors duration-150 outline-none ${
                  isSelected
                    ? "bg-[#e7f4fb] text-[#0b86d7] font-semibold"
                    : "text-[#2c3e4c] hover:bg-[#f2f7fa] hover:text-[#0b86d7]"
                }`}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && (
                  <Check size={15} className="ml-2 shrink-0 text-[#0b86d7]" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
