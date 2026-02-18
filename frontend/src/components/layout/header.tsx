export function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <h1 className="text-lg font-medium text-gray-900">
        ClaimLens — AI-Powered OCR for OpenIMIS
      </h1>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">v0.1.0</span>
      </div>
    </header>
  );
}
