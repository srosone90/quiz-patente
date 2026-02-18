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
      {/* Desktop: Tabs orizzontali */}
      <div className="hidden md:flex gap-2 bg-white dark:bg-dark-card rounded-xl p-2 shadow-sm border border-gray-200 dark:border-dark-border overflow-x-auto">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeSection === item.id
                ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-hover'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Mobile: Dropdown menu */}
      <div className="md:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-dark-border"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{activeItem?.icon}</span>
            <div className="text-left">
              <div className="font-semibold text-gray-900 dark:text-white">{activeItem?.label}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{activeItem?.description}</div>
            </div>
          </div>
          <svg
            className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
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
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-dark-card rounded-xl shadow-xl border border-gray-200 dark:border-dark-border z-50 overflow-hidden">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onSectionChange(item.id)
                    setIsOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-4 transition-colors border-b border-gray-100 dark:border-dark-border last:border-b-0 ${
                    activeSection === item.id
                      ? 'bg-primary-50 dark:bg-primary-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-dark-hover'
                  }`}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <div className="flex-1 text-left">
                    <div className={`font-semibold ${
                      activeSection === item.id
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {item.label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{item.description}</div>
                  </div>
                  {activeSection === item.id && (
                    <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
