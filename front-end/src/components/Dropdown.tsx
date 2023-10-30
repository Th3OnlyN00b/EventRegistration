import React, { useState, useRef, useEffect } from "react";
import { GrDown } from "react-icons/gr";

type DropdownOptions = {
  label: string;
  value: string;
};

type DropdownProps = {
  label: string;
  options: DropdownOptions[];
  onChange: (value: string) => void;
};

const Dropdown = (props: DropdownProps) => {
  const { label, options, onChange } = props;
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        type="button"
        className="flex w-[150px] min-w-min items-center justify-between rounded-lg border bg-white px-3 py-2 text-xs text-gray-500 shadow-sm transition-all hover:bg-gray-100 focus:ring focus:ring-gray-100"
      >
        {label}
        <GrDown className="mr-1" />
      </button>
      {open && (
        <div className="absolute left-0 z-10 mt-2 w-48 rounded-lg border border-gray-100 bg-white text-left text-xs shadow-lg">
          <div className="p-1">
            {options.map((option) => (
              <button
                key={option.label}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className="flex w-full items-center rounded-md px-3 py-2 text-gray-500 hover:bg-gray-100"
              >
                {" "}
                {option.label}{" "}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dropdown;
