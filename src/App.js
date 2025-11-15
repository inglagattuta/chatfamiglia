import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Users, Bell, BellOff, LogOut, UserPlus, Home } from 'lucide-react';

// Simulazione Firebase (in produzione useresti il vero Firebase SDK)
const FirebaseSimulator = {
  currentUser: null,
  families: {},
  messages: {},
  subscribers: new Set(),
  
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  },
  
  notify() {
    this.subscribers.forEach(cb => cb());
  },
  
  async signUp(email, password, name) {
    const userId = 'user_' + Date.now();
    this.currentUser = { id: userId, email, name };
    localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
    return this.currentUser;
  },
  
  async signIn(email, password) {
    const userId = 'user_' + Date.now();
    this.currentUser = { id: userId, email, name: email.split('@')[0] };
    localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
    return this.currentUser;
  },
  
  async signOut() {
    this.currentUser = null;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentFamily');
  },
  
  async createFamily(familyName) {
    const familyId = 'fam_' + Date.now();
    this.families[familyId] = {
      id: familyId,
      name: familyName,
      members: [this.currentUser.id],
      createdAt: Date.now()
    };
    this.messages[familyId] = [];
    localStorage.setItem('families', JSON.stringify(this.families));
    localStorage.setItem('messages', JSON.stringify(this.messages));
    return familyId;
  },
  
  async joinFamily(familyId) {
    if (this.families[familyId]) {
      if (!this.families[familyId].members.includes(this.currentUser.id)) {
        this.families[familyId].members.push(this.currentUser.id);
        localStorage.setItem('families', JSON.stringify(this.families));
      }
      return true;
    }
    return false;
  },
  
  async sendMessage(familyId, text) {
    const message = {
      id: 'msg_' + Date.now(),
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      text,
      timestamp: Date.now()
    };
    
    if (!this.messages[familyId]) {
      this.messages[familyId] = [];
    }
    
    this.messages[familyId].push(message);
    localStorage.setItem('messages', JSON.stringify(this.messages));
    
    if (Notification.permission === 'granted') {
      new Notification('Nuovo messaggio da ' + message.userName, {
        body: text,
        icon: '💬',
        tag: familyId
      });
    }
    
    this.notify();
    return message;
  },
  
  getMessages(familyId) {
    return this.messages[familyId] || [];
  },
  
  getFamily(familyId) {
    return this.families[familyId];
  },
  
  init() {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      this.currentUser = JSON.parse(stored);
    }
    
    const families = localStorage.getItem('families');
    if (families) {
      this.families = JSON.parse(families);
    }
    
    const messages = localStorage.getItem('messages');
    if (messages) {
      this.messages = JSON.parse(messages);
    }
  }
};

function App() {
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [familyId, setFamilyId] = useState('');
  const [currentFamily, setCurrentFamily] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    FirebaseSimulator.init();
    
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      setUser(JSON.parse(stored));
      const storedFamily = localStorage.getItem('currentFamily');
      if (storedFamily) {
        const fam = FirebaseSimulator.getFamily(storedFamily);
        if (fam) {
          setCurrentFamily(fam);
          setMessages(FirebaseSimulator.getMessages(storedFamily));
          setScreen('chat');
        } else {
          setScreen('family');
        }
      } else {
        setScreen('family');
      }
    }
    
    const unsubscribe = FirebaseSimulator.subscribe(() => {
      if (currentFamily) {
        setMessages([...FirebaseSimulator.getMessages(currentFamily.id)]);
      }
    });
    
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (currentFamily) {
      setMessages(FirebaseSimulator.getMessages(currentFamily.id));
    }
  }, [currentFamily]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSignUp = async () => {
    if (email && password && name) {
      const newUser = await FirebaseSimulator.signUp(email, password, name);
      setUser(newUser);
      setScreen('family');
    }
  };

  const handleSignIn = async () => {
    if (email && password) {
      const loggedUser = await FirebaseSimulator.signIn(email, password);
      setUser(loggedUser);
      setScreen('family');
    }
  };

  const handleCreateFamily = async () => {
    if (familyName.trim()) {
      const newFamilyId = await FirebaseSimulator.createFamily(familyName);
      const family = FirebaseSimulator.getFamily(newFamilyId);
      setCurrentFamily(family);
      localStorage.setItem('currentFamily', newFamilyId);
      setScreen('chat');
    }
  };

  const handleJoinFamily = async () => {
    if (familyId.trim()) {
      const success = await FirebaseSimulator.joinFamily(familyId);
      if (success) {
        const family = FirebaseSimulator.getFamily(familyId);
        setCurrentFamily(family);
        localStorage.setItem('currentFamily', familyId);
        setScreen('chat');
      } else {
        alert('Famiglia non trovata!');
      }
    }
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() && currentFamily) {
      await FirebaseSimulator.sendMessage(currentFamily.id, newMessage);
      setNewMessage('');
    }
  };

  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === 'granted');
    }
  };

  const handleLogout = async () => {
    await FirebaseSimulator.signOut();
    setUser(null);
    setCurrentFamily(null);
    setMessages([]);
    setScreen('login');
  };

  if (screen === 'login') {
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
            
            {screen === 'signup' && (
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
                if (screen === 'signup' && name && email && password) {
                  handleSignUp();
                } else {
                  setScreen('signup');
                }
              }}
              className="w-full bg-white text-indigo-600 py-3 rounded-lg font-medium border-2 border-indigo-600 hover:bg-indigo-50 transition"
            >
              Registrati
            </button>
          </div>
          
          <p className="text-xs text-gray-500 text-center mt-6">
            Demo: In produzione useresti Firebase Authentication
          </p>
        </div>
      </div>
    );
  }

  if (screen === 'family') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <Users className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-800">Ciao, {user?.name}!</h1>
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
              title={notificationsEnabled ? 'Notifiche attive' : 'Attiva notifiche'}
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
                key={msg.id}
                className={`flex ${msg.userId === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                    msg.userId === user?.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-800 shadow'
                  }`}
                >
                  {msg.userId !== user?.id && (
                    <p className="text-xs font-semibold mb-1 opacity-70">{msg.userName}</p>
                  )}
                  <p className="break-words">{msg.text}</p>
                  <p className={`text-xs mt-1 ${msg.userId === user?.id ? 'text-indigo-200' : 'text-gray-500'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
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
