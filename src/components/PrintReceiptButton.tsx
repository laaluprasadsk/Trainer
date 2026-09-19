"use client";

export function PrintReceiptButton() {
  return (
    <button className="nav-pill" onClick={() => window.print()}>
      Print receipt
    </button>
  );
}
