import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  InspectionSession,
  DemoScenario,
  ProcessingStepStatus,
  PackageView,
  ViewLabel,
  RuleCheckResult,
  FieldName,
} from '../types';
import { Header } from '../components/Header';
import { DemoScenarioSelector } from '../components/DemoScenarioSelector';
import { ImageUpload } from '../components/ImageUpload';
import { ProcessingStatus } from '../components/ProcessingStatus';
import { PackageImageViewer } from '../components/PackageImageViewer';
import { DeclarationTable } from '../components/DeclarationTable';
import { RuleResultsPanel } from '../components/RuleResultsPanel';
import { MultiViewTracker } from '../components/MultiViewTracker';
import { OfficerReviewPanel } from '../components/OfficerReviewPanel';
import { InspectionSummary } from '../components/InspectionSummary';
import { InspectionHistory } from '../components/InspectionHistory';
import { ArchitectureModal } from '../components/ArchitectureModal';
import { WorkflowGuide, WorkflowStep } from '../components/WorkflowGuide';
import { PlusCircle, History, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { queuePendingUpload, syncPendingUploads, getPendingCount } from '../lib/offlineQueue';

const API_BASE = '/api';

type RightPanelTab = 'declarations' | 'violations' | 'adjudication';

export const InspectionDashboard: React.FC = () => {
  const [scenarios, setScenarios] = useState<DemoScenario[]>([]);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [session, setSession] = useState<InspectionSession | null>(null);
  const [currentView, setCurrentView] = useState<PackageView | null>(null);
  const [selectedViewIndex, setSelectedViewIndex] = useState(0);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStepStatus[]>([]);
  const [highlightedBoxId, setHighlightedBoxId] = useState<string | null>(null);
  const [reviewingResult, setReviewingResult] = useState<RuleCheckResult | null>(null);
  const [showArchitecture, setShowArchitecture] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [allSessions, setAllSessions] = useState<InspectionSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [ocrEngine, setOcrEngine] = useState<'paddle' | 'tesseract'>('paddle');
  const [rightTab, setRightTab] = useState<RightPanelTab>('declarations');

  const fetchHistory = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/inspection`);
      setAllSessions(res.data.sessions || []);
    } catch {
      // History is non-critical
    }
  }, []);

  const refreshPendingCount = useCallback(async () => {
    const count = await getPendingCount();
    setPendingSyncCount(count);
  }, []);

  const triggerSync = useCallback(async () => {
    if (!navigator.onLine) return;
    setSyncing(true);
    try {
      const res = await syncPendingUploads((syncedSessionId) => {
        if (session && session.sessionId === syncedSessionId) {
          axios.get(`${API_BASE}/inspection/${syncedSessionId}`).then((r) => setSession(r.data.session));
        }
      });
      if (res.successCount > 0) fetchHistory();
    } finally {
      await refreshPendingCount();
      setSyncing(false);
    }
  }, [session, fetchHistory, refreshPendingCount]);

  useEffect(() => {
    refreshPendingCount();
    const handleOnline = () => { setIsOnline(true); triggerSync(); };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [triggerSync, refreshPendingCount]);

  useEffect(() => {
    axios.get(`${API_BASE}/demo/scenarios`)
      .then((res) => setScenarios(res.data.scenarios))
      .catch(() => setError('Failed to connect to server. Is the backend running on port 3001?'));
  }, []);

  useEffect(() => {
    if (showHistory) fetchHistory();
  }, [showHistory, fetchHistory]);

  const createNewSession = useCallback(async (): Promise<string> => {
    const res = await axios.post(`${API_BASE}/inspection/start`);
    setSession(res.data.session);
    return res.data.session.sessionId;
  }, []);

  const handleNewInspection = useCallback(() => {
    setSession(null);
    setCurrentView(null);
    setSelectedViewIndex(0);
    setProcessingSteps([]);
    setHighlightedBoxId(null);
    setReviewingResult(null);
    setActiveScenarioId(null);
    setError(null);
    setShowHistory(false);
    setRightTab('declarations');
  }, []);

  const handleOpenSession = useCallback(async (sessionId: string) => {
    try {
      const res = await axios.get(`${API_BASE}/inspection/${sessionId}`);
      const loadedSession = res.data.session as InspectionSession;
      setSession(loadedSession);
      setCurrentView(loadedSession.views[loadedSession.views.length - 1] || null);
      setSelectedViewIndex(Math.max(0, loadedSession.views.length - 1));
      setProcessingSteps([]);
      setHighlightedBoxId(null);
      setReviewingResult(null);
      setActiveScenarioId(null);
      setShowHistory(false);
      setError(null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Failed to load inspection');
    }
  }, []);

  const uploadImage = useCallback(async (
    sessionId: string,
    file: File,
    viewLabel: ViewLabel,
    scenarioId?: string,
    engine?: 'paddle' | 'tesseract'
  ) => {
    if (!navigator.onLine) {
      try {
        await queuePendingUpload(sessionId, viewLabel, file, scenarioId);
        await refreshPendingCount();
        setError('Network offline: Evidence queued in local storage. Will sync when connectivity is restored.');
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'IndexedDB error';
        setError('Could not queue offline evidence: ' + msg);
      }
      return;
    }

    setLoading(true);
    setError(null);
    setProcessingSteps([
      { step: 'Image Preprocessing', status: 'processing' },
      { step: 'OCR Text Detection', status: 'pending' },
      { step: 'Declaration Extraction', status: 'pending' },
      { step: 'Regulatory Check', status: 'pending' },
    ]);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('viewLabel', viewLabel);
      if (scenarioId) formData.append('scenarioId', scenarioId);
      if (engine) formData.append('ocrEngine', engine);

      const res = await axios.post(`${API_BASE}/inspection/${sessionId}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSession(res.data.session);
      setCurrentView(res.data.currentView);
      setProcessingSteps(res.data.processingSteps);
      setSelectedViewIndex(res.data.session.views.length - 1);
      if (res.data.session.ruleResults.length > 0) {
        const hasIssues = res.data.session.ruleResults.some(
          (r: RuleCheckResult) => r.verdict === 'POTENTIAL_ISSUE' || r.verdict === 'NEEDS_REVIEW'
        );
        setRightTab(hasIssues ? 'violations' : 'declarations');
      }
    } catch (err: unknown) {
      if (!(err as { response?: unknown })?.response && !navigator.onLine) {
        await queuePendingUpload(sessionId, viewLabel, file, scenarioId);
        await refreshPendingCount();
        setError('Network lost during upload: Evidence preserved in offline queue.');
      } else {
        const axiosErr = err as { response?: { data?: { error?: string } }; message?: string };
        setError(axiosErr?.response?.data?.error || axiosErr?.message || 'Upload failed. Please try again.');
      }
      setProcessingSteps([]);
    } finally {
      setLoading(false);
    }
  }, [refreshPendingCount]);

  const handleDemoSelect = useCallback(async (scenario: DemoScenario) => {
    setActiveScenarioId(scenario.id);
    setReviewingResult(null);
    setHighlightedBoxId(null);
    setShowHistory(false);

    try {
      const sessionId = await createNewSession();

      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#162238';
      ctx.fillRect(0, 0, 800, 600);
      ctx.fillStyle = '#E2E8F0';
      ctx.font = '20px IBM Plex Sans, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Demo: ${scenario.name}`, 400, 280);
      ctx.font = '14px JetBrains Mono, monospace';
      ctx.fillStyle = '#94A3B8';
      ctx.fillText('(Mock OCR — demo bounding boxes)', 400, 310);

      const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
      const file = new File([blob], 'demo-package.png', { type: 'image/png' });

      await uploadImage(sessionId, file, 'front', scenario.id, ocrEngine);

      if (scenario.id === 'missing_declaration') {
        for (const [label, text] of [['back', 'Package Back View'], ['left', 'Package Left View']] as const) {
          const c = document.createElement('canvas');
          c.width = 800; c.height = 600;
          const cctx = c.getContext('2d')!;
          cctx.fillStyle = '#162238';
          cctx.fillRect(0, 0, 800, 600);
          cctx.fillStyle = '#E2E8F0';
          cctx.font = '18px IBM Plex Sans';
          cctx.textAlign = 'center';
          cctx.fillText(text, 400, 300);
          const b = await new Promise<Blob>((resolve) => c.toBlob((bl) => resolve(bl!), 'image/png'));
          await uploadImage(sessionId, new File([b], `demo-${label}.png`, { type: 'image/png' }), label, scenario.id, ocrEngine);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load demo scenario';
      setError(msg);
    }
  }, [createNewSession, uploadImage, ocrEngine]);

  const handleUserUpload = useCallback(async (
    file: File,
    viewLabel: ViewLabel,
    engine: 'paddle' | 'tesseract' = ocrEngine
  ) => {
    let sessionId = session?.sessionId;
    if (!sessionId) sessionId = await createNewSession();
    setActiveScenarioId(null);
    await uploadImage(sessionId!, file, viewLabel, undefined, engine);
  }, [session, createNewSession, uploadImage, ocrEngine]);

  const handleReviewAction = useCallback(async (
    type: 'confirm' | 'correct' | 'reject' | 'request_image' | 'remark',
    data: {
      ruleId: string;
      field: FieldName;
      originalValue?: string;
      correctedValue?: string;
      remarks?: string;
    }
  ) => {
    if (!session) return;
    try {
      const res = await axios.post(`${API_BASE}/inspection/${session.sessionId}/review`, { type, ...data });
      setSession(res.data.session);
      setReviewingResult(null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Review action failed');
    }
  }, [session]);

  const handleComplete = useCallback(async () => {
    if (!session) return;
    try {
      const res = await axios.post(`${API_BASE}/inspection/${session.sessionId}/complete`);
      setSession(res.data.session);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Could not finalize inspection');
    }
  }, [session]);

  const handleReviewClick = useCallback((result: RuleCheckResult) => {
    setReviewingResult(result);
    setRightTab('adjudication');
  }, []);

  const displayedView = session?.views?.[selectedViewIndex] || currentView;
  const isDemoScenario = !!activeScenarioId;

  const stats = session
    ? {
        totalRules: session.ruleResults.length,
        passed: session.ruleResults.filter((r) => r.verdict === 'PASS').length,
        violations: session.ruleResults.filter((r) => r.verdict === 'POTENTIAL_ISSUE').length,
        reviews: session.ruleResults.filter((r) => r.verdict === 'NEEDS_REVIEW').length,
      }
    : undefined;

  const violationCount = session?.ruleResults.filter((r) => r.verdict === 'POTENTIAL_ISSUE').length ?? 0;
  const hasResults = (session?.ruleResults.length ?? 0) > 0;

  const workflowStep: WorkflowStep = !session?.views?.length
    ? 1
    : loading || processingSteps.some((s) => s.status === 'processing')
    ? 2
    : hasResults
    ? 3
    : 2;

  const TAB_LABELS: { id: RightPanelTab; label: string; hint: string }[] = [
    { id: 'declarations', label: 'Label details', hint: 'What was read from the package' },
    { id: 'violations', label: 'Issues found', hint: 'Pass / fail for each rule' },
    { id: 'adjudication', label: 'Final report', hint: 'Download PDFs & sign off' },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--gov-page)' }}>
      <Header
        onShowArchitecture={() => setShowArchitecture(true)}
        sessionId={session?.sessionId}
        ocrEngine={ocrEngine}
        onEngineChange={setOcrEngine}
        stats={stats}
      />

      <main style={{ flex: 1, maxWidth: 1600, margin: '0 auto', width: '100%', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2" style={{ flexShrink: 0 }}>
          <div className="flex items-center gap-2">
            <button onClick={handleNewInspection} className="gov-btn-primary">
              <PlusCircle style={{ width: 15, height: 15 }} />
              New Inspection
            </button>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="gov-btn-secondary"
              style={showHistory ? { borderColor: 'var(--gov-navy)', color: 'var(--gov-navy)' } : {}}
            >
              <History style={{ width: 15, height: 15 }} />
              Past Inspections
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className={`gov-badge ${isOnline ? 'gov-badge-pass' : 'gov-badge-review'}`} style={{ fontFamily: 'JetBrains Mono' }}>
              {isOnline ? <Wifi style={{ width: 11, height: 11 }} /> : <WifiOff style={{ width: 11, height: 11 }} />}
              {isOnline ? 'Online' : 'Offline — saves locally'}
            </span>
            {pendingSyncCount > 0 && (
              <button
                onClick={triggerSync}
                disabled={syncing || !isOnline}
                className="gov-btn-secondary"
                style={{ fontSize: 12 }}
              >
                <RefreshCw style={{ width: 13, height: 13 }} className={syncing ? 'animate-spin' : ''} />
                Sync {pendingSyncCount} pending
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="gov-verdict-breach" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <p style={{ fontSize: 12, fontFamily: 'JetBrains Mono', color: 'var(--gov-breach)' }}>{error}</p>
            <button onClick={() => setError(null)} style={{ fontSize: 14, marginLeft: 8, opacity: 0.7, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gov-breach)' }}>✕</button>
          </div>
        )}

        {showHistory ? (
          <InspectionHistory
            sessions={allSessions}
            onOpenSession={handleOpenSession}
            onRefresh={fetchHistory}
            loading={loading}
          />
        ) : (
          <>
          <WorkflowGuide currentStep={workflowStep} hasResults={hasResults} />

          <div className="flex-1 grid grid-cols-1 xl:grid-cols-[320px_1fr_420px] gap-3 min-h-0">
            {/* ZONE 1: Case Ingestion Rail */}
            <aside className="flex flex-col gap-3 min-h-0 xl:overflow-y-auto">
              <DemoScenarioSelector
                scenarios={scenarios}
                activeScenarioId={activeScenarioId}
                onSelect={handleDemoSelect}
                loading={loading}
              />
              <ImageUpload
                onUpload={handleUserUpload}
                disabled={loading}
                selectedEngine={ocrEngine}
              />
            </aside>

            {/* ZONE 2: Optical Evidence Viewer */}
            <section className="flex flex-col gap-2 min-h-0 min-w-0">
              <ProcessingStatus steps={processingSteps} />

              {session && session.views.length > 1 && (
                <div className="flex" style={{ borderBottom: '1px solid var(--gov-border)', background: 'var(--gov-surface)' }}>
                  {session.views.map((v, i) => (
                    <button
                      key={i}
                      onClick={() => { setSelectedViewIndex(i); setCurrentView(v); }}
                      style={{
                        padding: '6px 14px',
                        fontSize: 11,
                        fontFamily: 'JetBrains Mono',
                        fontWeight: 600,
                        textTransform: 'capitalize',
                        background: selectedViewIndex === i ? 'var(--gov-navy-bg)' : 'transparent',
                        borderBottom: selectedViewIndex === i ? '2px solid var(--gov-navy)' : '2px solid transparent',
                        color: selectedViewIndex === i ? 'var(--gov-navy)' : 'var(--gov-text-muted)',
                        cursor: 'pointer',
                        border: 'none',
                        borderBottomStyle: 'solid',
                        borderBottomWidth: 2,
                        borderBottomColor: selectedViewIndex === i ? 'var(--gov-navy)' : 'transparent',
                      }}
                    >
                      {v.viewLabel}
                    </button>
                  ))}
                </div>
              )}

              <PackageImageViewer
                view={displayedView}
                highlightedBoxId={highlightedBoxId}
                onBoxClick={(id) => setHighlightedBoxId(id === highlightedBoxId ? null : id)}
                demoMode={isDemoScenario}
              />

              {session && (
                <MultiViewTracker
                  submittedViews={session.submittedViews}
                  recommendations={session.viewRecommendations}
                />
              )}
            </section>

            {/* ZONE 3: Results panel */}
            <aside className="gov-panel flex flex-col min-h-0 xl:max-h-[calc(100vh-240px)]">
              <div style={{ flexShrink: 0, borderBottom: '1px solid var(--gov-border)' }}>
                <div style={{ display: 'flex', borderBottom: '1px solid var(--gov-border)' }}>
                  {TAB_LABELS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setRightTab(tab.id)}
                      title={tab.hint}
                      style={{
                        flex: 1,
                        padding: '9px 8px',
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        background: rightTab === tab.id ? 'var(--gov-navy-bg)' : 'var(--gov-surface-alt)',
                        color: rightTab === tab.id ? 'var(--gov-navy)' : 'var(--gov-text-muted)',
                        border: 'none',
                        borderBottom: rightTab === tab.id ? '2px solid var(--gov-navy)' : '2px solid transparent',
                        cursor: 'pointer',
                        fontFamily: 'IBM Plex Sans',
                        transition: 'background 0.15s, color 0.15s',
                        position: 'relative',
                      }}
                    >
                      {tab.label}
                      {tab.id === 'violations' && violationCount > 0 && (
                        <span style={{ marginLeft: 4, padding: '1px 5px', borderRadius: 2, background: 'var(--gov-breach)', color: '#fff', fontSize: 9, fontWeight: 700 }}>
                          {violationCount}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                {rightTab === 'declarations' && session && (
                  <DeclarationTable
                    fields={session.mergedFields}
                    highlightedBoxId={highlightedBoxId}
                    onFieldClick={(id) => setHighlightedBoxId(id === highlightedBoxId ? null : id)}
                  />
                )}
                {rightTab === 'declarations' && !session && (
                  <div style={{ padding: 32, textAlign: 'center' }}>
                    <p style={{ fontSize: 13, color: 'var(--gov-text-muted)' }}>Select a demo case or upload a photo to begin</p>
                  </div>
                )}

                {rightTab === 'violations' && session && (
                  <RuleResultsPanel results={session.ruleResults} onReviewClick={handleReviewClick} />
                )}
                {rightTab === 'violations' && !session && (
                  <div style={{ padding: 32, textAlign: 'center' }}>
                    <p style={{ fontSize: 13, color: 'var(--gov-text-muted)' }}>Statutory compliance results will appear here after a scan</p>
                  </div>
                )}

                {rightTab === 'adjudication' && (
                  <>
                    {reviewingResult && (
                      <OfficerReviewPanel
                        result={reviewingResult}
                        onAction={handleReviewAction}
                        onClose={() => setReviewingResult(null)}
                      />
                    )}
                    <InspectionSummary session={session} onComplete={handleComplete} />
                  </>
                )}
              </div>
            </aside>
          </div>
          </>
        )}
      </main>

      <ArchitectureModal isOpen={showArchitecture} onClose={() => setShowArchitecture(false)} />
    </div>
  );
};
