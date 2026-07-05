import { Asset, NewsEvent } from './types';

export function getNextPrice(currentPrice: number, volatility: number, newsImpact: number = 0): number {
  const baseChangePercent = (Math.random() - 0.5) * 2 * volatility;
  // News impact shifts the change percent heavily
  const totalChangePercent = baseChangePercent + newsImpact;
  // Introduce a slight upward drift over time (0.2%)
  const drift = 0.002;
  const newPrice = currentPrice * (1 + totalChangePercent + drift);
  return Math.max(1, Number(newPrice.toFixed(2))); // Prevent price from going to 0 or negative
}

export function generateNews(assets: Asset[]): NewsEvent | null {
  if (Math.random() > 0.15) return null; // 15% chance of news per tick

  const asset = assets[Math.floor(Math.random() * assets.length)];
  
  // Whale Event
  if (Math.random() < 0.1) { // 10% of events are whale events
      const isBuy = Math.random() > 0.5;
      return {
          id: Math.random().toString(36).substring(7),
          targetSymbol: asset.symbol,
          message: `🚨 BALİNA HAREKETİ: ${asset.symbol} için yüklü miktarda ${isBuy ? 'alım' : 'satış'} yapıldı!`,
          impact: isBuy ? 0.15 : -0.15,
          type: 'whale',
          timestamp: Date.now()
      };
  }

  const isPositive = Math.random() > 0.5;
  
  const positiveNews = [
    `${asset.name} rekor kar açıkladı!`,
    `${asset.name} için yeni yatırım anlaşması imzalandı.`,
    `${asset.name} sektöründe liderliğe yükseliyor.`,
    `Analistler ${asset.name} için alım önerisi verdi.`
  ];
  
  const negativeNews = [
    `${asset.name} CEO'su istifa etti.`,
    `${asset.name} ürünlerinde güvenlik açığı bulundu.`,
    `Hükümetten ${asset.name} şirketine rekor ceza.`,
    `${asset.name} beklenen kazanç raporunun altında kaldı.`
  ];

  const message = isPositive 
    ? positiveNews[Math.floor(Math.random() * positiveNews.length)]
    : negativeNews[Math.floor(Math.random() * negativeNews.length)];

  // Impact between 5% to 15%
  const impactMagnitude = 0.05 + Math.random() * 0.10;
  const impact = isPositive ? impactMagnitude : -impactMagnitude;

  return {
    id: Math.random().toString(36).substring(7),
    targetSymbol: asset.symbol,
    message,
    impact,
    type: isPositive ? 'positive' : 'negative',
    timestamp: Date.now()
  };
}
