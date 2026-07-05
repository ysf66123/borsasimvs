import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Wallet, Activity, Briefcase, Newspaper, TrendingUp, TrendingDown, Bell, X, Users } from 'lucide-react';
import { Asset, Portfolio, NewsEvent } from '../types';

interface TradingViewProps {
  activeLobby?: any;
  assets: Asset[];
  portfolio: Portfolio;
  news: NewsEvent[];
  onBuy: (symbol: string, quantity: number, orderType?: 'buy', targetPrice?: number) => void;
  onSell: (symbol: string, quantity: number, orderType?: 'sell' | 'stop_loss' | 'take_profit', targetPrice?: number) => void;
  onCancelOrder: (id: string) => void;
}

export default function TradingView({ activeLobby, assets, portfolio, news, onBuy, onSell, onCancelOrder }: TradingViewProps) {
  const [selectedSymbol, setSelectedSymbol] = useState<string>(assets[0].symbol);
  const [tradeAmount, setTradeAmount] = useState<string>("1");
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop_loss' | 'take_profit'>('market');
  const [targetPrice, setTargetPrice] = useState<string>("");
  const [leftTab, setLeftTab] = useState<'markets' | 'portfolio'>('markets');
  const [mobileView, setMobileView] = useState<'markets' | 'chart' | 'trade'>('markets');

  const selectedStock = assets.find(s => s.symbol === selectedSymbol) || assets[0];
  const holding = portfolio.holdings[selectedSymbol];
  
  const getPortfolioValue = () => {
    return Object.entries(portfolio.holdings).reduce((total, [symbol, holding]) => {
      const stock = assets.find(s => s.symbol === symbol);
      return total + (stock ? stock.price * holding.quantity : 0);
    }, 0);
  };

  const portfolioValue = getPortfolioValue();
  const netWorth = portfolio.balance + portfolioValue;

  const handleBuyClick = () => {
    const qty = parseInt(tradeAmount);
    if (!isNaN(qty) && qty > 0) {
      if (orderType === 'market') {
        onBuy(selectedSymbol, qty);
      } else if (orderType === 'limit') {
        const tp = parseFloat(targetPrice);
        if (!isNaN(tp) && tp > 0) onBuy(selectedSymbol, qty, 'buy', tp);
      }
      setTradeAmount("1");
      setTargetPrice("");
      setOrderType('market');
    }
  };

  const handleSellClick = () => {
    const qty = parseInt(tradeAmount);
    if (!isNaN(qty) && qty > 0) {
      if (orderType === 'market') {
        onSell(selectedSymbol, qty);
      } else {
        const tp = parseFloat(targetPrice);
        if (!isNaN(tp) && tp > 0) {
          onSell(selectedSymbol, qty, orderType === 'limit' ? 'sell' : orderType, tp);
        }
      }
      setTradeAmount("1");
      setTargetPrice("");
      setOrderType('market');
    }
  };

  // Quick percentage calculation shortcuts (e.g. Robinhood/Binance style)
  const handlePercentSelect = (percent: number, actionType: 'buy' | 'sell') => {
    if (actionType === 'buy') {
      const maxBuyQty = Math.floor(portfolio.balance / selectedStock.price);
      if (maxBuyQty > 0) {
        const targetQty = Math.floor(maxBuyQty * (percent / 100));
        setTradeAmount(Math.max(1, targetQty).toString());
      } else {
        setTradeAmount("0");
      }
    } else {
      const holdingQty = holding ? holding.quantity : 0;
      if (holdingQty > 0) {
        const targetQty = Math.floor(holdingQty * (percent / 100));
        setTradeAmount(Math.max(1, targetQty).toString());
      } else {
        setTradeAmount("0");
      }
    }
  };

  const chartData = useMemo(() => {
    return selectedStock.history.map((price, index) => ({
      time: index,
      price: price
    }));
  }, [selectedStock.history]);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 pb-20">
      
      {/* Multiplayer Status */}
      {activeLobby && activeLobby.status === 'playing' && (
        <div className="mb-6 bg-gradient-to-r from-indigo-900 to-blue-900 rounded-xl overflow-hidden shadow-sm p-4 text-white border border-indigo-800">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              {activeLobby.name}
            </h3>
            <span className="text-[10px] bg-white/10 px-2 py-1 rounded font-mono font-bold tracking-wider">KOD: {activeLobby.roomCode}</span>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            {activeLobby.players?.slice().sort((a,b) => (b.netWorth || 10000) - (a.netWorth || 10000)).map((p, i) => (
              <div key={p.uid} className="bg-white/10 rounded-lg p-3 min-w-[140px] shrink-0 border border-white/5 flex flex-col">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-xs text-indigo-200 font-medium truncate pr-2">{i + 1}. {p.name}</p>
                  {i === 0 && <span className="text-yellow-400 text-xs">👑</span>}
                </div>
                <p className="font-bold text-sm">${(p.netWorth || 10000).toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* News Ticker */}
      {news.length > 0 && (
        <div className="mb-6 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex">
          <div className="bg-blue-600 text-white px-4 py-3 flex items-center gap-2 font-semibold shrink-0">
            <Newspaper className="w-5 h-5" />
            <span>Son Haberler</span>
          </div>
          <div className="overflow-hidden relative w-full flex items-center bg-gray-50/50">
            <div className="animate-marquee whitespace-nowrap px-4 flex gap-8 items-center">
              {news.map((n) => (
                <span key={n.id} className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold text-white ${n.type === 'positive' ? 'bg-emerald-500' : n.type === 'whale' ? 'bg-purple-600' : 'bg-red-500'}`}>
                    {n.targetSymbol}
                  </span>
                  {n.message}
                  {n.type === 'positive' ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : n.type === 'whale' ? <Activity className="w-4 h-4 text-purple-600" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Premium Luxury Wallet Card for Mobile Display */}
      <div className="block md:hidden mb-6 bg-gradient-to-tr from-gray-900 via-slate-900 to-indigo-950 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-blue-500/10 rounded-full blur-xl"></div>
        
        <div className="flex justify-between items-center mb-4">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-indigo-300">Portföy Özeti</span>
          <div className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-[9px] font-mono font-bold text-indigo-200">
            HESAP DETAYI
          </div>
        </div>
        
        <p className="text-[11px] font-medium text-indigo-200/85">Toplam Net Değer</p>
        <p className="text-3xl font-extrabold tracking-tight text-white mt-0.5">${netWorth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        
        <div className="grid grid-cols-2 gap-4 mt-5 pt-4 border-t border-white/10">
          <div>
            <p className="text-[10px] text-indigo-300 font-medium">Kullanılabilir Bakiye</p>
            <p className="font-bold text-base mt-0.5 text-white">${portfolio.balance.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
          </div>
          <div>
            <p className="text-[10px] text-indigo-300 font-medium">Hisse Portföy Değeri</p>
            <p className={`font-bold text-base mt-0.5 ${portfolioValue < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              ${portfolioValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Desktop Top Stats Cards */}
      <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Nakit Bakiye</p>
            <p className="text-2xl font-bold text-gray-900">${portfolio.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Portföy Değeri</p>
            <p className={`text-2xl font-bold ${portfolioValue < 0 ? 'text-red-500' : 'text-gray-900'}`}>
              ${portfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Toplam Net Değer</p>
            <p className="text-2xl font-bold text-gray-900">${netWorth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      {/* Mobile Premium Tab bar for instant action-swapping without scrolling */}
      <div className="flex lg:hidden bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-gray-150 shadow-sm mb-5 sticky top-[64px] z-20">
        <button
          onClick={() => setMobileView('markets')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            mobileView === 'markets'
              ? 'bg-blue-600 text-white shadow-sm font-extrabold scale-[1.02]'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Piyasalar
        </button>
        <button
          onClick={() => setMobileView('chart')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            mobileView === 'chart'
              ? 'bg-blue-600 text-white shadow-sm font-extrabold scale-[1.02]'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Activity className="w-4 h-4" />
          Grafik ({selectedStock.symbol})
        </button>
        <button
          onClick={() => setMobileView('trade')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            mobileView === 'trade'
              ? 'bg-blue-600 text-white shadow-sm font-extrabold scale-[1.02]'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Wallet className="w-4 h-4" />
          Hızlı Al/Sat
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Column 1: Asset List (Markets/Portfolio) */}
        <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${mobileView === 'markets' ? 'block' : 'hidden lg:block'}`}>
          <div className="flex border-b border-gray-100 bg-gray-50/50">
            <button 
              onClick={() => setLeftTab('markets')}
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${leftTab === 'markets' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Piyasalar
            </button>
            <button 
              onClick={() => setLeftTab('portfolio')}
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${leftTab === 'portfolio' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Varlıklarım
            </button>
          </div>
          <div className="divide-y divide-gray-50 h-[550px] overflow-y-auto no-scrollbar">
            {leftTab === 'markets' ? (
              assets.map(asset => {
                const previousPrice = asset.history.length > 1 ? asset.history[asset.history.length - 2] : asset.price;
                const isUp = asset.price >= previousPrice;
                const percentChange = previousPrice > 0 ? ((asset.price - previousPrice) / previousPrice * 100).toFixed(2) : "0.00";

                return (
                  <button
                    key={asset.symbol}
                    onClick={() => {
                      setSelectedSymbol(asset.symbol);
                      // Auto switch to chart view on mobile to make it seamless
                      if (window.innerWidth < 1024) {
                        setMobileView('chart');
                      }
                    }}
                    className={`w-full text-left p-4 hover:bg-gray-50/70 transition-colors flex items-center justify-between ${selectedSymbol === asset.symbol ? 'bg-blue-50/50 border-l-4 border-blue-500' : 'border-l-4 border-transparent'}`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900">{asset.symbol}</p>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-medium uppercase">{asset.type}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{asset.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">${asset.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      <p className={`text-xs font-medium flex items-center justify-end gap-0.5 ${isUp ? 'text-emerald-500' : 'text-red-500'}`}>
                        {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {Math.abs(Number(percentChange))}%
                      </p>
                    </div>
                  </button>
                );
              })
            ) : (
              Object.entries(portfolio.holdings).length > 0 ? (
                Object.entries(portfolio.holdings).map(([symbol, holding]) => {
                  const asset = assets.find(a => a.symbol === symbol);
                  if (!asset || holding.quantity <= 0) return null;
                  
                  const value = asset.price * holding.quantity;
                  const previousPrice = asset.history.length > 1 ? asset.history[asset.history.length - 2] : asset.price;
                  const isUp = asset.price >= previousPrice;

                  return (
                    <button
                      key={symbol}
                      onClick={() => {
                        setSelectedSymbol(symbol);
                        if (window.innerWidth < 1024) {
                          setMobileView('chart');
                        }
                      }}
                      className={`w-full text-left p-4 hover:bg-gray-50 transition-colors flex items-center justify-between ${selectedSymbol === symbol ? 'bg-blue-50/50 border-l-4 border-blue-500' : 'border-l-4 border-transparent'}`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900">{symbol}</p>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 font-medium">{holding.quantity} Adet</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{asset.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <p className={`text-xs font-medium flex items-center justify-end gap-0.5 ${isUp ? 'text-emerald-500' : 'text-red-500'}`}>
                          ${asset.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="p-8 text-center text-gray-500 text-sm">
                  <Wallet className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Henüz hiçbir varlığınız bulunmuyor.</p>
                </div>
              )
            )}
          </div>
        </div>

        {/* Column 2 & 3: Chart & Trading Panel */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Chart Section */}
          <div className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-100 ${mobileView === 'chart' ? 'block' : 'hidden lg:block'}`}>
            <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  {selectedStock.name} ({selectedStock.symbol})
                  {selectedStock.dividendYield && (
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full flex items-center gap-1">
                      Temettü: {(selectedStock.dividendYield * 100).toFixed(1)}%
                    </span>
                  )}
                </h2>
                <p className="text-3xl font-bold mt-1">${selectedStock.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                
                {/* Fundamentals */}
                <div className="flex gap-4 mt-3 text-xs text-gray-500">
                  {selectedStock.marketCap && (
                    <div>Piyasa Değeri: <span className="font-semibold text-gray-700">{selectedStock.marketCap}</span></div>
                  )}
                  {selectedStock.peRatio && (
                    <div>F/K Oranı: <span className="font-semibold text-gray-700">{selectedStock.peRatio}</span></div>
                  )}
                  <div>Volatilite: <span className="font-semibold text-gray-700">%{(selectedStock.volatility * 100).toFixed(1)}</span></div>
                </div>
              </div>
              <div className="text-left sm:text-right bg-gray-50 p-3 rounded-xl border border-gray-100 min-w-[120px]">
                <p className="text-xs font-medium text-gray-500 mb-1">Pozisyon (Adet)</p>
                <p className={`text-xl font-bold ${holding && holding.quantity < 0 ? 'text-red-500' : 'text-gray-900'}`}>
                  {holding ? holding.quantity : 0} {holding && holding.quantity < 0 && '(Short)'}
                </p>
                {holding && holding.quantity !== 0 && (
                  <p className="text-xs text-gray-500 mt-1">Ort. Maliyet: ${holding.avgBuyPrice.toFixed(2)}</p>
                )}
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="time" hide />
                  <YAxis domain={['auto', 'auto']} tickFormatter={(value) => `$${value}`} stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Fiyat']}
                    labelFormatter={() => ''}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke={selectedStock.color} 
                    strokeWidth={3}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Trading Controls */}
          <div className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-100 ${mobileView === 'trade' ? 'block' : 'hidden lg:block'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">İşlem Yap</h3>
              <div className="flex gap-1.5 bg-gray-100 p-1 rounded-lg">
                <button onClick={() => setOrderType('market')} className={`px-2 py-1 text-[10px] sm:text-xs font-medium rounded-md transition-colors ${orderType === 'market' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Piyasa</button>
                <button onClick={() => setOrderType('limit')} className={`px-2 py-1 text-[10px] sm:text-xs font-medium rounded-md transition-colors ${orderType === 'limit' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Limit</button>
                <button onClick={() => setOrderType('stop_loss')} className={`px-2 py-1 text-[10px] sm:text-xs font-medium rounded-md transition-colors ${orderType === 'stop_loss' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Stop-Loss</button>
                <button onClick={() => setOrderType('take_profit')} className={`px-2 py-1 text-[10px] sm:text-xs font-medium rounded-md transition-colors ${orderType === 'take_profit' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Kar Al</button>
              </div>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-xs">Miktar:</span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={tradeAmount}
                    onChange={(e) => setTradeAmount(e.target.value)}
                    className="w-full pl-16 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="0"
                  />
                </div>
                
                {orderType !== 'market' && (
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-xs">Fiyat $:</span>
                    </div>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={targetPrice}
                      onChange={(e) => setTargetPrice(e.target.value)}
                      className="w-full pl-16 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      placeholder={selectedStock.price.toFixed(2)}
                    />
                  </div>
                )}
              </div>

              {/* Robinhood/Binance-style Quick Percent Shortcuts! */}
              <div className="flex flex-col gap-1.5 bg-gray-50 p-2.5 rounded-xl border border-gray-150">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Hızlı Miktar Belirle:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePercentSelect(25, 'buy')}
                    className="flex-1 py-1.5 text-[10px] font-bold bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-lg transition-all"
                  >
                    %25 Al
                  </button>
                  <button
                    onClick={() => handlePercentSelect(50, 'buy')}
                    className="flex-1 py-1.5 text-[10px] font-bold bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-lg transition-all"
                  >
                    %50 Al
                  </button>
                  <button
                    onClick={() => handlePercentSelect(100, 'buy')}
                    className="flex-1 py-1.5 text-[10px] font-bold bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-lg transition-all"
                  >
                    MAX Al
                  </button>
                  <div className="w-px bg-gray-200 my-1"></div>
                  <button
                    onClick={() => handlePercentSelect(50, 'sell')}
                    disabled={!holding || holding.quantity <= 0}
                    className="flex-1 py-1.5 text-[10px] font-bold bg-white hover:bg-gray-100 border border-gray-200 text-red-600 rounded-lg transition-all disabled:opacity-40"
                  >
                    %50 Sat
                  </button>
                  <button
                    onClick={() => handlePercentSelect(100, 'sell')}
                    disabled={!holding || holding.quantity <= 0}
                    className="flex-1 py-1.5 text-[10px] font-bold bg-white hover:bg-gray-100 border border-gray-200 text-red-600 rounded-lg transition-all disabled:opacity-40"
                  >
                    MAX Sat
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                {orderType !== 'stop_loss' && orderType !== 'take_profit' && (
                  <button
                    onClick={handleBuyClick}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors shadow-sm"
                  >
                    {orderType === 'limit' ? 'Alış Emri Gir' : (holding && holding.quantity < 0 ? 'Kapat (Al)' : 'Satın Al')}
                  </button>
                )}
                
                <button
                  onClick={handleSellClick}
                  className={`flex-1 ${orderType === 'stop_loss' || orderType === 'take_profit' ? 'w-full' : ''} bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors shadow-sm`}
                >
                  {orderType === 'limit' ? 'Satış Emri Gir' : orderType === 'stop_loss' ? 'Zarar Kes (Stop-Loss) Kur' : orderType === 'take_profit' ? 'Kar Al (Take-Profit) Kur' : (holding && holding.quantity > 0 ? 'Sat' : 'Açığa Sat (Short)')}
                </button>
              </div>
            </div>
            
            <div className="mt-4 flex justify-between text-sm text-gray-500">
              <span>{orderType === 'market' ? 'İşlem Hacmi:' : 'Emir Büyüklüğü:'}</span>
              <span className="font-medium text-gray-900">
                ${(!isNaN(parseInt(tradeAmount)) ? parseInt(tradeAmount) * (orderType === 'market' ? selectedStock.price : parseFloat(targetPrice) || selectedStock.price) : 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Active Orders List */}
          {portfolio.orders && portfolio.orders.filter(o => o.symbol === selectedSymbol).length > 0 && (
            <div className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-100 ${mobileView === 'trade' ? 'block' : 'hidden lg:block'}`}>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-500" />
                Aktif Bekleyen Emirler
              </h3>
              <div className="space-y-3">
                {portfolio.orders.filter(o => o.symbol === selectedSymbol).map(order => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                      <span className={`text-xs font-bold px-2 py-1 rounded mr-2 ${order.type === 'buy' ? 'bg-emerald-100 text-emerald-700' : order.type === 'sell' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        {order.type === 'buy' ? 'LİMİT AL' : order.type === 'sell' ? 'LİMİT SAT' : order.type === 'stop_loss' ? 'STOP-LOSS' : 'TAKE-PROFIT'}
                      </span>
                      <span className="font-medium text-gray-900">{order.quantity} Adet</span>
                      <span className="text-gray-500 text-sm ml-2">@ ${order.targetPrice.toFixed(2)}</span>
                    </div>
                    <button 
                      onClick={() => onCancelOrder(order.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Emri İptal Et"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
