import React from 'react';
import Scanner from './pages/Scanner';
import { EntryProvider } from './context/EntryContext';

function App() {
  return (
    <EntryProvider>
      <div className="min-h-screen bg-[#080C16] text-slate-50 font-sans antialiased selection:bg-cyan-500 selection:text-white relative overflow-x-hidden">
        {/* Main Application Container */}
        <main className="w-full min-h-screen flex flex-col justify-center items-center">
          <Scanner />
        </main>

        {/* Ambient Security Background Lighting */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-[140px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
      </div>
    </EntryProvider>
  );
}

export default App;
