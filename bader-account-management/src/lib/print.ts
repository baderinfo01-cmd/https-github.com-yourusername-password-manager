import { getOwner } from "@/lib/owner";

export function printPage(title?: string) {
  if (title) {
    document.title = title;
  }
  window.print();
}

/**
 * Prints an HTML document through a hidden iframe: pop-up windows are blocked in the
 * desktop app (and by browsers), and an iframe also works offline.
 */
export function printHtml(html: string) {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;width:0;height:0;border:0;right:0;bottom:0;visibility:hidden";
  document.body.appendChild(frame);
  const win = frame.contentWindow;
  if (!win) {
    frame.remove();
    alert("Print failed");
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

export function printElement(elementId: string, title?: string) {
  const content = document.getElementById(elementId);
  if (!content) {
    alert("لا يوجد محتوى للطباعة");
    return;
  }

  const cleanContent = content.cloneNode(true) as HTMLElement;

  cleanContent.querySelectorAll(".no-print").forEach((el) => el.remove());

  cleanContent
    .querySelectorAll('button, [role="button"]')
    .forEach((el) => el.remove());

  cleanContent.querySelectorAll(".print-only").forEach((el) => el.remove());

  const owner = getOwner();
  const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const currentDate = new Date().toLocaleDateString("ar-DZ", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const html = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>${title || "طباعة"}</title>
        <style>
          @page {
            size: A4;
            margin: 15mm;
          }
          
          * {
            box-sizing: border-box;
          }
          
          body {
            font-family: "Tajawal", Arial, sans-serif;
            padding: 20px;
            margin: 0;
            color: #1a1a1a;
            background: white;
            direction: rtl;
            line-height: 1.6;
          }
          
          .print-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 3px solid #0ea5e9;
            padding-bottom: 15px;
            margin-bottom: 25px;
          }
          
          .print-header .logo {
            font-size: 22px;
            font-weight: bold;
            color: #0ea5e9;
          }
          
          .print-header .date {
            text-align: left;
            font-size: 13px;
            color: #555;
          }
          
          h1, h2, h3, h4, h5 {
            color: #0ea5e9;
            margin-top: 20px;
            margin-bottom: 10px;
          }
          
          h1 {
            font-size: 26px;
            border-bottom: 2px solid #0ea5e9;
            padding-bottom: 8px;
          }
          
          h2 {
            font-size: 18px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
          }
          
          h3 {
            font-size: 15px;
            color: #334155;
          }
          
          .info-row {
            display: flex;
            padding: 6px 0;
            border-bottom: 1px dashed #eee;
            align-items: center;
          }
          
          .info-row strong {
            min-width: 130px;
            color: #555;
            margin-left: 10px;
            font-weight: 600;
          }
          
          .profile-section {
            display: flex;
            gap: 20px;
            align-items: center;
            margin-bottom: 25px;
            padding: 15px;
            background: linear-gradient(135deg, #f0f9ff 0%, #ede9fe 100%);
            border-radius: 10px;
          }
          
          .profile-avatar {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            background: linear-gradient(135deg, #0ea5e9, #2563eb);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 36px;
            font-weight: bold;
            overflow: hidden;
            flex-shrink: 0;
          }
          
          .profile-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          
          .profile-info h2 {
            margin: 0 0 5px 0;
            border: none;
            padding: 0;
            font-size: 22px;
          }
          
          .section {
            margin-bottom: 20px;
            page-break-inside: avoid;
          }
          
          .experience-item,
          .education-item,
          .cert-item,
          .achievement-item {
            margin-bottom: 12px;
            padding: 10px 15px;
            background: #f9fafb;
            border-right: 4px solid #0ea5e9;
            border-radius: 6px;
            page-break-inside: avoid;
          }
          
          .item-title {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 3px;
          }
          
          .item-subtitle {
            color: #555;
            font-size: 13px;
            margin-bottom: 3px;
          }
          
          .item-date {
            color: #888;
            font-size: 12px;
          }
          
          .hobbies-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
          }
          
          .hobby-item {
            background: #f0f9ff;
            padding: 8px 12px;
            border-radius: 6px;
            text-align: center;
            font-size: 13px;
          }
          
          .skills-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
          }
          
          .skill-tag {
            background: #e0f2fe;
            color: #075985;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 12px;
          }
          
          .footer {
            margin-top: 30px;
            padding-top: 12px;
            border-top: 2px solid #0ea5e9;
            text-align: center;
            font-size: 11px;
            color: #666;
          }
          
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-header">
          <div class="logo" style="display:flex;align-items:center;gap:10px"><img src="${new URL("/brand/app-icon.png", location.origin).href}" style="width:34px;height:34px;border-radius:9px" alt=""> Bader Account Management</div>
          <div class="date">${currentDate}</div>
        </div>
        <div style="display:flex;gap:24px;margin:-10px 0 18px;font-size:13px;color:#334155">
          <div>صاحب الحساب: <strong>${esc(owner.name) || "—"}</strong></div>
          <div>اسم المستخدم: <strong dir="ltr">${esc(owner.username) || "—"}</strong></div>
        </div>
        
        ${cleanContent.innerHTML}
        
        <div class="footer">
          تم إنشاء هذا التقرير بواسطة Bader Account Management v3.0.0
          <br>
          © ${new Date().getFullYear()} baderinfo.com - جميع الحقوق محفوظة
        </div>
        
      </body>
    </html>
  `;
  printHtml(html);
}

export function exportToJSON(data: any, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.json`;
  a.click();
  URL.revokeObjectURL(url);
}