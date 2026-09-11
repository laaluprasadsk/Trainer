import Link from "next/link";
export default function NotFound() {
  return (
    <main className="market-shell">
      <div className="panel">
        <h1 className="text-3xl font-bold">This page is unavailable.</h1>
        <p className="my-5">The trainer or page may no longer be published.</p>
        <Link href="/trainers" className="button">
          Find trainers
        </Link>
      </div>
    </main>
  );
}
