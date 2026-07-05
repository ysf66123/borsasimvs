import { Trophy, Medal, Award } from 'lucide-react';
import { auth } from '../firebase';

interface LeaderboardViewProps {
  netWorth: number;
  activeLobby?: any;
}

export default function LeaderboardView({ netWorth, activeLobby }: LeaderboardViewProps) {
  const isMultiplayerPlaying = activeLobby && activeLobby.status === 'playing';

  // If in active multiplayer lobby, use real-time player data from Firestore
  const competitors = isMultiplayerPlaying 
    ? (activeLobby.players || []).map((player: any) => ({
        name: player.name + (player.isBot ? " (Bot)" : ""),
        value: player.netWorth !== undefined ? player.netWorth : 10000,
        isPlayer: player.uid === auth.currentUser?.uid
      })).sort((a: any, b: any) => b.value - a.value)
    : [
        { name: "Warren Buffett (Bot)", value: 5000000 },
        { name: "Elon Musk (Bot)", value: 3500000 },
        { name: "Siz (Oyuncu)", value: netWorth, isPlayer: true },
        { name: "Ahmet Yılmaz (Bot)", value: 15000 },
        { name: "Mehmet Demir (Bot)", value: 8000 },
        { name: "Ayşe Kaya (Bot)", value: 4500 },
      ].sort((a, b) => b.value - a.value);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-20">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          {isMultiplayerPlaying ? `${activeLobby.name} Sıralaması` : 'Liderlik Tablosu'}
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          {isMultiplayerPlaying 
            ? "Mevcut çok oyunculu oyundaki oyuncuların net değerlerine göre anlık sıralaması." 
            : "Net değerinize göre dünyadaki diğer sanal yatırımcılar arasındaki sıranız."}
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="divide-y divide-gray-50">
          {competitors.map((comp: any, index: number) => (
            <div key={index} className={`p-4 sm:p-6 flex items-center justify-between transition-colors ${comp.isPlayer ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}>
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="w-10 flex justify-center">
                  {index === 0 ? <Trophy className="w-8 h-8 text-yellow-500" /> : 
                   index === 1 ? <Medal className="w-8 h-8 text-gray-400" /> : 
                   index === 2 ? <Award className="w-8 h-8 text-amber-700" /> : 
                   <span className="font-bold text-gray-400 text-lg">#{index + 1}</span>}
                </div>
                <p className={`font-semibold sm:text-lg ${comp.isPlayer ? 'text-blue-700' : 'text-gray-900'}`}>
                  {comp.name}
                  {comp.isPlayer && <span className="ml-2 text-xs font-normal bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Sen</span>}
                </p>
              </div>
              <p className={`font-bold sm:text-lg ${comp.isPlayer ? 'text-blue-700' : 'text-gray-900'}`}>
                ${comp.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
