import React from 'react';
import { InspectionSession } from '../types';
import { History, CheckCircle, AlertTriangle, XCircle, Eye, Trash2 } from 'lucide-react';

interface Props {
  sessions: InspectionSession[];
  onOpenSession: (sessionId: string) => void;
  onRefresh: () => void;
  loading: boolean;
}

export const InspectionHistory: React.FC<Props> = ({ sessions, onOpenSession, onRefresh, loading }) => {
  if (sessions.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
            <History className="w-4 h-4" />
            Inspection History
          </h3>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Refresh
          </button>
        </div>
        <p className="text-sm text-gray-400 text-center py-6">No inspections yet. Run a demo scenario or upload a package image to get started.</p>
      </div>
    );
  }

  const getStatusInfo = (session: InspectionSession) => {
    const issueCount = session.ruleResults.filter(r => r.verdict === 'POTENTIAL_ISSUE').length;
    const reviewCount = session.ruleResults.filter(r => r.verdict === 'NEEDS_REVIEW').length;
    const passCount = session.ruleResults.filter(r => r.verdict === 'PASS').length;

    if (issueCount > 0) return {
      label: 'Non-Compliant',
      icon: <XCircle className="w-4 h-4 text-red-500" />,
      bg: 'bg-red-50 text-red-700 border-red-200',
      passCount, reviewCount, issueCount,
    };
    if (reviewCount > 0) return {
      label: 'Review Required',
      icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      passCount, reviewCount, issueCount,
    };
    return {
      label: 'Compliant',
      icon: <CheckCircle className="w-4 h-4 text-emerald-500" />,
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      passCount, reviewCount, issueCount,
    };
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
          <History className="w-4 h-4" />
          Inspection History ({sessions.length})
        </h3>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
        >
          Refresh
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-2 text-xs font-semibold text-gray-500 uppercase">ID</th>
              <th className="text-left py-2 px-2 text-xs font-semibold text-gray-500 uppercase">Date / Time</th>
              <th className="text-center py-2 px-2 text-xs font-semibold text-gray-500 uppercase">Views</th>
              <th className="text-center py-2 px-2 text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="text-center py-2 px-2 text-xs font-semibold text-gray-500 uppercase">Results</th>
              <th className="text-center py-2 px-2 text-xs font-semibold text-gray-500 uppercase">Session</th>
              <th className="text-right py-2 px-2 text-xs font-semibold text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => {
              const info = getStatusInfo(s);
              return (
                <tr
                  key={s.sessionId}
                  className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onOpenSession(s.sessionId)}
                >
                  <td className="py-2.5 px-2 font-mono text-gray-600 text-xs">
                    {s.sessionId.slice(0, 8)}
                  </td>
                  <td className="py-2.5 px-2 text-gray-700 text-xs">
                    {new Date(s.createdAt).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <span className="text-xs text-gray-500">
                      {s.submittedViews.map(v => v.charAt(0).toUpperCase()).join(', ') || '—'}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${info.bg}`}>
                      {info.icon}
                      {info.label}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <div className="flex items-center justify-center gap-2 text-xs">
                      <span className="text-emerald-600 font-medium">{info.passCount}P</span>
                      {info.reviewCount > 0 && <span className="text-amber-600 font-medium">{info.reviewCount}R</span>}
                      {info.issueCount > 0 && <span className="text-red-600 font-medium">{info.issueCount}I</span>}
                    </div>
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded capitalize ${
                      s.status === 'completed' ? 'bg-gray-100 text-gray-700' : 'bg-blue-50 text-blue-700'
                    }`}>
                      {s.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); onOpenSession(s.sessionId); }}
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Open
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
