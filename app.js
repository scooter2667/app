import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  addDoc, 
  onSnapshot, 
  updateDoc, 
  deleteDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithCustomToken, 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  Settings, 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  Check, 
  ChevronRight, 
  Star, 
  Zap, 
  Shield, 
  Truck, 
  Instagram, 
  Twitter, 
  Facebook,
  Menu,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  Globe,
  Battery,
  Send,
  Upload,
  Eye,
  CreditCard,
  ShoppingBag,
  Info,
  Package,
  Plane,
  Lock,
  ChevronDown
} from 'lucide-react';

// --- Firebase Configuration ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'voltscoot-ultra-pro';

export default function App() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [orders, setOrders] = useState([]);
  
  // Admin State
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [adminTab, setAdminTab] = useState('orders');

  // Dynamic Page Settings
  const [pageSettings, setPageSettings] = useState({
    hero: {
      title: "Redefining Urban Velocity",
      subtitle: "Pure electric precision for the modern explorer. Swiss engineered, street perfected.",
      image: "https://images.unsplash.com/photo-1605333396915-47ed6b68a00e?auto=format&fit=crop&q=80&w=1200"
    },
    feature1: {
      title: "FluxDrive™ Propulsion",
      desc: "Instant torque, silent delivery. Our proprietary motor technology redefines how you move through the city.",
      image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=800"
    },
    feature2: {
      title: "Global Sustainability",
      desc: "Built with 100% recyclable materials and solar energy. We ship worldwide with zero carbon impact.",
      image: "https://images.unsplash.com/photo-1517520287167-4bbf64a00d66?auto=format&fit=crop&q=80&w=800"
    }
  });
  
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isBuying, setIsBuying] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [modalType, setModalType] = useState('product'); 
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [viewingOrder, setViewingOrder] = useState(null);

  // --- Auth & Admin Route Check ---
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);

    // Check URL for Admin Mode
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true') {
      setIsAdminMode(true);
    }

    return () => unsubscribe();
  }, []);

  // --- Data Sync ---
  useEffect(() => {
    if (!user) return;

    const paths = {
      products: collection(db, 'artifacts', appId, 'public', 'data', 'products'),
      reviews: collection(db, 'artifacts', appId, 'public', 'data', 'reviews'),
      gallery: collection(db, 'artifacts', appId, 'public', 'data', 'gallery'),
      orders: collection(db, 'artifacts', appId, 'public', 'data', 'orders'),
      settings: doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'pageConfig')
    };

    const unsubProducts = onSnapshot(paths.products, (snap) => setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubReviews = onSnapshot(paths.reviews, (snap) => setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubGallery = onSnapshot(paths.gallery, (snap) => setGallery(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubOrders = onSnapshot(paths.orders, (snap) => {
      const sorted = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => b.createdAt - a.createdAt);
      setOrders(sorted);
    });
    const unsubSettings = onSnapshot(paths.settings, (docSnap) => {
      if (docSnap.exists()) setPageSettings(docSnap.data());
    });

    return () => {
      unsubProducts(); unsubReviews(); unsubGallery(); unsubOrders(); unsubSettings();
    };
  }, [user]);

  // --- CRUD & Image Logic ---
  const handleFileUpload = (e, callback) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => callback(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPassword === "admin123") { // Default password
      setIsAuthorized(true);
    } else {
      alert("Invalid Admin Password");
    }
  };

  const updatePageConfig = async (newData) => {
    if (!user) return;
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'pageConfig'), newData);
  };

  const saveItem = async (data) => {
    if (!user) return;
    const colName = modalType === 'product' ? 'products' : modalType === 'review' ? 'reviews' : 'gallery';
    const colRef = collection(db, 'artifacts', appId, 'public', 'data', colName);
    
    if (editingItem?.id) {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', colName, editingItem.id), data);
    } else {
      await addDoc(colRef, { ...data, createdAt: Date.now() });
    }
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const deleteItem = async (id, type) => {
    if (!user) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', type, id));
  };

  const submitOrder = async (orderData) => {
    if (!user) return;
    const ordersRef = collection(db, 'artifacts', appId, 'public', 'data', 'orders');
    await addDoc(ordersRef, { 
      ...orderData, 
      productId: selectedProduct?.id || 'general', 
      productName: selectedProduct?.name || 'Inquiry/General Order',
      productPrice: selectedProduct?.price || 0,
      status: 'new',
      reservationFee: 250,
      createdAt: Date.now() 
    });
    setIsBuying(false);
    setSelectedProduct(null);
    alert("Success! Your reservation data has been transmitted to our headquarters. Our team will contact you shortly.");
  };

  // --- Sub-Components ---
  const Navbar = () => (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <div 
          className="text-lg font-bold tracking-tight text-blue-600 cursor-pointer flex items-center gap-2 select-none"
          onClick={() => setCurrentPage('home')}
        >
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white text-[10px]">V</div>
          VOLTSCOOT
        </div>

        <div className="hidden lg:flex items-center gap-8 ml-auto font-medium text-[11px] uppercase tracking-widest text-zinc-400">
          {['home', 'products', 'services', 'gallery', 'reviews', 'contact'].map(page => (
            <button key={page} onClick={() => setCurrentPage(page)} className={`hover:text-blue-600 transition-all ${currentPage === page ? 'text-blue-600' : ''}`}>
              {page}
            </button>
          ))}
          {isAuthorized && (
            <button onClick={() => setCurrentPage('admin-dashboard')} className="flex items-center gap-2 text-blue-600 font-bold border-l pl-8 border-zinc-100">
              <Settings size={14} /> ADMIN
            </button>
          )}
        </div>

        <button className="lg:hidden ml-4 text-zinc-900" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          <Menu size={20} />
        </button>
      </div>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b p-6 flex flex-col gap-4 animate-in slide-in-from-top duration-300">
           {['home', 'products', 'services', 'gallery', 'reviews', 'contact'].map(page => (
            <button key={page} onClick={() => { setCurrentPage(page); setMobileMenuOpen(false); }} className="text-left font-bold text-xs uppercase tracking-widest py-2 text-zinc-600">
              {page}
            </button>
          ))}
        </div>
      )}
    </nav>
  );

  const AdminLogin = () => (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-6 pt-32">
      <div className="bg-white p-10 rounded-[40px] shadow-xl w-full max-w-md border border-zinc-100 space-y-8 animate-in zoom-in duration-300">
         <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white mx-auto shadow-lg shadow-blue-100 mb-6">
               <Lock size={32} />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Admin Authentication</h2>
            <p className="text-zinc-400 text-sm">Enter the control key to manage VoltScoot.</p>
         </div>
         <form onSubmit={handleAdminLogin} className="space-y-4">
            <input 
              type="password" 
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Admin Password"
              className="w-full p-5 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:ring-2 ring-blue-600 font-bold"
            />
            <button type="submit" className="w-full py-5 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all text-xs uppercase tracking-widest shadow-xl shadow-blue-50">
               Authenticate Access
            </button>
         </form>
         <div className="text-center pt-4">
            <button onClick={() => { setIsAdminMode(false); window.history.replaceState(null, '', window.location.pathname); }} className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest hover:text-zinc-900 transition-colors">Return to Site</button>
         </div>
      </div>
    </div>
  );

  const Home = () => (
    <div className="animate-in fade-in duration-700">
      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 text-center bg-white relative overflow-hidden">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-blue-50/50 blur-[120px] rounded-full -z-10"></div>
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 rounded-full border border-blue-100 text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] animate-in slide-in-from-top duration-1000">
            Global Leader in Electric Transit
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-zinc-900 tracking-tighter leading-[0.9] animate-in zoom-in duration-700">
            {pageSettings.hero.title}
          </h1>
          <p className="text-lg text-zinc-500 max-w-xl mx-auto leading-relaxed animate-in fade-in duration-1000 delay-300">
            {pageSettings.hero.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4 animate-in fade-in slide-in-from-bottom duration-1000 delay-500">
             <button onClick={() => setCurrentPage('products')} className="px-12 py-5 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 hover:scale-105 transition-all text-xs uppercase tracking-widest shadow-2xl shadow-blue-100">View Collection</button>
             <button onClick={() => setCurrentPage('services')} className="px-12 py-5 bg-white text-zinc-900 font-bold rounded-full border border-zinc-200 hover:bg-zinc-50 transition-all text-xs uppercase tracking-widest">Our Ecosystem</button>
          </div>
          <div className="pt-20 animate-in slide-in-from-bottom duration-1000 delay-700">
            <img src={pageSettings.hero.image} className="w-full max-w-5xl mx-auto rounded-[60px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] border-b-8 border-blue-600" alt="VoltScoot Hero" />
          </div>
        </div>
      </section>

      {/* Quick Discover Section */}
      <section className="py-24 px-8 bg-zinc-50 border-y border-zinc-100">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-10">
          {[
            { title: "SmartRide OS", desc: "Integrated HUD for navigation and telemetry.", icon: <Zap size={24} /> },
            { title: "Direct Logistics", desc: "Door-to-door delivery in under 72 hours.", icon: <Plane size={24} /> },
            { title: "Full Warranty", desc: "2-year comprehensive global coverage.", icon: <Shield size={24} /> }
          ].map((item, i) => (
            <div key={i} className="p-12 bg-white rounded-[40px] border border-zinc-100 hover:shadow-xl transition-all text-center group">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                {item.icon}
              </div>
              <h3 className="text-2xl font-bold text-zinc-900 mb-3">{item.title}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Section 1: Dynamic Performance */}
      <section className="py-32 px-6 max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center">
        <div className="relative group overflow-hidden rounded-[50px] shadow-2xl animate-in slide-in-from-left duration-700">
           <img src={pageSettings.feature1.image} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
        </div>
        <div className="space-y-8 animate-in slide-in-from-right duration-700">
           <div className="text-blue-600 font-bold tracking-[0.4em] text-[10px] uppercase">Peak Performance</div>
           <h2 className="text-5xl font-bold tracking-tight text-zinc-900 leading-tight">{pageSettings.feature1.title}</h2>
           <p className="text-lg text-zinc-500 leading-relaxed">{pageSettings.feature1.desc}</p>
           <button onClick={() => setCurrentPage('services')} className="flex items-center gap-3 text-zinc-900 font-bold text-xs uppercase tracking-[0.2em] group">
             Detailed Specs <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
           </button>
        </div>
      </section>

      {/* Dynamic Products Section */}
      <section className="py-32 px-6 bg-zinc-900 text-white rounded-[80px] mx-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-4">
             <h2 className="text-5xl font-bold tracking-tight italic">THE FLEET.</h2>
             <p className="text-zinc-400 text-sm font-bold uppercase tracking-widest">Available Models for Immediate Reservation</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
             {products.length === 0 ? (
               <div className="col-span-full py-20 text-center text-zinc-600 font-bold italic">No models currently listed.</div>
             ) : products.slice(0, 4).map(p => (
               <div key={p.id} onClick={() => setSelectedProduct(p)} className="group cursor-pointer">
                 <div className="relative aspect-[3/4] rounded-[40px] overflow-hidden bg-zinc-800 mb-8 shadow-xl">
                   <img src={p.image} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-1000 group-hover:scale-110" />
                   <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent"></div>
                   <div className="absolute bottom-8 left-8 right-8 flex items-center justify-between">
                      <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl text-white shadow-xl"><Eye size={20} /></div>
                      <span className="text-2xl font-bold italic tracking-tighter">${p.price}</span>
                   </div>
                 </div>
                 <h3 className="text-xl font-bold text-center tracking-tight group-hover:text-blue-400 transition-colors uppercase italic">{p.name}</h3>
               </div>
             ))}
          </div>
          <div className="text-center mt-20">
             <button onClick={() => setCurrentPage('products')} className="px-10 py-4 border border-zinc-700 rounded-full text-zinc-400 font-bold uppercase text-[10px] tracking-widest hover:border-white hover:text-white transition-all">Browse Full Catalog</button>
          </div>
        </div>
      </section>

      {/* Feature Section 2: Sustainability */}
      <section className="py-32 px-6 max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center">
        <div className="space-y-8 order-2 lg:order-1 animate-in slide-in-from-left duration-700">
           <div className="text-blue-600 font-bold tracking-[0.4em] text-[10px] uppercase">Responsibility</div>
           <h2 className="text-5xl font-bold tracking-tight text-zinc-900 leading-tight">{pageSettings.feature2.title}</h2>
           <p className="text-lg text-zinc-500 leading-relaxed">{pageSettings.feature2.desc}</p>
           <div className="flex gap-12 pt-4">
              <div className="space-y-1"><div className="text-3xl font-bold text-blue-600 tracking-tighter italic">0%</div><p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Emissions</p></div>
              <div className="space-y-1"><div className="text-3xl font-bold text-blue-600 tracking-tighter italic">100%</div><p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Recyclable</p></div>
           </div>
        </div>
        <div className="relative group overflow-hidden rounded-[50px] shadow-2xl order-1 lg:order-2 animate-in slide-in-from-right duration-700">
           <img src={pageSettings.feature2.image} className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-105" />
        </div>
      </section>

      {/* Dynamic Gallery Section */}
      <section className="py-32 px-8 bg-zinc-50">
         <div className="max-w-7xl mx-auto space-y-16">
            <div className="text-center">
               <h2 className="text-5xl font-bold tracking-tight text-zinc-900 italic">COMMUNITY SQUAD.</h2>
               <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mt-2">Captured by Our Riders Across the Globe</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 animate-in fade-in duration-1000">
               {gallery.length === 0 ? <p className="col-span-full text-center py-10 text-zinc-300 font-bold uppercase text-[10px]">No Gallery Posts</p> : gallery.map(g => (
                 <div key={g.id} className="aspect-square rounded-3xl overflow-hidden shadow-sm group">
                    <img src={g.image} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-125" alt="VoltScoot Community" />
                 </div>
               ))}
            </div>
         </div>
      </section>

      {/* Dynamic Testimonials */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <div className="text-blue-600 font-bold tracking-[0.4em] text-[10px] uppercase mb-4">Verified Riders</div>
            <h2 className="text-5xl font-bold text-zinc-900 tracking-tight italic uppercase">Pure Adrenaline.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            {reviews.length === 0 ? <p className="col-span-full text-center py-10 text-zinc-300 font-bold uppercase text-[10px]">No Reviews Yet</p> : reviews.map(r => (
              <div key={r.id} className="p-12 rounded-[50px] bg-zinc-50 border border-zinc-100 relative group transition-all hover:bg-white hover:shadow-2xl">
                <p className="text-lg italic text-zinc-600 leading-relaxed mb-10">"{r.text}"</p>
                <div className="flex items-center gap-5">
                   <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-100">{r.user.charAt(0)}</div>
                   <div>
                      <h4 className="font-bold text-zinc-900">{r.user}</h4>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{r.role}</p>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );

  const Services = () => (
    <div className="pt-40 pb-24 px-6 max-w-5xl mx-auto space-y-24 animate-in fade-in duration-700">
       <div className="text-center space-y-6">
          <h1 className="text-6xl font-bold tracking-tighter text-zinc-900 uppercase italic">OUR ECOSYSTEM.</h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">Beyond just selling scooters—we provide a global mobility infrastructure built for the bold.</p>
       </div>
       
       <div className="grid md:grid-cols-3 gap-12">
          {[
            { icon: <Package size={40} />, title: "Premium Sales", desc: "Access to limited edition, high-performance electric bikes. Custom configuration and bespoke colors available." },
            { icon: <Truck size={40} />, title: "White-Glove Delivery", desc: "No assembly required. Our technicians deliver fully configured bikes, calibrate them to your preference, and take you on a test ride." },
            { icon: <Plane size={40} />, title: "Global Logistics", desc: "We handle international HAZMAT certifications and customs for shipping to over 45 countries. Truly borderless velocity." }
          ].map((s, i) => (
            <div key={i} className="space-y-8 p-12 bg-zinc-50 rounded-[50px] border border-zinc-100 hover:bg-white hover:shadow-2xl transition-all duration-500">
               <div className="text-blue-600 bg-white w-20 h-20 rounded-3xl flex items-center justify-center shadow-sm">{s.icon}</div>
               <h3 className="text-2xl font-bold text-zinc-900 tracking-tight">{s.title}</h3>
               <p className="text-zinc-500 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
       </div>

       <div className="bg-zinc-900 text-white p-16 lg:p-24 rounded-[60px] grid lg:grid-cols-2 gap-16 items-center shadow-3xl">
          <div className="space-y-8">
             <div className="text-blue-400 font-bold tracking-[0.4em] text-[10px] uppercase">International Shipping</div>
             <h2 className="text-4xl font-bold tracking-tight italic">BORDERLESS LOGISTICS.</h2>
             <p className="text-zinc-400 text-lg leading-relaxed">
               Shipping an electric bike internationally requires expertise in battery safety and global trade. VoltScoot handles every detail.
             </p>
             <div className="space-y-4 pt-4">
                {[
                  "HAZMAT Certified Battery Crating",
                  "Global GPS Live Tracking",
                  "Duty & Import Tax Management",
                  "Door-to-Door Courier Network"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-widest text-blue-400">
                    <Check size={16} /> {item}
                  </div>
                ))}
             </div>
          </div>
          <div className="aspect-video bg-zinc-800 rounded-[40px] overflow-hidden relative group">
             <img src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-1000" />
             <div className="absolute inset-0 flex items-center justify-center">
                <Globe size={48} className="text-white/20" />
             </div>
          </div>
       </div>
    </div>
  );

  const ProductDetailModal = () => (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-zinc-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-4xl rounded-[50px] shadow-2xl overflow-hidden grid md:grid-cols-2 animate-in zoom-in duration-300">
        <div className="bg-zinc-100 p-12 flex items-center justify-center">
           <img src={selectedProduct.image} className="w-full rounded-[40px] shadow-2xl transition-transform hover:scale-105 duration-700" alt={selectedProduct.name} />
        </div>
        <div className="p-12 space-y-8 relative">
           <button onClick={() => setSelectedProduct(null)} className="absolute top-8 right-8 p-3 hover:bg-zinc-100 rounded-full transition-colors"><X size={24} /></button>
           <div className="space-y-2 pt-6">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.3em]">{selectedProduct.category} Collection</span>
              <h3 className="text-5xl font-bold text-zinc-900 tracking-tighter italic uppercase">{selectedProduct.name}</h3>
           </div>
           <p className="text-lg text-zinc-500 leading-relaxed font-medium">{selectedProduct.description}</p>
           <div className="flex items-center justify-between border-y py-8">
              <div className="text-4xl font-bold text-blue-600 tracking-tighter italic">${selectedProduct.price}</div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Availability</span>
                <span className="text-xs font-bold text-green-500 uppercase">Ships in 48h Worldwide</span>
              </div>
           </div>
           <div className="space-y-4">
              <div className="flex items-center gap-4 text-zinc-900 text-[11px] font-bold uppercase tracking-widest bg-zinc-50 p-4 rounded-2xl">
                 <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shadow-sm"><CreditCard size={18} /></div>
                 $250.00 Reservation Fee Required
              </div>
              <button onClick={() => setIsBuying(true)} className="w-full py-6 bg-blue-600 text-white font-bold rounded-3xl hover:bg-blue-700 transition-all text-sm uppercase tracking-widest shadow-xl shadow-blue-100 flex items-center justify-center gap-3">
                Secure Reservation <ChevronRight size={18} />
              </button>
           </div>
        </div>
      </div>
    </div>
  );

  const OrderFormModal = () => {
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', location: '', country: 'USA' });
    const isInternational = formData.country.toUpperCase() !== 'USA';

    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-zinc-900/80 backdrop-blur-md">
        <div className="bg-white w-full max-w-md rounded-[50px] shadow-2xl p-12 space-y-10 animate-in zoom-in duration-200">
          <div className="flex justify-between items-center">
             <h3 className="text-3xl font-bold tracking-tighter uppercase italic">Checkout.</h3>
             <button onClick={() => setIsBuying(false)} className="p-2 hover:bg-zinc-100 rounded-lg"><X size={20} /></button>
          </div>
          <div className="p-6 bg-zinc-50 rounded-3xl border border-zinc-100 flex items-center gap-6">
             <img src={selectedProduct?.image || "https://images.unsplash.com/photo-1605333396915-47ed6b68a00e?auto=format&fit=crop&q=80&w=200"} className="w-16 h-16 rounded-2xl object-cover shadow-sm" />
             <div>
                <p className="text-sm font-bold text-zinc-900 uppercase italic tracking-tight">{selectedProduct?.name || "Custom Order"}</p>
                <p className="text-sm font-bold text-blue-600">${selectedProduct?.price || "TBD"}</p>
             </div>
          </div>
          <div className="space-y-4">
             <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Full Name" className="w-full p-5 bg-zinc-50 border rounded-2xl text-sm outline-none focus:ring-2 ring-blue-600 font-bold" />
             <input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Email" className="w-full p-5 bg-zinc-50 border rounded-2xl text-sm outline-none focus:ring-2 ring-blue-600 font-bold" />
             <div className="grid grid-cols-2 gap-4">
                <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="Phone" className="w-full p-5 bg-zinc-50 border rounded-2xl text-sm outline-none focus:ring-2 ring-blue-600 font-bold" />
                <input value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} placeholder="Country (e.g. USA)" className="w-full p-5 bg-zinc-50 border rounded-2xl text-sm outline-none focus:ring-2 ring-blue-600 font-bold" />
             </div>
             <textarea value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="Delivery Address" rows="3" className="w-full p-5 bg-zinc-50 border rounded-2xl text-sm outline-none focus:ring-2 ring-blue-600 font-bold" />
          </div>
          <div className="p-8 bg-blue-600 rounded-[40px] text-white space-y-3 shadow-2xl shadow-blue-100">
             <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.3em] opacity-70">
                <span>Immediate Reservation</span>
                <span>$250.00</span>
             </div>
             {isInternational && (
               <div className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200 bg-blue-700/50 p-3 rounded-2xl mt-3 flex items-center gap-2">
                 <Globe size={14} /> International Shipping Surcharge Applies
               </div>
             )}
          </div>
          <button onClick={() => submitOrder(formData)} className="w-full py-6 bg-zinc-900 text-white font-bold rounded-3xl hover:bg-blue-600 transition-all text-xs uppercase tracking-widest shadow-2xl">Confirm & Authorize Payment</button>
        </div>
      </div>
    );
  };

  const AdminPanel = () => (
    <div className="fixed inset-0 z-[100] bg-white pt-14 flex flex-col animate-in slide-in-from-bottom duration-500">
      <div className="bg-zinc-50 border-b border-zinc-100 px-8 py-5 flex items-center justify-between">
         <div className="flex items-center gap-8">
            <h2 className="text-xl font-bold text-zinc-900 italic tracking-tighter">ULTRA-PRO DASHBOARD</h2>
            <div className="flex gap-4">
               {['orders', 'products', 'gallery', 'reviews', 'settings'].map(tab => (
                 <button key={tab} onClick={() => setAdminTab(tab)} className={`text-[10px] font-black uppercase tracking-widest px-6 py-2.5 rounded-full transition-all ${adminTab === tab ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'text-zinc-400 hover:bg-zinc-100'}`}>
                    {tab}
                 </button>
               ))}
            </div>
         </div>
         <div className="flex items-center gap-4">
            <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-300 border px-3 py-1 rounded-full border-zinc-200">System Secure</div>
            <button onClick={() => setIsAuthorized(false)} className="p-2 text-zinc-400 hover:text-red-500 transition-colors"><X size={24} /></button>
         </div>
      </div>

      <div className="flex-grow overflow-auto p-12 bg-zinc-50/20">
        {adminTab === 'orders' && (
          <div className="max-w-7xl mx-auto space-y-6">
             <div className="flex justify-between items-center mb-8">
                <h3 className="text-3xl font-bold tracking-tight italic">ACTIVE RESERVATIONS.</h3>
                <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">{orders.length} TOTAL</span>
             </div>
             {orders.length === 0 ? <p className="text-center py-40 text-zinc-300 font-bold uppercase text-[10px] tracking-widest">No Incoming Leads</p> : (
                <div className="grid gap-6">
                   {orders.map(order => (
                     <div key={order.id} onClick={() => setViewingOrder(order)} className="bg-white p-8 rounded-[40px] border border-zinc-100 flex items-center justify-between hover:shadow-2xl transition-all cursor-pointer group">
                        <div className="flex items-center gap-8">
                           <div className="w-16 h-16 bg-zinc-50 text-zinc-900 rounded-3xl flex items-center justify-center font-bold text-xl group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">{order.name.charAt(0)}</div>
                           <div>
                              <p className="font-bold text-lg text-zinc-900 uppercase italic tracking-tight">{order.productName}</p>
                              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{order.name} • {order.country}</p>
                           </div>
                        </div>
                        <div className="text-right space-y-1">
                           <p className="text-xl font-bold text-blue-600 italic">$250.00 PAID</p>
                           <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">{new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                     </div>
                   ))}
                </div>
             )}
          </div>
        )}

        {adminTab === 'products' && (
           <div className="max-w-7xl mx-auto space-y-12">
              <div className="flex justify-between items-center">
                 <h3 className="text-3xl font-bold tracking-tight italic">FLEET INVENTORY.</h3>
                 <button onClick={() => { setEditingItem(null); setModalType('product'); setIsModalOpen(true); }} className="px-10 py-4 bg-blue-600 text-white font-bold rounded-2xl text-xs tracking-widest uppercase shadow-2xl shadow-blue-100">+ NEW SCOOTER</button>
              </div>
              <div className="grid md:grid-cols-4 gap-8">
                 {products.map(p => (
                   <div key={p.id} className="bg-white p-6 rounded-[40px] border border-zinc-100 space-y-6 shadow-sm hover:shadow-xl transition-all">
                      <img src={p.image} className="w-full h-48 object-cover rounded-[30px] shadow-md grayscale hover:grayscale-0 transition-all duration-700" />
                      <div className="flex justify-between items-start px-2">
                         <div>
                            <p className="font-bold text-lg tracking-tight uppercase italic">{p.name}</p>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{p.category}</p>
                         </div>
                         <div className="flex gap-2">
                            <button onClick={() => { setEditingItem(p); setModalType('product'); setIsModalOpen(true); }} className="p-3 text-blue-600 hover:bg-blue-50 rounded-2xl transition-all shadow-sm"><Edit3 size={16} /></button>
                            <button onClick={() => deleteItem(p.id, 'products')} className="p-3 text-red-500 hover:bg-red-50 rounded-2xl transition-all shadow-sm"><Trash2 size={16} /></button>
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        )}

        {adminTab === 'gallery' && (
           <div className="max-w-7xl mx-auto space-y-12">
              <div className="flex justify-between items-center">
                 <h3 className="text-3xl font-bold tracking-tight italic">GALLERY FEED.</h3>
                 <button onClick={() => { setEditingItem(null); setModalType('gallery'); setIsModalOpen(true); }} className="px-10 py-4 bg-blue-600 text-white font-bold rounded-2xl text-xs tracking-widest uppercase shadow-2xl shadow-blue-100">+ NEW PHOTO</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
                 {gallery.map(g => (
                   <div key={g.id} className="relative aspect-square rounded-[30px] overflow-hidden group shadow-lg border-4 border-white">
                      <img src={g.image} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-125" />
                      <div className="absolute inset-0 bg-red-600/0 hover:bg-red-600/40 transition-all flex items-center justify-center opacity-0 hover:opacity-100">
                         <button onClick={() => deleteItem(g.id, 'gallery')} className="p-4 bg-white rounded-full text-red-600 shadow-xl"><Trash2 size={24} /></button>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        )}

        {adminTab === 'reviews' && (
           <div className="max-w-7xl mx-auto space-y-12">
              <div className="flex justify-between items-center">
                 <h3 className="text-3xl font-bold tracking-tight italic">RIDER FEEDBACK.</h3>
                 <button onClick={() => { setEditingItem(null); setModalType('review'); setIsModalOpen(true); }} className="px-10 py-4 bg-blue-600 text-white font-bold rounded-2xl text-xs tracking-widest uppercase shadow-2xl shadow-blue-100">+ NEW REVIEW</button>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                 {reviews.map(r => (
                   <div key={r.id} className="bg-white p-12 rounded-[50px] border border-zinc-100 space-y-8 relative group hover:shadow-2xl transition-all">
                      <p className="text-lg italic text-zinc-600 leading-relaxed font-medium">"{r.text}"</p>
                      <div className="flex items-center gap-6 pt-6 border-t">
                         <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-bold text-xl">{r.user.charAt(0)}</div>
                         <div>
                            <h4 className="font-bold text-zinc-900 text-lg">{r.user}</h4>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{r.role}</p>
                         </div>
                      </div>
                      <button onClick={() => deleteItem(r.id, 'reviews')} className="absolute top-8 right-8 text-red-400 hover:text-red-600 transition-colors p-2"><Trash2 size={20} /></button>
                   </div>
                 ))}
              </div>
           </div>
        )}

        {adminTab === 'settings' && (
          <div className="max-w-2xl mx-auto space-y-12 pb-20">
             <h3 className="text-3xl font-bold tracking-tight italic text-center mb-10">PAGE CONFIGURATION.</h3>
             <div className="bg-white p-12 rounded-[50px] shadow-sm border space-y-12">
                <div className="space-y-8">
                   <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-300 border-b pb-4">Hero Section</h4>
                   <div className="space-y-6">
                      <label className="block space-y-2 cursor-pointer group">
                         <div className="relative aspect-video rounded-3xl overflow-hidden bg-zinc-100 flex items-center justify-center">
                            {pageSettings.hero.image && <img src={pageSettings.hero.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />}
                            <div className="absolute inset-0 bg-blue-600/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                               <Upload size={32} className="text-white" />
                            </div>
                         </div>
                         <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, (img) => updatePageConfig({ ...pageSettings, hero: { ...pageSettings.hero, image: img } }))} />
                      </label>
                      <input value={pageSettings.hero.title} onChange={e => updatePageConfig({...pageSettings, hero: {...pageSettings.hero, title: e.target.value}})} placeholder="Title" className="w-full p-5 bg-zinc-50 border rounded-2xl text-lg font-bold" />
                      <textarea value={pageSettings.hero.subtitle} onChange={e => updatePageConfig({...pageSettings, hero: {...pageSettings.hero, subtitle: e.target.value}})} placeholder="Subtitle" className="w-full p-5 bg-zinc-50 border rounded-2xl text-sm" />
                   </div>
                </div>

                <div className="space-y-8">
                   <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-300 border-b pb-4">Side Feature 1</h4>
                   <div className="space-y-6">
                      <label className="block cursor-pointer group rounded-3xl overflow-hidden">
                         <img src={pageSettings.feature1.image} className="w-full h-40 object-cover group-hover:grayscale transition-all" />
                         <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, (img) => updatePageConfig({ ...pageSettings, feature1: { ...pageSettings.feature1, image: img } }))} />
                      </label>
                      <input value={pageSettings.feature1.title} onChange={e => updatePageConfig({...pageSettings, feature1: {...pageSettings.feature1, title: e.target.value}})} placeholder="Title" className="w-full p-5 bg-zinc-50 border rounded-2xl text-sm font-bold" />
                      <textarea value={pageSettings.feature1.desc} onChange={e => updatePageConfig({...pageSettings, feature1: {...pageSettings.feature1, desc: e.target.value}})} placeholder="Description" className="w-full p-5 bg-zinc-50 border rounded-2xl text-xs" />
                   </div>
                </div>

                <div className="space-y-8">
                   <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-300 border-b pb-4">Side Feature 2</h4>
                   <div className="space-y-6">
                      <label className="block cursor-pointer group rounded-3xl overflow-hidden">
                         <img src={pageSettings.feature2.image} className="w-full h-40 object-cover group-hover:grayscale transition-all" />
                         <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, (img) => updatePageConfig({ ...pageSettings, feature2: { ...pageSettings.feature2, image: img } }))} />
                      </label>
                      <input value={pageSettings.feature2.title} onChange={e => updatePageConfig({...pageSettings, feature2: {...pageSettings.feature2, title: e.target.value}})} placeholder="Title" className="w-full p-5 bg-zinc-50 border rounded-2xl text-sm font-bold" />
                      <textarea value={pageSettings.feature2.desc} onChange={e => updatePageConfig({...pageSettings, feature2: {...pageSettings.feature2, desc: e.target.value}})} placeholder="Description" className="w-full p-5 bg-zinc-50 border rounded-2xl text-xs" />
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );

  const OrderDetailModal = () => (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-zinc-900/80 backdrop-blur-md">
       <div className="bg-white w-full max-w-lg rounded-[60px] shadow-2xl p-12 space-y-10 animate-in zoom-in duration-300">
          <div className="flex justify-between items-center border-b pb-8">
             <div>
                <h3 className="text-3xl font-bold tracking-tighter uppercase italic">Lead Info.</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-1">Transaction ID: {viewingOrder.id}</p>
             </div>
             <button onClick={() => setViewingOrder(null)} className="p-3 hover:bg-zinc-100 rounded-full transition-colors"><X size={24} /></button>
          </div>
          <div className="space-y-6">
             <div className="grid grid-cols-2 gap-8">
                <div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-300 mb-2">Full Name</p><p className="font-bold text-lg">{viewingOrder.name}</p></div>
                <div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-300 mb-2">Reservation</p><p className="font-bold text-lg text-blue-600 italic">$250.00 PAID</p></div>
             </div>
             <div className="grid grid-cols-2 gap-8">
                <div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-300 mb-2">Email</p><p className="font-bold">{viewingOrder.email}</p></div>
                <div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-300 mb-2">Phone</p><p className="font-bold">{viewingOrder.phone}</p></div>
             </div>
             <div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-300 mb-2">Product Interest</p><p className="font-bold text-xl uppercase italic text-zinc-900 border-l-4 border-blue-600 pl-4">{viewingOrder.productName}</p></div>
             <div className="p-8 bg-zinc-50 rounded-[40px] border space-y-3">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Logistics Destination</p>
                <div className="text-sm font-medium leading-relaxed italic text-zinc-500">
                   {viewingOrder.location}, <span className="font-black text-zinc-900">{viewingOrder.country}</span>
                </div>
             </div>
          </div>
          <div className="flex gap-4">
            <button onClick={() => deleteItem(viewingOrder.id, 'orders').then(() => setViewingOrder(null))} className="flex-1 py-5 bg-red-50 text-red-500 font-bold text-[10px] uppercase tracking-widest rounded-3xl hover:bg-red-500 hover:text-white transition-all">Archive Order</button>
            <button className="flex-1 py-5 bg-blue-600 text-white font-bold text-[10px] uppercase tracking-widest rounded-3xl hover:bg-zinc-900 transition-all">Contact Buyer</button>
          </div>
       </div>
    </div>
  );

  const AdminCrudModal = () => {
    const [formData, setFormData] = useState(editingItem || {
      name: '', price: 0, category: 'Performance', image: '', description: '', user: '', text: '', role: ''
    });

    return (
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-zinc-900/60 backdrop-blur-sm">
        <div className="bg-white w-full max-w-lg rounded-[50px] shadow-2xl p-12 space-y-8 animate-in zoom-in duration-200">
          <div className="flex justify-between items-center border-b pb-6">
            <h3 className="text-2xl font-bold tracking-tighter uppercase italic">Manage {modalType}.</h3>
            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-zinc-100 rounded-lg"><X size={20} /></button>
          </div>
          
          <div className="space-y-4">
            {(modalType === 'product' || modalType === 'gallery') && (
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Visual Component</label>
                <div className="flex items-center gap-6">
                  {formData.image && <img src={formData.image} className="w-20 h-20 rounded-3xl object-cover border-4 border-zinc-50 shadow-sm" />}
                  <label className="flex-grow p-6 border-2 border-dashed border-zinc-200 rounded-[30px] hover:border-blue-500 cursor-pointer flex flex-col items-center justify-center text-zinc-400 transition-all hover:bg-blue-50/20 group">
                    <Upload size={24} className="mb-2 group-hover:text-blue-600" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Select From PC</span>
                    <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, (img) => setFormData({...formData, image: img}))} />
                  </label>
                </div>
              </div>
            )}

            {modalType === 'product' && (
              <>
                <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Model Series" className="w-full p-5 bg-zinc-50 border rounded-2xl text-sm font-bold" />
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: parseInt(e.target.value)})} placeholder="Price ($)" className="w-full p-5 bg-zinc-50 border rounded-2xl text-sm font-bold" />
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-5 bg-zinc-50 border rounded-2xl text-[10px] font-bold uppercase tracking-widest">
                    <option>Performance</option><option>City</option><option>Off-road</option><option>Compact</option>
                  </select>
                </div>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Narrative Description" rows="3" className="w-full p-5 bg-zinc-50 border rounded-2xl text-sm font-medium" />
              </>
            )}

            {modalType === 'review' && (
              <>
                <input value={formData.user} onChange={e => setFormData({...formData, user: e.target.value})} placeholder="Rider Name" className="w-full p-5 bg-zinc-50 border rounded-2xl text-sm font-bold" />
                <input value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} placeholder="Occupation/Role" className="w-full p-5 bg-zinc-50 border rounded-2xl text-sm font-bold" />
                <textarea value={formData.text} onChange={e => setFormData({...formData, text: e.target.value})} placeholder="Testimonial Quote" rows="3" className="w-full p-5 bg-zinc-50 border rounded-2xl text-sm font-medium italic" />
              </>
            )}
          </div>

          <button onClick={() => saveItem(formData)} className="w-full py-6 bg-blue-600 text-white font-bold rounded-3xl hover:bg-zinc-900 transition-all text-xs uppercase tracking-widest shadow-2xl">
            {editingItem ? 'COMMIT UPDATE' : 'PUBLISH ASSET'}
          </button>
        </div>
      </div>
    );
  };

  // --- Final View logic ---
  if (isAdminMode && !isAuthorized) return <AdminLogin />;
  if (currentPage === 'admin-dashboard' && isAuthorized) return <AdminPanel />;

  return (
    <div className="min-h-screen bg-white font-sans text-zinc-900 antialiased selection:bg-blue-600 selection:text-white">
      <Navbar />
      
      {currentPage === 'home' && <Home />}
      {currentPage === 'services' && <Services />}
      
      {currentPage === 'products' && (
        <div className="pt-40 pb-24 px-6 max-w-7xl mx-auto space-y-20 animate-in fade-in duration-500">
           <div className="text-center space-y-4">
              <h1 className="text-6xl font-bold tracking-tighter italic uppercase">FULL CATALOG.</h1>
              <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">The World's Most Advanced Electric Propulsion Units</p>
           </div>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
              {products.map(p => (
                <div key={p.id} onClick={() => setSelectedProduct(p)} className="group cursor-pointer">
                  <div className="aspect-[4/5] rounded-[50px] overflow-hidden bg-zinc-50 mb-8 shadow-sm border group-hover:shadow-3xl transition-all duration-700">
                     <img src={p.image} className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-110" />
                  </div>
                  <h3 className="text-2xl font-bold italic tracking-tighter uppercase">{p.name}</h3>
                  <div className="flex justify-between items-center mt-2 border-t pt-4 border-zinc-50">
                     <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">{p.category} Series</span>
                     <span className="text-xl font-bold text-blue-600 italic tracking-tighter">${p.price}</span>
                  </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {currentPage === 'gallery' && (
        <div className="pt-40 pb-24 px-6 max-w-7xl mx-auto space-y-16 animate-in fade-in">
           <div className="text-center space-y-4">
              <h1 className="text-6xl font-bold tracking-tighter italic uppercase">SOCIAL FEED.</h1>
              <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">Live from the Urban Jungle</p>
           </div>
           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {gallery.map(g => (
                <div key={g.id} className="aspect-square rounded-[40px] overflow-hidden shadow-2xl border-4 border-white transform hover:rotate-2 transition-all">
                   <img src={g.image} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000" />
                </div>
              ))}
           </div>
        </div>
      )}

      {currentPage === 'reviews' && (
        <div className="pt-40 pb-24 px-6 max-w-7xl mx-auto space-y-20 animate-in fade-in">
           <div className="text-center space-y-4">
              <h1 className="text-6xl font-bold tracking-tighter italic uppercase">RIDER VOICE.</h1>
              <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">What the World is Saying About VoltScoot</p>
           </div>
           <div className="grid md:grid-cols-2 gap-10">
              {reviews.map(r => (
                <div key={r.id} className="p-16 bg-zinc-50 rounded-[60px] border space-y-10 hover:shadow-2xl transition-all duration-500 hover:bg-white">
                   <p className="text-2xl italic text-zinc-600 leading-relaxed font-medium">"{r.text}"</p>
                   <div className="flex items-center gap-6 border-t pt-10">
                      <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-blue-100">{r.user.charAt(0)}</div>
                      <div>
                         <h4 className="font-bold text-zinc-900 text-xl tracking-tight uppercase italic">{r.user}</h4>
                         <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{r.role}</p>
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {currentPage === 'contact' && (
        <div className="pt-40 pb-24 px-6 max-w-7xl mx-auto animate-in fade-in">
           <div className="grid lg:grid-cols-2 gap-20">
              <div className="space-y-12">
                 <div className="space-y-4">
                    <h1 className="text-7xl font-bold tracking-tighter italic uppercase">TRANSMIT.</h1>
                    <p className="text-xl text-zinc-400 leading-relaxed">Have a question or looking for a custom enterprise fleet? Reach out directly.</p>
                 </div>
                 <div className="space-y-8">
                    <div className="flex items-center gap-6 group cursor-pointer">
                       <div className="w-16 h-16 bg-zinc-900 text-blue-600 rounded-3xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-xl">
                          <Phone size={24} />
                       </div>
                       <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Global Hotline</p>
                          <p className="text-2xl font-bold text-zinc-900">+1 (800) VOLT-RIDE</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-6 group cursor-pointer">
                       <div className="w-16 h-16 bg-zinc-900 text-blue-600 rounded-3xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-xl">
                          <Mail size={24} />
                       </div>
                       <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Support Terminal</p>
                          <p className="text-2xl font-bold text-zinc-900">hq@voltscoot.com</p>
                       </div>
                    </div>
                 </div>
              </div>
              
              {/* This acts as a General Inquiry / Custom Order form */}
              <div className="bg-zinc-50 p-12 lg:p-16 rounded-[60px] border border-zinc-100 space-y-10 shadow-3xl">
                 <div className="space-y-2">
                    <h3 className="text-3xl font-bold tracking-tight italic uppercase">Direct Connection.</h3>
                    <p className="text-zinc-400 text-sm">Please provide your details below.</p>
                 </div>
                 <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                       <input id="contact-name" placeholder="Full Name" className="w-full p-5 bg-white border border-zinc-100 rounded-3xl text-sm outline-none focus:ring-2 ring-blue-600 font-bold" />
                       <input id="contact-email" placeholder="Email" className="w-full p-5 bg-white border border-zinc-100 rounded-3xl text-sm outline-none focus:ring-2 ring-blue-600 font-bold" />
                    </div>
                    <input id="contact-country" placeholder="Country" className="w-full p-5 bg-white border border-zinc-100 rounded-3xl text-sm outline-none focus:ring-2 ring-blue-600 font-bold" />
                    <textarea id="contact-message" placeholder="Message or Inquiry Details" rows="4" className="w-full p-5 bg-white border border-zinc-100 rounded-3xl text-sm outline-none focus:ring-2 ring-blue-600 font-bold"></textarea>
                 </div>
                 <button 
                   onClick={() => submitOrder({
                     name: document.getElementById('contact-name').value,
                     email: document.getElementById('contact-email').value,
                     country: document.getElementById('contact-country').value,
                     location: document.getElementById('contact-message').value,
                     phone: 'N/A'
                   })}
                   className="w-full py-6 bg-blue-600 text-white font-bold rounded-3xl hover:bg-zinc-900 transition-all text-xs uppercase tracking-widest shadow-2xl shadow-blue-100"
                 >
                    Send Transmission
                 </button>
              </div>
           </div>
        </div>
      )}

      <footer className="bg-white py-12 border-t border-zinc-50">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="text-[11px] font-black text-zinc-200 uppercase tracking-[0.5em] select-none">VOLTSCOOT • ULTRA-PRO • 2025</div>
           <div className="flex gap-10 text-zinc-400">
              <Instagram size={18} className="hover:text-blue-600 cursor-pointer transition-colors" />
              <Twitter size={18} className="hover:text-blue-600 cursor-pointer transition-colors" />
              <Facebook size={18} className="hover:text-blue-600 cursor-pointer transition-colors" />
           </div>
           <div className="text-[9px] font-bold text-zinc-300 uppercase tracking-widest">Designed for the 1%</div>
        </div>
      </footer>

      {/* Overlays */}
      {selectedProduct && !isBuying && <ProductDetailModal />}
      {isBuying && <OrderFormModal />}
      {isModalOpen && <AdminCrudModal />}
      {viewingOrder && <OrderDetailModal />}

      {/* Hidden Admin Entry Info */}
      {isAdminMode && !isAuthorized && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-zinc-900 text-white px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest animate-pulse">
           Administrative Access Panel Pending Authorization
        </div>
      )}
    </div>
  );
}