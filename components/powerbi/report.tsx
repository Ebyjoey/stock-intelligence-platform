'use client';

import React, { useRef, useEffect, useState } from 'react';

interface PowerBIReportProps {
  reportId: string;
  embedUrl: string;
  accessToken: string;
  workspaceId?: string;
  filters?: Array<{
    $schema: string;
    target: { table: string; column: string };
    operator: string;
    values: (string | number)[];
  }>;
}

export default function PowerBIReport({
  reportId,
  embedUrl,
  accessToken,
  workspaceId,
  filters
}: PowerBIReportProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    // Standard Power BI Embed PostMessage configuration trigger
    const handleEmbedLoad = () => {
      setIsLoaded(true);
      
      const payload = {
        action: 'load',
        accessToken: accessToken,
        id: reportId,
        settings: {
          filterPaneEnabled: false,
          navContentPaneEnabled: true,
        },
        pageName: undefined,
        filters: filters || [],
      };

      try {
        iframe.contentWindow?.postMessage(
          JSON.stringify(payload),
          '*' // In production, we restrict targetOrigin to 'https://app.powerbi.com'
        );
      } catch (err) {
        console.error('PowerBIReport: Failed to post load message', err);
      }
    };

    iframe.addEventListener('load', handleEmbedLoad);
    return () => {
      iframe.removeEventListener('load', handleEmbedLoad);
    };
  }, [accessToken, reportId, embedUrl, filters]);

  return (
    <div className="relative w-full h-full border border-border bg-card rounded overflow-hidden">
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-card text-xs font-mono text-neutral">
          <span className="w-2.5 h-2.5 bg-primary rounded-full animate-ping mr-2"></span>
          Establishing Secure Power BI Session...
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={`${embedUrl}&filterPaneEnabled=false`}
        className="w-full h-full border-none"
        allowFullScreen={true}
        title="Power BI Embedded Report"
      />
    </div>
  );
}
