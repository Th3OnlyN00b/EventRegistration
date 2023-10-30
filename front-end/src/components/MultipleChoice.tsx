import React, { useMemo } from "react";
import { GrClose, GrAdd } from "react-icons/gr";
import { OTHER_ID, QuestionOption } from "../models";

type MultipleChoiceProps = {
  options: QuestionOption[];
  onUpdateOption: (value: string, index: number) => void;
  onAddOption: () => void;
  onAddOther: () => void;
  onRemoveOption: (index: number) => void;
};

const MultipleChoice = (props: MultipleChoiceProps) => {
  const { options, onUpdateOption, onAddOption, onAddOther, onRemoveOption } =
    props;
  const otherAdded = useMemo(() => {
    return options.some((opt) => opt.id === OTHER_ID);
  }, [options]);
  return (
    <div className="px-6">
      {options.map((option, index) => (
        <div
          key={`opt-${index}`}
          className={`flex items-center justify-between space-x-2 rounded px-2 py-1 ${
            option.readOnly ? "bg-slate-50" : "hover:bg-gray-100"
          }`}
        >
          <div className="flex w-full items-center gap-3">
            <div className="h-4 w-4 rounded-full border-2 border-gray-300 text-rose-600 shadow-sm" />
            <input
              type="text"
              disabled={option.readOnly}
              onChange={(e: React.FormEvent<HTMLInputElement>) =>
                onUpdateOption(e.currentTarget.value, index)
              }
              value={option.label}
              className="w-full appearance-none border-none bg-transparent px-1 text-sm leading-none focus:border-b-2 focus:border-rose-500 focus:ring-0 disabled:text-gray-500"
            />
          </div>
          {options.length > 1 && (
            <div>
              <button
                onClick={() => onRemoveOption(index)}
                className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-xs text-gray-500 hover:bg-white"
              >
                <GrClose />
              </button>
            </div>
          )}
        </div>
      ))}
      <div>
        <div className="mt-2 flex items-center gap-3 text-xs">
          <button
            onClick={() => onAddOption()}
            className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-xs text-gray-500 hover:bg-gray-100"
          >
            <GrAdd /> Add option
          </button>
          {!otherAdded && (
            <button
              onClick={() => {
                onAddOther();
              }}
              className="flex items-center justify-between gap-2 rounded-md px-3 py-2 text-xs font-bold text-rose-500 hover:bg-gray-100"
            >
              add "Other..."
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MultipleChoice;
