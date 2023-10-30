export const TextInput = () => {
  return (
    <div className="px-9 py-3">
      <input
        className="w-full border-none bg-gray-100 px-2 py-3 text-xs"
        disabled={true}
        placeholder="Short-form text"
      />
    </div>
  );
};

export const TextArea = () => {
  return (
    <div className="px-9 py-3">
      <textarea
        className="w-full rounded-md border-none border-gray-300 bg-gray-100 px-2 py-3 text-xs shadow-sm focus:border-rose-300 focus:ring focus:ring-rose-200"
        rows={5}
        disabled={true}
        placeholder="Long-form text"
      />
    </div>
  );
};
