import React, { useState } from 'react';
import { Search, Car, User, ShieldCheck, AlertTriangle, Calendar, Clock, MapPin, CheckCircle2, AlertOctagon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEntry, formatDateDisplay, getValidityStatus } from '../../context/EntryContext';

const SearchPage = () => {
  const { vehicles, history } = useEntry();
  const [query, setQuery] = useState('');

  const vehicleList = Object.values(vehicles);

  // Perform search matching Vehicle Number, Register ID, Staff ID, or Owner Name
  const searchResults = vehicleList.filter(v => {
    if (!query.trim()) return false;
    const q = query.toLowerCase().replace(/[\s\-]+/g, '');
    return (
      (v.vehicleNumber && v.vehicleNumber.toLowerCase().replace(/[\s\-]+/g, '').includes(q)) ||
      (v.registerId && v.registerId.toLowerCase().replace(/[\s\-]+/g, '').includes(q)) ||
      (v.name && v.name.toLowerCase().replace(/[\s\-]+/g, '').includes(q)) ||
      (v.id && v.id.toLowerCase().replace(/[\s\-]+/g, '').includes(q))
    );
  });

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 md:px-8 bg-[#0F172A] relative">
      
      {/* Background Lighting */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-8 relative z-10">

        {/* Page Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Search className="w-3.5 h-3.5" /> Instant Campus Vehicle Lookup
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            Vehicle & Owner Search
          </h1>
          <p className="text-slate-400 text-xs md:text-sm max-w-xl mx-auto">
            Search authorized vehicles using Vehicle Number, Student Register Number, Staff ID, or Owner Name.
          </p>
        </div>

        {/* Search Box */}
        <div className="glass-panel p-3 rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur-2xl shadow-2xl">
          <div className="relative flex items-center">
            <Search className="w-6 h-6 text-slate-400 absolute left-5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. TN 38 AB 1234, 23BCS045, EMP9023, or Balaji S..."
              className="w-full bg-black/60 border border-white/10 rounded-2xl pl-14 pr-6 py-4 text-white text-sm md:text-base font-mono focus:outline-none focus:border-emerald-500 transition-colors shadow-inner"
            />
          </div>
        </div>

        {/* Quick Search Chips */}
        <div className="flex flex-wrap justify-center gap-2 text-xs">
          <span className="text-slate-500 font-bold uppercase tracking-wider py-1">Try Searching:</span>
          {['TN 38 AB 1234', '23BCS045', 'EMP9023', 'Balaji S', 'TN 38 ZZZ 999'].map((sample) => (
            <button
              key={sample}
              onClick={() => setQuery(sample)}
              className="px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-all font-mono"
            >
              {sample}
            </button>
          ))}
        </div>

        {/* Search Results */}
        {!query.trim() ? (
          <div className="text-center py-16 text-slate-500 space-y-3">
            <Car className="w-12 h-12 mx-auto opacity-30" />
            <p className="text-xs uppercase font-bold tracking-wider">Type a vehicle number or ID above to search</p>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="text-center py-16 text-slate-400 space-y-3 glass-card rounded-3xl border border-white/10 p-8">
            <AlertTriangle className="w-12 h-12 mx-auto text-amber-400 opacity-80" />
            <h3 className="text-lg font-black text-white">No Matching Vehicles Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No vehicle or owner matches "<span className="text-white font-mono">{query}</span>". Check the plate number or ID.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {searchResults.map((v) => {
              const status = getValidityStatus(v);
              const vLogs = history.filter(h => 
                (v.vehicleNumber && h.vehicleNumber?.toLowerCase().includes(v.vehicleNumber.toLowerCase())) ||
                (v.registerId && h.registerId?.toLowerCase() === v.registerId.toLowerCase())
              );

              return (
                <motion.div
                  key={v.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-6 md:p-8 rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur-xl shadow-2xl space-y-6"
                >
                  {/* Top Header Card */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6">
                    <div className="flex items-center gap-4">
                      <img
                        src={v.photo || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&q=80'}
                        alt={v.name}
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-white/20 shadow-lg"
                      />
                      <div>
                        <span className="text-2xl font-black font-mono text-white tracking-wider block">
                          {v.vehicleNumber || v.id}
                        </span>
                        <span className="text-sm font-bold text-emerald-400 block">
                          {v.name} ({v.registerId})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border ${
                        status === 'Active'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : status === 'Expired'
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          : 'bg-red-500/20 text-red-400 border-red-500/30'
                      }`}>
                        Sticker Status: {status}
                      </span>
                    </div>
                  </div>

                  {/* Attributes Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 font-bold uppercase tracking-wider block">Department</span>
                      <span className="text-white font-semibold block">{v.department}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 font-bold uppercase tracking-wider block">Vehicle Type</span>
                      <span className="text-white font-semibold block">{v.vehicleType || 'Two-Wheeler'}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 font-bold uppercase tracking-wider block">Expiry Date</span>
                      <span className={`font-semibold font-mono block ${status === 'Expired' ? 'text-red-400' : 'text-emerald-400'}`}>
                        {formatDateDisplay(v.expiryDate)}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 font-bold uppercase tracking-wider block">Contact Phone</span>
                      <span className="text-slate-300 font-mono block">{v.mobile || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Vehicle Gate Entry History Timeline */}
                  <div className="pt-4 border-t border-white/10 space-y-3">
                    <span className="text-xs font-black text-white uppercase tracking-wider block flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-emerald-400" /> Recent Gate Entries for this Vehicle:
                    </span>

                    {vLogs.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No entry logs recorded yet for this vehicle.</p>
                    ) : (
                      <div className="space-y-2">
                        {vLogs.map(log => (
                          <div key={log.id} className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              {log.status === 'Granted' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <AlertOctagon className="w-4 h-4 text-red-400" />
                              )}
                              <span className="font-mono text-white">{log.gate}</span>
                              <span className="text-slate-400 font-mono">({log.date} {log.time})</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              log.status === 'Granted' ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
                            }`}>
                              {log.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </motion.div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};

export default SearchPage;
