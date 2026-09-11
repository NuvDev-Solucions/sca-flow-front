// client/src/pages/Totem.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronRight, 
  RotateCcw, 
  Check, 
  Sparkles,
  ArrowRight,
  Heart,
  Activity,
  Eye,
  Stethoscope,
  Pill,
  Baby,
  ShieldCheck,
  UserCheck,
  Apple,
  Smile,
  FlaskConical
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { socket, playChimeSound } from '../socket';
import scaFlowLogo from '../assets/logo/ScaFlow.svg';

// Especialidades Médicas Diversificadas com Ícones e Descrições
const SPECIALTY_OPTIONS = [
  { id: 'clinica_geral', nome: 'Clínica Geral & Acolhimento', sigla: 'CG', descricao: 'Triagem e Avaliação Geral', icon: Stethoscope },
  { id: 'cardiologia', nome: 'Cardiologia & Check-up', sigla: 'CARD', descricao: 'Avaliação Cardiovascular', icon: Heart },
  { id: 'pediatria', nome: 'Pediatria & Puericultura', sigla: 'PED', descricao: 'Saúde Infantil e Bebês', icon: Baby },
  { id: 'ortopedia', nome: 'Ortopedia & Traumatologia', sigla: 'ORT', descricao: 'Ossos e Articulações', icon: Activity },
  { id: 'ginecologia', nome: 'Ginecologia & Obstetrícia', sigla: 'GIN', descricao: 'Saúde Feminina e Pré-Natal', icon: ShieldCheck },
  { id: 'dermatologia', nome: 'Dermatologia Clínica', sigla: 'DERM', descricao: 'Cuidados da Pele e Cabelos', icon: Sparkles },
  { id: 'oftalmologia', nome: 'Oftalmologia & Visão', sigla: 'OFT', descricao: 'Exames de Vista e Refração', icon: Eye },
  { id: 'neurologia', nome: 'Neurologia & Neurodiagnóstico', sigla: 'NEUR', descricao: 'Sistema Nervoso e Cefaleia', icon: Activity },
  { id: 'otorrinolaringologia', nome: 'Otorrinolaringologia', sigla: 'OTO', descricao: 'Ouvido, Nariz e Garganta', icon: Activity },
  { id: 'urologia', nome: 'Urologia & Saúde Masculina', sigla: 'URO', descricao: 'Aparelho Urinário e Renal', icon: UserCheck },
  { id: 'endocrinologia', nome: 'Endocrinologia & Metabologia', sigla: 'ENDO', descricao: 'Metabolismo e Hormônios', icon: Activity },
  { id: 'gastroenterologia', nome: 'Gastroenterologia & Digestiva', sigla: 'GAST', descricao: 'Trato Digestivo e Fígado', icon: Pill },
  { id: 'pneumologia', nome: 'Pneumologia & Respiratória', sigla: 'PNEU', descricao: 'Pulmão e Vias Aéreas', icon: Stethoscope },
  { id: 'reumatologia', nome: 'Reumatologia Clínica', sigla: 'REUM', descricao: 'Doenças das Articulações', icon: Activity },
  { id: 'geriatria', nome: 'Geriatria & Longevidade', sigla: 'GER', descricao: 'Cuidado da Melhor Idade', icon: Heart },
  { id: 'nutricao', nome: 'Nutrição & Dietética', sigla: 'NUTR', descricao: 'Plano Alimentar Saudável', icon: Apple },
  { id: 'psicologia', nome: 'Psicologia & Saúde Mental', sigla: 'PSI', descricao: 'Suporte Emocional e Terapia', icon: Smile },
  { id: 'exames_laboratorio', nome: 'Diagnósticos & Coleta', sigla: 'LAB', descricao: 'Análises Clínicas e Sangue', icon: FlaskConical }
];

export default function Totem() {
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [generatedTicket, setGeneratedTicket] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [modalTimer, setModalTimer] = useState(15);
  const [ticketCountdown, setTicketCountdown] = useState(5);

  const modalIntervalRef = useRef(null);

  // Timer decrescente de 15s no modal de classificação
  useEffect(() => {
    if (selectedSpecialty && !generatedTicket) {
      setModalTimer(15);
      if (modalIntervalRef.current) clearInterval(modalIntervalRef.current);

      modalIntervalRef.current = setInterval(() => {
        setModalTimer(prev => {
          if (prev <= 1) {
            handleCloseModal();
            return 15;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (modalIntervalRef.current) clearInterval(modalIntervalRef.current);
    }

    return () => {
      if (modalIntervalRef.current) clearInterval(modalIntervalRef.current);
    };
  }, [selectedSpecialty, generatedTicket]);

  // Contagem regressiva no comprovante (5s)
  useEffect(() => {
    let timer = null;
    if (generatedTicket) {
      setTicketCountdown(5);
      timer = setInterval(() => {
        setTicketCountdown(prev => {
          if (prev <= 1) {
            handleResetTotem();
            return 5;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [generatedTicket]);

  const handleSelectSpecialty = (srv) => {
    setSelectedSpecialty(srv);
  };

  const handleCloseModal = () => {
    setSelectedSpecialty(null);
    setModalTimer(15);
  };

  const handleResetTotem = () => {
    setSelectedSpecialty(null);
    setGeneratedTicket(null);
    setIsProcessing(false);
  };

  // Emite a senha de acordo com a modalidade selecionada
  const handleChooseClassification = (prioridadeId) => {
    if (isProcessing || !selectedSpecialty) return;
    setIsProcessing(true);

    socket.emit('ticket:create', {
      servicoId: selectedSpecialty.id,
      prioridadeId: prioridadeId
    }, (res) => {
      setIsProcessing(false);
      if (res && res.success && res.ticket) {
        setGeneratedTicket(res.ticket);
        playChimeSound();

        try {
          confetti({
            particleCount: 75,
            spread: 65,
            origin: { y: 0.65 }
          });
        } catch (e) {}
      } else {
        alert('Falha na emissão da senha. Por favor, tente novamente.');
      }
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '28px 16px',
      position: 'relative',
      userSelect: 'none'
    }}>
      
      {/* TELA DE SELEÇÃO: ESPECIALIDADES MÉDICAS EM GRID RESPONSIVO */}
      {!generatedTicket && (
        <div style={{
          width: '100%',
          maxWidth: '1200px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '12px 16px'
        }} className="fade-in">
          
          <div style={{ textAlign: 'center', marginBottom: '24px', maxWidth: '640px' }}>
            <img 
              src={scaFlowLogo} 
              alt="ScaFlow" 
              style={{ 
                height: '95px', 
                width: 'auto',
                filter: 'drop-shadow(0 0 24px rgba(46, 158, 253, 0.45))',
                marginBottom: '14px'
              }} 
            />

            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#FDFCFD', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Selecione a Especialidade
            </h1>
            <p style={{ color: '#B5BCD7', fontSize: '0.98rem', marginTop: '6px' }}>
              Toque na área médica desejada para emitir seu comprovante de atendimento
            </p>
          </div>

          {/* Grid Responsivo de Especialidades */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '16px',
            width: '100%',
            maxHeight: 'calc(100vh - 220px)',
            overflowY: 'auto',
            padding: '4px 6px 36px 4px'
          }}>
            {SPECIALTY_OPTIONS.map((srv) => {
              const IconComp = srv.icon || Stethoscope;
              return (
                <button
                  key={srv.id}
                  onClick={() => handleSelectSpecialty(srv)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    minHeight: '128px',
                    padding: '20px',
                    borderRadius: '18px',
                    background: 'linear-gradient(135deg, rgba(7, 19, 63, 0.92) 0%, rgba(2, 8, 23, 0.98) 100%)',
                    border: '1px solid rgba(46, 158, 253, 0.28)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    boxShadow: '0 8px 24px rgba(2, 8, 23, 0.65)',
                    transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(19, 36, 160, 0.65) 0%, #07133F 100%)';
                    e.currentTarget.style.borderColor = '#2E9EFD';
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 12px 30px rgba(46, 158, 253, 0.45)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(7, 19, 63, 0.92) 0%, rgba(2, 8, 23, 0.98) 100%)';
                    e.currentTarget.style.borderColor = 'rgba(46, 158, 253, 0.28)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(2, 8, 23, 0.65)';
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: 'rgba(46, 158, 253, 0.15)',
                      border: '1px solid rgba(46, 158, 253, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#2E9EFD'
                    }}>
                      <IconComp size={22} />
                    </div>

                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: '#5D5EFC',
                      letterSpacing: '0.08em',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: 'rgba(93, 94, 252, 0.14)'
                    }}>
                      {srv.sigla}
                    </span>
                  </div>

                  <div>
                    <div style={{
                      color: '#FDFCFD',
                      fontSize: '1.05rem',
                      fontWeight: 800,
                      letterSpacing: '-0.01em',
                      lineHeight: 1.25,
                      marginBottom: '4px'
                    }}>
                      {srv.nome}
                    </div>
                    <div style={{
                      fontSize: '0.78rem',
                      color: '#B5BCD7',
                      fontWeight: 500
                    }}>
                      {srv.descricao}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: CLASSIFICAÇÃO DE ATENDIMENTO (Identidade ScaFlow refinada) */}
      {selectedSpecialty && !generatedTicket && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(2, 8, 23, 0.85)',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="pop-in" style={{
            width: '100%',
            maxWidth: '480px',
            borderRadius: '26px',
            background: 'linear-gradient(135deg, #07133F 0%, #020817 100%)',
            border: '1px solid rgba(93, 94, 252, 0.45)',
            boxShadow: '0 25px 65px rgba(2, 8, 23, 0.95), 0 0 35px rgba(46, 158, 253, 0.3)',
            overflow: 'hidden',
            position: 'relative'
          }}>
            
            {/* Cabeçalho do Modal */}
            <div style={{ padding: '32px 30px 22px 30px' }}>
              <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#FDFCFD', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                Modalidade de Acolhimento
              </h2>
              <div style={{
                color: '#2E9EFD',
                fontWeight: 800,
                fontSize: '0.98rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginTop: '6px'
              }}>
                {selectedSpecialty.nome}
              </div>
            </div>

            {/* As 3 Opções com Variação Sutil */}
            <div style={{ padding: '0 30px 26px 30px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              
              {/* Opção 1: Prioridade Especial (Barra Vermelha) */}
              <button
                onClick={() => handleChooseClassification('ESPECIAL')}
                disabled={isProcessing}
                style={{
                  width: '100%',
                  padding: '20px 22px',
                  borderRadius: '16px',
                  background: 'rgba(19, 36, 160, 0.28)',
                  border: '1px solid rgba(93, 94, 252, 0.3)',
                  borderLeft: '6px solid #ef4444',
                  color: '#FDFCFD',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(19, 36, 160, 0.55)';
                  e.currentTarget.style.transform = 'translateX(4px)';
                  e.currentTarget.style.borderColor = '#ef4444';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(19, 36, 160, 0.28)';
                  e.currentTarget.style.transform = 'translateX(0)';
                  e.currentTarget.style.borderColor = 'rgba(93, 94, 252, 0.3)';
                }}
              >
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.01em' }}>
                    Atendimento Especial (80+)
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#B5BCD7', marginTop: '3px' }}>
                    Pacientes acima de 80 anos ou prioridade médica legal
                  </div>
                </div>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FDFCFD'
                }}>
                  <ChevronRight size={22} />
                </div>
              </button>

              {/* Opção 2: Preferencial (Barra Âmbar) */}
              <button
                onClick={() => handleChooseClassification('PREFERENCIAL')}
                disabled={isProcessing}
                style={{
                  width: '100%',
                  padding: '20px 22px',
                  borderRadius: '16px',
                  background: 'rgba(19, 36, 160, 0.28)',
                  border: '1px solid rgba(93, 94, 252, 0.3)',
                  borderLeft: '6px solid #f59e0b',
                  color: '#FDFCFD',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(19, 36, 160, 0.55)';
                  e.currentTarget.style.transform = 'translateX(4px)';
                  e.currentTarget.style.borderColor = '#f59e0b';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(19, 36, 160, 0.28)';
                  e.currentTarget.style.transform = 'translateX(0)';
                  e.currentTarget.style.borderColor = 'rgba(93, 94, 252, 0.3)';
                }}
              >
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.01em' }}>
                    Atendimento Prioritário
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#B5BCD7', marginTop: '3px' }}>
                    Idosos (60+), PCD, Gestantes, Lactantes e TEA (Lei 10.048)
                  </div>
                </div>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FDFCFD'
                }}>
                  <ChevronRight size={22} />
                </div>
              </button>

              {/* Opção 3: Normal (Barra Azul Elétrico) */}
              <button
                onClick={() => handleChooseClassification('NORMAL')}
                disabled={isProcessing}
                style={{
                  width: '100%',
                  padding: '20px 22px',
                  borderRadius: '16px',
                  background: 'rgba(19, 36, 160, 0.28)',
                  border: '1px solid rgba(93, 94, 252, 0.3)',
                  borderLeft: '6px solid #2E9EFD',
                  color: '#FDFCFD',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(19, 36, 160, 0.55)';
                  e.currentTarget.style.transform = 'translateX(4px)';
                  e.currentTarget.style.borderColor = '#2E9EFD';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(19, 36, 160, 0.28)';
                  e.currentTarget.style.transform = 'translateX(0)';
                  e.currentTarget.style.borderColor = 'rgba(93, 94, 252, 0.3)';
                }}
              >
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.01em' }}>
                    Atendimento Convencional
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#B5BCD7', marginTop: '3px' }}>
                    Atendimento ambulatorial por ordem cronológica
                  </div>
                </div>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FDFCFD'
                }}>
                  <ChevronRight size={22} />
                </div>
              </button>
            </div>

            {/* Rodapé: Botão de Retorno com Timer Decrescente */}
            <div style={{ padding: '0 30px 24px 30px', textAlign: 'center' }}>
              <button
                onClick={handleCloseModal}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#2E9EFD',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  cursor: 'pointer',
                  padding: '8px 16px',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#FDFCFD'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#2E9EFD'}
              >
                Retornar ao Início ({modalTimer}s)
              </button>
            </div>

            {/* Barra de Progresso Decrescente (Gradiente ScaFlow) */}
            <div style={{
              width: '100%',
              height: '5px',
              background: 'rgba(255, 255, 255, 0.08)',
              position: 'relative'
            }}>
              <div style={{
                height: '100%',
                width: `${(modalTimer / 15) * 100}%`,
                background: 'var(--gradient-symbol)',
                transition: 'width 1s linear'
              }} />
            </div>

          </div>
        </div>
      )}

      {/* COMPROVANTE DE SENHA IMPRESSA */}
      {generatedTicket && (
        <div className="pop-in" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxWidth: '430px',
          marginTop: '36px'
        }}>
          <div style={{
            width: '100%',
            background: '#ffffff',
            color: '#07133F',
            borderRadius: '24px',
            padding: '36px 28px',
            boxShadow: '0 20px 60px rgba(2, 8, 23, 0.8), 0 0 40px rgba(46, 158, 253, 0.35)',
            textAlign: 'center',
            border: '2px dashed #B5BCD7',
            position: 'relative'
          }}>
            <img 
              src={scaFlowLogo} 
              alt="ScaFlow" 
              style={{ 
                height: '100px', 
                width: 'auto',
                marginBottom: '14px'
              }} 
            />

            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#7e8bb6', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              SENHA DE ATENDIMENTO
            </div>

            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '4.8rem',
              fontWeight: 900,
              color: generatedTicket.prioridadeCor || '#07133F',
              lineHeight: 1.1,
              margin: '8px 0'
            }}>
              {generatedTicket.codigo}
            </div>

            <div style={{
              display: 'inline-block',
              padding: '4px 16px',
              borderRadius: '9999px',
              background: `${generatedTicket.prioridadeCor}22`,
              color: generatedTicket.prioridadeCor,
              fontWeight: 800,
              fontSize: '0.9rem',
              marginBottom: '16px'
            }}>
              {generatedTicket.prioridadeNome}
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', padding: '16px 0', margin: '12px 0', textAlign: 'left', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>Especialidade:</span>
                <strong style={{ color: '#07133F' }}>{generatedTicket.servicoNome}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Data / Hora:</span>
                <strong style={{ color: '#07133F' }}>
                  {new Date(generatedTicket.createdAt).toLocaleDateString('pt-BR')} · {new Date(generatedTicket.createdAt).toLocaleTimeString('pt-BR')}
                </strong>
              </div>
            </div>

            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '12px' }}>
              Aguarde na sala de espera. Seu código será chamado no painel.
            </p>
          </div>

          <button
            onClick={handleResetTotem}
            className="btn-primary"
            style={{
              marginTop: '24px',
              padding: '16px 36px',
              borderRadius: '16px',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            <span>Concluir ({ticketCountdown}s)</span>
            <RotateCcw size={18} />
          </button>
        </div>
      )}

    </div>
  );
}
