'use client'

import React from 'react'
import { useAppState } from '../providers/AppStateProvider'
import { X, CheckCircle, Info, AlertTriangle } from 'lucide-react'

const RealTimeNotification: React.FC = () => {
  const { notification, clearNotification, isRealTimeConnected } = useAppState()

  if (!notification) return null

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-500" />
    }
  }

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  const getTextColor = () => {
    switch (notification.type) {
      case 'success':
        return 'text-green-800'
      case 'warning':
        return 'text-yellow-800'
      case 'info':
      default:
        return 'text-blue-800'
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className={`
        ${getBackgroundColor()}
        ${getTextColor()}
        border rounded-lg p-4 shadow-lg
        transform transition-all duration-300 ease-in-out
        animate-in slide-in-from-right-5
      `}>
        <div className="flex items-start space-x-3">
          {getIcon()}
          <div className="flex-1">
            <p className="text-sm font-medium">
              {notification.message}
            </p>
            {isRealTimeConnected && (
              <p className="text-xs mt-1 opacity-75">
                Actualización automática activa
              </p>
            )}
          </div>
          <button
            onClick={clearNotification}
            className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default RealTimeNotification