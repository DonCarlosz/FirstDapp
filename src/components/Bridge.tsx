'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWalletClient, useBalance } from 'wagmi';
import { createClient, MAINNET_RELAY_API } from '@relayprotocol/relay-sdk';
import { ArrowDown } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { parseEther, formatEther, type Address } from 'viem';

// Initialize Relay SDK
const relay = createClient({
  baseApiUrl: MAINNET_RELAY_API,
  source: 'my-bridge-app', 
});

const ETH_ADDRESS = '0x0000000000000000000000000000000000000000' as Address;

export default function Bridge() {
  const { isConnected, address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { data: balance } = useBalance({ address: address, chainId: 8453 });

  // State
  const [amount, setAmount] = useState<string>('');
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [swapping, setSwapping] = useState(false);

  // Safe Balance Display
  const displayBalance = balance?.value
    ? Number(formatEther(balance.value)).toFixed(5)
    : '0.00';

  // 1. Fetch Quote Logic (Clean ETH Only)
  useEffect(() => {
    const fetchQuote = async () => {
      // Safety Check
      if (!amount || isNaN(Number(amount)) || Number(amount) === 0) {
        setQuote(null);
        return;
      }
      
      setLoading(true);
      try {
        const weiAmount = parseEther(amount).toString();
        const safeAddress = (address || ETH_ADDRESS) as Address;

        const q = await relay.actions.getQuote({
          chainId: 8453, 
          toChainId: 42161, 
          toCurrency: ETH_ADDRESS, 
          currency: ETH_ADDRESS,
          amount: weiAmount,
          tradeType: 'EXACT_INPUT',
          user: safeAddress,
          recipient: safeAddress, 
        });
        setQuote(q);
      } catch (e) {
        console.error("Quote error:", e);
        setQuote(null);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchQuote, 500);
    return () => clearTimeout(timer);
  }, [amount, address]);

  // 2. Execute Swap
  const handleSwap = async () => {
    if (!quote || !walletClient) return;
    setSwapping(true);
    try {
      await relay.actions.execute({
        quote,
        wallet: walletClient,
        onProgress: (status) => { console.log("Status:", status); }
      });
      alert("Bridge Transaction Sent!");
      setAmount('');
      setQuote(null);
    } catch (e) {
      console.error(e);
      alert("Transaction Failed");
    } finally {
      setSwapping(false);
    }
  };

  // Max Button
  const handleMax = () => {
    if (balance?.value) {
      const rawBalance = Number(formatEther(balance.value));
      const safeMax = Math.max(0, rawBalance - 0.0001);
      setAmount(safeMax.toFixed(6));
    }
  };

  // Fee Parser
  const getFeeDisplay = () => {
    if (!quote) return '-';
    // 1. Try explicit string fees
    if (quote.fees?.total && typeof quote.fees.total === 'string') {
        return quote.fees.total.replace('$', '');
    }
    // 2. Try explicit object fees (drill down)
    let feeObj = quote.fees?.relayer || quote.fees?.total;
    if (typeof feeObj === 'object' && feeObj !== null) {
        // Look for amount inside object
        const val = feeObj.amountUsd || feeObj.amount || feeObj.formatted;
        if (val) return parseFloat(val).toFixed(2);
    }
    // 3. Fallback: Input - Output Spread
    if (quote.details?.currencyIn?.amountUsd && quote.details?.currencyOut?.amountUsd) {
       const diff = parseFloat(quote.details.currencyIn.amountUsd) - parseFloat(quote.details.currencyOut.amountUsd);
       return (diff > 0) ? diff.toFixed(2) : '-';
    }
    return '-';
  };

  return (
    <div className="w-full max-w-[480px] bg-[#121212] rounded-3xl p-4 border border-[#222] shadow-2xl text-white font-sans">
      
      <div className="flex justify-between items-center mb-4 px-2">
        <h2 className="text-xl font-bold">Bridge</h2>
      </div>

      {/* FROM: Base */}
      <div className="bg-[#1b1b1b] rounded-2xl p-4 border border-transparent hover:border-[#333] transition-all relative">
        <div className="flex justify-between text-gray-400 text-sm mb-3">
          <span>From</span>
          <span className="cursor-pointer hover:text-white" onClick={handleMax}>
            Balance: {displayBalance} ETH
          </span>
        </div>
        
        <div className="flex justify-between items-center gap-4">
          <input
            type="number"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            // CSS to hide arrows/spinners
            className="bg-transparent text-4xl font-medium outline-none w-full placeholder-[#333] text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          
          <div className="flex items-center gap-2 bg-[#2d2d2d] px-3 py-2 rounded-full shrink-0">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-[10px] font-bold">B</div>
            <span className="font-bold">Base</span>
          </div>
        </div>
      </div>

      {/* Arrow Divider */}
      <div className="relative flex justify-center -my-4 z-10">
        <div className="bg-[#121212] p-1.5 rounded-xl">
          <div className="bg-[#2d2d2d] p-2 rounded-lg text-gray-400 border border-[#121212]">
            <ArrowDown size={18} strokeWidth={3} />
          </div>
        </div>
      </div>

      {/* TO: Arb (Output) */}
      <div className="bg-[#1b1b1b] rounded-2xl p-4 mt-2 border border-transparent hover:border-[#333] transition-all pt-6">
        <div className="flex justify-between text-gray-400 text-sm mb-3">
          <span>To (Estimated Receive)</span>
        </div>
        
        <div className="flex justify-between items-center gap-4">
           <div className="text-4xl font-medium w-full truncate text-white">
            {loading ? (
                <span className="text-gray-600 animate-pulse">0.00...</span>
            ) : quote ? (
                // Safe Output Display
                (Number(quote.details?.currencyOut?.amount || 0) / 1e18).toFixed(4)
            ) : (
                <span className="text-gray-600">0</span>
            )}
          </div>

          <div className="flex items-center gap-2 bg-[#2d2d2d] px-3 py-2 rounded-full shrink-0">
            <div className="w-6 h-6 bg-[#2d374b] rounded-full flex items-center justify-center text-[10px] text-white font-bold border border-white/20">A</div>
            <span className="font-bold">Arb</span>
          </div>
        </div>
      </div>

      {/* Fees */}
      <div className="mt-4 px-2 min-h-[24px]">
        {quote && (
          <div className="flex justify-between text-sm text-gray-500">
            <span>Estimated Cost</span>
            <span>{getFeeDisplay() !== '-' ? '$' : ''}{getFeeDisplay()}</span>
          </div>
        )}
      </div>

      {/* Button */}
      <div className="mt-4">
        {!isConnected ? (
          <div className="w-full [&_button]:!w-full [&_button]:!h-[56px] [&_button]:!rounded-xl [&_button]:!text-lg [&_button]:!font-bold">
             <ConnectButton />
          </div>
        ) : (
          <button
            onClick={handleSwap}
            disabled={swapping || loading || !quote}
            className="w-full h-[56px] bg-[#3b82f6] hover:bg-[#2563eb] disabled:bg-[#1e293b] disabled:text-gray-500 text-white font-bold rounded-xl text-lg transition-all"
          >
            {swapping ? 'Bridging...' : loading ? 'Fetching Quote...' : 'Swap'}
          </button>
        )}
      </div>
    </div>
  );
}