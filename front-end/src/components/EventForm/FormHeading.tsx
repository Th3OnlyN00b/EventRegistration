import React, { useState } from "react";
import InputBorder from "./InputBorder";

type FormHeadingProps = {
  title: string;
  description: string;
  setTitle: (x: string) => void;
  setDescription: (x: string) => void;
};

const FormHeading = (props: FormHeadingProps) => {
  const { description, setDescription, title, setTitle } = props;
  const [titleActive, setTitleActive] = useState(false);
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
        {InputBorder(titleActive)}
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
        {InputBorder(descriptionActive)}
      </div>
    </div>
  );
};

export default FormHeading;
