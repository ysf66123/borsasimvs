import React, { useState } from 'react';
import { Download, Github, Code2, ArrowRight, CheckCircle, Copy, ExternalLink, Globe, Sparkles, AlertCircle } from 'lucide-react';
import { ZIP_BASE64 } from './ZipData';

export default function ExportView() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleDownloadBase64 = () => {
    try {
      // Decode base64 to binary string
      const binaryString = atob(ZIP_BASE64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Create a blob and trigger a download link
      const blob = new Blob([bytes], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'borsasim-projesi.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Base64 download failed:", error);
      alert("Tarayıcınız indirmeyi engelledi. Lütfen uygulamayı sağ üstteki 'Yeni Sekmede Aç' butonuna basarak yeni sekmede açıp tekrar indirmeyi deneyin.");
    }
  };

  const gitCommands = `git init
git add .
git commit -m "İlk yükleme"
git branch -M main
git remote add origin https://github.com/ysf66123/borsasimvs.git
git push -u origin main`;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-12 animate-fade-in">
      {/* İndirme Sorunu İpucu Uyarı Kutusu */}
      <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-semibold">İndirme İşlemi Hakkında Önemli Not:</p>
          <p className="mt-1">
            Google AI Studio önizleme ekranı (iframe) güvenlik nedeniyle indirmeleri engelleyebilir. Eğer indirdiğiniz dosya bozuk inerse veya inmezse, lütfen ekranın sağ üstündeki <strong>"Yeni Sekmede Aç" (Open in new tab)</strong> butonuna tıklayarak uygulamayı yeni sekmede açın ve oradan "İndir & Yayınla" sekmesine gelip indirin.
          </p>
        </div>
      </div>

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-md overflow-hidden mb-8 text-white">
        <div className="p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 bg-blue-500/30 text-blue-100 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5" />
              Hazır ve Derli Toplu Paket
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight">Projeyi İndir ve Canlıya Al!</h2>
            <p className="text-blue-100 max-w-xl text-sm md:text-base leading-relaxed">
              BorsaSim projenizin tüm kaynak kodlarını (React, Tailwind, Firebase konfigürasyonu) tarayıcı üzerinden tamamen güvenli ve doğrudan ZIP olarak indirebilirsiniz.
            </p>
          </div>
          <div className="shrink-0">
            <button
              onClick={handleDownloadBase64}
              className="flex items-center gap-2 bg-white text-blue-700 hover:bg-blue-50 px-6 py-4 rounded-xl font-bold shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 duration-200 cursor-pointer"
            >
              <Download className="w-5 h-5" />
              Projeyi ZIP Olarak İndir
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Adım Adım Rehber */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">GitHub ve Canlı Yayınlama Rehberi</h3>
              <p className="text-xs text-gray-500">Uygulamanızı tüm dünyaya açmak için aşağıdaki 3 adımı uygulayın.</p>
            </div>
          </div>

          <div className="p-6 space-y-8">
            {/* Adım 1 */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">
                  1
                </div>
                <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
              </div>
              <div className="space-y-2 pb-6">
                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                  ZIP Dosyasını Ayıklayın
                </h4>
                <p className="text-sm text-gray-600">
                  Yukarıdaki butonla indirdiğiniz <code className="bg-gray-100 text-blue-600 px-1.5 py-0.5 rounded font-mono text-xs">borsasim-projesi.zip</code> dosyasını bilgisayarınızda boş bir klasöre çıkartın.
                </p>
              </div>
            </div>

            {/* Adım 2 */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">
                  2
                </div>
                <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
              </div>
              <div className="space-y-4 pb-6 flex-1">
                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                  GitHub Deposu (Repository) Oluşturma ve Yükleme
                </h4>
                <div className="text-sm text-gray-600 space-y-2">
                  <p>
                    Projeyi internete yüklemek için öncelikle bir GitHub deposuna ihtiyacımız var:
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 ml-2">
                    <li><a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-0.5 font-semibold">GitHub.com<ExternalLink className="w-3.5 h-3.5" /></a> adresine gidin ve hesabınız yoksa açın.</li>
                    <li>Sağ üstteki <strong className="text-gray-900">+</strong> butonuna tıklayıp <strong>New repository</strong> seçeneğini seçin.</li>
                    <li>Depo adı kısmına <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">borsasimvs</code> yazıp alttaki yeşil <strong>Create repository</strong> butonuna basın. (Görünen o ki deponuzu zaten oluşturmuşsunuz!)</li>
                    <li>
                      <strong>İndirdiğiniz klasörün içinde bir terminal / komut satırı açın:</strong>
                      <div className="mt-2 bg-blue-50/50 border border-blue-100 rounded-lg p-3 text-xs text-blue-900 space-y-2">
                        <p className="font-semibold flex items-center gap-1.5">
                          💡 Terminal Nasıl Açılır?
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
                          <div>
                            <span className="font-bold text-blue-950 block mb-0.5">💻 Windows için En Kolay Yol:</span>
                            <ol className="list-decimal list-inside space-y-1 text-blue-800">
                              <li>ZIP'ten çıkardığınız klasörün içine girin.</li>
                              <li>Yukarıdaki <strong>adres çubuğuna</strong> (dosya yolunun yazdığı boşluğa) tıklayın.</li>
                              <li>Oraya doğrudan <code className="bg-blue-100 px-1 py-0.2 rounded font-mono font-bold">cmd</code> yazıp <strong>Enter</strong> tuşuna basın. Komut satırı o klasörde anında açılacaktır!</li>
                            </ol>
                          </div>
                          <div>
                            <span className="font-bold text-blue-950 block mb-0.5">🍎 macOS için En Kolay Yol:</span>
                            <ol className="list-decimal list-inside space-y-1 text-blue-800">
                              <li>Klasöre <strong>sağ tıklayın</strong>.</li>
                              <li>Açılan menüden <strong>Hizmetler (Services)</strong> &gt; <strong>Klasörde Yeni Terminal (New Terminal at Folder)</strong> seçeneğini seçin.</li>
                            </ol>
                          </div>
                        </div>
                      </div>
                    </li>
                  </ul>
                </div>

                <div className="relative">
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-xl overflow-x-auto text-xs font-mono leading-relaxed">
                    {gitCommands}
                  </pre>
                  <button
                    onClick={() => copyToClipboard(gitCommands, 1)}
                    className="absolute top-3 right-3 bg-gray-800/80 hover:bg-gray-700 text-gray-300 p-1.5 rounded-lg transition-colors border border-gray-700"
                    title="Kodu Kopyala"
                  >
                    {copiedIndex === 1 ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-green-600 font-medium">
                  💡 Sizin için komutları doğrudan <code className="bg-green-50 px-1 rounded text-green-700">ysf66123/borsasimvs</code> bilgilerinizle özelleştirdik! Kopyalayıp direkt terminalde çalıştırabilirsiniz.
                </p>

                {/* Hata ve Çözüm Kutusu */}
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 mt-4 text-sm text-rose-900 space-y-4">
                  <div>
                    <p className="font-bold flex items-center gap-2 text-rose-800 text-base">
                      ⚠️ "fatal: not a git repository (or any of the parent directories)" Hatası mı Alıyorsunuz?
                    </p>
                    <p className="text-xs text-rose-700 leading-relaxed mt-1.5 font-medium">
                      Gönderdiğiniz ekran görüntüsündeki <strong>"fatal: not a git repository..."</strong> hatası, indirdiğiniz klasörü henüz bir Git projesi haline getirmediğinizi (başlatmadığınızı) gösteriyor. Klasörünüzün içinde Git'i başlatmak ve kodları yüklemek için <strong>HİÇBİR ADIMI ATLAMADAN</strong> sırayla şu komutları kopyalayıp terminalinize yapıştırın:
                    </p>
                  </div>

                  <div className="bg-white border border-rose-150 rounded-lg p-4 space-y-3 shadow-sm">
                    <span className="font-bold text-xs text-rose-950 block">⚡ KESİN ÇÖZÜM İÇİN ŞU ADIMLARI SIRAYLA ÇALIŞTIRIN:</span>
                    
                    <div className="space-y-4 text-xs text-rose-800">
                      <div>
                        <span className="font-bold block text-gray-900">1. Adım: Git'i Başlatın (Klasörü Git Deposuna Dönüştürün):</span>
                        <p className="text-[11px] text-gray-500 mb-1">Klasörün içinde Git sistemini kurar. Bu komutu çalıştırmazsanız diğer komutlar çalışmaz:</p>
                        <div className="relative">
                          <code className="block bg-gray-900 text-green-400 p-2.5 rounded-lg text-[11px] font-mono whitespace-pre pr-12">
                            git init
                          </code>
                          <button
                            onClick={() => copyToClipboard("git init", 8)}
                            className="absolute right-2 top-2 bg-gray-800 hover:bg-gray-700 text-gray-300 p-1.5 rounded-md transition-colors border border-gray-700"
                            title="Kopyala"
                          >
                            {copiedIndex === 8 ? <CheckCircle className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="font-bold block text-gray-900">2. Adım: Git'e Kendinizi Tanıtın (E-posta ve Adınızı Girin):</span>
                        <p className="text-[11px] text-gray-500 mb-1">Git programının sizi tanımasını sağlar (Girdiğiniz e-posta ve isim ile):</p>
                        <div className="relative">
                          <code className="block bg-gray-900 text-green-400 p-2.5 rounded-lg text-[11px] font-mono whitespace-pre pr-12">
{`git config --global user.email "yusar646@gmail.com"
git config --global user.name "Yusuf"`}
                          </code>
                          <button
                            onClick={() => copyToClipboard(`git config --global user.email "yusar646@gmail.com"\ngit config --global user.name "Yusuf"`, 5)}
                            className="absolute right-2 top-2 bg-gray-800 hover:bg-gray-700 text-gray-300 p-1.5 rounded-md transition-colors border border-gray-700"
                            title="Kopyala"
                          >
                            {copiedIndex === 5 ? <CheckCircle className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="font-bold block text-gray-900">3. Adım: Dosyaları Seçin, Kaydedin (Commit) ve Ana Dalı Belirleyin:</span>
                        <p className="text-[11px] text-gray-500 mb-1">Klasördeki tüm dosyaları paketler ve ilk kaydı oluşturur:</p>
                        <div className="relative">
                          <code className="block bg-gray-900 text-green-400 p-2.5 rounded-lg text-[11px] font-mono whitespace-pre pr-12">
{`git add .
git commit -m "Ilk yukleme"
git branch -M main`}
                          </code>
                          <button
                            onClick={() => copyToClipboard(`git add .\ngit commit -m "Ilk yukleme"\ngit branch -M main`, 6)}
                            className="absolute right-2 top-2 bg-gray-800 hover:bg-gray-700 text-gray-300 p-1.5 rounded-md transition-colors border border-gray-700"
                            title="Kopyala"
                          >
                            {copiedIndex === 6 ? <CheckCircle className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="font-bold block text-gray-900">4. Adım: GitHub Deponuzu Tanımlayın (Remote):</span>
                        <p className="text-[11px] text-gray-500 mb-1">Lokal projenizi kendi oluşturduğunuz GitHub deposuna bağlar (Varsa eski kaydı siler):</p>
                        <div className="relative">
                          <code className="block bg-gray-900 text-green-400 p-2.5 rounded-lg text-[11px] font-mono whitespace-pre pr-12">
{`git remote remove origin
git remote add origin https://github.com/ysf66123/borsasimvs.git`}
                          </code>
                          <button
                            onClick={() => copyToClipboard(`git remote remove origin\ngit remote add origin https://github.com/ysf66123/borsasimvs.git`, 9)}
                            className="absolute right-2 top-2 bg-gray-800 hover:bg-gray-700 text-gray-300 p-1.5 rounded-md transition-colors border border-gray-700"
                            title="Kopyala"
                          >
                            {copiedIndex === 9 ? <CheckCircle className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <p className="text-[10px] text-rose-600 font-semibold mt-1">
                          💡 Not: Bu komut grubu "error: remote origin already exists" hatasını almamak için eski bağlantıyı sıfırlayıp yenisini tanımlar.
                        </p>
                      </div>

                      <div>
                        <span className="font-bold block text-gray-900">5. Adım: Şimdi GitHub'a Gönderin (Push):</span>
                        <p className="text-[11px] text-gray-500 mb-1">Tüm dosyaları GitHub'a başarıyla yükleyecektir:</p>
                        <div className="relative">
                          <code className="block bg-gray-900 text-green-400 p-2.5 rounded-lg text-[11px] font-mono whitespace-pre pr-12">
{`git push -u origin main --force`}
                          </code>
                          <button
                            onClick={() => copyToClipboard(`git push -u origin main --force`, 7)}
                            className="absolute right-2 top-2 bg-gray-800 hover:bg-gray-700 text-gray-300 p-1.5 rounded-md transition-colors border border-gray-700"
                            title="Kopyala"
                          >
                            {copiedIndex === 7 ? <CheckCircle className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <hr className="border-rose-200" />

                  <p className="font-bold flex items-center gap-2 text-rose-800">
                    ⚠️ "failed to push some refs" Hatası mı Alıyorsunuz?
                  </p>
                  <p className="text-xs text-rose-700 leading-relaxed">
                    Bu hata ise, GitHub üzerinde deponuzu oluştururken otomatik olarak <strong>README.md</strong>, <strong>LICENSE</strong> veya <strong>.gitignore</strong> dosyası eklediğiniz için oluşur. GitHub'daki o dosyalar bilgisayarınızda olmadığı için push işlemi engellenir.
                  </p>
                  <div className="pt-1 space-y-2.5">
                    <div>
                      <span className="font-bold text-xs text-rose-950 block">🛠️ Çözüm (Zorla Gönder):</span>
                      <p className="text-xs text-rose-800 mb-1">GitHub'daki boş başlangıç dosyalarını ezerek dosyalarınızı göndermek için şu komutu çalıştırın:</p>
                      <div className="relative">
                        <code className="block bg-rose-950 text-rose-100 p-2.5 rounded-lg text-xs font-mono break-all pr-12">
                          git push -u origin main --force
                        </code>
                        <button
                          onClick={() => copyToClipboard("git push -u origin main --force", 3)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-rose-900/60 hover:bg-rose-800 text-rose-100 p-1.5 rounded-md transition-colors border border-rose-800"
                          title="Komutu Kopyala"
                        >
                          {copiedIndex === 3 ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Adım 3 */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold shrink-0">
                  3
                </div>
              </div>
              <div className="space-y-4 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-bold text-gray-900 text-lg">
                    Vercel veya Netlify ile Tek Tıkla Canlı Link Alın! 🚀
                  </h4>
                  <span className="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
                    EN KOLAY VE EN HIZLI YOL (Önerilen)
                  </span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Kodlarla, ayarlarla veya karmaşık iş akışlarıyla (workflows) uğraşmak istemiyorsanız; GitHub deponuzu (<code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800 font-mono">borsasimvs</code>) Vercel veya Netlify'a bağlayarak <strong>10 saniyede tamamen ücretsiz canlı bir link</strong> alabilirsiniz. Her iki servis de Vite projelerini otomatik algılar ve sıfır ayarla yayına alır!
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Vercel Option */}
                  <div className="border border-blue-100 rounded-xl p-5 bg-gradient-to-br from-white to-blue-50/30 hover:border-blue-200 transition-all shadow-sm space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-black text-white px-2 py-1 rounded text-xs font-bold font-mono">▲ Vercel</span>
                      <h5 className="font-bold text-gray-900 text-sm">Vercel ile 10 Saniyede Yayınla</h5>
                    </div>
                    <ol className="text-xs text-gray-600 space-y-2 list-decimal list-inside">
                      <li><a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-semibold inline-flex items-center gap-0.5">Vercel.com'a Git<ExternalLink className="w-3 h-3" /></a> ve <strong>Continue with GitHub</strong> seçeneğiyle giriş yap.</li>
                      <li>Açılan panelde sağ üstteki <strong>Add New...</strong> butonuna tıklayıp <strong>Project</strong>'i seç.</li>
                      <li>Listede otomatik beliren <strong>borsasimvs</strong> deponun yanındaki <strong>Import</strong> butonuna bas.</li>
                      <li>Hiçbir ayarı değiştirmeden doğrudan mavi <strong>Deploy</strong> butonuna bas!</li>
                    </ol>
                    <p className="text-xs text-emerald-600 font-medium pt-1">🚀 İşte bu kadar! Canlı siteniz 10 saniye içinde hazır olacak!</p>
                  </div>

                  {/* Netlify Option */}
                  <div className="border border-teal-100 rounded-xl p-5 bg-gradient-to-br from-white to-teal-50/30 hover:border-teal-200 transition-all shadow-sm space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-teal-600 text-white px-2 py-0.5 rounded text-xs font-bold font-mono">Netlify</span>
                      <h5 className="font-bold text-gray-900 text-sm">Netlify ile 10 Saniyede Yayınla</h5>
                    </div>
                    <ol className="text-xs text-gray-600 space-y-2 list-decimal list-inside">
                      <li><a href="https://app.netlify.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-semibold inline-flex items-center gap-0.5">Netlify.com'a Git<ExternalLink className="w-3 h-3" /></a> ve <strong>Sign up with GitHub</strong> seçeneğiyle giriş yap.</li>
                      <li>Panelde <strong>Add new site</strong> butonuna tıkla ve <strong>Import an existing project</strong>'i seç.</li>
                      <li>Sağlayıcı olarak <strong>GitHub</strong>'ı yetkilendir ve listeden <strong>borsasimvs</strong> deponu seç.</li>
                      <li>Hiçbir ayara dokunmadan en alttaki <strong>Deploy borsasimvs</strong> butonuna tıkla!</li>
                    </ol>
                    <p className="text-xs text-teal-600 font-medium pt-1">🎉 Harika! Netlify siteniz saniyeler içinde yayına girecektir!</p>
                  </div>
                </div>

                {/* Alternatif GitHub Pages Accordion */}
                <div className="border border-gray-200 rounded-xl overflow-hidden mt-4">
                  <details className="group">
                    <summary className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer select-none">
                      <span className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                        <Github className="w-4 h-4 text-gray-600" />
                        Alternatif: GitHub Actions ve GitHub Pages ile Yayınlama (Daha Fazla Ayar Gerektirir)
                      </span>
                      <span className="text-xs text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <div className="p-4 border-t border-gray-200 space-y-4 bg-white">
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Projenizi Vercel veya Netlify gibi harici bulut servisleri olmadan, <strong>tamamen doğrudan GitHub sunucularında</strong> barındırmak isterseniz bu yöntemi kullanabilirsiniz:
                      </p>
                      
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs text-gray-700 space-y-3">
                        <div>
                          <span className="font-bold text-gray-900 block mb-1">A. Vite Konfigürasyonunu Güncelleyin</span>
                          <p className="text-gray-600">
                            GitHub Pages alt klasör yapısında çalıştığından, assets dosyalarının düzgün yüklenmesi için <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800">vite.config.ts</code> dosyasına <code className="bg-gray-100 px-1 py-0.5 rounded text-blue-600 font-semibold">base: '/borsasimvs/'</code> parametresini eklemelisiniz.
                          </p>
                        </div>

                        <div>
                          <span className="font-bold text-gray-900 block mb-1">B. GitHub Action İş Akışı (Workflow) Oluşturun</span>
                          <p className="text-gray-600">
                            Klasörün içinde <code className="bg-gray-100 px-1 py-0.5 rounded">.github/workflows</code> klasörü ve altına <code className="bg-gray-100 px-1 py-0.5 rounded">deploy.yml</code> adında bir dosya oluşturup aşağıdaki YAML kodunu yerleştirin:
                          </p>
                          <div className="relative mt-2">
                            <pre className="bg-gray-900 text-green-400 p-3 rounded-lg overflow-x-auto text-[10px] font-mono leading-normal max-h-40 overflow-y-auto">
{`name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - name: Install dependencies
        run: npm install
      - name: Build
        run: npm run build
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4`}
                            </pre>
                          </div>
                        </div>

                        <div>
                          <span className="font-bold text-gray-900 block mb-1">C. GitHub Ayarlarından "Pages" Menüsünü Değiştirin</span>
                          <p className="text-gray-600">
                            GitHub'da <strong>Settings → Pages → Build and deployment → Source</strong> seçeneğini <strong>GitHub Actions</strong> olarak ayarlayın. Ardından her <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800">git push</code> işleminde siteniz <code className="text-blue-600 font-semibold">https://ysf66123.github.io/borsasimvs/</code> üzerinde otomatik güncellenecektir.
                          </p>
                        </div>
                      </div>
                    </div>
                  </details>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
