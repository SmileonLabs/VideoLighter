import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import FeaturesGrid from './components/FeaturesGrid';
import CoreTech from './components/CoreTech';
import InterfaceShowcase from './components/InterfaceShowcase';
import PrivacySection from './components/PrivacySection';
import Footer from './components/Footer';

const App: React.FC = () => {
    return (
        <div className="min-h-screen bg-darker text-white font-sans overflow-x-hidden selection:bg-secondary selection:text-black">
            <Navbar />
            <main>
                <Hero />
                <FeaturesGrid />
                <CoreTech />
                <InterfaceShowcase />
                <PrivacySection />
            </main>
            <Footer />
        </div>
    );
};

export default App;
