import { memo, useState } from "react";
import { GrAdd, GrTrash } from "react-icons/gr";
import { v4 as uuid } from "uuid";

import InputBorder from "./InputBorder";
import {
  Checkboxes,
  Dropdown,
  DropdownFormInput,
  TextArea,
  TextInput,
  MultipleChoice
} from "../index";
import {
  QuestionInput,
  QuestionModel,
  BLANK_QUESTION,
  OTHER_ID
} from "../../models";

const QuestionInputMap = {
  MULTIPLE_CHOICE: "Multiple choice",
  DROPDOWN: "Dropdown",
  TEXT_INPUT: "Short-form text",
  TEXT_AREA: "Long-form text",
  CHECKBOXES: "Checkboxes"
};

const INPUT_OPTIONS = [
  {
    label: QuestionInputMap[QuestionInput.TEXT_INPUT],
    value: QuestionInput.TEXT_INPUT
  },
  {
    label: QuestionInputMap[QuestionInput.TEXT_AREA],
    value: QuestionInput.TEXT_AREA
  },
  {
    label: QuestionInputMap[QuestionInput.MULTIPLE_CHOICE],
    value: QuestionInput.MULTIPLE_CHOICE
  },
  {
    label: QuestionInputMap[QuestionInput.DROPDOWN],
    value: QuestionInput.DROPDOWN
  },
  {
    label: QuestionInputMap[QuestionInput.CHECKBOXES],
    value: QuestionInput.CHECKBOXES
  }
];

type QuestionProps = {
  setQuestions: (arr: QuestionModel[]) => void;
  questions: QuestionModel[];
  index: number;
};

const Question = memo(function Question(props: QuestionProps) {
  const { questions, setQuestions, index } = props;
  const currentQuestion = questions[index];
  const [titleActive, setTitleActive] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [descriptionActive, setDescriptionActive] = useState(false);

  const removeQuestion = (index: number) => {
    const updatedQuestions = [...questions];
    updatedQuestions.splice(index, 1);
    setQuestions(updatedQuestions);
  };

  const addQuestionFromIndex = (index: number) => {
    if (index === questions.length - 1) {
      const updatedQuestions = [...questions];
      updatedQuestions.push(BLANK_QUESTION);
      setQuestions(updatedQuestions);
    } else {
      const updatedQuestions = [...questions];
      updatedQuestions.splice(index + 1, 0, BLANK_QUESTION);
      setQuestions(updatedQuestions);
    }
  };

  const updateQuestion = (args?: Partial<QuestionModel>) => {
    const newQuestion = {
      ...currentQuestion,
      ...(args || {})
    };
    const updated = [...questions];
    updated[index] = newQuestion;
    setQuestions(updated);
  };

  const updateOption = (value: string, index: number) => {
    const currentOptions = currentQuestion.options;
    currentOptions[index] = { ...currentQuestion, label: value };
    updateQuestion({ options: [...currentOptions] });
  };

  const addOption = () => {
    const currentOptions = currentQuestion.options;
    const newOption = {
      id: uuid(),
      label: `Option ${currentOptions.length + 1}`
    };
    currentOptions.push(newOption);
    // Somewhat complicated logic for keeping the "Other..." option as the last in the array
    // -- not sure the best way to do this --
    if (currentQuestion.input === QuestionInput.MULTIPLE_CHOICE) {
      const otherIndex = currentOptions.findIndex((opt) => opt.id === OTHER_ID);
      if (otherIndex >= 0) {
        currentOptions.splice(
          currentOptions.length - 1,
          0,
          currentOptions.splice(otherIndex, 1)[0]
        );
      }
    }
    updateQuestion({ options: [...currentOptions] });
  };

  const addOptionOther = () => {
    const currentOptions = currentQuestion.options;
    currentOptions.push({ label: "Other...", id: OTHER_ID, readOnly: true });
    updateQuestion({ options: [...currentOptions] });
  };

  const removeOption = (index: number) => {
    const currentOptions = currentQuestion.options;
    if (currentOptions.length === 1 && index === 0) return;
    currentOptions.splice(index, 1);
    updateQuestion({ options: [...currentOptions] });
  };

  return (
    <div className={`flex flex-col rounded bg-white shadow-2xl`}>
      <div className="flex justify-between px-2 pt-2 text-xs text-gray-400">
        <span className="inline-block">{`Question ${index + 1}`}</span>
      </div>
      <div className="px-6 py-2">
        <input
          onFocus={() => setTitleActive(true)}
          onBlur={() => setTitleActive(false)}
          type="text"
          onChange={(e: React.FormEvent<HTMLInputElement>) =>
            updateQuestion({ title: e.currentTarget.value })
          }
          value={currentQuestion.title}
          className={`w-full border-none ${
            titleActive && "bg-gray-100"
          } px-1 py-2 text-lg leading-none focus:border-rose-500 focus:ring-0`}
        />
        {InputBorder(titleActive)}
        <div className={`my-2 ${showDescription ? "block" : "hidden"}`}>
          <input
            onFocus={() => setDescriptionActive(true)}
            onBlur={() => setDescriptionActive(false)}
            placeholder="Description"
            type="text"
            onChange={(e: React.FormEvent<HTMLInputElement>) =>
              updateQuestion({ description: e.currentTarget.value })
            }
            value={currentQuestion.description}
            className={`${
              !descriptionActive && "text-gray-500"
            } w-full border-none p-0 text-sm leading-none focus:border-rose-500 focus:ring-0`}
          />
          {InputBorder(descriptionActive)}
        </div>
      </div>
      {currentQuestion.input === QuestionInput.TEXT_INPUT && <TextInput />}
      {currentQuestion.input === QuestionInput.TEXT_AREA && <TextArea />}
      {currentQuestion.input === QuestionInput.CHECKBOXES && (
        <Checkboxes
          options={currentQuestion.options}
          onUpdateOption={updateOption}
          onRemoveOption={removeOption}
          onAddOption={addOption}
        />
      )}
      {currentQuestion.input === QuestionInput.DROPDOWN && (
        <DropdownFormInput
          options={currentQuestion.options}
          onUpdateOption={updateOption}
          onRemoveOption={removeOption}
          onAddOption={addOption}
        />
      )}
      {currentQuestion.input === QuestionInput.MULTIPLE_CHOICE && (
        <MultipleChoice
          options={currentQuestion.options}
          onUpdateOption={updateOption}
          onRemoveOption={removeOption}
          onAddOption={addOption}
          onAddOther={addOptionOther}
        />
      )}

      {/* Footer */}
      <div className="mt-4 flex items-center justify-end gap-2 border-t p-2">
        <div className="flex items-center gap-2 text-gray-500">
          <span className="text-xs text-gray-500">Required</span>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              onChange={(e: React.FormEvent<HTMLInputElement>) =>
                updateQuestion({ required: e.currentTarget.checked })
              }
              className="peer sr-only"
              checked={currentQuestion.required}
            />
            <div className="h-5 w-9 rounded-full bg-gray-100 after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow after:transition-all after:content-[''] hover:bg-gray-200 peer-checked:bg-rose-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-4 peer-focus:ring-rose-200 peer-disabled:cursor-not-allowed peer-disabled:bg-gray-100 peer-disabled:after:bg-gray-50"></div>
          </label>
        </div>
        <Dropdown
          label={QuestionInputMap[currentQuestion.input]}
          options={INPUT_OPTIONS}
          onChange={(value: string) => {
            updateQuestion({ input: value as QuestionInput });
          }}
        />
        <button
          onClick={() => {
            if (showDescription) {
              updateQuestion({ description: "" });
              setShowDescription(false);
            } else {
              setShowDescription(true);
            }
          }}
          className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-xs text-gray-500 hover:bg-gray-100"
        >
          {showDescription ? "Hide description" : "Show description"}
        </button>
        <button
          onClick={() => removeQuestion(index)}
          className="rounded border px-3 py-2 text-gray-500 hover:bg-gray-100"
        >
          <GrTrash />
        </button>
        <button
          onClick={() => addQuestionFromIndex(index)}
          className="rounded border px-3 py-2 text-gray-500 hover:bg-gray-100"
        >
          <GrAdd />
        </button>
      </div>
    </div>
  );
});

export default Question;
