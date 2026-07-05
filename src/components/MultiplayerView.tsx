import React, { useState, useEffect, useRef } from 'react';
import { auth, db, signInWithGoogle, signInAsGuestWithDetails, logout, signUpWithEmail, signInWithEmail } from '../firebase';
import { collection, addDoc, onSnapshot, query, deleteDoc, doc, updateDoc, arrayUnion, arrayRemove, getDoc, where, getDocs } from 'firebase/firestore';
import { Users, LogIn, LogOut, Plus, Play, Loader2, User, Search, Bot, MessageSquare, Send, Mail } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import FriendSystem from './FriendSystem';
import { INITIAL_BALANCE, INITIAL_ASSETS } from '../data';

const AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Max',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Nala',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo',
];

export default function MultiplayerView({ onGoToTrade, currentNetWorth, onActiveLobbyChange }: { onGoToTrade?: () => void, currentNetWorth?: number, onActiveLobbyChange?: (lobby: any) => void }) {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [lobbies, setLobbies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLobbyId, setActiveLobbyId] = useState<string | null>(null);
  
    const activeLobby = activeLobbyId ? lobbies.find(l => l.id === activeLobbyId) || null : null;
    const isAdmin = user?.email === "yusar646@gmail.com";

    useEffect(() => {
      if (onActiveLobbyChange) {
        onActiveLobbyChange(activeLobby);
      }
    }, [activeLobby, onActiveLobbyChange]);

    const adminCloseLobby = async (lobbyId: string) => {
      try {
        await deleteDoc(doc(db, "lobbies", lobbyId));
      } catch (error) {
        console.error("Admin delete error:", error);
      }
    };

  // Guest login state
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestAvatar, setGuestAvatar] = useState(AVATARS[0]);

  // Email login / signup states
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailFormType, setEmailFormType] = useState<'login' | 'signup'>('login');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [emailNameInput, setEmailNameInput] = useState('');
  const [emailAvatarInput, setEmailAvatarInput] = useState(AVATARS[0]);
  const [emailError, setEmailError] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);
  
  // Join by code state
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [joinError, setJoinError] = useState('');
  const [customLobbyName, setCustomLobbyName] = useState('');

  // Lobi Sohbet State
  const [chatMessageInput, setChatMessageInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll chat stream
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeLobby?.messages]);

  const sendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user || !activeLobby || !chatMessageInput.trim()) return;

    try {
      const lobbyRef = doc(db, 'lobbies', activeLobby.id);
      const newMessage = {
        id: Math.random().toString(36).substring(2, 9),
        senderUid: user.uid,
        senderName: user.displayName || 'Oyuncu',
        senderAvatar: user.photoURL || null,
        text: chatMessageInput.trim(),
        timestamp: Date.now()
      };
      
      const currentMessages = activeLobby.messages || [];
      const updatedMessages = [...currentMessages, newMessage].slice(-50); // Son 50 mesajı tut
      
      await updateDoc(lobbyRef, {
        messages: updatedMessages
      });
      setChatMessageInput('');
    } catch (error) {
      console.error("Mesaj gönderilemedi:", error);
    }
  };

  useEffect(() => {
    let unsubscribeUser = () => {};
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      if (currentUser) {
        unsubscribeUser = onSnapshot(doc(db, 'users', currentUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            setUserData({ id: docSnap.id, ...docSnap.data() });
          }
        });
      } else {
        setUserData(null);
        unsubscribeUser();
      }
    });

    const q = query(collection(db, 'lobbies'));
    const unsubscribeLobbies = onSnapshot(q, (snapshot) => {
      const lobbiesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLobbies(lobbiesData);
      
      if (auth.currentUser) {
        const myLobby = lobbiesData.find((l: any) => 
          l.players?.some((p: any) => p.uid === auth.currentUser?.uid)
        );
        if (myLobby) {
          setActiveLobbyId(myLobby.id);
        } else {
          setActiveLobbyId(null);
        }
      }
    }, (error) => {
      console.error("Error fetching lobbies:", error);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeUser();
      unsubscribeLobbies();
    };
  }, []);


  
  // Host ping & Stale Lobby Cleanup
  const lobbiesRef = useRef(lobbies);
  const activeLobbyIdRef = useRef(activeLobbyId);
  
  useEffect(() => {
    lobbiesRef.current = lobbies;
    activeLobbyIdRef.current = activeLobbyId;
  }, [lobbies, activeLobbyId]);

  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      const currentLobbies = lobbiesRef.current;
      const currentActiveLobbyId = activeLobbyIdRef.current;
      
      // 1. Cleanup stale/empty lobbies
      const now = Date.now();
      for (const lobby of currentLobbies) {
        const createdAt = lobby.createdAt?.toMillis ? lobby.createdAt.toMillis() : Date.now();
        const lastActivity = lobby.lastPing || createdAt;
        
        // condition 1: Host has been disconnected (no ping for 60s)
        const isStale = now - lastActivity > 60000;
        
        // condition 2: Lobby has been empty (only host) and waiting for > 60s
        const realPlayersCount = lobby.players?.filter((p: any) => !p.isBot).length || 0;
        const isEmptyForTooLong = lobby.status === 'waiting' && realPlayersCount <= 1 && (now - createdAt > 60000);

        if (lobby.status === 'waiting' && (isStale || isEmptyForTooLong)) {
          try {
            deleteDoc(doc(db, 'lobbies', lobby.id));
            if (lobby.id === currentActiveLobbyId) {
                // If I'm in it, clear my state
                // This doesn't directly call setActiveLobbyId because we are in a setInterval scope,
                // but we can let the snapshot listener handle the deletion and clear it.
            }
          } catch (e) {
            // ignore
          }
        }
      }
      
      // 2. Ping active lobby if host
      if (currentActiveLobbyId) {
        const lobby = currentLobbies.find(l => l.id === currentActiveLobbyId);
        if (lobby && lobby.hostId === user.uid && lobby.status === 'waiting') {
          try {
            updateDoc(doc(db, 'lobbies', lobby.id), {
              lastPing: Date.now()
            });
          } catch (e) {
            // ignore
          }
        }
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [user]);


  // Optimized Game Sync Loop
  const netWorthRef = useRef(currentNetWorth);
  const activeLobbyRef = useRef(activeLobby);
  
  useEffect(() => {
    netWorthRef.current = currentNetWorth;
    activeLobbyRef.current = activeLobby;
  }, [currentNetWorth, activeLobby]);

  useEffect(() => {
    // Only run if we are actually playing
    if (!activeLobbyRef.current || activeLobbyRef.current.status !== 'playing' || !user) return;
    
    const interval = setInterval(async () => {
      const currentLobby = activeLobbyRef.current;
      const currentNw = netWorthRef.current;
      
      if (!currentLobby || currentLobby.status !== 'playing') return;

      try {
        let updatedPlayers = [...currentLobby.players];
        let hasChanges = false;

        // 1. Update our own net worth
        if (currentNw !== undefined) {
          const myIndex = updatedPlayers.findIndex(p => p.uid === user.uid);
          if (myIndex !== -1 && updatedPlayers[myIndex].netWorth !== currentNw) {
            updatedPlayers[myIndex] = { ...updatedPlayers[myIndex], netWorth: currentNw };
            hasChanges = true;
          }
        }

        if (hasChanges) {
          const lobbyRef = doc(db, 'lobbies', currentLobby.id);
          await updateDoc(lobbyRef, { players: updatedPlayers });
        }
      } catch (err) {
        console.error("Sync error:", err);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [user, activeLobby?.status]); // Restart interval when game starts/stops

  const handleGuestLogin = async () => {
    if (!guestName.trim()) return;
    setLoading(true);
    await signInAsGuestWithDetails(guestName, guestAvatar);
    setLoading(false);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !passwordInput.trim()) {
      setEmailError("Lütfen tüm alanları doldurun.");
      return;
    }
    if (emailFormType === 'signup' && !emailNameInput.trim()) {
      setEmailError("Lütfen bir kullanıcı adı girin.");
      return;
    }

    setEmailError('');
    setAuthSubmitting(true);
    try {
      if (emailFormType === 'signup') {
        await signUpWithEmail(emailInput.trim(), passwordInput, emailNameInput.trim(), emailAvatarInput);
      } else {
        await signInWithEmail(emailInput.trim(), passwordInput);
      }
      // Reset form states
      setShowEmailForm(false);
      setEmailInput('');
      setPasswordInput('');
      setEmailNameInput('');
      setEmailError('');
    } catch (error: any) {
      console.error("Email auth error:", error);
      let msg = error.message;
      if (error.code === 'auth/invalid-email') msg = "Geçersiz e-posta adresi.";
      else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        msg = "E-posta adresi veya şifre hatalı.";
      } else if (error.code === 'auth/email-already-in-use') {
        msg = "Bu e-posta adresi zaten kullanımda.";
      } else if (error.code === 'auth/weak-password') {
        msg = "Şifre en az 6 karakter olmalıdır.";
      } else {
        msg = "E-posta ile giriş başarısız oldu.";
      }
      setEmailError(msg);
    } finally {
      setAuthSubmitting(false);
    }
  };

  const createLobby = async () => {
    if (!user) return;
    if (activeLobbyId) {
      alert("Zaten aktif bir lobidesiniz! Yeni bir lobi kurmak için önce mevcut lobiden ayrılın.");
      return;
    }
    try {
      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const docRef = await addDoc(collection(db, 'lobbies'), {
        name: customLobbyName.trim() ? customLobbyName.trim() : `${user.displayName || 'Oyuncu'}'nun Lobisi`,
        roomCode,
        hostId: user.uid,
        hostName: user.displayName,
        players: [{ 
          uid: user.uid, 
          name: user.displayName || "Oyuncu", 
          avatar: user.photoURL || null, 
          userTag: userData?.userTag || "",
          balance: INITIAL_BALANCE,
          holdings: {},
          netWorth: INITIAL_BALANCE
        }],
        status: 'waiting', // waiting, playing
        createdAt: new Date(),
        messages: [] // Initialize empty chat
      });
      const newLobby = await getDoc(docRef);
      setActiveLobbyId(newLobby.id);
      setCustomLobbyName('');
    } catch (error) {
      console.error("Lobi oluşturulurken hata:", error);
      alert("Lobi oluşturulamadı. Lütfen giriş yaptığınızdan ve Firebase kurallarının doğru ayarlandığından emin olun.");
    }
  };

  const joinLobby = async (lobbyId: string) => {
    if (!user) return;
    if (activeLobbyId) {
      alert("Zaten aktif bir lobidesiniz! Başka bir lobiye katılmak için önce mevcut lobiden ayrılın.");
      return;
    }
    try {
      const lobbyRef = doc(db, 'lobbies', lobbyId);
      await updateDoc(lobbyRef, {
        players: arrayUnion({ 
          uid: user.uid, 
          name: user.displayName || "Oyuncu", 
          avatar: user.photoURL || null, 
          userTag: userData?.userTag || "",
          balance: INITIAL_BALANCE,
          holdings: {},
          netWorth: INITIAL_BALANCE
        })
      });
      const joinedLobby = await getDoc(lobbyRef);
      setActiveLobbyId(joinedLobby.id);
    } catch (error) {
      console.error("Lobiye katılırken hata:", error);
    }
  };

  const joinLobbyByCode = async () => {
    setJoinError('');
    if (!roomCodeInput.trim()) return;
    if (activeLobbyId) {
      setJoinError("Zaten aktif bir lobidesiniz! Önce mevcut lobiden ayrılın.");
      return;
    }
    
    const code = roomCodeInput.trim().toUpperCase();
    const q = query(collection(db, 'lobbies'), where('roomCode', '==', code));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      setJoinError('Bu koda sahip bir lobi bulunamadı.');
      return;
    }
    
    const lobbyDoc = snapshot.docs[0];
    const lobbyData = lobbyDoc.data();
    
    if (lobbyData.status !== 'waiting') {
      setJoinError('Bu lobi şu anda oyunda.');
      return;
    }
    
    await joinLobby(lobbyDoc.id);
  };

  const addBot = async () => {
    if (!user || !activeLobby || activeLobby.hostId !== user.uid) return;
    try {
      const lobbyRef = doc(db, 'lobbies', activeLobby.id);
      const botId = 'bot_' + Math.random().toString(36).substr(2, 6);
      const botQuality = Math.floor(Math.random() * 5) + 1; // 1 to 5
      await updateDoc(lobbyRef, {
        players: arrayUnion({ 
          uid: botId, 
          name: `TradeBot-${botId.substr(4,3)}`, 
          avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${botId}`, 
          isBot: true, 
          quality: botQuality,
          balance: INITIAL_BALANCE,
          holdings: {},
          netWorth: INITIAL_BALANCE
        })
      });
    } catch (error) {
      console.error("Bot eklenirken hata:", error);
    }
  };

  const removeBot = async (botPlayer: any) => {
    if (!user || !activeLobby || activeLobby.hostId !== user.uid) return;
    try {
      const lobbyRef = doc(db, 'lobbies', activeLobby.id);
      await updateDoc(lobbyRef, {
        players: arrayRemove(botPlayer)
      });
    } catch (error) {
      console.error("Bot çıkarılırken hata:", error);
    }
  };

  const leaveLobby = async () => {
    if (!user || !activeLobby) return;
    try {
      const lobbyRef = doc(db, 'lobbies', activeLobby.id);
      
      if (activeLobby.hostId === user.uid) {
        // Host leaves, delete lobby
        await deleteDoc(lobbyRef);
      } else {
        // Player leaves
        const me = activeLobby.players.find((p: any) => p.uid === user.uid);
        if (me) {
          await updateDoc(lobbyRef, {
            players: arrayRemove(me)
          });
        }
      }
      setActiveLobbyId(null);
    } catch (error) {
      console.error("Lobiden ayrılırken hata:", error);
    }
  };

  const startGame = async () => {
    if (!user || !activeLobby || activeLobby.hostId !== user.uid) return;
    try {
      const lobbyRef = doc(db, 'lobbies', activeLobby.id);
      
      const resetPlayers = activeLobby.players.map((p: any) => ({
        ...p,
        balance: INITIAL_BALANCE,
        holdings: {},
        netWorth: INITIAL_BALANCE
      }));

      await updateDoc(lobbyRef, {
        status: 'playing',
        players: resetPlayers,
        assets: INITIAL_ASSETS,
        news: []
      });
    } catch (error) {
      console.error("Oyun başlatılırken hata:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-12 bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center animate-fade-in">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Çok Oyunculu Mod</h2>
        <p className="text-gray-600 mb-8">Arkadaşlarınızla lobi kurmak ve oyunu birlikte oynamak için giriş yapın veya hesap oluşturun.</p>
        
        {showEmailForm ? (
          <form onSubmit={handleEmailAuth} className="space-y-4 text-left">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">
              E-posta ile {emailFormType === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
            </h3>
            
            {emailError && (
              <div className="bg-red-50 text-red-600 p-2.5 rounded-lg text-xs font-semibold border border-red-100">
                {emailError}
              </div>
            )}

            {emailFormType === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Kullanıcı Adı</label>
                <input 
                  type="text"
                  required
                  value={emailNameInput}
                  onChange={e => setEmailNameInput(e.target.value)}
                  placeholder="Örn: Trader007"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">E-posta</label>
              <input 
                type="email"
                required
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                placeholder="Örn: trader@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Şifre (En az 6 haneli)</label>
              <input 
                type="password"
                required
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                placeholder="••••••"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            {emailFormType === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Avatar Seç</label>
                <div className="flex justify-between items-center gap-1.5 overflow-x-auto py-1">
                  {AVATARS.map(avatar => (
                    <button
                      type="button"
                      key={avatar}
                      onClick={() => setEmailAvatarInput(avatar)}
                      className={`p-1 rounded-full border-2 transition-colors shrink-0 ${emailAvatarInput === avatar ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:bg-gray-50'}`}
                    >
                      <img src={avatar} alt="avatar" className="w-10 h-10 rounded-full" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowEmailForm(false);
                  setEmailError('');
                }}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Geri Dön
              </button>
              <button
                type="submit"
                disabled={authSubmitting}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {authSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {emailFormType === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
              </button>
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setEmailFormType(emailFormType === 'login' ? 'signup' : 'login');
                  setEmailError('');
                }}
                className="text-xs text-blue-600 hover:underline font-medium"
              >
                {emailFormType === 'login' ? "Hesabınız yok mu? Yeni Hesap Oluşturun" : "Zaten hesabınız var mı? Giriş Yapın"}
              </button>
            </div>
          </form>
        ) : showGuestForm ? (
          <div className="space-y-4 text-left">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Kullanıcı Adı</label>
              <input 
                type="text"
                value={guestName}
                onChange={e => setGuestName(e.target.value)}
                placeholder="Örn: Trader007"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Avatar Seç</label>
              <div className="flex justify-between items-center gap-2">
                {AVATARS.map(avatar => (
                  <button
                    key={avatar}
                    onClick={() => setGuestAvatar(avatar)}
                    className={`p-1 rounded-full border-2 transition-colors ${guestAvatar === avatar ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:bg-gray-50'}`}
                  >
                    <img src={avatar} alt="avatar" className="w-12 h-12 rounded-full" />
                  </button>
                ))}
              </div>
            </div>
            <div className="pt-2 flex gap-2">
              <button
                onClick={() => setShowGuestForm(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleGuestLogin}
                disabled={!guestName.trim()}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Oyuna Katıl
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={signInWithGoogle}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <LogIn className="w-5 h-5" />
              Google ile Giriş Yap
            </button>
            <button
              onClick={() => {
                setShowEmailForm(true);
                setEmailFormType('login');
              }}
              className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-700 py-3 px-4 rounded-lg font-medium hover:bg-blue-100 transition-colors border border-blue-200"
            >
              <Mail className="w-5 h-5" />
              E-posta ile Giriş/Kayıt
            </button>
            <button
              onClick={() => setShowGuestForm(true)}
              className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              <User className="w-5 h-5" />
              Anonim Olarak Katıl
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-12">
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-3">
          <img src={user.photoURL || 'https://via.placeholder.com/40'} alt="Profile" className="w-10 h-10 rounded-full" />
          <div>
            <p className="font-semibold text-gray-900">{user.displayName}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
            {userData?.userTag && <p className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block mt-1">{userData.userTag}</p>}
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Çıkış Yap
        </button>
      </div>

            
      {userData?.invites && userData.invites.length > 0 && !activeLobby && (
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 mb-6">
          <h3 className="font-bold text-blue-800 mb-2">Lobi Davetleri</h3>
          <div className="space-y-2">
            {userData.invites.map((invite: any, index: number) => (
              <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border border-blue-100">
                <div>
                  <p className="text-sm font-medium text-gray-900">{invite.fromName} sizi davet etti</p>
                  <p className="text-xs text-gray-500">{invite.lobbyName}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      setRoomCodeInput(invite.lobbyCode);
                      // Remove invite
                      await updateDoc(doc(db, 'users', user.uid), {
                        invites: arrayRemove(invite)
                      });
                    }}
                    className="text-xs font-medium bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700"
                  >
                    Kodu Doldur
                  </button>
                  <button
                    onClick={async () => {
                      await updateDoc(doc(db, 'users', user.uid), {
                        invites: arrayRemove(invite)
                      });
                    }}
                    className="text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-2 py-1.5 rounded-lg"
                  >
                    Reddet
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {!activeLobby && <FriendSystem currentUser={user} userData={userData} activeLobby={activeLobby} />}

      {activeLobby ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{activeLobby.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-gray-600">
                  {activeLobby.status === 'waiting' ? 'Oyuncular bekleniyor...' : 'Oyun devam ediyor!'}
                </p>
                {activeLobby.roomCode && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-mono text-xs font-bold border border-blue-200">
                    KOD: {activeLobby.roomCode}
                  </span>
                )}
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              activeLobby.status === 'waiting' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
            }`}>
              {activeLobby.status === 'waiting' ? 'BEKLİYOR' : 'OYUNDA'}
            </span>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sol Kolon: Oyuncular Raporu */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">Oyuncular ({activeLobby.players?.length || 0})</h3>
                  {activeLobby.hostId === user.uid && activeLobby.status === 'waiting' && (
                    <button
                      onClick={addBot}
                      className="flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors border border-blue-200"
                    >
                      <Bot className="w-3.5 h-3.5" />
                      Bot Ekle
                    </button>
                  )}
                </div>

                {activeLobby.hostId === user.uid && activeLobby.status === 'waiting' && (
                  <div className="mb-6">
                    <FriendSystem currentUser={user} userData={userData} activeLobby={activeLobby} />
                  </div>
                )}

                <div className="space-y-2 mb-6 max-h-[300px] overflow-y-auto pr-1">
                  {activeLobby.players?.map((player: any) => (
                    <div key={player.uid} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-3">
                        {player.avatar ? (
                          <img src={player.avatar} alt={player.name} className="w-9 h-9 rounded-full bg-white border border-gray-200" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                            {player.name ? player.name.charAt(0).toUpperCase() : '?'}
                          </div>
                        )}
                        <div>
                          <span className="font-medium text-gray-900 block flex items-center gap-1.5">
                            {player.name} {player.userTag && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded ml-1 font-mono">{player.userTag}</span>}
                            {player.isBot && <Bot className="w-3.5 h-3.5 text-blue-500" />}
                          </span>
                          <span className="text-xs text-gray-500">
                            {player.uid === activeLobby.hostId && 'Kurucu '}
                            {player.uid === user.uid && '(Sen) '}
                            {player.isBot && `(Kalite: ${player.quality}/5)`}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {activeLobby.status === 'playing' && (
                          <div className="text-right">
                            <span className="block text-xs text-gray-500">Net Değer</span>
                            <span className="font-bold text-gray-900">${(player.netWorth !== undefined ? player.netWorth : 10000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                        )}
                        {activeLobby.hostId === user.uid && player.isBot && activeLobby.status === 'waiting' && (
                          <button 
                            onClick={() => removeBot(player)}
                            className="text-red-500 hover:text-red-700 text-xs font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                          >
                            Kaldır
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 mt-6">
                  {activeLobby.hostId === user.uid && activeLobby.status === 'waiting' && (
                    <button
                      onClick={startGame}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                      <Play className="w-5 h-5" />
                      Oyunu Başlat
                    </button>
                  )}
                  {activeLobby.status === 'playing' && (
                    <button
                      onClick={() => onGoToTrade && onGoToTrade()}
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      <Play className="w-5 h-5" />
                      Piyasaya Dön
                    </button>
                  )}
                  <button
                    onClick={leaveLobby}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-colors ${
                      activeLobby.hostId === user.uid 
                        ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <LogOut className="w-5 h-5" />
                    {activeLobby.hostId === user.uid ? 'Lobiyi Kapat' : 'Lobiden Ayrıl'}
                  </button>
                </div>
              </div>

              {/* Sağ Kolon: Lobi Sohbet Alanı */}
              <div className="flex flex-col bg-gray-50 rounded-xl border border-gray-200 p-4 h-[450px]">
                <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2 mb-3 border-b border-gray-200 pb-2">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  Lobi Sohbeti
                </h3>

                {/* Mesaj Listesi */}
                <div className="flex-1 overflow-y-auto mb-3 space-y-3 pr-1">
                  {(!activeLobby.messages || activeLobby.messages.length === 0) ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                      <MessageSquare className="w-8 h-8 text-gray-300 mb-2" />
                      <p className="text-xs text-gray-500">Henüz mesaj yok. Bir şeyler yazarak sohbeti başlatın!</p>
                    </div>
                  ) : (
                    activeLobby.messages.map((msg: any) => {
                      const isMe = msg.senderUid === user.uid;
                      return (
                        <div key={msg.id} className={`flex items-start gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                          {msg.senderAvatar ? (
                            <img src={msg.senderAvatar} alt={msg.senderName} className="w-7 h-7 rounded-full bg-white border border-gray-200" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-7 h-7 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs shrink-0">
                              {msg.senderName ? msg.senderName.charAt(0).toUpperCase() : '?'}
                            </div>
                          )}
                          <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                            <span className="text-[10px] text-gray-500 mb-0.5">{msg.senderName}</span>
                            <div className={`p-2.5 rounded-2xl text-sm ${
                              isMe 
                                ? 'bg-blue-600 text-white rounded-tr-none' 
                                : 'bg-white text-gray-900 border border-gray-200 rounded-tl-none'
                            }`}>
                              <p className="break-words leading-relaxed">{msg.text}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Mesaj Yazma Alanı */}
                <form onSubmit={sendChatMessage} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Mesajınızı yazın..."
                    value={chatMessageInput}
                    onChange={e => setChatMessageInput(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!chatMessageInput.trim()}
                    className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Search className="w-5 h-5 text-gray-500" />
              Oda Koduyla Katıl
            </h3>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="6 Haneli Kod (Örn: A1B2C3)"
                value={roomCodeInput}
                onChange={e => setRoomCodeInput(e.target.value.toUpperCase())}
                maxLength={6}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none uppercase font-mono tracking-wider"
              />
              <button
                onClick={joinLobbyByCode}
                disabled={roomCodeInput.length < 3}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Katıl
              </button>
            </div>
            {joinError && <p className="text-red-500 text-sm mt-2">{joinError}</p>}
          </div>

          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <h2 className="text-xl font-bold text-gray-900">Aktif Lobiler</h2>
              <div className="flex gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Lobi İsmi (Opsiyonel)"
                  value={customLobbyName}
                  onChange={e => setCustomLobbyName(e.target.value)}
                  className="flex-1 sm:w-48 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button
                  onClick={createLobby}
                  className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  Lobi Kur
                </button>
              </div>
            </div>
            
            {lobbies.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900">Şu an aktif lobi yok</h3>
                <p className="text-gray-500 text-sm">İlk lobiyi sen kur ve arkadaşlarını davet et!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lobbies.map(lobby => (
                  <div key={lobby.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900">{lobby.name}</h3>
                        {lobby.roomCode && <p className="text-xs font-mono text-gray-500 mt-0.5">KOD: {lobby.roomCode}</p>}
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold \${
                        lobby.status === 'waiting' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {lobby.status === 'waiting' ? 'BEKLİYOR' : 'OYUNDA'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                      <Users className="w-4 h-4" />
                      <span>{lobby.players?.length || 0} Oyuncu</span>
                    </div>
                                        <div className="flex gap-2">
                      <button
                        onClick={() => joinLobby(lobby.id)}
                        disabled={lobby.status !== 'waiting'}
                        className="flex-1 py-2 bg-gray-50 hover:bg-gray-100 text-gray-900 border border-gray-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {lobby.status === 'waiting' ? 'Katıl' : 'Oyun Başladı'}
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => adminCloseLobby(lobby.id)}
                          className="px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-lg text-sm font-medium transition-colors"
                        >
                          Sil (Admin)
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
