"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="market-shell">
      <section className="panel">
        <h1 className="text-2xl font-bold">We could not load this page.</h1>
        <p className="my-4">Please check your connection and try again.</p>
        <button onClick={reset} className="button">
          Try again
        </button>
      </section>
    </main>
  );
}
