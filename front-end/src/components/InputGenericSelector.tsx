import React from "react";
import { GrClose, GrAdd } from "react-icons/gr";

enum QuestionInput {
  MULTIPLE_CHOICE = "MULTIPLE_CHOICE",
  CHECKBOXES = "CHECKBOXES",
  DROPDOWN = "DROPDOWN",
  TEXT_INPUT = "TEXT_INPUT"
}

type InputGenericSelectorProps = {
  options: string[];
  input: QuestionInput;
  onUpdateOption: (value: string, index: number) => void;
  onAddOption: () => void;
  onRemoveOption: (index: number) => void;
};

const InputGenericSelector = (props: InputGenericSelectorProps) => {
  const { options, onRemoveOption, onUpdateOption, onAddOption, input } = props;
  const InputIcon = (index: number) => {
    if (input === QuestionInput.CHECKBOXES) {
      return (
        <div className="h-4 w-4 rounded border-2 border-gray-300 text-rose-600 shadow-sm" />
      );
    }

    if (input === QuestionInput.MULTIPLE_CHOICE) {
      return (
        <div className="h-4 w-4 rounded-full border-2 border-gray-300 text-rose-600 shadow-sm" />
      );
    }

    if (input === QuestionInput.DROPDOWN) {
      return <div className="text-sm">{`${index + 1}. `}</div>;
    }
  };

  return (
    <div className="px-6">
      {options.map((option, index) => (
        <div
          key={`opt-${index}`}
          className="flex items-center justify-between space-x-2 rounded px-2 py-1 hover:bg-gray-100"
        >
          <div className="flex w-full items-center gap-3">
            {InputIcon(index)}
            <input
              type="text"
              onChange={(e: React.FormEvent<HTMLInputElement>) =>
                onUpdateOption(e.currentTarget.value, index)
              }
              value={option}
              className="w-full border-none bg-transparent px-1 text-sm leading-none focus:border-rose-500 focus:ring-0"
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
        <div className="mt-2 flex items-center gap-3">
          <button
            onClick={() => onAddOption()}
            className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-xs text-gray-500 hover:bg-gray-100"
          >
            <GrAdd /> Add option
          </button>
        </div>
      </div>
    </div>
  );
};

export default InputGenericSelector;
