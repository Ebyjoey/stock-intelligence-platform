'use client';

import React, { useState, useEffect } from 'react';
import { useSession as useAuthSession, signIn } from 'next-auth/react';
import { 
  BarChart4, 
  RefreshCw, 
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import PowerBIReport from '@/components/powerbi/report';

interface EmbedConfig {
  reportId: string;
  embedUrl: string;
  accessToken: string;
  workspaceId: string;
}

export default function PowerBIPage() {
  const { data: session, status } = useAuthSession();
  const [config, setConfig] = useState<EmbedConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Dashboard Switching
  const dashboards = [
    { name: 'Global Equity Portfolio', id: 'equity-portfolio-id-123' },
    { name: 'Market Risk Analytics', id: 'risk-analytics-id-456' },
    { name: 'FX & Commodity Reserves', id: 'fx-reserves-id-789' }
  ];
  const [selectedDashboard, setSelectedDashboard] = useState(dashboards[0]);

  // Report Filtering
  const [selectedSector, setSelectedSector] = useState('ALL');

  useEffect(() => {
    if (session) {
      fetchToken(selectedDashboard.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, selectedDashboard]);

  const fetchToken = async (reportId: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/powerbi/token?reportId=${reportId}`);
      if (!res.ok) throw new Error('Token endpoint request failed');
      const data = await res.json();
      setConfig(data);
    } catch {
      setError('Unable to authenticate secure embedding channel.');
    } finally {
      setLoading(false);
    }
  };

  // Construct filters schema
  const getFilters = () => {
    if (selectedSector === 'ALL') return [];
    return [
      {
        $schema: "http://powerbi.com/product/schema#basic",
        target: {
          table: "MarketPerformance",
          column: "SectorName"
        },
        operator: "In",
        values: [selectedSector]
      }
    ];
  };

  if (status === 'loading') {
    return (
      <div className="flex-1 flex items-center justify-center font-mono text-xs text-neutral bg-background">
        Verifying Session Profile...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="max-w-md w-full border border-border bg-card rounded p-6 text-center space-y-6">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
            <BarChart4 className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h2 className="text-sm font-bold font-mono tracking-wide uppercase text-foreground">REPORTS_LOCKED</h2>
            <p className="text-xs text-neutral">
              Connecting a terminal account is required to generate AAD embed tokens and view corporate Power BI dashboards.
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
    <div className="flex-1 flex flex-col min-h-0 bg-background text-foreground font-sans">
      {/* Header Panel */}
      <div className="h-16 border-b border-border bg-card flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-2">
          <BarChart4 className="w-5 h-5 text-primary" />
          <div>
            <h2 className="text-sm font-bold font-mono tracking-wide uppercase">POWER_BI_EMBEDDED</h2>
            <p className="text-[10px] text-neutral">Secure multi-tenant reports authenticated via Azure Active Directory.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => config && fetchToken(selectedDashboard.id)}
            className="p-1.5 border border-border hover:bg-accent rounded text-neutral hover:text-foreground transition"
            title="Refresh Token"
            disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <div className="text-[10px] font-mono text-gainer bg-gainer/10 px-2.5 py-1 rounded border border-gainer/20 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            TOKEN_ACTIVE
          </div>
        </div>
      </div>

      {/* Main Workspace split */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Reports Controls sidebar */}
        <aside className="w-64 border-r border-border bg-card/60 p-4 space-y-6 shrink-0">
          {/* Dashboard Selector */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold font-mono text-neutral uppercase tracking-wider block">Select Report Workspace</label>
            <div className="space-y-1.5">
              {dashboards.map((db) => (
                <button
                  key={db.id}
                  onClick={() => setSelectedDashboard(db)}
                  className={`w-full text-left px-3 py-2 text-xs rounded transition flex items-center justify-between border ${
                    selectedDashboard.id === db.id
                      ? 'bg-accent border-border text-foreground font-semibold'
                      : 'border-transparent text-neutral hover:text-foreground hover:bg-accent/40'
                  }`}
                >
                  <span>{db.name}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
          </div>

          {/* Report Filters */}
          <div className="space-y-2 border-t border-border pt-4">
            <label className="text-[10px] font-bold font-mono text-neutral uppercase tracking-wider flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
              Slicers & Filters
            </label>
            
            <div className="space-y-1.5">
              {['ALL', 'Technology', 'Financials', 'Energy'].map((sector) => (
                <button
                  key={sector}
                  onClick={() => setSelectedSector(sector)}
                  className={`w-full text-left px-3 py-1.5 rounded text-[11px] font-mono transition ${
                    selectedSector === sector
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'text-neutral hover:text-foreground'
                  }`}
                >
                  {sector === 'ALL' ? 'RESET_FILTER' : `SECTOR: ${sector.toUpperCase()}`}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Embedded Report Frame */}
        <main className="flex-1 p-6 overflow-hidden">
          {loading ? (
            <div className="w-full h-full border border-border bg-card rounded flex items-center justify-center font-mono text-xs text-neutral">
              <span className="w-2.5 h-2.5 bg-primary rounded-full animate-ping mr-2"></span>
              Securing connection credentials...
            </div>
          ) : error ? (
            <div className="w-full h-full border border-border bg-card rounded flex flex-col items-center justify-center text-center p-6 space-y-4">
              <span className="text-loser text-lg font-bold font-mono uppercase">SECURITY_CHALLENGE_FAILED</span>
              <p className="text-xs text-neutral max-w-sm">
                Unable to query access tokens from the Microsoft Azure workspace. Check your environment settings.
              </p>
            </div>
          ) : config ? (
            <PowerBIReport
              reportId={config.reportId}
              embedUrl={config.embedUrl}
              accessToken={config.accessToken}
              filters={getFilters()}
            />
          ) : (
            <div className="w-full h-full border border-border bg-card rounded flex items-center justify-center font-mono text-xs text-neutral">
              Select a workspace report to begin viewing data.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
