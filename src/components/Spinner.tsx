export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex justify-center py-16" aria-busy>
      <span className="h-8 w-8 animate-spin rounded-full border-4 border-sky-200 border-t-sky-600" aria-label={label} />
    </div>
  );
}
