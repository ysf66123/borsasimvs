import { Asset } from './types';

export const INITIAL_ASSETS: Asset[] = [
  // Stocks
  { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock', price: 150.00, history: [150.00], color: '#3b82f6', dividendYield: 0.005, volatility: 0.04, marketCap: '3.0T', peRatio: 28.5 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'stock', price: 2800.00, history: [2800.00], color: '#ef4444', volatility: 0.045, marketCap: '1.9T', peRatio: 25.2 },
  { symbol: 'TSLA', name: 'Tesla Inc.', type: 'stock', price: 700.00, history: [700.00], color: '#10b981', volatility: 0.08, marketCap: '800B', peRatio: 65.4 },
  { symbol: 'AMZN', name: 'Amazon.com', type: 'stock', price: 3300.00, history: [3300.00], color: '#f59e0b', volatility: 0.05, marketCap: '1.7T', peRatio: 40.1 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', type: 'stock', price: 300.00, history: [300.00], color: '#8b5cf6', dividendYield: 0.006, volatility: 0.035, marketCap: '2.8T', peRatio: 35.8 },
  // Crypto
  { symbol: 'BTC', name: 'Bitcoin', type: 'crypto', price: 45000.00, history: [45000.00], color: '#f97316', volatility: 0.12, marketCap: '900B' },
  { symbol: 'ETH', name: 'Ethereum', type: 'crypto', price: 3000.00, history: [3000.00], color: '#6366f1', volatility: 0.15, marketCap: '350B' },
  // Commodities
  { symbol: 'GOLD', name: 'Gold (XAU)', type: 'commodity', price: 1900.00, history: [1900.00], color: '#eab308', volatility: 0.02, marketCap: '13T' },
  { symbol: 'OIL', name: 'Crude Oil (WTI)', type: 'commodity', price: 75.00, history: [75.00], color: '#1f2937', volatility: 0.06 },
];

export const INITIAL_BALANCE = 10000;
