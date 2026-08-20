export interface InstitutionalEmailTemplateParams {
  recipientName: string;
  subject: string;
  body: string;
  senderName?: string;
  academyName?: string;
  year?: number;
}

export function generateInstitutionalEmailHtml(
  params: InstitutionalEmailTemplateParams,
): string {
  const academyName =
    params.academyName || 'Centro de Danzas Jeroky Paraguai';
  const year = params.year || new Date().getFullYear();
  const dateFormatted = new Intl.DateTimeFormat('es-PY', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'America/Asuncion',
  }).format(new Date());

  // Convert line breaks in body to HTML paragraphs / breaks cleanly with HTML escaping
  const formattedBody = params.body
    .split('\n\n')
    .map((paragraph) => {
      const clean = escapeHtml(paragraph.trim()).replace(/\n/g, '<br />');
      return clean ? `<p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #334155;">${clean}</p>` : '';
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(params.subject)}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f8fafc;
      padding: 32px 16px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
      border: 1px solid #e2e8f0;
    }
    .header {
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%);
      padding: 32px 28px;
      text-align: center;
      color: #ffffff;
    }
    .header-logo-text {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin: 0;
      color: #f8fafc;
      text-transform: uppercase;
    }
    .header-badge {
      display: inline-block;
      margin-top: 8px;
      font-size: 12px;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      background-color: rgba(255, 255, 255, 0.15);
      padding: 4px 12px;
      border-radius: 9999px;
      color: #e0e7ff;
      font-weight: 600;
    }
    .content {
      padding: 32px 28px;
    }
    .subject-title {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 16px 0;
      line-height: 1.3;
    }
    .greeting {
      font-size: 15px;
      font-weight: 600;
      color: #4338ca;
      margin: 0 0 16px 0;
    }
    .body-box {
      background-color: #f8fafc;
      border-left: 4px solid #4338ca;
      border-radius: 0 8px 8px 0;
      padding: 20px;
      margin: 20px 0;
    }
    .meta-box {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px dashed #cbd5e1;
      font-size: 12px;
      color: #64748b;
    }
    .footer {
      background-color: #f1f5f9;
      padding: 24px 28px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
      line-height: 1.5;
      border-top: 1px solid #e2e8f0;
    }
    .footer p {
      margin: 4px 0;
    }
    .footer-highlight {
      font-weight: 600;
      color: #334155;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <!-- Encabezado Institucional -->
      <div class="header">
        <h1 class="header-logo-text">Jeroky Soft</h1>
        <div class="header-badge">${escapeHtml(academyName)}</div>
      </div>

      <!-- Contenido Principal -->
      <div class="content">
        <h2 class="subject-title">${escapeHtml(params.subject)}</h2>
        
        <p class="greeting">Estimado/a ${escapeHtml(params.recipientName)},</p>
        
        <div class="body-box">
          ${formattedBody}
        </div>

        <!-- Metadatos de Auditoría -->
        <div class="meta-box">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="color: #64748b; font-size: 12px;"><strong>Emisión:</strong> ${dateFormatted}</td>
              <td style="text-align: right; color: #64748b; font-size: 12px;"><strong>Canal:</strong> Notificación Oficial</td>
            </tr>
          </table>
        </div>
      </div>

      <!-- Pie de Página Institucional -->
      <div class="footer">
        <p class="footer-highlight">${escapeHtml(academyName)}</p>
        <p>Sistema de Gestión Académica, Control Biométrico y Comunicaciones Institucionales</p>
        <p style="margin-top: 10px; font-size: 11px; color: #94a3b8;">
          Este es un correo institucional automático generado por <strong>Jeroky Soft</strong>. Por favor, no responda directamente a este mensaje a menos que se indique lo contrario.
        </p>
        <p style="font-size: 11px; color: #94a3b8;">© ${year} ${escapeHtml(academyName)}. Todos los derechos reservados.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
