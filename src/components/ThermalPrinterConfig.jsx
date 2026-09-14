// client/src/components/ThermalPrinterConfig.jsx
import React, { useState, useEffect } from 'react';
import {
  Printer,
  Settings2,
  Save,
  Eye,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Sliders,
  FileText,
  Check,
  RefreshCw,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Info,
  Zap
} from 'lucide-react';
import QRCode from 'qrcode';
import { socket } from '../socket';
import { DEFAULT_PRINTER_CONFIG, printTestTicket } from '../utils/thermalPrinter';

export default function ThermalPrinterConfig() {
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('sca_printer_config');
    if (saved) {
      try {
        return { ...DEFAULT_PRINTER_CONFIG, ...JSON.parse(saved) };
      } catch (e) { }
    }
    return DEFAULT_PRINTER_CONFIG;
  });

  const [previewQrUrl, setPreviewQrUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Carrega configuração do servidor e escuta atualizações
  useEffect(() => {
    socket.emit('printer:config:get', {}, (res) => {
      if (res && res.success && res.config) {
        setConfig(prev => ({ ...prev, ...res.config }));
        localStorage.setItem('sca_printer_config', JSON.stringify(res.config));
      }
    });

    const handleConfigUpdated = (updatedConfig) => {
      if (updatedConfig) {
        setConfig(prev => ({ ...prev, ...updatedConfig }));
        localStorage.setItem('sca_printer_config', JSON.stringify(updatedConfig));
      }
    };

    socket.on('printer:config:updated', handleConfigUpdated);
    return () => {
      socket.off('printer:config:updated', handleConfigUpdated);
    };
  }, []);

  // Atualiza QR Code da prévia em tempo real
  useEffect(() => {
    let active = true;
    if (config.showQrCode) {
      const url = `${config.qrCodeUrl || 'https://scaflow.med.br/fila/'}?senha=CARD007&esp=cardiologia`;
      QRCode.toDataURL(url, {
        width: config.paperWidth === '58mm' ? 105 : 130,
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' }
      }).then(dataUrl => {
        if (active) setPreviewQrUrl(dataUrl);
      }).catch(() => { });
    } else {
      setPreviewQrUrl('');
    }
    return () => { active = false; };
  }, [config.showQrCode, config.qrCodeUrl, config.paperWidth]);

  const handleChange = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    setSaveSuccess(false);
  };

  const handleSave = () => {
    setIsSaving(true);
    socket.emit('printer:config:save', config, (res) => {
      setIsSaving(false);
      if (res && res.success) {
        setSaveSuccess(true);
        localStorage.setItem('sca_printer_config', JSON.stringify(res.config || config));
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        alert('Erro ao sincronizar com o servidor. A configuração foi salva localmente.');
        localStorage.setItem('sca_printer_config', JSON.stringify(config));
      }
    });
  };

  const handleTestPrint = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await printTestTicket(config);
      if (res.printed) {
        setTestResult({ success: true, message: `Comando enviado para ${config.modelName} (${config.paperWidth})` });
      } else {
        setTestResult({ success: false, message: res.error || 'A impressão não foi concluída.' });
      }
    } catch (err) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setIsTesting(false);
      setTimeout(() => setTestResult(null), 6000);
    }
  };

  const is58mm = config.paperWidth === '58mm';

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* CABEÇALHO DO MÓDULO */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(7, 19, 63, 0.95) 0%, rgba(2, 8, 23, 0.98) 100%)',
        border: '1px solid rgba(46, 158, 253, 0.35)',
        borderRadius: '24px',
        padding: '24px 28px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        boxShadow: '0 12px 36px rgba(2, 8, 23, 0.65)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(46, 158, 253, 0.25) 0%, rgba(127, 72, 252, 0.2) 100%)',
            border: '1px solid rgba(46, 158, 253, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#2E9EFD'
          }}>
            <Printer size={28} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#FDFCFD', letterSpacing: '-0.02em' }}>
                Gestão da Impressora Térmica
              </h1>
              <span style={{
                padding: '3px 10px',
                borderRadius: '9999px',
                background: config.enabled ? 'rgba(52, 211, 153, 0.18)' : 'rgba(239, 68, 68, 0.18)',
                color: config.enabled ? '#34d399' : '#f87171',
                border: `1px solid ${config.enabled ? 'rgba(52, 211, 153, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                fontSize: '0.75rem',
                fontWeight: 800,
                letterSpacing: '0.04em'
              }}>
                {config.enabled ? 'AUTO-PRINT ATIVO' : 'IMPRESSÃO PAUSADA'}
              </span>
            </div>
            <p style={{ color: '#B5BCD7', fontSize: '0.86rem', marginTop: '4px' }}>
              Configuração de bobina, mensagens personalizadas e layout para <strong>Epson M352A</strong> e impressoras ESC/POS
            </p>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleTestPrint}
            disabled={isTesting}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '12px',
              background: 'rgba(19, 36, 160, 0.4)',
              border: '1px solid rgba(93, 94, 252, 0.4)',
              color: '#FDFCFD',
              fontSize: '0.86rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#2E9EFD'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(93, 94, 252, 0.4)'}
          >
            <Printer size={17} color="#2E9EFD" />
            <span>{isTesting ? 'Imprimindo...' : 'Testar Impressão'}</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 22px',
              borderRadius: '12px',
              background: saveSuccess
                ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
                : 'linear-gradient(135deg, #2E9EFD 0%, #7F48FC 100%)',
              border: 'none',
              color: '#ffffff',
              fontSize: '0.86rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(46, 158, 253, 0.4)',
              transition: 'all 0.2s'
            }}
          >
            {saveSuccess ? <Check size={18} /> : <Save size={18} />}
            <span>{isSaving ? 'Salvando...' : saveSuccess ? 'Configuração Salva!' : 'Salvar Alterações'}</span>
          </button>
        </div>
      </div>

      {/* FEEDBACK DE TESTE */}
      {testResult && (
        <div className="fade-in" style={{
          padding: '12px 18px',
          borderRadius: '12px',
          background: testResult.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${testResult.success ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
          color: testResult.success ? '#34d399' : '#f87171',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.88rem',
          fontWeight: 600
        }}>
          {testResult.success ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{testResult.message}</span>
        </div>
      )}

      {/* GRID PRINCIPAL: CONFIGURAÇÃO (ESQUERDA) + LIVE PREVIEW (DIREITA) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(420px, 1.3fr) minmax(360px, 0.9fr)',
        gap: '24px',
        alignItems: 'start'
      }}>

        {/* COLUNA ESQUERDA: FORMULÁRIO DE CONFIGURAÇÃO */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* CARTÃO 1: HARDWARE & PARÂMETROS DA BOBINA */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(7, 19, 63, 0.85) 0%, rgba(2, 8, 23, 0.95) 100%)',
            border: '1px solid rgba(93, 94, 252, 0.3)',
            borderRadius: '20px',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <Settings2 size={20} color="#2E9EFD" />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FDFCFD' }}>
                Parâmetros da Impressora & Bobina
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Toggle de Impressão Automática */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderRadius: '12px',
                background: 'rgba(19, 36, 160, 0.25)',
                border: '1px solid rgba(46, 158, 253, 0.2)'
              }}>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#FDFCFD' }}>
                    Impressão Automática no Totem
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#B5BCD7', marginTop: '2px' }}>
                    Dispara o cupom físico na Epson M352A imediatamente ao tocar para retirar senha
                  </div>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '26px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={config.enabled}
                    onChange={(e) => handleChange('enabled', e.target.checked)}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: config.enabled ? '#2E9EFD' : 'rgba(255, 255, 255, 0.2)',
                    transition: '0.3s',
                    borderRadius: '26px'
                  }}>
                    <span style={{
                      position: 'absolute',
                      content: '""',
                      height: '20px',
                      width: '20px',
                      left: config.enabled ? '25px' : '3px',
                      bottom: '3px',
                      background: '#ffffff',
                      transition: '0.3s',
                      borderRadius: '50%'
                    }} />
                  </span>
                </label>
              </div>

              {/* Canal de Disparo da Impressão (Nativo vs Navegador) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#B5BCD7', marginBottom: '8px' }}>
                  Método de Impressão
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => handleChange('printMethod', 'native')}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      background: config.printMethod !== 'browser' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(19, 36, 160, 0.15)',
                      border: `1.5px solid ${config.printMethod !== 'browser' ? '#34d399' : 'rgba(93, 94, 252, 0.25)'}`,
                      color: config.printMethod !== 'browser' ? '#FDFCFD' : '#B5BCD7',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '0.88rem', color: config.printMethod !== 'browser' ? '#34d399' : '#FDFCFD' }}>
                      <Zap size={15} />
                      <span>Direto no Windows</span>
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#8F9BB3', marginTop: '3px', lineHeight: 1.3 }}>
                      ✨ 100% invisível! Zero janelas ou piscadas na tela.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleChange('printMethod', 'browser')}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      background: config.printMethod === 'browser' ? 'rgba(46, 158, 253, 0.2)' : 'rgba(19, 36, 160, 0.15)',
                      border: `1.5px solid ${config.printMethod === 'browser' ? '#2E9EFD' : 'rgba(93, 94, 252, 0.25)'}`,
                      color: config.printMethod === 'browser' ? '#FDFCFD' : '#B5BCD7',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '0.88rem', color: config.printMethod === 'browser' ? '#2E9EFD' : '#FDFCFD' }}>
                      <ExternalLink size={15} />
                      <span>Navegador (Kiosk)</span>
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#8F9BB3', marginTop: '3px', lineHeight: 1.3 }}>
                      Disparo via Chrome/Edge Kiosk Printing.
                    </div>
                  </button>
                </div>
              </div>

              {/* Seletor de Largura da Bobina */}
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#B5BCD7', marginBottom: '8px' }}>
                  Largura da Bobina de Papel
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => handleChange('paperWidth', '80mm')}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      background: config.paperWidth === '80mm' ? 'rgba(46, 158, 253, 0.2)' : 'rgba(19, 36, 160, 0.15)',
                      border: `1.5px solid ${config.paperWidth === '80mm' ? '#2E9EFD' : 'rgba(93, 94, 252, 0.25)'}`,
                      color: config.paperWidth === '80mm' ? '#FDFCFD' : '#B5BCD7',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: '0.92rem', color: config.paperWidth === '80mm' ? '#2E9EFD' : '#FDFCFD' }}>
                      80mm (Padrão Epson)
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#8F9BB3', marginTop: '2px' }}>
                      Epson M352A, TM-T20, TM-m30
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleChange('paperWidth', '58mm')}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      background: config.paperWidth === '58mm' ? 'rgba(46, 158, 253, 0.2)' : 'rgba(19, 36, 160, 0.15)',
                      border: `1.5px solid ${config.paperWidth === '58mm' ? '#2E9EFD' : 'rgba(93, 94, 252, 0.25)'}`,
                      color: config.paperWidth === '58mm' ? '#FDFCFD' : '#B5BCD7',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: '0.92rem', color: config.paperWidth === '58mm' ? '#2E9EFD' : '#FDFCFD' }}>
                      58mm (Mini Bobina)
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#8F9BB3', marginTop: '2px' }}>
                      Mini impressoras térmicas compactas
                    </div>
                  </button>
                </div>
              </div>

              {/* Modelo de Referência */}
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#B5BCD7', marginBottom: '6px' }}>
                  Identificação do Dispositivo
                </label>
                <input
                  type="text"
                  value={config.modelName}
                  onChange={(e) => handleChange('modelName', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'rgba(2, 8, 23, 0.7)',
                    border: '1px solid rgba(93, 94, 252, 0.3)',
                    color: '#FDFCFD',
                    fontSize: '0.86rem'
                  }}
                />
              </div>

              {/* Corte Automático */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  id="cutPaper"
                  checked={config.cutPaper}
                  onChange={(e) => handleChange('cutPaper', e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#2E9EFD', cursor: 'pointer' }}
                />
                <label htmlFor="cutPaper" style={{ fontSize: '0.84rem', color: '#FDFCFD', cursor: 'pointer', fontWeight: 600 }}>
                  Avanço e acionamento de corte automático de papel (Guilhotina Epson)
                </label>
              </div>

            </div>
          </div>

          {/* CARTÃO 2: MENSAGENS DO CABEÇALHO & RODAPÉ */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(7, 19, 63, 0.85) 0%, rgba(2, 8, 23, 0.95) 100%)',
            border: '1px solid rgba(93, 94, 252, 0.3)',
            borderRadius: '20px',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <FileText size={20} color="#2E9EFD" />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FDFCFD' }}>
                Textos e Mensagens Personalizáveis
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#B5BCD7', marginBottom: '4px' }}>
                  Nome da Instituição (Cabeçalho Principal)
                </label>
                <input
                  type="text"
                  value={config.headerTitle}
                  onChange={(e) => handleChange('headerTitle', e.target.value)}
                  placeholder="Ex: ScaFlow"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'rgba(2, 8, 23, 0.7)',
                    border: '1px solid rgba(93, 94, 252, 0.3)',
                    color: '#FDFCFD',
                    fontSize: '0.86rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#B5BCD7', marginBottom: '4px' }}>
                  Subtítulo / Descrição
                </label>
                <input
                  type="text"
                  value={config.headerSubtitle}
                  onChange={(e) => handleChange('headerSubtitle', e.target.value)}
                  placeholder="Ex: Centro Integrado de Atendimento"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'rgba(2, 8, 23, 0.7)',
                    border: '1px solid rgba(93, 94, 252, 0.3)',
                    color: '#FDFCFD',
                    fontSize: '0.86rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#B5BCD7', marginBottom: '4px' }}>
                  Unidade / Endereço / CNPJ
                </label>
                <input
                  type="text"
                  value={config.unitName}
                  onChange={(e) => handleChange('unitName', e.target.value)}
                  placeholder="Ex: Complexo Hospitalar Central"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'rgba(2, 8, 23, 0.7)',
                    border: '1px solid rgba(93, 94, 252, 0.3)',
                    color: '#FDFCFD',
                    fontSize: '0.86rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#B5BCD7', marginBottom: '4px' }}>
                  Mensagem Principal de Rodapé (Orientações da Sala de Espera)
                </label>
                <textarea
                  rows={2}
                  value={config.footerMessage}
                  onChange={(e) => handleChange('footerMessage', e.target.value)}
                  placeholder="Ex: Aguarde ser chamado no painel da sala de espera."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'rgba(2, 8, 23, 0.7)',
                    border: '1px solid rgba(93, 94, 252, 0.3)',
                    color: '#FDFCFD',
                    fontSize: '0.86rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#B5BCD7', marginBottom: '4px' }}>
                  Mensagem Secundária / Lembretes de Documentos
                </label>
                <textarea
                  rows={2}
                  value={config.footerSubMessage}
                  onChange={(e) => handleChange('footerSubMessage', e.target.value)}
                  placeholder="Ex: Tenha em mãos documento oficial com foto e carteirinha."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'rgba(2, 8, 23, 0.7)',
                    border: '1px solid rgba(93, 94, 252, 0.3)',
                    color: '#FDFCFD',
                    fontSize: '0.86rem',
                    resize: 'vertical'
                  }}
                />
              </div>

            </div>
          </div>

          {/* CARTÃO 3: ELEMENTOS & QR CODE */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(7, 19, 63, 0.85) 0%, rgba(2, 8, 23, 0.95) 100%)',
            border: '1px solid rgba(93, 94, 252, 0.3)',
            borderRadius: '20px',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <QrCode size={20} color="#2E9EFD" />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FDFCFD' }}>
                Campos Exibidos & QR Code da Fila
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', color: '#FDFCFD', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={config.showPriority}
                  onChange={(e) => handleChange('showPriority', e.target.checked)}
                  style={{ accentColor: '#2E9EFD' }}
                />
                Destaque da Prioridade
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', color: '#FDFCFD', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={config.showSpecialty}
                  onChange={(e) => handleChange('showSpecialty', e.target.checked)}
                  style={{ accentColor: '#2E9EFD' }}
                />
                Nome da Especialidade
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', color: '#FDFCFD', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={config.showDateTime}
                  onChange={(e) => handleChange('showDateTime', e.target.checked)}
                  style={{ accentColor: '#2E9EFD' }}
                />
                Data e Horário de Emissão
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', color: '#FDFCFD', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={config.showQrCode}
                  onChange={(e) => handleChange('showQrCode', e.target.checked)}
                  style={{ accentColor: '#2E9EFD' }}
                />
                QR Code para Smartphone
              </label>
            </div>

            {config.showQrCode && (
              <div className="fade-in">
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#B5BCD7', marginBottom: '4px' }}>
                  URL Base do Acompanhamento Mobile
                </label>
                <input
                  type="text"
                  value={config.qrCodeUrl}
                  onChange={(e) => handleChange('qrCodeUrl', e.target.value)}
                  placeholder="https://scaflow.med.br/fila/"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'rgba(2, 8, 23, 0.7)',
                    border: '1px solid rgba(93, 94, 252, 0.3)',
                    color: '#FDFCFD',
                    fontSize: '0.86rem'
                  }}
                />
                <span style={{ fontSize: '0.74rem', color: '#8F9BB3', marginTop: '4px', display: 'block' }}>
                  O paciente aponta a câmera do celular para o cupom e visualiza a fila em tempo real.
                </span>
              </div>
            )}
          </div>

          {/* DICA OPERACIONAL EPSON */}
          <div style={{
            padding: '16px 20px',
            borderRadius: '16px',
            background: 'rgba(46, 158, 253, 0.08)',
            border: '1px solid rgba(46, 158, 253, 0.25)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}>
            <Info size={20} color="#2E9EFD" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.82rem', color: '#B5BCD7', lineHeight: 1.45 }}>
              <strong style={{ color: '#FDFCFD' }}>Modo Totem Silencioso (Kiosk Mode):</strong> No totem com Windows, execute o Chrome/Edge com a flag <code style={{ color: '#2E9EFD', background: 'rgba(46, 158, 253, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>--kiosk-printing</code>. A Epson M352A imprimirá em milissegundos sem exibir nenhuma caixa de diálogo.
            </div>
          </div>

        </div>

        {/* COLUNA DIREITA: LIVE PHYSICAL THERMAL PREVIEW (PRÉVIA EM TEMPO REAL) */}
        <div style={{ position: 'sticky', top: '24px' }}>

          <div style={{
            background: 'linear-gradient(135deg, rgba(7, 19, 63, 0.95) 0%, rgba(2, 8, 23, 0.98) 100%)',
            border: '1px solid rgba(93, 94, 252, 0.4)',
            borderRadius: '24px',
            padding: '24px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
          }}>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Eye size={18} color="#2E9EFD" />
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#FDFCFD' }}>
                  Prévia em Tempo Real da Bobina
                </h3>
              </div>

              <div style={{
                fontSize: '0.74rem',
                fontWeight: 800,
                color: '#2E9EFD',
                background: 'rgba(46, 158, 253, 0.15)',
                padding: '4px 10px',
                borderRadius: '8px',
                border: '1px solid rgba(46, 158, 253, 0.3)'
              }}>
                {config.paperWidth}
              </div>
            </div>

            <p style={{ fontSize: '0.78rem', color: '#B5BCD7', marginBottom: '20px' }}>
              Simulação de impressão térmica física de alta fidelidade na saída da bobina
            </p>

            {/* SIMULADOR DE PAPEL TÉRMICO FÍSICO */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '16px 0',
              background: '#0b132b',
              borderRadius: '16px',
              border: '1px dashed rgba(93, 94, 252, 0.3)'
            }}>

              <div style={{
                width: is58mm ? '230px' : '310px',
                background: '#fafafa',
                color: '#000000',
                boxShadow: '0 12px 30px rgba(0,0,0,0.45)',
                padding: is58mm ? '20px 14px 28px 14px' : '24px 20px 32px 20px',
                textAlign: 'center',
                fontFamily: "'Courier New', Courier, monospace",
                position: 'relative',
                transition: 'width 0.25s ease',
                borderRadius: '2px'
              }}>

                {/* Serrilhado superior de corte térmico */}
                <div style={{
                  position: 'absolute',
                  top: '-6px',
                  left: 0,
                  right: 0,
                  height: '6px',
                  background: 'radial-gradient(circle, transparent, transparent 50%, #fafafa 50%, #fafafa 100%)',
                  backgroundSize: '12px 12px'
                }} />

                {/* Cabeçalho */}
                <div style={{
                  fontSize: is58mm ? '14px' : '18px',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '2px'
                }}>
                  {config.headerTitle || 'ScaFlow'}
                </div>

                {config.headerSubtitle && (
                  <div style={{ fontSize: is58mm ? '9px' : '11px', fontWeight: 600, color: '#333', marginBottom: '2px' }}>
                    {config.headerSubtitle}
                  </div>
                )}

                {config.unitName && (
                  <div style={{ fontSize: is58mm ? '9px' : '11px', fontStyle: 'italic', color: '#555', marginBottom: '6px' }}>
                    {config.unitName}
                  </div>
                )}

                <div style={{ borderTop: '1.5px dashed #000', margin: '8px 0' }} />

                {/* Número da Senha */}
                <div style={{ fontSize: is58mm ? '9px' : '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#444' }}>
                  SENHA DE ATENDIMENTO
                </div>

                <div style={{
                  fontSize: is58mm ? '2.6rem' : '3.8rem',
                  fontWeight: 900,
                  fontFamily: "'Courier New', Courier, monospace",
                  letterSpacing: '2px',
                  lineHeight: 1.0,
                  margin: '6px 0',
                  color: '#000000'
                }}>
                  CARD007
                </div>

                {/* Prioridade */}
                {config.showPriority && (
                  <div>
                    <span style={{
                      display: 'inline-block',
                      border: '1.5px solid #000',
                      padding: '2px 8px',
                      fontSize: is58mm ? '9px' : '10px',
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                      margin: '4px 0 6px 0'
                    }}>
                      Atendimento Prioritário
                    </span>
                  </div>
                )}

                <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

                {/* Detalhes de Serviço e Horário */}
                <div style={{ fontSize: is58mm ? '9px' : '10px', textAlign: 'left', lineHeight: 1.4 }}>
                  {config.showSpecialty && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <span style={{ color: '#444' }}>Especialidade:</span>
                      <strong style={{ textAlign: 'right' }}>Cardiologia</strong>
                    </div>
                  )}

                  {config.showDateTime && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#444' }}>Emissão:</span>
                      <strong>{new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</strong>
                    </div>
                  )}
                </div>

                {/* QR Code */}
                {config.showQrCode && previewQrUrl && (
                  <div style={{ margin: '10px 0 6px 0', textAlign: 'center' }}>
                    <img
                      src={previewQrUrl}
                      alt="QR Code"
                      style={{
                        width: is58mm ? '90px' : '110px',
                        height: is58mm ? '90px' : '110px',
                        imageRendering: 'pixelated'
                      }}
                    />
                    <div style={{ fontSize: '8px', fontWeight: 600, color: '#333', marginTop: '2px' }}>
                      Acompanhe a fila no seu celular
                    </div>
                  </div>
                )}

                <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

                {/* Mensagens de Rodapé */}
                {config.footerMessage && (
                  <div style={{ fontSize: '9px', fontWeight: 700, margin: '6px 0 2px 0', lineHeight: 1.25 }}>
                    {config.footerMessage}
                  </div>
                )}

                {config.footerSubMessage && (
                  <div style={{ fontSize: '8px', color: '#555', marginTop: '3px', lineHeight: 1.2 }}>
                    {config.footerSubMessage}
                  </div>
                )}

                {/* Serrilhado inferior de corte térmico */}
                <div style={{
                  position: 'absolute',
                  bottom: '-6px',
                  left: 0,
                  right: 0,
                  height: '6px',
                  background: 'radial-gradient(circle, transparent, transparent 50%, #fafafa 50%, #fafafa 100%)',
                  backgroundSize: '12px 12px'
                }} />

              </div>

            </div>

            {/* Ação rápida de teste */}
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button
                onClick={handleTestPrint}
                disabled={isTesting}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(46, 158, 253, 0.2) 0%, rgba(127, 72, 252, 0.2) 100%)',
                  border: '1px solid rgba(46, 158, 253, 0.4)',
                  color: '#2E9EFD',
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(46, 158, 253, 0.3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(46, 158, 253, 0.2) 0%, rgba(127, 72, 252, 0.2) 100%)'}
              >
                <Printer size={16} />
                <span>{isTesting ? 'Emitindo Teste...' : 'Imprimir Este Modelo de Teste'}</span>
              </button>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
