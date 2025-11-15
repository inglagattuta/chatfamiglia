import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, Users, Bell, BellOff, LogOut, UserPlus, Home } from "lucide-react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { collection, addDoc, query, where, onSnapshot, updateDoc, doc, getDoc, arrayUnion } from "firebase/firestore";
import { getMessaging, getToken } from "firebase/messaging";
import { auth, db } from "./firebase";

// (Solo se hai esportato messaging da firebase.js, altrimenti crea qui)
const messaging = getMessaging();


function App() {
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [familyId, setFamilyId] = useState("");
  const [currentFamily, setCurrentFamily] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      if (u) {
        setUser(u);
        setScreen("family");
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (currentFamily) {
      const q = query(collection(db, "messages"), where("familyId", "==", currentFamily.id));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setMessages(snapshot.docs.map((doc) => doc.data()));
      });
      return unsubscribe;
    }
  }, [currentFamily]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Registrazione
  const handleSignUp = async () => {
    if (email && password && name) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        setUser(userCredential.user);
        setScreen("family");
      } catch (e) {
        alert("Errore registrazione: " + e.message);
      }
    }
  };

  // Login
  const handleSignIn = async () => {
    if (email && password) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        setUser(userCredential.user);
        setScreen("family");
      } catch (e) {
        alert("Errore login: " + e.message);
      }
    }
  };

  // Logout
  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setCurrentFamily(null);
    setMessages([]);
    setScreen("login");
  };

  // Crea nuova famiglia
  const handleCreateFamily = async () => {
    if (familyName.trim()) {
      try {
        const familyRef = await addDoc(collection(db, "families"), {
          name: familyName,
          members: [auth.currentUser.uid],
          createdAt: Date.now(),
        });
        setCurrentFamily({ id: familyRef.id, name: familyName, members: [auth.currentUser.uid] });
        setScreen("chat");
      } catch (e) {
        alert("Errore creazione famiglia: " + e.message);
      }
    }
  };

  // Unisciti a una famiglia tramite ID
  const handleJoinFamily = async () => {
    if (familyId.trim()) {
      try {
        const familyDocRef = doc(db, "families", familyId);
        const familySnap = await getDoc(familyDocRef);
        if (familySnap.exists()) {
          if (!familySnap.data().members.includes(auth.currentUser.uid)) {
            await updateDoc(familyDocRef, {
              members: arrayUnion(auth.currentUser.uid)
            });
          }
          setCurrentFamily({ id: familyId, ...familySnap.data() });
          setScreen("chat");
        } else {
          alert("Famiglia non trovata!");
        }
      } catch (e) {
        alert("Errore join famiglia: " + e.message);
      }
    }
  };
import { getMessaging, getToken } from "firebase/messaging";
import { messaging } from "./firebase";

const requestNotificationPermission = async () => {
  if ("Notification" in window) {
    const permission = await Notification.requestPermission();
    setNotificationsEnabled(permission === "granted");
    if (permission === "granted") {
      const token = await getToken(messaging, { vapidKey: "BHxZ_FoGoLNLbF9A84f4-2ygWWtE9I3OPjp0cNY7236DutFGOvmYOnXcKqWqWx8_cleV18kpIoSbhNtIePkcT8g" });
      alert("Notifiche attivate! (Token FCM: " + token + ")");
    }
  }
};

  // Invia messaggio nella chat
  const handleSendMessage = async () => {
    if (newMessage.trim() && currentFamily) {
      try {
        await addDoc(collection(db, "messages"), {
          familyId: currentFamily.id,
          userId: auth.currentUser.uid,
          userName: user?.displayName || email,
          text: newMessage,
          timestamp: Date.now(),
        });
        setNewMessage("");
      } catch (e) {
        alert("Errore invio messaggio: " + e.message);
      }
    }
  };
import { getMessaging, getToken } from "firebase/messaging";
import { messaging } from "./firebase"; // Se lo esporti dal file firebase.js

const requestNotificationPermission = async () => {
  if ("Notification" in window) {
    const permission = await Notification.requestPermission();
    setNotificationsEnabled(permission === "granted");
    if (permission === "granted") {
      const token = await getToken(messaging, { vapidKey: "BHxZ_FoGoLNLbF9A84f4-2ygWWtE9I3OPjp0cNY7236DutFGOvmYOnXcKqWqWx8_cleV18kpIoSbhNtIePkcT8g" });
      // Salva il token su Firestore per l'utente (lo userai dal backend per inviare notifiche)
      alert("Token push: " + token);
    }
  }
};

  // Notifiche browser (facoltativo)
  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === "granted");
    }
  };

  const handleKeyPress = (e, action) => {
    if (e.key === "Enter") {
      e.preventDefault();
      action();
    }
  };

  // --- RENDER ---

  if (screen === "login" || screen === "signup") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <MessageCircle className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-800">Chat Famiglia</h1>
            <p className="text-gray-600 mt-2">Rimani connesso con chi ami</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, handleSignIn)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="tua@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, handleSignIn)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>
            {screen === "signup" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, handleSignUp)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Il tuo nome"
                />
              </div>
            )}
            <button
              onClick={handleSignIn}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition"
            >
              Accedi
            </button>
            <button
              onClick={() => {
                // Unico click: se sei già su "signup" e i dati sono compilati, registri, altrimenti mostra il campo nome
                if (screen === "signup" && name && email && password) {
                  handleSignUp();
                } else {
                  setScreen("signup");
                }
              }}
              className="w-full bg-white text-indigo-600 py-3 rounded-lg font-medium border-2 border-indigo-600 hover:bg-indigo-50 transition"
            >
              Registrati
            </button>
          </div>
          <p className="text-xs text-gray-500 text-center mt-6">
            In produzione usi Firebase Authentication
          </p>
        </div>
      </div>
    );
  }

  if (screen === "family") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <Users className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-800">Ciao, {user?.email}!</h1>
            <p className="text-gray-600 mt-2">Crea o unisciti a una famiglia</p>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Crea nuova famiglia</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, handleCreateFamily)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Nome famiglia"
              />
              <button
                onClick={handleCreateFamily}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                Crea
              </button>
            </div>
          </div>
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">oppure</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Unisciti a una famiglia</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={familyId}
                onChange={(e) => setFamilyId(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, handleJoinFamily)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="ID famiglia"
              />
              <button
                onClick={handleJoinFamily}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
              >
                <UserPlus className="w-5 h-5" />
                Unisciti
              </button>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full mt-6 text-gray-600 py-2 hover:text-gray-800 transition flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Esci
          </button>
        </div>
      </div>
    );
  }

  // Chat screen
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="bg-indigo-600 text-white p-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Home className="w-6 h-6" />
            <div>
              <h1 className="text-xl font-bold">{currentFamily?.name}</h1>
              <p className="text-sm text-indigo-200">ID: {currentFamily?.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={requestNotificationPermission}
              className="p-2 hover:bg-indigo-700 rounded-lg transition"
              title={notificationsEnabled ? "Notifiche attive" : "Attiva notifiche"}
            >
              {notificationsEnabled ? <Bell className="w-6 h-6" /> : <BellOff className="w-6 h-6" />}
            </button>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-indigo-700 rounded-lg transition"
              title="Esci"
            >
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-20">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Nessun messaggio ancora. Inizia la conversazione!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.timestamp}
                className={`flex ${msg.userId === user?.uid ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                    msg.userId === user?.uid ? "bg-indigo-600 text-white" : "bg-white text-gray-800 shadow"
                  }`}
                >
                  {msg.userId !== user?.uid && (
                    <p className="text-xs font-semibold mb-1 opacity-70">{msg.userName}</p>
                  )}
                  <p className="break-words">{msg.text}</p>
                  <p className={`text-xs mt-1 ${msg.userId === user?.uid ? "text-indigo-200" : "text-gray-500"}`}>
                    {new Date(msg.timestamp).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => handleKeyPress(e, handleSendMessage)}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Scrivi un messaggio..."
          />
          <button
            onClick={handleSendMessage}
            className="bg-indigo-600 text-white p-3 rounded-full hover:bg-indigo-700 transition"
          >
            <Send className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
