import Link from "next/link";
export default function NotFound() {
  return (
    <main className="market-shell">
      <div className="panel">
        <h1 className="text-3xl font-bold">This page is unavailable.</h1>
        <p className="my-5">
          The address may be incorrect, or this page may have moved.
        </p>
        <Link href="/" className="button">
          Return home
        </Link>
      </div>
    </main>
  );
}
