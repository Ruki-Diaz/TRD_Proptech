import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import ProtectedRoute from './components/ProtectedRoute';
import { SavedPropertiesProvider } from './context/SavedPropertiesContext';
import { AuthProvider } from './context/AuthContext';

const Properties = lazy(() => import('./pages/Properties'));
const PropertyDetail = lazy(() => import('./pages/PropertyDetail'));
const SavedProperties = lazy(() => import('./pages/SavedProperties'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const PostProperty = lazy(() => import('./pages/PostProperty'));
const EditProperty = lazy(() => import('./pages/EditProperty'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Settings = lazy(() => import('./pages/Settings'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const Terms = lazy(() => import('./pages/Terms'));
const AgentProfile = lazy(() => import('./pages/AgentProfile'));
const NotFound = lazy(() => import('./pages/NotFound'));

const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center bg-transparent">
    <div className="w-10 h-10 border-4 border-teal-500/30 border-t-teal-400 rounded-full animate-spin"></div>
  </div>
);

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <SavedPropertiesProvider>
          <Router>
            <div className="flex flex-col min-h-screen bg-[#050505] text-slate-50 font-sans selection:bg-teal-500/30 selection:text-teal-200">
              <Navbar />
              <main className="flex-grow">
                <Suspense fallback={<PageLoader />}>
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
                </Suspense>
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
