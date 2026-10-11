"use client";
import { create } from "zustand";

export type Paper = "a4" | "thermal";
export interface PreviewRequest {
  title: string;
  fileName: string;
  papers?: Paper[];          // papers the user may switch between (default: A4 only)
  paper?: Paper;             // initial paper
  build: (paper: Paper) => Promise<string>;
}
interface PreviewState { req: PreviewRequest | null; open(r: PreviewRequest): void; close(): void }
export const usePreview = create<PreviewState>((set) => ({ req: null, open: (req) => set({ req }), close: () => set({ req: null }) }));
export const openPreview = (r: PreviewRequest) => usePreview.getState().open(r);
