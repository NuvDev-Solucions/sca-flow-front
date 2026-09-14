// client/src/utils/thermalPrinter.js
import QRCode from 'qrcode';
import { socket } from '../socket';

export const DEFAULT_PRINTER_CONFIG = {
  enabled: true,
  paperWidth: '80mm', // '80mm' (Epson M352A / TM-T20) ou '58mm' (POS-58)
  modelName: 'Epson M352A (ESC/POS)',
  headerTitle: 'ScaFlow',
  headerSubtitle: 'Centro Integrado de Atendimento',
  unitName: 'Complexo Hospitalar Central',
  footerMessage: 'Aguarde ser chamado no painel da sala de espera.',
  footerSubMessage: 'Tenha em mãos documento oficial com foto e carteirinha.',
  showQrCode: true,
  qrCodeUrl: 'https://scaflow.med.br/fila/',
  showDateTime: true,
  showSpecialty: true,
  showPriority: true,
  fontSize: 'normal', // 'compact' | 'normal' | 'large'
  ticketNumberSize: 'xlarge', // 'large' | 'xlarge'
  cutPaper: true,
  copies: 1,
  silentMode: true,
  printMethod: 'native' // 'native' (Direto Windows Spooler sem telas) ou 'browser' (iframe window.print)
};

/**
 * Gera o documento HTML/CSS formatado especificamente para impressoras térmicas (80mm ou 58mm)
 */
export function buildTicketHtml(ticket, config = DEFAULT_PRINTER_CONFIG, qrCodeDataUrl = '') {
  const is58mm = config.paperWidth === '58mm';
  const paperMm = is58mm ? '58mm' : '80mm';
  const printWidthMm = is58mm ? '48mm' : '72mm';

  const ticketDate = ticket.createdAt ? new Date(ticket.createdAt) : new Date();
  const dateFormatted = ticketDate.toLocaleDateString('pt-BR');
  const timeFormatted = ticketDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const fontBase = config.fontSize === 'compact' ? '11px' : config.fontSize === 'large' ? '14px' : '12px';
  const codeSize = config.ticketNumberSize === 'large' 
    ? (is58mm ? '2.6rem' : '3.4rem') 
    : (is58mm ? '3.0rem' : '4.2rem');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Comprovante de Senha - ${ticket.codigo || 'SENHA'}</title>
  <style>
    @page {
      size: ${paperMm} auto;
      margin: 0 !important;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    html, body {
      margin: 0 auto !important;
      padding: 2mm 1mm 4mm 1mm !important;
      background: #ffffff !important;
      color: #000000 !important;
      font-family: 'Courier New', Courier, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
      width: 100% !important;
      max-width: ${printWidthMm};
      font-size: ${fontBase};
      line-height: 1.25;
      text-align: center;
    }
    .header-title {
      font-size: ${is58mm ? '16px' : '20px'};
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 2px;
    }
    .header-sub {
      font-size: ${is58mm ? '10px' : '11px'};
      color: #000000;
      margin-bottom: 2px;
      font-weight: 600;
    }
    .header-unit {
      font-size: ${is58mm ? '10px' : '11px'};
      font-style: italic;
      margin-bottom: 6px;
    }
    .divider {
      border-top: 1.5px dashed #000000;
      margin: 6px 0;
      width: 100%;
    }
    .double-divider {
      border-top: 2px solid #000000;
      margin: 8px 0;
      width: 100%;
    }
    .ticket-label {
      font-size: ${is58mm ? '10px' : '11px'};
      font-weight: 700;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      margin-top: 4px;
    }
    .ticket-code {
      font-size: ${codeSize};
      font-weight: 900;
      font-family: 'Courier New', Courier, monospace;
      letter-spacing: 2px;
      line-height: 1.0;
      margin: 6px 0;
    }
    .priority-badge {
      display: inline-block;
      border: 2px solid #000000;
      padding: 3px 10px;
      font-size: ${is58mm ? '10px' : '12px'};
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin: 4px 0 8px 0;
      border-radius: 2px;
    }
    .info-table {
      width: 100%;
      margin: 6px 0;
      font-size: ${is58mm ? '10px' : '12px'};
      text-align: left;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 2px 0;
    }
    .info-row strong {
      text-align: right;
      font-weight: 800;
    }
    .qr-container {
      margin: 8px 0 6px 0;
      text-align: center;
    }
    .qr-container img {
      width: ${is58mm ? '95px' : '130px'};
      height: ${is58mm ? '95px' : '130px'};
      image-rendering: pixelated;
    }
    .qr-caption {
      font-size: ${is58mm ? '9px' : '10px'};
      margin-top: 3px;
      font-weight: 600;
    }
    .footer-msg {
      font-size: ${is58mm ? '10px' : '11px'};
      font-weight: 700;
      margin-top: 8px;
      padding: 0 4px;
      line-height: 1.3;
    }
    .footer-sub {
      font-size: ${is58mm ? '9px' : '10px'};
      margin-top: 4px;
      padding: 0 4px;
    }
    .cut-feed {
      height: ${config.cutPaper ? '6mm' : '3mm'};
      display: block;
    }
  </style>
</head>
<body>
  <!-- CABEÇALHO DA INSTITUIÇÃO -->
  <div class="header-title">${config.headerTitle || 'ScaFlow'}</div>
  ${config.headerSubtitle ? `<div class="header-sub">${config.headerSubtitle}</div>` : ''}
  ${config.unitName ? `<div class="header-unit">${config.unitName}</div>` : ''}

  <div class="divider"></div>

  <!-- NÚMERO DA SENHA -->
  <div class="ticket-label">SENHA DE ATENDIMENTO</div>
  <div class="ticket-code">${ticket.codigo || '---'}</div>

  <!-- PRIORIDADE -->
  ${config.showPriority && ticket.prioridadeNome ? `
    <div>
      <span class="priority-badge">${ticket.prioridadeNome}</span>
    </div>
  ` : ''}

  <div class="divider"></div>

  <!-- DETALHES -->
  <div class="info-table">
    ${config.showSpecialty && ticket.servicoNome ? `
      <div class="info-row">
        <span>Especialidade:</span>
        <strong>${ticket.servicoNome}</strong>
      </div>
    ` : ''}

    ${config.showDateTime ? `
      <div class="info-row">
        <span>Emissão:</span>
        <strong>${dateFormatted} ${timeFormatted}</strong>
      </div>
    ` : ''}
  </div>

  <!-- QR CODE (SE HABILITADO) -->
  ${config.showQrCode && qrCodeDataUrl ? `
    <div class="qr-container">
      <img src="${qrCodeDataUrl}" alt="QR Fila" />
      <div class="qr-caption">Acompanhe a fila no seu celular</div>
    </div>
  ` : ''}

  <div class="divider"></div>

  <!-- MENSAGEM DE RODAPÉ -->
  ${config.footerMessage ? `<div class="footer-msg">${config.footerMessage}</div>` : ''}
  ${config.footerSubMessage ? `<div class="footer-sub">${config.footerSubMessage}</div>` : ''}

  <!-- ESPAÇO PARA O CORTE AUTOMÁTICO DE PAPEL DA EPSON -->
  <div class="cut-feed"></div>
</body>
</html>`;
}

/**
 * Disparo via Iframe (método do navegador)
 */
async function printViaIframe(ticket, config) {
  let qrCodeDataUrl = '';
  if (config.showQrCode) {
    try {
      const qrUrl = `${config.qrCodeUrl || 'https://scaflow.med.br/fila/'}?senha=${encodeURIComponent(ticket.codigo || '')}&esp=${encodeURIComponent(ticket.servicoId || '')}`;
      qrCodeDataUrl = await QRCode.toDataURL(qrUrl, {
        width: config.paperWidth === '58mm' ? 110 : 140,
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' }
      });
    } catch (qrErr) {
      console.warn('[ThermalPrinter] Erro ao gerar QR Code:', qrErr);
    }
  }

  const htmlContent = buildTicketHtml(ticket, config, qrCodeDataUrl);

  let iframe = document.getElementById('thermal-print-iframe');
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = 'thermal-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.top = '-10000px';
    iframe.style.left = '-10000px';
    iframe.style.width = '1px';
    iframe.style.height = '1px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
  }

  const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!iframeDoc) {
    throw new Error('Não foi possível acessar o iframe de impressão.');
  }

  iframeDoc.open();
  iframeDoc.write(htmlContent);
  iframeDoc.close();

  return new Promise((resolve) => {
    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        resolve({ printed: true, native: false, ticketId: ticket.id, codigo: ticket.codigo });
      } catch (printErr) {
        console.error('[ThermalPrinter] Erro no print() do iframe:', printErr);
        resolve({ printed: false, error: printErr.message });
      }
    }, 100);
  });
}

/**
 * Dispara a impressão térmica: Nativamente pelo Windows (Zero popups)
 * ou via Navegador Kiosk se configurado assim.
 */
export async function printThermalTicket(ticket, customConfig = {}) {
  try {
    const config = { ...DEFAULT_PRINTER_CONFIG, ...customConfig };
    if (!config.enabled) {
      console.log('[ThermalPrinter] Impressão desativada nas configurações.');
      return { printed: false, reason: 'disabled' };
    }

    // Método NATIVO: Zero telas, zero janelas, zero popups!
    if (config.printMethod === 'native') {
      return new Promise((resolve) => {
        socket.emit('printer:printNative', { ticket }, (res) => {
          if (res && res.success) {
            console.log(`[ThermalPrinter] Impresso nativamente sem telas para a senha ${ticket.codigo}`);
            resolve({ printed: true, native: true, ticketId: ticket.id, codigo: ticket.codigo });
          } else {
            console.warn('[ThermalPrinter] Falha no nativo, tentando fallback iframe:', res?.error);
            printViaIframe(ticket, config).then(resolve);
          }
        });
      });
    }

    // Método Navegador (Kiosk Printing)
    return await printViaIframe(ticket, config);

  } catch (err) {
    console.error('[ThermalPrinter] Falha geral ao imprimir:', err);
    return { printed: false, error: err.message };
  }
}

/**
 * Imprime um bilhete de teste com dados simulados
 */
export async function printTestTicket(config) {
  const dummyTicket = {
    id: `test_${Date.now()}`,
    codigo: 'CARD007',
    servicoId: 'cardiologia',
    servicoNome: 'Cardiologia & Check-up',
    prioridadeId: 'PREFERENCIAL',
    prioridadeNome: 'Atendimento Prioritário',
    createdAt: new Date().toISOString()
  };

  return await printThermalTicket(dummyTicket, config);
}
