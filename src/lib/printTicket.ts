export interface TicketData {
  nombre: string;
  cedula: string;
}

function esc(value: string): string {
  return String(value ?? "").replace(
    /[&<>"]/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c
  );
}

/**
 * Genera e imprime un tiquete de asistencia (nombre + cédula) usando el
 * diálogo de impresión del navegador. Funciona con cualquier impresora que
 * reconozca el sistema operativo (incluidas las térmicas de 80 mm).
 *
 * El tiquete se dibuja en un iframe oculto para no afectar la página y evitar
 * bloqueadores de ventanas emergentes.
 */
export function printTicket({ nombre, cedula }: TicketData): void {
  if (typeof window === "undefined") return;

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>Tiquete</title>
<style>
  @page { size: 80mm auto; margin: 4mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    width: 72mm;
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    color: #000;
    text-align: left;
    padding: 4mm 0 4mm 6mm;
  }
  .name { font-size: 20px; font-weight: 700; line-height: 1.25; margin: 0 0 6px; }
  .cc { font-family: ui-monospace, "Courier New", monospace; font-size: 16px; font-weight: 700; }
</style>
</head>
<body>
  <div class="name">${esc(nombre)}</div>
  <div class="cc">CC ${esc(cedula)}</div>
</body>
</html>`;

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  const doc = win?.document;
  if (!win || !doc) {
    iframe.remove();
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  const cleanup = () => {
    setTimeout(() => iframe.remove(), 1500);
  };

  // Espera a que el logo cargue antes de imprimir; con un respaldo por tiempo.
  let printed = false;
  const doPrint = () => {
    if (printed) return;
    printed = true;
    win.focus();
    win.print();
    cleanup();
  };

  win.onload = () => setTimeout(doPrint, 250);
  // Respaldo por si onload no dispara (contenido ya listo).
  setTimeout(doPrint, 1200);
}
