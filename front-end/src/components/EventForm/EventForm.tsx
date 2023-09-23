import React, { useState, memo } from "react";
import { v4 as uuid } from "uuid";
import { GrAdd, GrTrash } from "react-icons/gr";

import {
  Dropdown,
  // MultipleChoice,
  // Checkboxes,
  TextInput,
  InputGenericSelector
} from "../index";
import Navbar from "../Navbar";

enum QuestionInput {
  MULTIPLE_CHOICE = "MULTIPLE_CHOICE",
  CHECKBOXES = "CHECKBOXES",
  DROPDOWN = "DROPDOWN",
  TEXT_INPUT = "TEXT_INPUT"
}

const QuestionInputMap = {
  MULTIPLE_CHOICE: "Multiple choice",
  DROPDOWN: "Dropdown",
  TEXT_INPUT: "Text",
  CHECKBOXES: "Checkboxes"
};

const DROPDOWN_OPTIONS = [
  {
    label: QuestionInputMap[QuestionInput.TEXT_INPUT],
    value: QuestionInput.TEXT_INPUT
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

type EventQuestion = {
  id: string;
  title: string;
  input: QuestionInput;
  required: boolean;
  description: string;
  options: string[];
};

const BLANK_QUESTION: EventQuestion = {
  id: uuid(),
  input: QuestionInput.CHECKBOXES,
  title: "What can you bring?",
  description: "",
  options: ["Option 1"],
  required: true
};

const FieldBorder = (fieldActive: boolean) => {
  return (
    <div
      className={`border-t-2 ${
        fieldActive ? "border-rose-300" : "border-gray-200"
      }`}
    />
  );
};

const EventFormHeading = () => {
  const [title, setTitle] = useState("Title");
  const [titleActive, setTitleActive] = useState(false);
  const [description, setDescription] = useState("");
  const [descriptionActive, setDescriptionActive] = useState(false);

  return (
    <div className="flex flex-col gap-2 rounded border-t-8 border-rose-500 bg-white p-6 shadow-2xl">
      <div>
        <input
          onFocus={() => setTitleActive(true)}
          onBlur={() => setTitleActive(false)}
          type="text"
          onChange={(e: React.FormEvent<HTMLInputElement>) =>
            setTitle(e.currentTarget.value)
          }
          value={title}
          className="w-full border-none bg-transparent px-1 py-2 text-2xl leading-none focus:border-rose-500 focus:ring-0"
        />
        {FieldBorder(titleActive)}
      </div>
      <div>
        <input
          onFocus={() => setDescriptionActive(true)}
          onBlur={() => setDescriptionActive(false)}
          type="text"
          onChange={(e: React.FormEvent<HTMLInputElement>) =>
            setDescription(e.currentTarget.value)
          }
          value={description}
          className="w-full border-none p-0 text-sm leading-none focus:border-rose-500 focus:ring-0"
          placeholder="Description"
        />
        {FieldBorder(descriptionActive)}
      </div>
    </div>
  );
};

type EventQuestionComponentProps = {
  setQuestions: (arr: EventQuestion[]) => void;
  questions: EventQuestion[];
  index: number;
};

const EventQuestionComponent = memo(function EventQuestionComponent(
  props: EventQuestionComponentProps
) {
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

  const updateQuestion = (args?: Partial<EventQuestion>) => {
    const newQuestion = {
      ...currentQuestion,
      ...(args || {})
    };
    const updated = [...questions];
    updated[index] = newQuestion;
    setQuestions(updated);
  };

  const updateOption = (value: string, index: number) => {
    const currentCheckboxOptions = currentQuestion.options;
    currentCheckboxOptions[index] = value;
    updateQuestion({ options: [...currentCheckboxOptions] });
  };

  const addOption = () => {
    const currentCheckboxOptions = currentQuestion.options;
    const newOption = `Option ${currentCheckboxOptions.length + 1}`;
    currentCheckboxOptions.push(newOption);
    updateQuestion({ options: [...currentCheckboxOptions] });
  };

  const removeOption = (index: number) => {
    const currentCheckboxOptions = currentQuestion.options;
    if (currentCheckboxOptions.length === 1 && index === 0) return;
    currentCheckboxOptions.splice(index, 1);
    updateQuestion({ options: [...currentCheckboxOptions] });
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
        {FieldBorder(titleActive)}
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
          {FieldBorder(descriptionActive)}
        </div>
      </div>
      {currentQuestion.input === QuestionInput.TEXT_INPUT ? (
        <TextInput />
      ) : (
        <InputGenericSelector
          input={currentQuestion.input}
          options={currentQuestion.options}
          onUpdateOption={updateOption}
          onRemoveOption={removeOption}
          onAddOption={addOption}
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
          options={DROPDOWN_OPTIONS}
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

const EventForm = () => {
  const [questions, setQuestions] = useState<EventQuestion[]>([BLANK_QUESTION]);
  return (
    <div>
      <Navbar />
      <div className="flex min-h-screen flex-col items-center bg-rose-100 py-12">
        <div className="flex w-[900px] flex-col gap-4">
          <EventFormHeading />
          {questions.length === 0 && (
            <div className="flex justify-center">
              <button
                onClick={() => setQuestions([BLANK_QUESTION])}
                className="flex w-[170px] items-center justify-between rounded border bg-white px-3 py-2 hover:bg-gray-100"
              >
                <GrAdd /> Add question
              </button>
            </div>
          )}
          {questions.map((question, index) => {
            return (
              <EventQuestionComponent
                key={question.id}
                questions={questions}
                index={index}
                setQuestions={setQuestions}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EventForm;
