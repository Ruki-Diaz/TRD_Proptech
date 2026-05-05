import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Properties from './pages/Properties';
import PropertyDetail from './pages/PropertyDetail';
import SavedProperties from './pages/SavedProperties';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PostProperty from './pages/PostProperty';
import EditProperty from './pages/EditProperty';
import AdminDashboard from './pages/AdminDashboard';
import Settings from './pages/Settings';
import About from './pages/About';
import Contact from './pages/Contact';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';
import AgentProfile from './pages/AgentProfile';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import { SavedPropertiesProvider } from './context/SavedPropertiesContext';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <SavedPropertiesProvider>
          <Router>
            <div className="flex flex-col min-h-screen bg-[#050505] text-slate-50 font-sans selection:bg-teal-500/30 selection:text-teal-200">
              <Navbar />
              <main className="flex-grow">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/properties" element={<Properties />} />
                  <Route path="/properties/:slug" element={<PropertyDetail />} />
                  <Route path="/saved" element={<SavedProperties />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/post-property" element={<ProtectedRoute allowedRoles={['agent', 'admin']}><PostProperty /></ProtectedRoute>} />
                  <Route path="/dashboard/properties/:propertyId/edit" element={<ProtectedRoute allowedRoles={['agent', 'admin']}><EditProperty /></ProtectedRoute>} />
                  <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/agents/:id" element={<AgentProfile />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </Router>
        </SavedPropertiesProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
