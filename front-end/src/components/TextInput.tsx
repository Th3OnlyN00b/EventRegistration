import React from "react";

const TextInput = () => {
  return (
    <div className="px-9 py-3">
      <input
        className="w-full border-none bg-gray-100 px-2 py-3 text-xs"
        disabled={true}
        placeholder="Response text..."
      />
    </div>
  );
};

export default TextInput;
