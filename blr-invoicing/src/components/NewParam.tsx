"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function Inner({ onNew }: { onNew: () => void }) {
  const n = useSearchParams().get("new");
  useEffect(() => {
    if (n === "1") {
      onNew();
      window.history.replaceState(null, "", window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);
  return null;
}
/** Opens the "add" dialog when a page is reached with ?new=1 (from the quick-create menu). */
export const NewParam = ({ onNew }: { onNew: () => void }) => (
  <Suspense fallback={null}>
    <Inner onNew={onNew} />
  </Suspense>
);
