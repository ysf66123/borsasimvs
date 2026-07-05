import { useState, useEffect, useMemo } from 'react';
import { Activity, Map, Trophy, Newspaper, Users, ShieldAlert, Download, User } from 'lucide-react';
import { Asset, Portfolio, NewsEvent, Holding } from './types';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { INITIAL_ASSETS, INITIAL_BALANCE } from './data';
import { getNextPrice, generateNews } from './utils';
import TradingView from './components/TradingView';
import RoadmapView from './components/RoadmapView';
import LeaderboardView from './components/LeaderboardView';
import MultiplayerView from './components/MultiplayerView';
import FirebaseRulesView from './components/FirebaseRulesView';
import ExportView from './components/ExportView';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const isAdmin = user?.email === 'yusar646@gmail.com';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const [activeLobby, setActiveLobby] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'trade' | 'leaderboard' | 'roadmap' | 'multiplayer' | 'rules' | 'export'>('trade');
  const [gameMode, setGameMode] = useState<'single' | 'multi'>('single');

  // Automatic gameMode synchronization based on active multiplayer game status
  useEffect(() => {
    if (activeLobby && activeLobby.status === 'playing') {
      setGameMode('multi');
    } else if (!activeLobby || activeLobby.status !== 'playing') {
      setGameMode('single');
    }
  }, [activeLobby, activeLobby?.status]);

  // Mode change switchers preventing switching away from active games
  const handleSwitchToSingle = () => {
    if (activeLobby && activeLobby.status === 'playing') {
      alert("Aktif bir çok oyunculu oyundasınız! Başka bir oyuna veya Tek Oyunculu moda geçmek için lütfen önce Çok Oyunculu lobi sekmesine gidip oyundan ayrılın.");
      return;
    }
    setGameMode('single');
    setActiveTab('trade');
  };

  const handleSwitchToMulti = () => {
    setActiveTab('multiplayer');
  };
  
  // Game State
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);
  const [portfolio, setPortfolio] = useState<Portfolio>(() => {
    const saved = localStorage.getItem('trading-game-portfolio');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure new properties exist for backward compatibility
      return {
        ...parsed,
        orders: parsed.orders || [],
        level: parsed.level || 1,
      };
    }
    return { balance: INITIAL_BALANCE, holdings: {}, orders: [], level: 1 };
  });
  const [news, setNews] = useState<NewsEvent[]>([]);
  const [tickCount, setTickCount] = useState(0);

  // Sync assets and news from active multiplayer lobby for GUESTS
  useEffect(() => {
    if (activeLobby && activeLobby.status === 'playing') {
      if (activeLobby.assets) {
        setAssets(activeLobby.assets);
      }
      if (activeLobby.news) {
        setNews(activeLobby.news);
      }
    }
  }, [activeLobby?.assets, activeLobby?.news, activeLobby?.status]);

  // Simulation Loop
  useEffect(() => {
    const interval = setInterval(async () => {
      setTickCount(tc => tc + 1);
      
      // If we are inside an active multiplayer game
      if (activeLobby && activeLobby.status === 'playing') {
        // ONLY the Host is authorized to tick prices and bot moves to prevent infinite racing loops!
        if (user && activeLobby.hostId === user.uid) {
          let nextNewsEvent: NewsEvent | null = null;
          const currentAssets = activeLobby.assets || assets;
          
          nextNewsEvent = generateNews(currentAssets);
          const nextAssets = currentAssets.map((asset: Asset) => {
            let newsImpact = 0;
            if (nextNewsEvent && nextNewsEvent.targetSymbol === asset.symbol) {
              newsImpact = nextNewsEvent.impact;
            }
            const newPrice = getNextPrice(asset.price, asset.volatility, newsImpact);
            const newHistory = [...(asset.history || [asset.price]), newPrice].slice(-30);
            return { ...asset, price: newPrice, history: newHistory };
          });

          const currentNews = activeLobby.news || [];
          const nextNews = nextNewsEvent 
            ? [nextNewsEvent, ...currentNews].slice(0, 5) 
            : currentNews;

          // Process bot actions
          let updatedPlayers = [...(activeLobby.players || [])];
          let playersChanged = false;

          updatedPlayers = updatedPlayers.map(p => {
            if (!p.isBot) return p;
            
            // SIGNIFICANTLY INCREASE trade chance so the market feels alive and moving!
            // Quality 1 -> 35%, Quality 5 -> 75%
            const tradeChance = 0.25 + (p.quality || 3) * 0.10;
            if (Math.random() > tradeChance) return p;

            const botPlayer = { ...p };
            if (botPlayer.balance === undefined) botPlayer.balance = INITIAL_BALANCE;
            if (!botPlayer.holdings) botPlayer.holdings = {};

            // Smart News Reaction: 65% chance the bot targets the latest news asset
            let chosenAsset = nextAssets[Math.floor(Math.random() * nextAssets.length)];
            let action = Math.random() > 0.45 ? 'buy' : 'sell';

            if (nextNewsEvent && Math.random() < 0.65) {
              const newsAsset = nextAssets.find(a => a.symbol === nextNewsEvent!.targetSymbol);
              if (newsAsset) {
                chosenAsset = newsAsset;
                if (nextNewsEvent.type === 'positive' || nextNewsEvent.type === 'whale') {
                  action = 'buy'; // Buy positive news!
                } else if (nextNewsEvent.type === 'negative') {
                  action = 'sell'; // Sell bad news!
                }
              }
            }

            if (action === 'buy') {
              // Bots can buy larger or smaller quantities depending on asset price
              const maxAffordable = Math.floor(botPlayer.balance / chosenAsset.price);
              if (maxAffordable > 0) {
                const qty = Math.min(maxAffordable, Math.floor(Math.random() * 8) + 1);
                const cost = chosenAsset.price * qty;
                
                const currentHolding = botPlayer.holdings[chosenAsset.symbol] || { quantity: 0, avgBuyPrice: 0 };
                const newQuantity = currentHolding.quantity + qty;
                const totalCost = (currentHolding.quantity * currentHolding.avgBuyPrice) + cost;
                const newAvgBuyPrice = totalCost / newQuantity;

                botPlayer.balance -= cost;
                botPlayer.holdings[chosenAsset.symbol] = {
                  quantity: newQuantity,
                  avgBuyPrice: newAvgBuyPrice
                };
                playersChanged = true;
              }
            } else {
              // Sell holdings
              const currentHolding = botPlayer.holdings[chosenAsset.symbol];
              if (currentHolding && currentHolding.quantity > 0) {
                const qty = Math.min(currentHolding.quantity, Math.floor(Math.random() * currentHolding.quantity) + 1);
                const revenue = chosenAsset.price * qty;
                const newQuantity = currentHolding.quantity - qty;

                botPlayer.balance += revenue;
                if (newQuantity === 0) {
                  delete botPlayer.holdings[chosenAsset.symbol];
                } else {
                  botPlayer.holdings[chosenAsset.symbol] = {
                    ...currentHolding,
                    quantity: newQuantity
                  };
                }
                playersChanged = true;
              } else if (Math.random() < 0.2) {
                // High quality bots sometimes open short positions!
                // To keep schema simple, they just buy/sell another asset instead of doing nothing
              }
            }

            // Recalculate netWorth for leaderboard
            const holdingsValue = Object.entries(botPlayer.holdings).reduce((total, [sym, h]: [string, any]) => {
              const a = nextAssets.find(st => st.symbol === sym);
              if (!a) return total;
              return total + (a.price * h.quantity);
            }, 0);
            botPlayer.netWorth = botPlayer.balance + holdingsValue;

            return botPlayer;
          });

          // Funny Turkish Trader Bot Chat Messages!
          let updatedMessages = [...(activeLobby.messages || [])];
          let messagesChanged = false;

          // 30% chance on each tick (every 3s) for a bot to send a message
          if (Math.random() < 0.3) {
            const bots = updatedPlayers.filter(p => p.isBot);
            if (bots.length > 0) {
              const randomBot = bots[Math.floor(Math.random() * bots.length)];
              let botText = "";

              if (nextNewsEvent && Math.random() < 0.5) {
                // Comment on the latest news event!
                const isPositive = nextNewsEvent.type === 'positive' || nextNewsEvent.type === 'whale';
                if (isPositive) {
                  const options = [
                    `${nextNewsEvent.targetSymbol} roket oldu gidiyor! Son saniyede alanlar ihya oldu! 🚀`,
                    `KAP haberi harika geldi, ${nextNewsEvent.targetSymbol} dev yatırım açıklayacak diyordum inanmıyordunuz!`,
                    `${nextNewsEvent.targetSymbol} tavan tavan gidecek tavan! Tutabilene aşk olsun. 🔥`,
                    `Warrent Buffett taktiği budur abi, ${nextNewsEvent.targetSymbol} uçuşa hazır!`,
                    `Ah be keşke daha fazla ${nextNewsEvent.targetSymbol} alsaydım beyler, tren kalktı.`
                  ];
                  botText = options[Math.floor(Math.random() * options.length)];
                } else {
                  const options = [
                    `Eyvah eyvah, ${nextNewsEvent.targetSymbol} çakıldı! Kol bacak kestik valla... 😭`,
                    `${nextNewsEvent.targetSymbol} haberiyle SHORT pozisyonlar ihya oldu, yine terste kaldık.`,
                    `${nextNewsEvent.targetSymbol} niye düşüyor yahu manipülasyon var kesin, SPK nerede?! 🚨`,
                    `Düşerken ${nextNewsEvent.targetSymbol} topluyordum ama dip neresiymiş bulamadım, batıyoruz sanırım.`,
                    `Böyle kötü haber mi olur abi, ${nextNewsEvent.targetSymbol} alanlar geçmiş olsun.`
                  ];
                  botText = options[Math.floor(Math.random() * options.length)];
                }
              } else {
                // General Turkish Stock Market slang / trader humor
                const slangs = [
                  "SASA uçacak, yazın kenara tavan serisi başlıyor! 🚀",
                  "Gene tepeden aldık herhalde, niye düşüyor bu yahu?",
                  "Zarar kes falan hikaye, beklemesini bilen zengin olur buralarda.",
                  "Düşüşler benim için sadece alım fırsatıdır arkadaşlar 😎",
                  "Açığa satanlar (Short) patladı mı? Oh olsun, borsada short açılmaz!",
                  "Gümüş tavan yapınca bana haber verin, gidip uyuyacağım biraz.",
                  "Altın her zaman güvenli limandır aga, gerisi yalan.",
                  "Kim satıyor olm bu fiyattan? Bedava fiyata gelmiş!",
                  "Tepeden aldık dipten sattık çok şükür, borsa fatihiyiz.",
                  "Biri bana acil tüyo versin, tüm nakit boşta duruyor yahu. 🤔",
                  "Varlıklarım eriyor göz göre göre, kurtarın beni!",
                  "TradeBot derler adıma, piyasaya tek başıma yön veririm!"
                ];
                botText = slangs[Math.floor(Math.random() * slangs.length)];
              }

              const newBotMessage = {
                id: Math.random().toString(36).substring(2, 9),
                senderUid: randomBot.uid,
                senderName: randomBot.name,
                senderAvatar: randomBot.avatar,
                text: botText,
                timestamp: Date.now()
              };
              updatedMessages = [...updatedMessages, newBotMessage].slice(-50); // Keep last 50
              messagesChanged = true;
            }
          }

          // Write updated game state to Firestore (instantly syncing all players and guests)
          try {
            const lobbyRef = doc(db, 'lobbies', activeLobby.id);
            await updateDoc(lobbyRef, {
              assets: nextAssets,
              news: nextNews,
              players: updatedPlayers,
              ...(messagesChanged ? { messages: updatedMessages } : {})
            });
          } catch (error) {
            console.error("Lobby price sync failed:", error);
          }
        }
      } else {
        // Singleplayer Mode
        let newNewsEvent: NewsEvent | null = null;

        setAssets(currentAssets => {
          newNewsEvent = generateNews(currentAssets);
          
          return currentAssets.map(asset => {
            let newsImpact = 0;
            if (newNewsEvent && newNewsEvent.targetSymbol === asset.symbol) {
              newsImpact = newNewsEvent.impact;
            }
            
            const newPrice = getNextPrice(asset.price, asset.volatility, newsImpact);
            const newHistory = [...asset.history, newPrice].slice(-30); // Keep last 30 points
            return { ...asset, price: newPrice, history: newHistory };
          });
        });
        
        if (newNewsEvent) {
          setNews(prev => [newNewsEvent as NewsEvent, ...prev].slice(0, 5));
        }
      }

    }, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, [activeLobby, assets, user]);

  // Dividends effect (Only in singleplayer, or handles active local user portfolio)
  useEffect(() => {
    if (tickCount > 0 && tickCount % 10 === 0) { // Every 10 ticks (30 seconds)
      // Only singleplayer handles local portfolio dividends
      if (!activeLobby || activeLobby.status !== 'playing') {
        setPortfolio(prev => {
          let dividendTotal = 0;
          (Object.entries(prev.holdings) as [string, Holding][]).forEach(([symbol, holding]) => {
            if (holding.quantity > 0) {
               const asset = assets.find(a => a.symbol === symbol);
               if (asset && asset.dividendYield) {
                 dividendTotal += asset.price * holding.quantity * asset.dividendYield;
               }
            }
          });
          
          if (dividendTotal > 0) {
             return {
               ...prev,
               balance: prev.balance + dividendTotal
             };
          }
          return prev;
        });
      }
    }
  }, [tickCount, assets, activeLobby]);

  // Level and Order Execution
  useEffect(() => {
    setPortfolio(prev => {
      let hasChanges = false;
      let newBalance = prev.balance;
      let newHoldings = { ...prev.holdings };
      let newOrders = prev.orders ? [...prev.orders] : [];
      let newLevel = prev.level || 1;

      // 1. Process limit orders
      for (let i = newOrders.length - 1; i >= 0; i--) {
        const order = newOrders[i];
        const asset = assets.find(a => a.symbol === order.symbol);
        if (!asset) continue;

        let executed = false;
        if (order.type === 'take_profit' && asset.price >= order.targetPrice) {
          executed = true;
        } else if (order.type === 'stop_loss' && asset.price <= order.targetPrice) {
          executed = true;
        } else if (order.type === 'buy' && asset.price <= order.targetPrice) {
          executed = true;
        } else if (order.type === 'sell' && asset.price >= order.targetPrice) {
          executed = true;
        }

        if (executed) {
          hasChanges = true;
          const costOrRevenue = asset.price * order.quantity;
          
          if (order.type === 'buy') {
            if (newBalance >= costOrRevenue) {
              newBalance -= costOrRevenue;
              const currentHolding = newHoldings[order.symbol] || { quantity: 0, avgBuyPrice: 0 };
              const totalCost = (currentHolding.quantity * currentHolding.avgBuyPrice) + costOrRevenue;
              newHoldings[order.symbol] = {
                quantity: currentHolding.quantity + order.quantity,
                avgBuyPrice: currentHolding.quantity >= 0 ? totalCost / (currentHolding.quantity + order.quantity) : asset.price
              };
            }
          } else {
            const currentHolding = newHoldings[order.symbol];
            if (currentHolding && currentHolding.quantity >= order.quantity) {
              newBalance += costOrRevenue;
              const newQuantity = currentHolding.quantity - order.quantity;
              if (newQuantity === 0) {
                delete newHoldings[order.symbol];
              } else {
                newHoldings[order.symbol] = { ...currentHolding, quantity: newQuantity };
              }
            }
          }
          // Remove executed order
          newOrders.splice(i, 1);
        }
      }

      // 2. Level calculation based on Net Worth
      const currentNetWorth = newBalance + (Object.entries(newHoldings) as [string, Holding][]).reduce((total, [symbol, holding]) => {
        const asset = assets.find(s => s.symbol === symbol);
        if (!asset) return total;
        return total + (asset.price * holding.quantity);
      }, 0);

      let calculatedLevel = 1;
      if (currentNetWorth >= 1000000) calculatedLevel = 50;
      else if (currentNetWorth >= 500000) calculatedLevel = 40;
      else if (currentNetWorth >= 250000) calculatedLevel = 30;
      else if (currentNetWorth >= 100000) calculatedLevel = 20;
      else if (currentNetWorth >= 50000) calculatedLevel = 10;
      else if (currentNetWorth >= 20000) calculatedLevel = 5;
      else if (currentNetWorth >= 15000) calculatedLevel = 2;

      if (calculatedLevel > newLevel) {
        newLevel = calculatedLevel;
        hasChanges = true;
      }

      if (hasChanges) {
        return { ...prev, balance: newBalance, holdings: newHoldings, orders: newOrders, level: newLevel };
      }
      return prev;
    });
  }, [assets]);

  // Save portfolio to local storage
  useEffect(() => {
    localStorage.setItem('trading-game-portfolio', JSON.stringify(portfolio));
  }, [portfolio]);

  // Dynamically swap portfolio depending on whether we are in an active multiplayer game
  const currentPortfolio = useMemo<Portfolio>(() => {
    if (activeLobby && activeLobby.status === 'playing' && user) {
      const myPlayerObj = activeLobby.players?.find((p: any) => p.uid === user.uid);
      if (myPlayerObj) {
        return {
          balance: myPlayerObj.balance !== undefined ? myPlayerObj.balance : INITIAL_BALANCE,
          holdings: myPlayerObj.holdings || {},
          orders: myPlayerObj.orders || [],
          level: portfolio.level || 1
        };
      }
    }
    return portfolio;
  }, [activeLobby, portfolio, user]);

  const getPortfolioValue = (p: Portfolio = currentPortfolio, a: Asset[] = assets) => {
    return Object.entries(p.holdings).reduce((total, [symbol, holding]) => {
      const asset = a.find(s => s.symbol === symbol);
      if (!asset) return total;
      return total + (asset.price * holding.quantity);
    }, 0);
  };

  const handleBuy = async (symbol: string, quantity: number, orderType?: 'buy', targetPrice?: number) => {
    const asset = assets.find(s => s.symbol === symbol);
    if (!asset) return;

    // MULTIPLAYER HANDLER
    if (activeLobby && activeLobby.status === 'playing' && user) {
      try {
        const lobbyRef = doc(db, 'lobbies', activeLobby.id);
        const players = [...(activeLobby.players || [])];
        const myIdx = players.findIndex(p => p.uid === user.uid);
        if (myIdx === -1) return;

        const myPlayer = { ...players[myIdx] };
        if (myPlayer.balance === undefined) myPlayer.balance = INITIAL_BALANCE;
        if (!myPlayer.holdings) myPlayer.holdings = {};

        const cost = asset.price * quantity;
        if (myPlayer.balance >= cost) {
          const currentHolding = myPlayer.holdings[symbol] || { quantity: 0, avgBuyPrice: 0 };
          const newQuantity = currentHolding.quantity + quantity;
          let newAvgBuyPrice = currentHolding.avgBuyPrice;

          if (currentHolding.quantity >= 0) {
            const totalCost = (currentHolding.quantity * currentHolding.avgBuyPrice) + cost;
            newAvgBuyPrice = totalCost / newQuantity;
          } else if (newQuantity > 0) {
            newAvgBuyPrice = asset.price;
          }

          myPlayer.balance -= cost;
          myPlayer.holdings[symbol] = {
            quantity: newQuantity,
            avgBuyPrice: newAvgBuyPrice
          };

          // Recompute netWorth for real-time ranking
          const holdingsValue = Object.entries(myPlayer.holdings).reduce((total, [sym, h]: [string, any]) => {
            const a = assets.find(st => st.symbol === sym);
            if (!a) return total;
            return total + (a.price * h.quantity);
          }, 0);
          myPlayer.netWorth = myPlayer.balance + holdingsValue;

          players[myIdx] = myPlayer;
          await updateDoc(lobbyRef, { players });
        } else {
          alert("Yetersiz bakiye!");
        }
      } catch (error) {
        console.error("Multiplayer buy error:", error);
      }
      return;
    }

    // SINGLEPLAYER HANDLER
    if (orderType === 'buy' && targetPrice) {
      setPortfolio(prev => ({
        ...prev,
        orders: [...(prev.orders || []), { id: Math.random().toString(), symbol, type: orderType, targetPrice, quantity }]
      }));
      return;
    }

    const cost = asset.price * quantity;
    if (portfolio.balance >= cost) {
      setPortfolio(prev => {
        const currentHolding = prev.holdings[symbol] || { quantity: 0, avgBuyPrice: 0 };
        
        const newQuantity = currentHolding.quantity + quantity;
        let newAvgBuyPrice = currentHolding.avgBuyPrice;
        
        if (currentHolding.quantity >= 0) {
          const totalCost = (currentHolding.quantity * currentHolding.avgBuyPrice) + cost;
          newAvgBuyPrice = totalCost / newQuantity;
        } else if (newQuantity > 0) {
          newAvgBuyPrice = asset.price;
        }

        return {
          ...prev,
          balance: prev.balance - cost,
          holdings: {
            ...prev.holdings,
            [symbol]: {
              quantity: newQuantity,
              avgBuyPrice: newAvgBuyPrice
            }
          }
        };
      });
    } else {
      alert("Yetersiz bakiye!");
    }
  };

  const handleSell = async (symbol: string, quantity: number, orderType?: 'sell' | 'stop_loss' | 'take_profit', targetPrice?: number) => {
    const asset = assets.find(s => s.symbol === symbol);
    if (!asset) return;

    // MULTIPLAYER HANDLER
    if (activeLobby && activeLobby.status === 'playing' && user) {
      try {
        const lobbyRef = doc(db, 'lobbies', activeLobby.id);
        const players = [...(activeLobby.players || [])];
        const myIdx = players.findIndex(p => p.uid === user.uid);
        if (myIdx === -1) return;

        const myPlayer = { ...players[myIdx] };
        if (myPlayer.balance === undefined) myPlayer.balance = INITIAL_BALANCE;
        if (!myPlayer.holdings) myPlayer.holdings = {};

        const revenue = asset.price * quantity;
        const currentHolding = myPlayer.holdings[symbol] || { quantity: 0, avgBuyPrice: 0 };
        const newQuantity = currentHolding.quantity - quantity;

        if (newQuantity < 0 && myPlayer.balance < asset.price * Math.abs(newQuantity)) {
          alert("Açığa satış (Shorting) için yeterli teminatınız (nakit) yok!");
          return;
        }

        let newAvgBuyPrice = currentHolding.avgBuyPrice;
        if (currentHolding.quantity <= 0) {
          const totalShortValue = (Math.abs(currentHolding.quantity) * currentHolding.avgBuyPrice) + revenue;
          newAvgBuyPrice = totalShortValue / Math.abs(newQuantity);
        } else if (newQuantity < 0) {
          newAvgBuyPrice = asset.price;
        }

        myPlayer.balance += revenue;
        if (newQuantity === 0) {
          delete myPlayer.holdings[symbol];
        } else {
          myPlayer.holdings[symbol] = {
            quantity: newQuantity,
            avgBuyPrice: newAvgBuyPrice
          };
        }

        // Recompute netWorth for real-time ranking
        const holdingsValue = Object.entries(myPlayer.holdings).reduce((total, [sym, h]: [string, any]) => {
          const a = assets.find(st => st.symbol === sym);
          if (!a) return total;
          return total + (a.price * h.quantity);
        }, 0);
        myPlayer.netWorth = myPlayer.balance + holdingsValue;

        players[myIdx] = myPlayer;
        await updateDoc(lobbyRef, { players });
      } catch (error) {
        console.error("Multiplayer sell error:", error);
      }
      return;
    }

    // SINGLEPLAYER HANDLER
    if (orderType && targetPrice) {
      setPortfolio(prev => ({
        ...prev,
        orders: [...(prev.orders || []), { id: Math.random().toString(), symbol, type: orderType, targetPrice, quantity }]
      }));
      return;
    }

    const revenue = asset.price * quantity;
    
    setPortfolio(prev => {
      const currentHolding = prev.holdings[symbol] || { quantity: 0, avgBuyPrice: 0 };
      const newQuantity = currentHolding.quantity - quantity;
      
      if (newQuantity < 0 && prev.balance < asset.price * Math.abs(newQuantity)) {
        alert("Açığa satış (Shorting) için yeterli teminatınız (nakit) yok!");
        return prev;
      }
      
      let newAvgBuyPrice = currentHolding.avgBuyPrice;
      if (currentHolding.quantity <= 0) {
        const totalShortValue = (Math.abs(currentHolding.quantity) * currentHolding.avgBuyPrice) + revenue;
        newAvgBuyPrice = totalShortValue / Math.abs(newQuantity);
      } else if (newQuantity < 0) {
        newAvgBuyPrice = asset.price;
      }

      const newHoldings = { ...prev.holdings };
      if (newQuantity === 0) {
        delete newHoldings[symbol];
      } else {
        newHoldings[symbol] = {
          quantity: newQuantity,
          avgBuyPrice: newAvgBuyPrice
        };
      }

      return {
        ...prev,
        balance: prev.balance + revenue,
        holdings: newHoldings
      };
    });
  };

  const netWorth = currentPortfolio.balance + getPortfolioValue();

  // Reset assets and news to initial values when switching back to singleplayer mode
  useEffect(() => {
    if (gameMode === 'single') {
      setAssets(INITIAL_ASSETS);
      setNews([]);
    }
  }, [gameMode]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between h-16 items-center overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 pr-4 shrink-0">
              <div className="bg-blue-600 p-2 rounded-lg relative">
                <Activity className="w-5 h-5 text-white" />
                <span className="absolute -bottom-2 -right-2 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white shadow-sm">
                  Lvl {currentPortfolio.level || 1}
                </span>
              </div>
              <span className="font-bold text-xl tracking-tight text-gray-900 ml-1">BorsaSim</span>
            </div>
            
            <div className="flex space-x-1 sm:space-x-2 shrink-0 overflow-x-auto no-scrollbar items-center">
              {/* Tek Oyunculu Mod Aktifleştirici */}
              <button
                onClick={handleSwitchToSingle}
                className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  gameMode === 'single'
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Tek Oyunculu Çevrimdışı Mod"
              >
                <User className="w-4 h-4" />
                Tek Oyunculu
              </button>

              {/* Çok Oyunculu Mod Aktifleştirici */}
              <button
                onClick={handleSwitchToMulti}
                className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'multiplayer'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Çok Oyunculu Lobi Modu"
              >
                <Users className="w-4 h-4" />
                Çok Oyunculu
              </button>

              <div className="h-6 w-px bg-gray-200 mx-1 sm:mx-2 shrink-0" />

              <button
                onClick={() => setActiveTab('trade')}
                className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'trade'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                Piyasa & İşlemler
              </button>

              <button
                onClick={() => setActiveTab('leaderboard')}
                className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'leaderboard'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Trophy className="w-4 h-4 hidden sm:block" />
                Sıralama
              </button>

              {isAdmin && <button
                onClick={() => setActiveTab('roadmap')}
                className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'roadmap'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Map className="w-4 h-4 hidden sm:block" />
                Güncellemeler
              </button>}
              {isAdmin && <button
                onClick={() => setActiveTab('rules')}
                className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'rules'
                    ? 'bg-red-50 text-red-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <ShieldAlert className="w-4 h-4 hidden sm:block" />
                  Kurallar
                </button>}
              {isAdmin && <button
                onClick={() => setActiveTab('export')}
                className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'export'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Download className="w-4 h-4 hidden sm:block" />
                İndir & Yayınla
              </button>}
            </div>
          </div>
        </div>
      </nav>

      {/* Active Game Mode Status Banner */}
      <div className={`py-2 px-4 text-center text-sm font-medium transition-all shadow-inner ${
        gameMode === 'multi' 
          ? 'bg-gradient-to-r from-indigo-700 to-blue-700 text-white' 
          : 'bg-gradient-to-r from-green-700 to-emerald-700 text-white'
      }`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-white rounded-full animate-pulse inline-block"></span>
            <span>
              {gameMode === 'multi' 
                ? `Çok Oyunculu Mod Aktif (${activeLobby?.name || 'Lobi'})` 
                : 'Tek Oyunculu Mod Aktif (Çevrimdışı Borsa)'}
            </span>
          </div>
          <span className="text-xs bg-white/20 px-2.5 py-1 rounded font-semibold">
            {gameMode === 'multi' ? 'Lobi Portföyü & Lobi Sıralaması' : 'Kişisel Portföy & Global Sıralama'}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <main className="pt-6 animate-fade-in">
        {activeTab === 'trade' && (
          <TradingView 
            activeLobby={gameMode === 'single' ? null : activeLobby}
            assets={assets} 
            portfolio={currentPortfolio} 
            news={news}
            onBuy={handleBuy} 
            onSell={handleSell}
            onCancelOrder={(id) => {
              setPortfolio(prev => ({
                ...prev,
                orders: prev.orders.filter(o => o.id !== id)
              }))
            }}
          />
        )}
        <div className={activeTab === 'multiplayer' ? 'block' : 'hidden'}>
          <MultiplayerView 
            onGoToTrade={() => setActiveTab('trade')} 
            currentNetWorth={netWorth}
            onActiveLobbyChange={setActiveLobby}
          />
        </div>
        {activeTab === 'leaderboard' && (
          <LeaderboardView 
            netWorth={netWorth} 
            activeLobby={gameMode === 'single' ? null : activeLobby} 
          />
        )}
        {activeTab === 'roadmap' && (
          <RoadmapView />
        )}
        {activeTab === 'rules' && (
          <FirebaseRulesView />
        )}
        {activeTab === 'export' && (
          <ExportView />
        )}
      </main>
    </div>
  );
}
