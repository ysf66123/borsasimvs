export type AssetType = 'stock' | 'crypto' | 'commodity';

export interface Asset {
  symbol: string;
  name: string;
  type: AssetType;
  price: number;
  history: number[];
  color: string;
  dividendYield?: number;
  volatility: number;
  marketCap?: string;
  peRatio?: number;
}

export interface Holding {
  quantity: number; // can be negative for shorting
  avgBuyPrice: number;
}

export interface LimitOrder {
  id: string;
  symbol: string;
  type: 'buy' | 'sell' | 'stop_loss' | 'take_profit';
  targetPrice: number;
  quantity: number;
}

export interface Portfolio {
  balance: number;
  holdings: Record<string, Holding>;
  orders: LimitOrder[];
  level: number;
}

export interface NewsEvent {
  id: string;
  targetSymbol: string;
  message: string;
  impact: number;
  type: 'positive' | 'negative' | 'whale';
  timestamp: number;
}


