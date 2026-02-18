'use client'

import { useState } from 'react'

interface DashboardMenuItem {
  id: string
  label: string
  icon: string
  description: string
}

interface DashboardMenuProps {
  items: DashboardMenuItem[]
  activeSection: string
  onSectionChange: (sectionId: string) => void
}

export default function DashboardMenu({ items, activeSection, onSectionChange }: DashboardMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  const activeItem = items.find(item => item.id === activeSection)

  return (
    <div className="relative mb-6">
      {/* Dropdown menu per tutte le dimensioni */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-dark-border hover:shadow-md transition-shadow"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl sm:text-3xl">{activeItem?.icon}</span>
          <div className="text-left">
            <div className="font-semibold text-gray-900 dark:text-white text-base sm:text-lg">{activeItem?.label}</div>
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{activeItem?.description}</div>
          </div>
        </div>
        <svg
          className={`w-5 h-5 sm:w-6 sm:h-6 text-gray-500 dark:text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-25 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-dark-card rounded-xl shadow-xl border border-gray-200 dark:border-dark-border z-50 overflow-hidden max-h-[70vh] overflow-y-auto">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onSectionChange(item.id)
                  setIsOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-4 sm:px-6 py-3 sm:py-4 transition-colors border-b border-gray-100 dark:border-dark-border last:border-b-0 ${
                  activeSection === item.id
                    ? 'bg-primary-50 dark:bg-primary-900/20'
                    : 'hover:bg-gray-50 dark:hover:bg-dark-hover'
                }`}
              >
                <span className="text-2xl sm:text-3xl">{item.icon}</span>
                <div className="flex-1 text-left">
                  <div className={`font-semibold text-base sm:text-lg ${
                    activeSection === item.id
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    {item.label}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{item.description}</div>
                </div>
                {activeSection === item.id && (
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600 dark:text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
