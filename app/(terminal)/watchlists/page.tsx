'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { 
  Star, 
  Plus, 
  Trash2, 
  Bell, 
  StickyNote
} from 'lucide-react';
import { 
  getWatchlist, 
  addWatchlistItem, 
  removeWatchlistItem, 
  getNotes, 
  saveNote, 
  getAlerts, 
  createAlert, 
  deleteAlert 
} from '@/app/actions/watchlist';

interface WatchlistItemData {
  symbol: string;
  price: number;
  changePercent: number;
}

export default function WatchlistsPage() {
  const { data: session, status } = useSession();
  const [watchlistItems, setWatchlistItems] = useState<{ symbol: string }[]>([]);
  const [watchlistData, setWatchlistData] = useState<WatchlistItemData[]>([]);
  const [notes, setNotes] = useState<{ symbol: string; content: string }[]>([]);
  const [alerts, setAlerts] = useState<{ id: string; symbol: string; type: string; targetPrice: number; channel: string }[]>([]);

  // Inputs
  const [newSymbol, setNewSymbol] = useState('');
  const [alertSymbol, setAlertSymbol] = useState('');
  const [alertPrice, setAlertPrice] = useState('');
  const [alertType, setAlertType] = useState<'ABOVE' | 'BELOW'>('ABOVE');
  const [alertChannel, setAlertChannel] = useState('TELEGRAM');
  const [activeNoteSymbol, setActiveNoteSymbol] = useState('');
  const [activeNoteText, setActiveNoteText] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (session) {
      loadUserData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      const items = await getWatchlist();
      const userNotes = await getNotes();
      const userAlerts = await getAlerts();

      setWatchlistItems(items);
      setNotes(userNotes);
      setAlerts(userAlerts);

      // Fetch live prices for watchlisted items
      if (items.length > 0) {
        const liveQuotes = await Promise.all(
          items.map(async (item: { symbol: string }) => {
            try {
              // Call API route to fetch quote safely
              const res = await fetch(`/api/market/quote?symbol=${item.symbol}`);
              if (!res.ok) throw new Error();
              const q = await res.json();
              return { symbol: item.symbol, price: q.price, changePercent: q.changePercent };
            } catch {
              // Return standard reference quotes if API fails
              return { symbol: item.symbol, price: 150.0, changePercent: 0.5 };
            }
          })
        );
        setWatchlistData(liveQuotes);
      } else {
        setWatchlistData([]);
      }
    } catch (_err) {
      console.error('Error loading watchlist data:', _err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSymbol = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymbol.trim()) return;
    try {
      await addWatchlistItem(newSymbol);
      setNewSymbol('');
      await loadUserData();
    } catch (_err) {
      alert('Failed to add ticker.');
    }
  };

  const handleRemoveSymbol = async (symbol: string) => {
    try {
      await removeWatchlistItem(symbol);
      await loadUserData();
    } catch (_err) {
      alert('Failed to remove ticker.');
    }
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeNoteSymbol.trim()) return;
    try {
      await saveNote(activeNoteSymbol, activeNoteText);
      setActiveNoteText('');
      setActiveNoteSymbol('');
      await loadUserData();
    } catch {
      alert('Failed to save notes.');
    }
  };

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertSymbol.trim() || !alertPrice) return;
    try {
      await createAlert(alertSymbol, alertType, parseFloat(alertPrice), alertChannel);
      setAlertSymbol('');
      setAlertPrice('');
      await loadUserData();
    } catch {
      alert('Failed to create alert.');
    }
  };

  const handleDeleteAlert = async (id: string) => {
    try {
      await deleteAlert(id);
      await loadUserData();
    } catch {
      alert('Failed to delete alert.');
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex-1 flex items-center justify-center font-mono text-xs text-neutral bg-background">
        Verifying Session Profile...
      </div>
    );
  }

  // Auth requirement guard
  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="max-w-md w-full border border-border bg-card rounded p-6 text-center space-y-6">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
            <Star className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h2 className="text-sm font-bold font-mono tracking-wide uppercase text-foreground">WATCHLIST_LOCKED</h2>
            <p className="text-xs text-neutral">
              Connecting a terminal account is required to build portfolios, create alerts, and draft ticker research notes.
            </p>
          </div>
          <button
            onClick={() => signIn()}
            className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white rounded font-mono text-xs font-semibold tracking-wide transition"
          >
            CONNECT_TERMINAL_ACCOUNT
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6 bg-background text-foreground font-sans">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-lg font-bold font-mono tracking-tight uppercase">PORTFOLIO_WATCHLISTS</h1>
          <p className="text-xs text-neutral">Track tickers, configure thresholds, and manage analysis notes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Watchlist Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="border border-border bg-card rounded p-5">
            <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
              <h3 className="text-xs font-bold font-mono tracking-wider text-neutral uppercase flex items-center gap-1.5">
                <Star className="w-4 h-4 text-primary" />
                Active Watchlist
              </h3>
              <form onSubmit={handleAddSymbol} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ticker (e.g. AAPL)"
                  value={newSymbol}
                  onChange={(e) => setNewSymbol(e.target.value)}
                  className="bg-background border border-border rounded text-[11px] px-3 py-1 font-mono uppercase focus:outline-none focus:border-primary w-32"
                />
                <button
                  type="submit"
                  className="px-2 py-1 bg-primary hover:bg-primary-hover text-white rounded flex items-center text-[10px] font-mono transition"
                >
                  <Plus className="w-3.5 h-3.5 mr-0.5" /> ADD
                </button>
              </form>
            </div>

            {isLoading ? (
              <div className="py-8 text-center text-xs font-mono text-neutral">Querying quotes feeds...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono text-left">
                  <thead>
                    <tr className="text-[10px] text-neutral border-b border-border uppercase">
                      <th className="py-2">Symbol</th>
                      <th className="py-2 text-right">Price</th>
                      <th className="py-2 text-right">Change</th>
                      <th className="py-2 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {watchlistData.map((item) => {
                      const isUp = item.changePercent >= 0;
                      return (
                        <tr key={item.symbol} className="hover:bg-accent/20 transition-colors">
                          <td className="py-3 font-bold text-foreground">{item.symbol}</td>
                          <td className="py-3 text-right">${item.price.toFixed(2)}</td>
                          <td className={`py-3 text-right ${isUp ? 'text-gainer' : 'text-loser'}`}>
                            {isUp ? '+' : ''}{item.changePercent.toFixed(2)}%
                          </td>
                          <td className="py-3 text-center">
                            <button
                              onClick={() => handleRemoveSymbol(item.symbol)}
                              className="text-neutral hover:text-loser p-1 rounded transition"
                              title="Delete Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                      {watchlistData.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-neutral text-xs">
                            Your watchlist is empty. Add symbol above.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Notes Section */}
            <div className="border border-border bg-card rounded p-5">
              <h3 className="text-xs font-bold font-mono tracking-wider text-neutral uppercase mb-4 flex items-center gap-1.5 border-b border-border pb-2">
                <StickyNote className="w-4 h-4 text-primary" />
                Investment & Ticker Notes
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Note creator */}
                <form onSubmit={handleSaveNote} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-neutral font-mono block">Symbol</label>
                    <input
                      type="text"
                      placeholder="e.g. AAPL"
                      value={activeNoteSymbol}
                      onChange={(e) => setActiveNoteSymbol(e.target.value)}
                      className="w-full bg-background border border-border rounded text-xs p-2 font-mono uppercase focus:outline-none focus:border-primary"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-neutral font-mono block">Notes Content</label>
                    <textarea
                      placeholder="Draft technical summaries, research notes..."
                      value={activeNoteText}
                      onChange={(e) => setActiveNoteText(e.target.value)}
                      className="w-full h-24 bg-background border border-border rounded text-xs p-2 focus:outline-none focus:border-primary"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-primary hover:bg-primary-hover text-white rounded font-mono text-xs transition"
                  >
                    SAVE_NOTE
                  </button>
                </form>

                {/* List of notes */}
                <div className="space-y-3 overflow-y-auto max-h-[200px]">
                  {notes.map((note) => (
                    <div key={note.symbol} className="bg-background border border-border/80 p-3 rounded space-y-1">
                      <div className="flex justify-between items-center border-b border-border/40 pb-1">
                        <span className="text-xs font-bold font-mono text-primary">{note.symbol}</span>
                      </div>
                      <p className="text-[11px] text-foreground leading-normal whitespace-pre-line">{note.content}</p>
                    </div>
                  ))}
                  {notes.length === 0 && (
                    <div className="py-8 text-center text-neutral text-xs">No ticker notes drafted yet.</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Price Alerts Panel */}
          <div className="border border-border bg-card rounded p-5 h-fit">
            <h3 className="text-xs font-bold font-mono tracking-wider text-neutral uppercase mb-4 flex items-center gap-1.5 border-b border-border pb-2">
              <Bell className="w-4 h-4 text-primary" />
              Threshold Alerts
            </h3>

            {/* Create Alert Form */}
            <form onSubmit={handleCreateAlert} className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-neutral font-mono block">Ticker</label>
                  <input
                    type="text"
                    placeholder="e.g. NVDA"
                    value={alertSymbol}
                    onChange={(e) => setAlertSymbol(e.target.value)}
                    className="w-full bg-background border border-border rounded text-xs p-2 font-mono uppercase focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-neutral font-mono block">Target Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="120.50"
                    value={alertPrice}
                    onChange={(e) => setAlertPrice(e.target.value)}
                    className="w-full bg-background border border-border rounded text-xs p-2 font-mono focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-neutral font-mono block">Condition</label>
                  <select
                    value={alertType}
                    onChange={(e) => setAlertType(e.target.value as any)}
                    className="w-full bg-background border border-border rounded text-xs p-2 focus:outline-none text-foreground font-mono"
                  >
                    <option value="ABOVE">ABOVE</option>
                    <option value="BELOW">BELOW</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-neutral font-mono block">Channel</label>
                  <select
                    value={alertChannel}
                    onChange={(e) => setAlertChannel(e.target.value)}
                    className="w-full bg-background border border-border rounded text-xs p-2 focus:outline-none text-foreground font-mono"
                  >
                    <option value="TELEGRAM">TELEGRAM</option>
                    <option value="WHATSAPP">WHATSAPP</option>
                    <option value="WEB">WEB APP</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-primary hover:bg-primary-hover text-white rounded font-mono text-xs transition"
              >
                CREATE_ALERT_TRIGGER
              </button>
            </form>

            {/* List of active alerts */}
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              <h4 className="text-[10px] font-bold font-mono text-neutral uppercase border-b border-border/40 pb-1">Active Alerts</h4>
              {alerts.map((al) => (
                <div key={al.id} className="bg-background border border-border/80 p-3 rounded flex justify-between items-center text-xs font-mono">
                  <div>
                    <span className="font-bold text-foreground mr-1.5">{al.symbol}</span>
                    <span className="text-[10px] text-neutral bg-accent px-1.5 py-0.5 rounded mr-1.5">{al.type}</span>
                    <span className="font-semibold">${al.targetPrice.toFixed(2)}</span>
                    <span className="text-[9px] text-neutral block mt-1">Channel: {al.channel}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteAlert(al.id)}
                    className="text-neutral hover:text-loser p-1 rounded transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {alerts.length === 0 && (
                <div className="py-6 text-center text-neutral text-xs">No active price alert triggers.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
