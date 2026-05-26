
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { User } from '@/entities/User';
import { ShardTransaction } from '@/entities/ShardTransaction';
import { Badge } from '@/components/ui/badge';
import { Zap } from 'lucide-react';
import { Card } from "@/components/ui/card";

const wheelNumbers = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const numberColor = (n) => (n === 0 ? 'green' : redNumbers.includes(n) ? 'red' : 'black');

const chipValues = [1, 5, 10, 25, 100, 500, 1000, 2500, 5000, 10000];
const chipColors = {
  1: 'bg-blue-500', 5: 'bg-red-500', 10: 'bg-green-500', 25: 'bg-purple-500', 
  100: 'bg-gray-800 text-white', 500: 'bg-yellow-500', 1000: 'bg-orange-500',
  2500: 'bg-pink-500', 5000: 'bg-indigo-500', 10000: 'bg-cyan-500'
};

const payouts = {
  straight: 35, red: 1, black: 1, even: 1, odd: 1, low: 1, high: 1,
};

// Realistic Betting Table Component
const BettingTable = ({ bets, onBet, disabled }) => {
  const renderBettingSpot = (label, betType, betValue, className = '', key) => (
    <div
      key={key}
      className={`relative flex items-center justify-center text-center font-bold text-base border border-yellow-300/60 cursor-pointer hover:bg-yellow-400/20 transition-all duration-200 ${className}`}
      onClick={() => !disabled && onBet(betType, betValue)}
      style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
    >
      <span className="text-white font-mono">{label}</span>
      {bets[betType]?.[betValue] > 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-black text-sm font-bold shadow-lg border-2 border-yellow-200">
            {bets[betType][betValue]}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-8 flex justify-center items-center w-full h-full" style={{ perspective: '1000px' }}>
      <div 
        className="relative bg-gradient-to-br from-green-800 via-green-700 to-green-900 border-4 border-amber-600 rounded-lg shadow-2xl p-6 w-full max-w-4xl"
        style={{
          transform: 'rotateX(15deg)',
          background: 'linear-gradient(135deg, #1e5128 0%, #2d5016 50%, #1a4c28 100%)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.1)',
          minHeight: '500px'
        }}
      >
        {/* Main betting grid - increased size */}
        <div className="grid grid-cols-13 gap-1 mb-4">
          {/* Zero - larger */}
          {renderBettingSpot('0', 'straight', 0, 'col-span-1 row-span-3 bg-green-600 h-32 text-2xl font-bold', 's-0')}
          
          {/* Numbers 1-36 in proper roulette layout - larger cells */}
          {[3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36].map((num, colIndex) => 
            renderBettingSpot(num, 'straight', num, `col-start-${colIndex + 2} row-start-1 h-10 text-lg ${numberColor(num) === 'red' ? 'bg-red-600' : 'bg-gray-900'}`, `s-${num}`)
          )}
          {[2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35].map((num, colIndex) => 
            renderBettingSpot(num, 'straight', num, `col-start-${colIndex + 2} row-start-2 h-10 text-lg ${numberColor(num) === 'red' ? 'bg-red-600' : 'bg-gray-900'}`, `s-${num}`)
          )}
          {[1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34].map((num, colIndex) => 
            renderBettingSpot(num, 'straight', num, `col-start-${colIndex + 2} row-start-3 h-10 text-lg ${numberColor(num) === 'red' ? 'bg-red-600' : 'bg-gray-900'}`, `s-${num}`)
          )}
          
          {/* Column bets - larger */}
          {renderBettingSpot('2 to 1', 'column', 1, 'col-start-14 row-start-1 bg-green-700 h-10 text-sm', 'col-1')}
          {renderBettingSpot('2 to 1', 'column', 2, 'col-start-14 row-start-2 bg-green-700 h-10 text-sm', 'col-2')}
          {renderBettingSpot('2 to 1', 'column', 3, 'col-start-14 row-start-3 bg-green-700 h-10 text-sm', 'col-3')}
        </div>
        
        {/* Outside bets - larger */}
        <div className="grid grid-cols-6 gap-1 mb-4">
          {renderBettingSpot('1-18', 'low', null, 'bg-green-700 h-16 text-base font-bold', 'low')}
          {renderBettingSpot('EVEN', 'even', null, 'bg-green-700 h-16 text-base font-bold', 'even')}
          {renderBettingSpot('RED', 'red', null, 'bg-red-600 h-16 text-base font-bold', 'red')}
          {renderBettingSpot('BLACK', 'black', null, 'bg-gray-900 h-16 text-base font-bold', 'black')}
          {renderBettingSpot('ODD', 'odd', null, 'bg-green-700 h-16 text-base font-bold', 'odd')}
          {renderBettingSpot('19-36', 'high', null, 'bg-green-700 h-16 text-base font-bold', 'high')}
        </div>
        
        {/* Dozen bets - larger */}
        <div className="grid grid-cols-3 gap-1">
          {renderBettingSpot('1st 12', 'dozen', 1, 'bg-green-700 h-14 text-base font-bold', 'dozen-1')}
          {renderBettingSpot('2nd 12', 'dozen', 2, 'bg-green-700 h-14 text-base font-bold', 'dozen-2')}
          {renderBettingSpot('3rd 12', 'dozen', 3, 'bg-green-700 h-14 text-base font-bold', 'dozen-3')}
        </div>
      </div>
    </div>
  );
};

// Realistic Roulette Wheel Component
const RouletteWheel = ({ isSpinning, winningNumber }) => {
  const wheelRotation = useMemo(() => {
    if (winningNumber === null) return 0;
    const winningIndex = wheelNumbers.indexOf(winningNumber);
    const baseSpins = 8 * 360; // Increased base spins for more dramatic effect
    const segmentAngle = 360 / wheelNumbers.length;
    const stopAngle = winningIndex * segmentAngle;
    const randomOffset = Math.random() * segmentAngle * 0.8 - segmentAngle * 0.4;
    return baseSpins - stopAngle + randomOffset;
  }, [winningNumber]);

  return (
    <div className="relative flex items-center justify-center w-96 h-96 mx-auto my-8" style={{ perspective: '1200px' }}>
      {/* Outer wooden rim with deeper shadow */}
      <div 
        className="absolute inset-0 rounded-full border-8 shadow-2xl"
        style={{
          background: 'radial-gradient(circle at 30% 30%, #D2691E 0%, #8B4513 20%, #A0522D 40%, #654321 70%, #3E2723 100%)',
          transform: 'rotateX(35deg)',
          boxShadow: '0 0 60px rgba(0,0,0,0.8), inset 0 8px 20px rgba(255,255,255,0.15), inset 0 -8px 20px rgba(0,0,0,0.3)',
          border: '8px solid #654321'
        }}
      />
      
      {/* Chrome/metal inner rim with enhanced depth */}
      <div 
        className="absolute inset-6 rounded-full border-6 shadow-inner"
        style={{
          background: 'linear-gradient(135deg, #E8E8E8 0%, #C0C0C0 25%, #A8A8A8 50%, #C0C0C0 75%, #E8E8E8 100%)',
          transform: 'rotateX(35deg)',
          boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.4), inset 0 -4px 12px rgba(255,255,255,0.3)',
          border: '6px solid #B8B8B8'
        }}
      />
      
      {/* Spinning wheel with single continuous rotation */}
      <div 
        className="absolute inset-12 rounded-full overflow-hidden"
        style={{
          transform: `rotateX(35deg) rotateZ(${isSpinning ? -wheelRotation : 0}deg)`,
          transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          transitionDuration: isSpinning ? '4000ms' : '0ms', // Single 4-second spin
          background: 'radial-gradient(circle at 40% 40%, #CD853F 0%, #8B4513 30%, #654321 70%, #2F1B14 100%)',
          boxShadow: 'inset 0 6px 16px rgba(0,0,0,0.6), inset 0 -6px 16px rgba(255,255,255,0.1)',
          border: '2px solid #654321'
        }}
      >
        {/* Number segments with carved wood effect */}
        {wheelNumbers.map((num, i) => {
          const angle = i * (360 / 37);
          const color = numberColor(num);
          return (
            <div 
              key={num} 
              className="absolute w-full h-full origin-center"
              style={{ transform: `rotate(${angle}deg)` }}
            >
              {/* Carved number pocket */}
              <div 
                className={`absolute top-3 left-1/2 -ml-5 w-10 h-8 flex items-center justify-center text-sm font-bold text-white ${
                  color === 'red' ? 'bg-red-700' : color === 'black' ? 'bg-gray-900' : 'bg-green-700'
                }`}
                style={{ 
                  transform: `rotate(${-angle}deg) rotateX(-35deg)`,
                  textShadow: '2px 2px 4px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.1)',
                  borderRadius: '4px',
                  boxShadow: `
                    inset 0 2px 4px rgba(0,0,0,0.5),
                    inset 0 -2px 4px rgba(255,255,255,0.1),
                    0 3px 6px rgba(0,0,0,0.4)
                  `,
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: color === 'red' 
                    ? 'linear-gradient(145deg, #DC143C 0%, #B22222 50%, #8B0000 100%)'
                    : color === 'black' 
                    ? 'linear-gradient(145deg, #2F2F2F 0%, #1C1C1C 50%, #000000 100%)'
                    : 'linear-gradient(145deg, #228B22 0%, #006400 50%, #004000 100%)'
                }}
              >
                <span style={{
                  filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.8))',
                  fontWeight: '900',
                  fontSize: '12px'
                }}>
                  {num}
                </span>
              </div>
              
              {/* Wooden separator lines between numbers */}
              <div 
                className="absolute top-0 left-1/2 w-0.5 h-16 bg-gradient-to-b from-amber-600 to-amber-800"
                style={{
                  transform: `rotate(${-angle}deg) rotateX(-35deg)`,
                  marginLeft: '-1px',
                  boxShadow: '0 0 2px rgba(0,0,0,0.5)'
                }}
              />
            </div>
          );
        })}
        
        {/* Central hub with enhanced metallic spinner */}
        <div 
          className="absolute inset-1/3 rounded-full flex items-center justify-center"
          style={{
            background: 'radial-gradient(circle at 30% 30%, #F5F5F5 0%, #E8E8E8 20%, #C0C0C0 50%, #A0A0A0 80%, #808080 100%)',
            boxShadow: `
              0 0 30px rgba(255,255,255,0.6), 
              inset 0 4px 12px rgba(0,0,0,0.4),
              inset 0 -4px 12px rgba(255,255,255,0.4),
              0 8px 16px rgba(0,0,0,0.3)
            `,
            border: '3px solid #B8B8B8',
            transform: 'translateZ(8px)'
          }}
        >
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center animate-pulse"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #FFD700 0%, #FFA500 50%, #FF8C00 100%)',
              boxShadow: `
                0 0 20px rgba(255,215,0,0.8),
                inset 0 2px 6px rgba(255,255,255,0.4),
                inset 0 -2px 6px rgba(0,0,0,0.3),
                0 4px 8px rgba(0,0,0,0.2)
              `,
              border: '2px solid #DAA520',
              transform: 'translateZ(4px)'
            }}
          >
            <Zap 
              className="w-6 h-6 text-amber-900" 
              style={{
                filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.5))',
                animation: isSpinning ? 'spin 0.5s linear infinite' : 'none'
              }}
            />
          </div>
        </div>
      </div>
      
      {/* Enhanced white ball that touches the wheel surface */}
      <div
        className="absolute rounded-full bg-white border border-gray-300 z-10"
        style={{
          width: '16px',
          height: '16px',
          top: '20%', // Adjusted to be closer to the wheel surface
          left: '50%',
          marginLeft: '-8px',
          marginTop: '-8px',
          transform: `rotateZ(${isSpinning ? wheelRotation * 0.9 : 0}deg) translateX(130px) rotateZ(${isSpinning ? -wheelRotation * 0.9 : 0}deg) rotateX(35deg)`,
          transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          transitionDuration: isSpinning ? '3800ms' : '200ms', // Slightly faster than wheel to create realistic effect
          boxShadow: `
            0 6px 12px rgba(0,0,0,0.5),
            inset 0 2px 4px rgba(255,255,255,0.9),
            0 0 15px rgba(255,255,255,0.7),
            0 2px 4px rgba(0,0,0,0.3)
          `,
          background: 'radial-gradient(circle at 30% 30%, #FFFFFF 0%, #F8F8F8 50%, #E8E8E8 100%)',
          border: '1px solid rgba(200,200,200,0.8)'
        }}
      />
      
      {/* Enhanced pointer/deflector with metallic finish */}
      <div 
        className="absolute top-6 left-1/2 w-0 h-0 z-20"
        style={{
          borderLeft: '10px solid transparent',
          borderRight: '10px solid transparent',
          borderTop: '20px solid #C0C0C0',
          marginLeft: '-10px',
          transform: 'rotateX(35deg)',
          filter: `
            drop-shadow(0 4px 6px rgba(0,0,0,0.4))
            drop-shadow(0 0 4px rgba(255,255,255,0.3))
          `,
          background: 'linear-gradient(145deg, #E8E8E8 0%, #C0C0C0 50%, #A8A8A8 100%)'
        }}
      />
      
      {/* Additional wooden rim details */}
      <div 
        className="absolute inset-2 rounded-full border-2 border-amber-700/30"
        style={{
          transform: 'rotateX(35deg)',
          boxShadow: 'inset 0 0 20px rgba(218, 165, 32, 0.3)'
        }}
      />
    </div>
  );
};

export default function RouletteGame({ user, onBalanceChange }) {
  const [bets, setBets] = useState({});
  const [selectedChip, setSelectedChip] = useState(1);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winningNumber, setWinningNumber] = useState(null);
  const [lastResult, setLastResult] = useState({ win: 0, text: "Place your bets!" });
  const [insufficientChips, setInsufficientChips] = useState(false);

  const totalBet = useMemo(() => {
    return Object.values(bets).reduce((acc, betGroup) => {
      return acc + Object.values(betGroup).reduce((groupAcc, amount) => groupAcc + amount, 0);
    }, 0);
  }, [bets]);

  const handleBet = (betType, betValue) => {
    if ((user.chips || 0) < totalBet + selectedChip) {
      setInsufficientChips(true);
      setTimeout(() => setInsufficientChips(false), 2000);
      return;
    }
    const newBets = { ...bets };
    if (!newBets[betType]) newBets[betType] = {};
    newBets[betType][betValue] = (newBets[betType][betValue] || 0) + selectedChip;
    setBets(newBets);
  };
  
  const handleSpin = async () => {
    if (totalBet === 0 || isSpinning) return;
    
    setIsSpinning(true);
    setWinningNumber(null);

    const resultNumber = Math.floor(Math.random() * 37);
    
    setTimeout(() => {
      setWinningNumber(resultNumber);
      calculateWinnings(resultNumber);
    }, 100);

    setTimeout(() => {
      setIsSpinning(false);
      setBets({});
    }, 4100);
  };

  const calculateWinnings = async (number) => {
    let winnings = 0;
    const resultColor = numberColor(number);
    const isEven = number !== 0 && number % 2 === 0;
    const isLow = number >= 1 && number <= 18;

    if (bets.straight?.[number]) { winnings += bets.straight[number] * (payouts.straight + 1); }
    if (resultColor === 'red' && bets.red?.[null]) { winnings += bets.red[null] * (payouts.red + 1); }
    if (resultColor === 'black' && bets.black?.[null]) { winnings += bets.black[null] * (payouts.black + 1); }
    if (isEven && bets.even?.[null]) { winnings += bets.even[null] * (payouts.even + 1); }
    if (!isEven && number !== 0 && bets.odd?.[null]) { winnings += bets.odd[null] * (payouts.odd + 1); }
    if (isLow && bets.low?.[null]) { winnings += bets.low[null] * (payouts.low + 1); }
    if (!isLow && number !== 0 && bets.high?.[null]) { winnings += bets.high[null] * (payouts.high + 1); }

    const netWin = winnings - totalBet;

    setLastResult({
      win: netWin,
      text: `Number is ${number} ${resultColor}. You ${netWin > 0 ? `won ${netWin}` : netWin < 0 ? `lost ${-netWin}` : 'broke even'}.`
    });

    // Update player balance using in-app currency system
    if (netWin !== 0) {
      await User.updateMyUserData({ chips: (user.chips || 0) + netWin });
      
      if (netWin > 0) {
        // Player won - casino pays out
        await ShardTransaction.create({ 
          from_user: "Cybertron Casino", 
          to_user: user.email, 
          from_user_wallet: "in-app",
          to_user_wallet: "in-app",
          amount: netWin, 
          transaction_type: 'allocation', 
          marketplace_item_id: 'Roulette Win'
        });
      } else {
        // Player lost - house wins, transfer to casino owner (admin)
        const houseWinnings = -netWin; // Convert negative to positive
        
        try {
          // Find the admin user (casino owner)
          const allUsers = await User.list();
          const adminUser = allUsers.find(u => u.is_admin === true);
          
          if (adminUser) {
            // Transfer house winnings to admin's chip balance
            await User.update(adminUser.id, {
              chips: (adminUser.chips || 0) + houseWinnings
            });
            
            // Record the transaction
            await ShardTransaction.create({
              from_user: user.email,
              to_user: adminUser.email,
              from_user_wallet: "in-app",
              to_user_wallet: "in-app",
              amount: houseWinnings,
              transaction_type: 'marketplace_purchase',
              marketplace_item_id: 'House Edge - Roulette'
            });
          } else {
            // No admin user found, route to generic casino
            console.warn("No admin user found to receive house winnings.");
            await ShardTransaction.create({
              from_user: user.email,
              to_user: "Cybertron Casino",
              from_user_wallet: "in-app",
              to_user_wallet: "in-app",
              amount: houseWinnings,
              transaction_type: 'marketplace_purchase',
              marketplace_item_id: 'Roulette Loss - No Admin'
            });
          }
        } catch (error) {
          console.error("Error transferring house winnings to admin:", error);
          // Still record the transaction to Cybertron Casino as fallback
          await ShardTransaction.create({
            from_user: user.email,
            to_user: "Cybertron Casino",
            from_user_wallet: "in-app",
            to_user_wallet: "in-app",
            amount: houseWinnings,
            transaction_type: 'marketplace_purchase',
            marketplace_item_id: 'Roulette Loss - Error'
          });
        }
      }
    }
    
    onBalanceChange();
  };

  const clearBets = () => setBets({});

  return (
    <Card className="bg-black/70 border-2 border-yellow-500/80 neon-border p-4">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 min-h-[700px]">
        <div className="xl:col-span-1 flex flex-col">
          <BettingTable bets={bets} onBet={handleBet} disabled={isSpinning} />
        </div>
        
        <div className="flex flex-col justify-between items-center space-y-4 p-4 bg-gray-900/50 rounded-lg border border-cyan-400/30">
          <RouletteWheel isSpinning={isSpinning} winningNumber={winningNumber} />
          
          <div>
            <h3 className="text-center font-bold text-lg text-cyan-400 bloom-glow mb-2">RESULT</h3>
            <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center text-4xl font-bold border-4 ${winningNumber !== null ? (numberColor(winningNumber) === 'red' ? 'border-red-500 text-red-500' : numberColor(winningNumber) === 'black' ? 'border-gray-400 text-gray-400' : 'border-green-500 text-green-500') : 'border-gray-600 text-gray-600'}`}>
              {winningNumber !== null ? winningNumber : '?'}
            </div>
            <p className={`text-center mt-2 font-bold ${lastResult.win > 0 ? 'text-green-400' : lastResult.win < 0 ? 'text-red-400' : 'text-yellow-400'}`}>
              {lastResult.text}
            </p>
          </div>

          <div className="w-full">
            <h3 className="text-center font-bold text-lg text-cyan-400 bloom-glow mb-2">CHIPS</h3>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {chipValues.map(value => (
                <Button key={value} variant={selectedChip === value ? 'default' : 'outline'} className={`w-full font-bold border-2 text-xs ${chipColors[value]} ${selectedChip === value ? 'border-yellow-400' : 'border-transparent'}`} onClick={() => setSelectedChip(value)}>
                  {value >= 1000 ? `${value/1000}K` : value}
                </Button>
              ))}
            </div>

            <div className="text-center mb-4">
              <Badge variant="outline" className={`text-lg py-2 px-4 border-cyan-500 ${insufficientChips ? 'text-red-500 border-red-500 animate-pulse' : 'text-cyan-400'}`}>
                {insufficientChips ? "INSUFFICIENT CHIPS" : `TOTAL BET: ${totalBet.toLocaleString()}`}
              </Badge>
            </div>

            <div className="flex gap-2">
              <Button onClick={clearBets} variant="destructive" className="w-full" disabled={isSpinning || totalBet === 0}>Clear Bets</Button>
              <Button onClick={handleSpin} className="w-full bg-green-600 hover:bg-green-700 text-lg font-bold" disabled={isSpinning || totalBet === 0}>
                <Zap className="mr-2" /> SPIN
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
