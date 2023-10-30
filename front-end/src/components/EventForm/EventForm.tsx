import React, { useState } from "react";
import { GrAdd } from "react-icons/gr";
import Question from "./Question";
import FormHeading from "./FormHeading";
import Navbar from "../Navbar";
import { BLANK_QUESTION, QuestionModel } from "../../models";

const EventForm = () => {
  const [title, setTitle] = useState("Event title");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<QuestionModel[]>([BLANK_QUESTION]);

  return (
    <div>
      <Navbar />
      <div className="flex min-h-screen flex-col items-center bg-rose-100 py-12">
        <div className="flex w-[900px] flex-col gap-4">
          <FormHeading
            title={title}
            description={description}
            setTitle={setTitle}
            setDescription={setDescription}
          />
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
              <Question
                key={`${question.id}-${index}`}
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
