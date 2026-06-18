const foundationItems = [
  "Next.js App Router",
  "TypeScript",
  "Tailwind CSS",
  "Mock-first local development",
];

export default function Home() {
  return (
    <main className="min-h-screen px-6 py-10 sm:px-10">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl flex-col justify-center gap-8">
        <div className="max-w-3xl">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.16em] text-slate-500">
            Phase 0 foundation
          </p>
          <h1 className="text-4xl font-semibold text-slate-950 sm:text-5xl">
            E-commerce operations dashboard
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            Local-first scaffold for a portfolio operations dashboard. Business
            features, demo data, and external integrations start in later phases.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {foundationItems.map((item) => (
            <div
              className="rounded-lg border border-slate-200 bg-white p-4 text-sm font-medium text-slate-700 shadow-sm"
              key={item}
            >
              {item}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
