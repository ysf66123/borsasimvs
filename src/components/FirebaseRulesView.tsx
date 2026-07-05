import React from 'react';
import { ShieldAlert, Database, CheckCircle2, XCircle } from 'lucide-react';

export default function FirebaseRulesView() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="p-6 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Firebase Yapılandırma ve Kurallar</h2>
            <p className="text-sm text-gray-600">Projeye eklemeniz ve eklememeniz gereken Firebase ürünleri ve güvenlik kuralları.</p>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-green-700">
              <CheckCircle2 className="w-5 h-5" /> Eklenecek Ürünler (Products)
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <Database className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <span className="font-semibold text-gray-900 block">Firestore Database</span>
                  <span className="text-sm text-gray-600">Lobi ve oyun içi veri senkronizasyonu için Firestore kullanıyoruz.</span>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Database className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <span className="font-semibold text-gray-900 block">Authentication (Google Sign-In)</span>
                  <span className="text-sm text-gray-600">Kullanıcıların giriş yapması ve güvenli lobi sistemi için. "Sign-in method" sekmesinden Google'ı aktif etmeyi unutmayın.</span>
                </div>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-red-700">
              <XCircle className="w-5 h-5" /> Eklenmemesi Gereken Ürünler
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-gray-700">
                <span className="font-bold text-red-500 mt-1">•</span>
                <div>
                  <span className="font-semibold text-gray-900 block">Realtime Database</span>
                  <span className="text-sm text-gray-600">Realtime Database yerine Firestore kullandığımız için bunu aktif etmeyin.</span>
                </div>
              </li>
              <li className="flex items-start gap-2 text-gray-700">
                <span className="font-bold text-red-500 mt-1">•</span>
                <div>
                  <span className="font-semibold text-gray-900 block">Hosting / Functions (Opsiyonel)</span>
                  <span className="text-sm text-gray-600">Şu an için sadece istemci tarafında işlem yapıyoruz. Functions kullanmanıza gerek yok.</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Firestore Güvenlik Kuralları</h3>
          <p className="text-sm text-gray-600 mb-4">Firestore konsolunuzda "Rules" sekmesine gidip aşağıdaki kuralları yapıştırın. Bu, sadece giriş yapmış kullanıcıların veri okuyup yazabilmesini sağlayacaktır.</p>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false; // Tüm erişimi varsayılan olarak kapat (Güvenlik için)
    }
    
    // Lobiler ve Oyun için kurallar
    match /lobbies/{lobbyId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if request.auth != null && resource.data.hostId == request.auth.uid;
    }
  }
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}
