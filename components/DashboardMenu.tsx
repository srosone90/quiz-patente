'use client'

import { useState, useRef, useEffect } from 'react'
import { LucideIcon } from 'lucide-react'

interface DashboardMenuItem {
  id: string
  label: string
  Icon: LucideIcon
  description: string
}

interface DashboardMenuProps {
  items: DashboardMenuItem[]
  activeSection: string
  onSectionChange: (sectionId: string) => void
}

export default function DashboardMenu({ items, activeSection, onSectionChange }: DashboardMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const activeItem = items.find(item => item.id === activeSection)

  // Chiudi dropdown quando si clicca fuori
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative mb-8" ref={dropdownRef}>
      {/* Trigger Button - Design moderno */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full group relative overflow-hidden
          flex items-center justify-between gap-4
          px-6 py-5 rounded-2xl
          bg-white dark:bg-dark-card
          border-2 transition-all duration-300
          ${isOpen 
            ? 'border-primary-800 dark:border-accent-400 shadow-card-hover' 
            : 'border-gray-200 dark:border-dark-border hover:border-primary-800 dark:hover:border-accent-400 hover:shadow-card'
          }
        `}
      >
        {/* Decorative gradient on hover */}
        <div className={`
          absolute inset-0 bg-gradient-to-r from-primary-800/5 to-accent-400/5 
          transition-opacity duration-300
          ${isOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
        `}></div>
        
        {/* Content */}
        <div className="relative flex items-center gap-4 flex-1 min-w-0">
          {/* Icon con background */}
          <div className={`
            flex-shrink-0 w-14 h-14 rounded-xl
            flex items-center justify-center
            transition-all duration-300
            ${ isOpen
              ? 'bg-primary-800 dark:bg-accent-400 text-white scale-110'
              : 'bg-gray-100 dark:bg-dark-surface text-primary-800 dark:text-accent-400 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/20 group-hover:scale-110'
            }
          `}>
            {activeItem?.Icon && <activeItem.Icon className={`w-7 h-7 ${!isOpen && 'group-hover:scale-110 transition-transform'}`} />}
          </div>
          
          {/* Text */}
          <div className="flex-1 text-left min-w-0">
            <div className="font-bold text-lg text-primary-900 dark:text-white truncate">
              {activeItem?.label}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
              {activeItem?.description}
            </div>
          </div>
        </div>

        {/* Chevron */}
        <svg
          className={`
            relative flex-shrink-0 w-6 h-6 
            text-primary-800 dark:text-accent-400
            transition-transform duration-300
            ${isOpen ? 'rotate-180' : 'group-hover:translate-y-0.5'}
          `}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Panel - Design premium */}
      <div className={`
        absolute top-full left-0 right-0 mt-2 z-50
        transition-all duration-300 origin-top
        ${isOpen 
          ? 'opacity-100 scale-100 pointer-events-auto' 
          : 'opacity-0 scale-95 pointer-events-none'
        }
      `}>
        <div className="
          bg-white dark:bg-dark-card 
          rounded-2xl shadow-card-hover
          border-2 border-primary-800 dark:border-accent-400
          overflow-hidden
          max-h-[70vh] overflow-y-auto
        ">
          {items.map((item, index) => {
            const isActive = activeSection === item.id
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSectionChange(item.id)
                  setIsOpen(false)
                }}
                className={`
                  w-full group relative
                  flex items-center gap-4
                  px-6 py-4
                  transition-all duration-300
                  ${index !== items.length - 1 ? 'border-b border-gray-200 dark:border-dark-border' : ''}
                  ${isActive
                    ? 'bg-gradient-to-r from-primary-800 to-primary-900 dark:from-primary-700 dark:to-primary-800'
                    : 'hover:bg-gray-50 dark:hover:bg-dark-hover'
                  }
                `}
              >
                {/* Icon */}
                <div className={`
                  flex-shrink-0 w-12 h-12 rounded-xl
                  flex items-center justify-center
                  transition-all duration-300
                  ${isActive
                    ? 'bg-white/20 backdrop-blur-sm text-white scale-110'
                    : 'bg-gray-100 dark:bg-dark-surface text-primary-800 dark:text-primary-400 group-hover:scale-110'
                  }
                `}>
                  <item.Icon className="w-6 h-6" />
                </div>
                
                {/* Text */}
                <div className="flex-1 text-left">
                  <div className={`
                    font-bold text-base
                    ${isActive
                      ? 'text-white'
                      : 'text-primary-900 dark:text-white'
                    }
                  `}>
                    {item.label}
                  </div>
                  <div className={`
                    text-sm
                    ${isActive
                      ? 'text-white/80'
                      : 'text-gray-600 dark:text-gray-400'
                    }
                  `}>
                    {item.description}
                  </div>
                </div>

                {/* Check icon per item attivo */}
                {isActive && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-accent-400 rounded-full flex items-center justify-center animate-scale-in">
                      <svg className="w-5 h-5 text-primary-900" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}

                {/* Hover arrow per items non attivi */}
                {!isActive && (
                  <svg 
                    className="flex-shrink-0 w-5 h-5 text-gray-400 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
