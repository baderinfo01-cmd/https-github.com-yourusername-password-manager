/**
 * Prints an HTML document through a hidden iframe: pop-up windows are blocked in the
 * desktop app (setWindowOpenHandler denies them), and an iframe also works offline.
 */
export function printHtml(html: string) {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;width:0;height:0;border:0;right:0;bottom:0;visibility:hidden";
  document.body.appendChild(frame);
  const win = frame.contentWindow;
  if (!win) {
    frame.remove();
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.onafterprint = () => setTimeout(() => frame.remove(), 500);
  // let styles settle, then open the print dialog of the hidden frame
  setTimeout(() => {
    win.focus();
    win.print();
    // some engines never fire afterprint for frames: do not leave the frame behind
    setTimeout(() => frame.isConnected && frame.remove(), 60_000);
  }, 400);
}
