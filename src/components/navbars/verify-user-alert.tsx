'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { XIcon, MailCheckIcon } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function VerifyUserAlert() {
  const [showAlert, setShowAlert] = useState(true)
  const [cooldown, setCooldown] = useState(0)

  const handleResend = async () => {
    if (cooldown > 0) return
    
    try {
      // Add your resend verification email logic here
      console.log('Resending verification email...')
      
      // Start cooldown timer
      setCooldown(60)
    } catch (error) {
      console.error('Resend failed:', error)
    }
  }

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown(prev => Math.max(0, prev - 1))
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [cooldown])

  return (
    <AnimatePresence>
      {showAlert && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 w-full max-w-md z-50"
        >
          <div className="relative rounded-lg bg-amber-50/95 backdrop-blur-sm border border-amber-200 px-4 py-3 text-amber-700 shadow-lg">
            <div className="flex gap-3">
              <MailCheckIcon className="mt-0.5 shrink-0 opacity-80" size={20} />
              
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">Verify your email address</p>
                <p className="text-sm opacity-90">
                  Please check your inbox for the verification link
                </p>
                
                <div className="mt-2 flex items-center gap-3">
                  <button
                    onClick={handleResend}
                    disabled={cooldown > 0}
                    className="text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed
                      hover:text-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 rounded-sm"
                  >
                    Resend email {cooldown > 0 && `(${cooldown})`}
                  </button>
                  
                  <span className="text-amber-600/50">|</span>
                  
                  <Link
                    href="/contact"
                    className="text-sm font-medium hover:text-amber-800 
                      focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 rounded-sm"
                  >
                    Need help?
                  </Link>
                </div>
              </div>
              
              <button
                onClick={() => setShowAlert(false)}
                className="absolute top-3 right-3 p-1 hover:bg-amber-100 rounded-full
                  focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
              >
                <XIcon className="opacity-70 hover:opacity-90" size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}