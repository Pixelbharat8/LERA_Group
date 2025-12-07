export function Button({ children }: { children: any }) {
  return (
    <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-800">
      {children}
    </button>
  );
}
