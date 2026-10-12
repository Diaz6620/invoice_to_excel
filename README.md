# Factura a Excel

Sube facturas (PDF/JPG/PNG) → tabla editable → Excel / CSV / copiar.

## Desplegar en Netlify
1. Sube esta carpeta a un repo de GitHub (o arrástrala en app.netlify.com/drop; con la función necesitas CLI o repo).
2. Netlify → Site settings → Environment variables → añade `ANTHROPIC_API_KEY`.
3. Deploy. No hay build: `netlify.toml` ya lo configura.

CLI: `npm i -g netlify-cli && netlify dev` (local) · `netlify deploy --prod`.

Notas: límite ~4 MB por archivo (Netlify limita el cuerpo a 6 MB). El modelo se cambia con `ANTHROPIC_MODEL`.
