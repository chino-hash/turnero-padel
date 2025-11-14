'use client'

import React, { useEffect } from 'react';
import { TimeSlot } from '../types/types';

interface SlotModalProps {
  slot: TimeSlot | null;
  isOpen: boolean;
  onClose: () => void;
}

// Contador global para manejar múltiples modales
let modalCount = 0;
let originalBodyOverflow: string | null = null;

const SlotModal: React.FC<SlotModalProps> = ({ slot, isOpen, onClose }) => {
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

  if (!isOpen || !slot) return null;

  return (
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
          {(slot.isAvailable ?? slot.available) && (
            <button 
              className="btn-primary"
              onClick={() => {
                // Aquí se podría integrar la lógica de reserva
                console.log('Reservar turno:', slot);
                onClose();
              }}
            >
              📅 Confirmar Reserva
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SlotModal;