"use client";

const TONES = {
  green: { ink: "#1e40af", soft: "rgba(30,64,175,0.07)", glow: "rgba(59,130,246,0.35)" }, // genuine license: official blue, like the Baderinfo seal
  amber: { ink: "#b45309", soft: "rgba(180,83,9,0.07)", glow: "rgba(245,158,11,0.4)" },
  red: { ink: "#b91c1c", soft: "rgba(185,28,28,0.07)", glow: "rgba(239,68,68,0.35)" },
} as const;

/**
 * The two license marks: the round Baderinfo seal, and under it a narrower, taller rectangular
 * "genuine license" stamp (double border, edition and license number), slightly rotated like a real stamp.
 */
export function LicenseSeals({ title, plan, id, tone = "green", size = 190 }: { title: string; plan?: string; id: string; tone?: keyof typeof TONES; size?: number }) {
  const { ink, soft, glow } = TONES[tone];
  const w = Math.round(size * 0.76);
  const k = size / 190;
  return (
    <div className="mx-auto flex flex-col items-center" style={{ gap: Math.round(12 * k) }}>
      <img src="/brand/seal.png" alt="Baderinfo" width={size} height={size} style={{ width: size, height: size }} className="drop-shadow-[0_8px_16px_rgba(15,23,42,0.16)]" />
      <div style={{ transform: "rotate(-3deg)", width: w, padding: 4, border: `1.5px solid ${glow}`, borderRadius: 14, background: "rgba(255,255,255,.92)", boxShadow: `0 0 0 3px ${soft}, 0 10px 20px -12px rgba(15,23,42,.4)` }}>
        <div style={{ border: `2.5px solid ${ink}`, borderRadius: 10, background: soft, color: ink, textAlign: "center", padding: `${8 * k}px ${8 * k}px ${9 * k}px` }}>
          <div dir="ltr" style={{ fontSize: Math.max(7, 8.5 * k), letterSpacing: 2.2, fontWeight: 800, opacity: 0.8 }}>BADERINFO</div>
          <div style={{ height: 1.5, background: ink, opacity: 0.35, margin: `${4 * k}px 0 ${6 * k}px` }} />
          <div style={{ fontSize: Math.max(13, 17 * k), fontWeight: 800, lineHeight: 1.2, whiteSpace: "nowrap" }}>{title}</div>
          {plan && <div dir="ltr" style={{ marginTop: 6 * k, fontSize: Math.max(8.5, 10.5 * k), fontWeight: 800, letterSpacing: 2 }}>{plan.toUpperCase()}</div>}
          <div style={{ height: 1.5, background: ink, opacity: 0.35, margin: `${6 * k}px 0` }} />
          <div dir="ltr" style={{ fontFamily: "ui-monospace, Consolas, monospace", fontSize: Math.max(9.5, 11 * k), fontWeight: 800, letterSpacing: 0.4, whiteSpace: "nowrap" }}>{id || "—"}</div>
        </div>
      </div>
    </div>
  );
}
