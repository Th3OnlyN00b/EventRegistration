import { v4 as uuid } from "uuid";

export enum QuestionInput {
  MULTIPLE_CHOICE = "MULTIPLE_CHOICE",
  CHECKBOXES = "CHECKBOXES",
  DROPDOWN = "DROPDOWN",
  TEXT_INPUT = "TEXT_INPUT",
  TEXT_AREA = "TEXT_AREA"
}

export const OTHER_ID = "other-id";

export type QuestionOption = {
  id: string;
  label: string;
  readOnly?: boolean;
};

export type QuestionModel = {
  id: string;
  title: string;
  input: QuestionInput;
  required: boolean;
  description: string;
  options: QuestionOption[];
};

export const BLANK_QUESTION: QuestionModel = {
  id: uuid(),
  input: QuestionInput.CHECKBOXES,
  title: "What can you bring?",
  description: "",
  options: [{ label: "Option 1", id: "option1" }],
  required: true
};
