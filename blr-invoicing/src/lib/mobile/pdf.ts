// HTML -> PDF on the phone (no printer driver): render in a hidden iframe, rasterise, slice into pages.
export async function htmlToPdfBase64(html: string, paper: string): Promise<string> {
  const thermal = paper === "thermal";
  const W = thermal ? 302 : 794;
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
  const frame = document.createElement("iframe");
  frame.setAttribute("sandbox", "allow-same-origin");
  Object.assign(frame.style, { position: "fixed", left: "-10000px", top: "0", width: `${W}px`, height: "1200px", border: "0", background: "#fff" });
  document.body.appendChild(frame);
  try {
    await new Promise<void>((res) => { frame.onload = () => res(); frame.srcdoc = html; });
    const doc = frame.contentDocument!;
    await (doc as any).fonts?.ready?.catch(() => {});
    await Promise.all(Array.from(doc.images).map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = () => r(null); }))));
    const el = doc.body;
    const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#ffffff", width: W, windowWidth: W, logging: false });
    const wMm = thermal ? 80 : 210;
    const pageH = thermal ? (canvas.height / canvas.width) * wMm : 297;
    const pdf = new jsPDF({ unit: "mm", format: [wMm, pageH], orientation: "portrait", compress: true });
    const pxPerPage = Math.floor((canvas.width * pageH) / wMm);
    for (let y = 0, page = 0; y < canvas.height; y += pxPerPage, page++) {
      const slice = document.createElement("canvas");
      slice.width = canvas.width; slice.height = Math.min(pxPerPage, canvas.height - y);
      slice.getContext("2d")!.drawImage(canvas, 0, y, canvas.width, slice.height, 0, 0, canvas.width, slice.height);
      if (page) pdf.addPage([wMm, pageH]);
      pdf.addImage(slice.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, wMm, (slice.height * wMm) / canvas.width);
    }
    return pdf.output("datauristring").split(",")[1];
  } finally { frame.remove(); }
}
