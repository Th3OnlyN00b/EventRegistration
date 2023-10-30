const InputBorder = (fieldActive: boolean) => {
  return (
    <div
      className={`border-t-2 ${
        fieldActive ? "border-rose-300" : "border-gray-200"
      }`}
    />
  );
};

export default InputBorder;
