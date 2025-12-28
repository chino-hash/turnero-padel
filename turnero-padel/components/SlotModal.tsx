'use client'

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { TimeSlot } from '../types/types';

interface SlotModalProps {
  slot: TimeSlot | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: (slot: TimeSlot) => Promise<void>;
}

// Contador global para manejar múltiples modales
let modalCount = 0;
let originalBodyOverflow: string | null = null;

const SlotModal: React.FC<SlotModalProps> = ({ slot, isOpen, onClose, onConfirm }) => {
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      // Incrementar contador de modales
      modalCount++;
      
      // Solo guardar el overflow original la primera vez
      if (modalCount === 1) {
        originalBodyOverflow = document.body.style.overflow || null;
        document.body.style.overflow = 'hidden';
      }
      
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        // Decrementar contador de modales
        modalCount--;
        
        // Solo restaurar el overflow cuando no hay más modales abiertos
        if (modalCount === 0) {
          if (originalBodyOverflow !== null) {
            document.body.style.overflow = originalBodyOverflow;
          } else {
            document.body.style.removeProperty('overflow');
          }
          originalBodyOverflow = null;
        }
        
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  // Función para formatear la fecha
  const formatDate = (date?: Date) => {
    if (!date) return 'sábado, 16 de agosto';
    
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    };
    
    return new Intl.DateTimeFormat('es-ES', options).format(new Date(date));
  };

  // Función para obtener el día de la semana
  const getDayOfWeek = (date?: Date) => {
    if (!date) return 'Sábado';
    
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long'
    };
    
    return new Intl.DateTimeFormat('es-ES', options).format(new Date(date));
  };

  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { setError(null) }, [slot]) // Limpiar error al cambiar de slot
  
  if (!isOpen || !slot || !mounted) return null;

  return createPortal(
    <div 
      className="modal-overlay" 
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal-content-new">
        <div className="modal-header-new">
          <h2 id="modal-title" className="modal-title-new">
            📅 Confirmar Reserva
          </h2>
          <button 
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            ×
          </button>
        </div>
        
        <div className="modal-subtitle">
          Revisa los detalles de tu reserva antes de continuar
        </div>
        
        <div className="modal-body-new">
          <div className="reservation-details">
            <div className="detail-row">
              <div className="detail-label">Cancha:</div>
              <div className="detail-value">{slot.courtName || 'Cancha 1'}</div>
            </div>
            
            <div className="detail-row">
              <div className="detail-label">Horario:</div>
              <div className="detail-value">{slot.timeRange || slot.time || '14:00 - 15:30'}</div>
            </div>
            
            <div className="detail-row">
              <div className="detail-label">Fecha:</div>
              <div className="detail-value">{formatDate(slot.date)}</div>
            </div>
            
            <div className="detail-row">
              <div className="detail-label">Precio por persona:</div>
              <div className="detail-value">${(slot.pricePerPerson ?? Math.round(((slot.finalPrice ?? slot.price ?? 6000) / 4))).toLocaleString()}</div>
            </div>
            
            <div className="total-section">
              <div className="detail-row total-row">
                <div className="detail-label total-label">Total cancha (4 personas):</div>
                <div className="detail-value total-amount">${(slot.finalPrice ?? slot.price ?? 24000).toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button 
            className="btn-secondary"
            onClick={onClose}
          >
            Cancelar
          </button>
          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
          {(slot.isAvailable ?? slot.available) && (
            <button 
              className="btn-primary"
              disabled={isLoading}
              onClick={async () => {
                if (onConfirm && slot) {
                  setIsLoading(true)
                  setError(null)
                  try {
                    await onConfirm(slot);
                    onClose();
                  } catch (error: any) {
                    console.error('Error al confirmar reserva:', error);
                    // Intentar extraer mensaje de error
                    let errorMessage = 'Error al confirmar la reserva. Por favor, inténtalo de nuevo.'
                    try {
                      if (error?.message) {
                        // Intentar parsear como JSON
                        try {
                          const errorData = JSON.parse(error.message)
                          if (errorData.error) {
                            errorMessage = errorData.error
                            // Si hay detalles, agregarlos
                            if (errorData.details) {
                              if (typeof errorData.details === 'string') {
                                errorMessage += `: ${errorData.details}`
                              } else if (Array.isArray(errorData.details)) {
                                const detailMessages = errorData.details.map((d: any) => 
                                  typeof d === 'string' ? d : d.message || d.field || ''
                                ).filter(Boolean)
                                if (detailMessages.length > 0) {
                                  errorMessage += `: ${detailMessages.join(', ')}`
                                }
                              }
                            }
                          } else if (errorData.message) {
                            errorMessage = errorData.message
                          }
                        } catch {
                          // Si no es JSON, usar el mensaje directamente
                          errorMessage = error.message
                        }
                      }
                    } catch {
                      // Si hay un error al procesar, usar un mensaje genérico
                      if (error?.message && typeof error.message === 'string') {
                        errorMessage = error.message
                      }
                    }
                    setError(errorMessage)
                  } finally {
                    setIsLoading(false)
                  }
                } else {
                  console.log('Reservar turno:', slot);
                  onClose();
                }
              }}
            >
              {isLoading ? 'Procesando...' : '📅 Confirmar Reserva'}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SlotModal;
