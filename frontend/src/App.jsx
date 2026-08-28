import React, { useState, useEffect } from 'react';
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
import { useAuth } from './context/AuthContext';

/*
  View Routing:
    'landing'   → Public portal (default)
    'login'     → Login page
    'dashboard' → Role-based dashboard (authenticated only)
*/

// Nirikshak AI Main Application Layout
function App() {
  const { isAuthenticated, user } = useAuth();
  const [currentView, setCurrentView] = useState('landing');
  const [activeSection, setActiveSection] = useState('hero');
  const [activeFeature, setActiveFeature] = useState(null);

  // Auto-redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated && currentView === 'login') {
      setCurrentView('dashboard');
    }
  }, [isAuthenticated]);

  // Scroll reveal observer for all sections and elements
  useEffect(() => {
    if (currentView !== 'landing') return;

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
  }, [currentView]);

  const scrollToSection = (id) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // ─── Login View ───
  if (currentView === 'login') {
    return (
      <LoginView
        onBack={() => setCurrentView('landing')}
        onLoginSuccess={(user) => setCurrentView('dashboard')}
      />
    );
  }

  // ─── Feature Detail View (from Navigation Drawer) ───
  if (activeFeature) {
    return (
      <FeatureView
        featureId={activeFeature}
        onBack={() => setActiveFeature(null)}
      />
    );
  }

  // ─── Dashboard View (Authenticated) ───
  if (currentView === 'dashboard' && isAuthenticated) {
    return (
      <RoleDashboardLayout
        onLogout={() => setCurrentView('landing')}
      />
    );
  }

  // ─── Public Landing Page (Default) ───
  return (
    <div style={{ background: 'var(--color-bg-light)', color: 'var(--color-text-primary)', minHeight: '100vh' }}>
      {/* Nirikshak AI MoSPI Header */}
      <Header
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        onFeatureSelect={(featureId) => setActiveFeature(featureId)}
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
      <Footer onLoginClick={() => setCurrentView('login')} />

      {/* Floating Risk Map & Nirikshak AI Assistant Widgets */}
      <FloatingWidgets />
    </div>
  );
}

export default App;
