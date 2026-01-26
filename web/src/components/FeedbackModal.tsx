'use client';

import { useState } from 'react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FORMSPREE_URL = 'https://formspree.io/f/xnjdjwav';

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!message.trim()) return;

    setSending(true);
    setError(false);

    try {
      const response = await fetch(FORMSPREE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensaje: message,
          fecha: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        setSent(true);
        setMessage('');
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setSent(false);
    setError(false);
    setMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-lg shadow-xl border border-gray-700 w-full max-w-md">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-white font-semibold">Enviar feedback</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {sent ? (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-white text-lg mb-2">Feedback enviado</p>
            <p className="text-gray-400 text-sm mb-4">Gracias por tu comentario.</p>
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            <div>
              <label className="text-gray-400 text-xs block mb-1">Tu mensaje</label>
              <textarea
                placeholder="Sugerencias, errores, ideas..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:border-green-500 focus:outline-none resize-none"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm">Error al enviar. Intentá de nuevo.</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={sending || !message.trim()}
              className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                'Enviando...'
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Enviar
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
