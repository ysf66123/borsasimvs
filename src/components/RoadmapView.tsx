import { LineChart, FileText, Medal, Settings, Eye, Clock, Users, Globe, Briefcase } from 'lucide-react';

export default function RoadmapView() {
  const ideas = [
    {
      title: "Teknik Analiz Göstergeleri (Gelişmiş)",
      description: "Şu anki basit çizgi grafiği yerine Mum Grafikleri (Candlesticks), RSI (Göreceli Güç Endeksi), MACD ve Hareketli Ortalamalar (Moving Averages) eklenebilir.",
      icon: <LineChart className="w-6 h-6 text-blue-500" />
    },
    {
      title: "Kredi ve Banka Sistemi",
      description: "Banka üzerinden kredi çekerek kaldıraçlı işlemler (Leverage) yapılabilmesi. Ancak kredinin günlük faizi (Margin Interest) hesabınızdan düşülecektir.",
      icon: <Briefcase className="w-6 h-6 text-indigo-500" />
    },
    {
      title: "Küresel Etkinlikler ve Mevsimsellik",
      description: "Haberlerin ötesinde 'Boğa Piyasası', 'Ayı Piyasası' döngüleri, faiz kararları, savaş veya pandemi gibi küresel makro-ekonomik olayların tüm piyasayı etkilemesi.",
      icon: <Globe className="w-6 h-6 text-yellow-500" />
    },
    {
      title: "Çok Oyunculu Mod & Borsa Kulüpleri",
      description: "Gerçek zamanlı olarak diğer oyuncularla aynı piyasada işlem yapmak. Arkadaşlarınızla yatırım kulüpleri kurup ortak fon yönetebilme imkanı.",
      icon: <Users className="w-6 h-6 text-emerald-500" />
    },
    {
      title: "Opsiyon Sözleşmeleri (Options)",
      description: "Daha gelişmiş yatırımcılar için Call (Alım) ve Put (Satım) opsiyonları eklenebilir, bu sayede çok daha yüksek getiri/risk oranlarıyla işlemler yapılabilir.",
      icon: <Settings className="w-6 h-6 text-purple-500" />
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-20">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Yeni Fikirler & Gelecek Planları</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Önceki güncellemelerde Temel Analiz, Balina Etkinlikleri, Limit/Stop Emirleri ve Seviye Sistemi eklendi!
          İşte oyunu daha da derinleştirecek sonraki aşama için fikirler:
        </p>
      </div>
      
      <div className="grid gap-6">
        {ideas.map((idea, index) => (
          <div key={index} className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-start gap-4 sm:gap-5 hover:shadow-md transition-shadow">
            <div className="p-4 bg-gray-50 rounded-xl shrink-0">
              {idea.icon}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{idea.title}</h3>
              <p className="text-gray-600 leading-relaxed text-sm sm:text-base">{idea.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
