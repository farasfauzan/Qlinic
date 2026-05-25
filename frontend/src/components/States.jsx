export function LoadingState() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="flex h-8 w-8 animate-spin items-center justify-center rounded-full border-2 border-[#0a4778] border-t-transparent"></div>
    </div>
  );
}

export function EmptyState({ title, description }) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
      <h3 className="text-base font-semibold text-[#12385d]">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </div>
  );
}
