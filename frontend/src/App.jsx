import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import StatsMarquee from './components/StatsMarquee';
import PathwaysGrid from './components/PathwaysGrid';
import VirtualOffice from './components/VirtualOffice';
import ProductsSection from './components/ProductsSection';
import InsightsSection from './components/InsightsSection';
import PreFooter from './components/PreFooter';
import Footer from './components/Footer';
import FloatingWidgets from './components/FloatingWidgets';
import LoginView from './components/auth/LoginView';
import RoleDashboardLayout from './components/dashboard/RoleDashboardLayout';
import FeatureView from './components/views/FeatureView';
import StateDetailView from './components/views/StateDetailView';
import MpDetailView from './components/views/MpDetailView';
import QrDemoView from './components/views/QrDemoView';
import { useAuth } from './context/AuthContext';

// Helper component to scroll to top on route change
function ScrollToTop() {
  const { pathname, state } = useLocation();

  useEffect(() => {
    if (!state?.scrollTo) {
      window.scrollTo(0, 0);
    }
  }, [pathname, state]);

  return null;
}

// ─── Public Landing Page Component ───
function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('hero');

  // Handle scroll-to-section on load or when navigating with state
  useEffect(() => {
    if (location.state?.scrollTo) {
      const el = document.getElementById(location.state.scrollTo);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth' });
        }, 80);
      }
    }
  }, [location.state]);

  // Scroll reveal observer for landing sections
  useEffect(() => {
    const observerCallback = (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      root: null,
      rootMargin: '0px 0px -60px 0px',
      threshold: 0.12
    });

    const targets = document.querySelectorAll('section, .scroll-reveal');
    targets.forEach((el) => {
      el.classList.add('scroll-reveal');
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleFeatureSelect = (featureId) => {
    const targetPath = `/features/${featureId}`;
    if (location.pathname !== targetPath) {
      navigate(targetPath);
    }
  };

  return (
    <div style={{ background: 'var(--color-bg-light)', color: 'var(--color-text-primary)', minHeight: '100vh' }}>
      {/* Nirikshak AI MoSPI Header */}
      <Header
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        onFeatureSelect={handleFeatureSelect}
      />

      {/* Main Content Sections */}
      <main>
        <Hero
          onExploreClick={() => scrollToSection('problem')}
          onVirtualOfficeClick={() => scrollToSection('risk-scoring')}
        />

        {/* Live MPLADS Stats Marquee Ticker */}
        <StatsMarquee />

        {/* Section 2: The Problem & Section 3: Solution Process */}
        <PathwaysGrid />

        {/* Section 4: What Nirikshak AI Detects */}
        <ProductsSection />

        {/* Section 5: Risk Score & Section 7: Investigation */}
        <VirtualOffice />

        {/* Section 6: India Geospatial Intelligence */}
        <InsightsSection />

        {/* Reference-Inspired Panoramic Pre-Footer Visual Section */}
        <PreFooter onExploreClick={() => scrollToSection('risk-scoring')} />
      </main>

      {/* Footer with Login entry point */}
      <Footer onLoginClick={() => navigate('/login')} />

      {/* Floating Risk Map & Nirikshak AI Assistant Widgets */}
      <FloatingWidgets onLoginClick={() => navigate('/login')} />
    </div>
  );
}

// ─── Login View Wrapper ───
function LoginPage() {
  const navigate = useNavigate();

  return (
    <LoginView
      onBack={() => navigate('/')}
      onLoginSuccess={() => navigate('/dashboard')}
    />
  );
}

// ─── Dashboard View Wrapper ───
function DashboardPage() {
  const navigate = useNavigate();

  return (
    <RoleDashboardLayout
      onLogout={() => navigate('/')}
    />
  );
}

// ─── Feature Detail View Wrapper ───
function FeaturePage() {
  const navigate = useNavigate();

  return (
    <FeatureView
      onBack={() => navigate('/')}
    />
  );
}

// ─── State Detail View Wrapper ───
function StateDetailPage() {
  return <StateDetailView />;
}

// ─── MP Detail View Wrapper ───
function MpDetailPage() {
  return <MpDetailView />;
}

// ─── Main App Router Layout ───
function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Authentication */}
        <Route path="/login" element={<LoginPage />} />

        {/* Smart QR Code Access Routes */}
        <Route path="/demo" element={<QrDemoView />} />
        <Route path="/qr" element={<QrDemoView />} />

        {/* Authenticated Dashboard */}
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Dedicated State Detail Route */}
        <Route path="/states/:stateSlug" element={<StateDetailPage />} />

        {/* Dedicated MP Detail Route */}
        <Route path="/mps/:mpSlug" element={<MpDetailPage />} />

        {/* Feature Detail Views */}
        <Route path="/features/:featureId" element={<FeaturePage />} />

        {/* Direct Feature Aliases (e.g., /overview, /keyMetrics, /financialAnomaly, /states, /mps) */}
        <Route path="/:featureId" element={<FeaturePage />} />
      </Routes>
    </>
  );
}

export default App;
