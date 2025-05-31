"use client";

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils/helpers'

interface ModalProps {
  // Whether the modal is open
  open: boolean
  // Function to close the modal
  onClose: () => void
  // Modal content
  children: React.ReactNode
  // Modal title
  title?: string
  // Optional description
  description?: string
  // Size of the modal
  size?: 'sm' | 'md' | 'lg' | 'xl'
  // Whether to show close button
  showCloseButton?: boolean
  // Custom className for the modal content
  className?: string
}

export function Modal({
  open,
  onClose,
  children,
  title,
  description,
  size = 'md',
  showCloseButton = true,
  className
}: ModalProps) {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  }

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Background overlay */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm" />
        </Transition.Child>

        {/* Modal container */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel 
                className={cn(
                  "w-full transform overflow-hidden rounded-2xl bg-background-secondary border border-border-primary p-6 shadow-xl transition-all",
                  sizeClasses[size],
                  className
                )}
              >
                {/* Header */}
                {(title || showCloseButton) && (
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      {title && (
                        <Dialog.Title className="text-lg font-semibold text-foreground-primary">
                          {title}
                        </Dialog.Title>
                      )}
                      {description && (
                        <p className="text-sm text-foreground-secondary mt-1">
                          {description}
                        </p>
                      )}
                    </div>
                    
                    {showCloseButton && (
                      <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-foreground-tertiary hover:text-foreground-primary hover:bg-background-tertiary transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                )}

                {/* Content */}
                <div>
                  {children}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}