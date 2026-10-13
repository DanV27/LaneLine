import { GeneratorForm } from "@/components/generator/GeneratorForm";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Build a workout</h1>
        <p className="mt-2 text-slate-600">
          Pick your pool, how much you want to swim, and what to work on. LaneLine writes the sets.
        </p>
      </div>
      <GeneratorForm />
    </main>
  );
}
