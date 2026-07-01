import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export const QRCodeModal = ({ isOpen, onClose, gameCode }) => {
  const [copied, setCopied] = React.useState(false);
  const joinUrl = `${window.location.origin}/join?code=${gameCode}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      toast.success('Invite link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(joinUrl)}&color=2c-5f-5d&bgcolor=fffdf9`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-primary/40 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.95, y: 15, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 15, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-md bg-card-cream border border-primary/10 rounded-3xl p-6 shadow-premium overflow-hidden z-10"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl text-primary font-bold">Invite Freshers</h3>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-primary/5 text-primary/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* QR Section */}
            <div className="flex flex-col items-center justify-center p-4 bg-background-cream rounded-2xl border border-primary/5 mb-4">
              <img
                src={qrImageUrl}
                alt={`QR code to join game ${gameCode}`}
                className="w-48 h-48 rounded-xl shadow-inner bg-white p-2 border border-primary/5"
                onError={(e) => {
                  // Fallback if the external qr API fails
                  e.target.src = `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(joinUrl)}`;
                }}
              />
              <span className="text-xs text-primary/60 mt-3 font-medium">Scan to join on mobile</span>
            </div>

            {/* Game Code Display */}
            <div className="text-center mb-6">
              <span className="text-sm text-primary/60 uppercase tracking-widest font-semibold">Game Code</span>
              <div className="text-3xl text-primary font-extrabold tracking-wider font-display my-1">
                {gameCode}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={copyToClipboard}
                className="flex-1 inline-flex items-center justify-center gap-2 font-display font-medium text-sm text-primary bg-sage/20 border border-sage/40 hover:bg-sage/35 py-3 rounded-xl transition-all cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy Invite Link'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default QRCodeModal;
