import React, { useState } from 'react';

export interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (amount: number) => void;
}

const PRESET_AMOUNTS = [50, 100, 200, 500, 1000];

export const TopUpModal: React.FC<TopUpModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [amount, setAmount] = useState<number>(50);
  const [utr, setUtr] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount < 50) {
      alert('Minimum deposit amount is ₹50');
      return;
    }
    setIsSubmitted(true);
    if (onSuccess) {
      onSuccess(amount);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="bg-[#12121a] border border-cyan-500/40 w-full max-w-md rounded-2xl p-6 shadow-[0_0_25px_rgba(6,182,212,0.15)] relative text-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition text-lg"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold text-center text-cyan-400 tracking-wide">
          DEPOSIT CREDITS
        </h2>
        <p className="text-xs text-center text-gray-400 mt-1 mb-5">
          Min. Deposit ₹50 | Instant Wallet Update
        </p>

        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Amount Selection */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                Select Amount (₹)
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {PRESET_AMOUNTS.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val)}
                    className={`py-2 text-sm font-bold rounded-lg border transition ${
                      amount === val
                        ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                        : 'bg-[#1a1a26] text-gray-300 border-gray-700 hover:border-cyan-500/50'
                    }`}
                  >
                    ₹{val}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount Input */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                Or Enter Custom Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-cyan-400 font-bold">₹</span>
                <input
                  type="number"
                  min="50"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full bg-[#1a1a26] border border-gray-700 rounded-xl py-2.5 pl-8 pr-4 text-white text-sm font-semibold focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>
            </div>

            {/* UTR / Transaction Input */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                Transaction ID / UTR (Optional)
              </label>
              <input
                type="text"
                placeholder="12-digit UTR after payment"
                value={utr}
                onChange={(e) => setUtr(e.target.value)}
                className="w-full bg-[#1a1a26] border border-gray-700 rounded-xl py-2.5 px-4 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-sm tracking-wider uppercase rounded-xl shadow-lg transition duration-200"
            >
              Confirm Deposit ₹{amount}
            </button>
          </form>
        ) : (
          <div className="text-center py-6 space-y-4">
            <div className="w-12 h-12 bg-green-500/20 border border-green-500 text-green-400 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              ✓
            </div>
            <h3 className="text-lg font-bold text-white">Deposit Request Received</h3>
            <p className="text-xs text-gray-400">
              ₹{amount} deposit request is being processed. Wallet balance will update shortly.
            </p>
            <button
              type="button"
              onClick={() => {
                setIsSubmitted(false);
                onClose();
              }}
              className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl text-xs transition"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopUpModal;
