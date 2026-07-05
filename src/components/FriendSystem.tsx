import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, arrayUnion, query, collection, where, getDocs, onSnapshot } from 'firebase/firestore';
import { Users, Search, UserPlus, Send, X } from 'lucide-react';

export default function FriendSystem({ currentUser, userData, activeLobby }: { currentUser: any, userData: any, activeLobby: any }) {
  const [friendTag, setFriendTag] = useState('');
  const [message, setMessage] = useState('');
  const [friendsList, setFriendsList] = useState<any[]>([]);

  useEffect(() => {
    if (!userData || !userData.friends || userData.friends.length === 0) {
      setFriendsList([]);
      return;
    }

    // Since 'in' queries are limited to 10 items, we can fetch all and filter, or fetch one by one
    // For simplicity, fetch all friends one by one or listen to them if less than 10
    const unsubscribes: any[] = [];
    const friendsData: Record<string, any> = {};

    userData.friends.forEach((friendId: string) => {
      const unsub = onSnapshot(doc(db, 'users', friendId), (docSnap) => {
        if (docSnap.exists()) {
          friendsData[friendId] = { uid: docSnap.id, ...docSnap.data() };
          setFriendsList(Object.values(friendsData));
        }
      });
      unsubscribes.push(unsub);
    });

    return () => unsubscribes.forEach(u => u());
  }, [userData?.friends]);

  const addFriend = async () => {
    if (!friendTag.trim() || !currentUser) return;
    try {
      const q = query(collection(db, 'users'), where('userTag', '==', friendTag.trim()));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        setMessage("Kullanıcı bulunamadı.");
        return;
      }
      
      const friendDoc = snap.docs[0];
      const friendId = friendDoc.id;
      
      if (friendId === currentUser.uid) {
        setMessage("Kendinizi ekleyemezsiniz.");
        return;
      }
      
      if (userData?.friends?.includes(friendId)) {
        setMessage("Bu kullanıcı zaten arkadaşınız.");
        return;
      }

      // Add to my friends
      await updateDoc(doc(db, 'users', currentUser.uid), {
        friends: arrayUnion(friendId)
      });
      
      // Add to their friends (bidirectional for simplicity)
      await updateDoc(doc(db, 'users', friendId), {
        friends: arrayUnion(currentUser.uid)
      });
      
      setMessage("Arkadaş eklendi!");
      setFriendTag('');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error(error);
      setMessage("Bir hata oluştu.");
    }
  };

  const inviteFriend = async (friendId: string) => {
    if (!activeLobby) return;
    // We can use a simple invites collection
    try {
      await updateDoc(doc(db, 'users', friendId), {
        invites: arrayUnion({
          lobbyId: activeLobby.id,
          lobbyName: activeLobby.name,
          lobbyCode: activeLobby.roomCode,
          fromName: userData?.displayName || currentUser.displayName,
          timestamp: Date.now()
        })
      });
    } catch (e) {
      console.error("Davet hatası:", e);
    }
  };

  if (!userData) return null;

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 mb-6">
      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Users className="w-5 h-5 text-gray-500" />
        Arkadaşlar
      </h3>
      
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Kullanıcı Etiketi (Örn: Oyuncu#A1B2)"
            value={friendTag}
            onChange={e => setFriendTag(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <button
          onClick={addFriend}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Ekle
        </button>
      </div>
      
      {message && <p className="text-sm text-blue-600 mb-4">{message}</p>}

      <div className="space-y-3">
        {friendsList.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">Henüz arkadaşınız yok.</p>
        ) : (
          friendsList.map(friend => (
            <div key={friend.uid} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <img src={friend.photoURL || 'https://via.placeholder.com/40'} alt={friend.displayName} className="w-8 h-8 rounded-full" />
                <div>
                  <p className="font-medium text-sm text-gray-900">{friend.displayName}</p>
                  <p className="text-xs text-gray-500">{friend.userTag}</p>
                </div>
              </div>
              {activeLobby && activeLobby.status === 'waiting' && activeLobby.hostId === currentUser.uid && (
                <button
                  onClick={() => inviteFriend(friend.uid)}
                  className="text-xs font-medium text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors flex items-center gap-1"
                >
                  <Send className="w-3 h-3" />
                  Davet Et
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
