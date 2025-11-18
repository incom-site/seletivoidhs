import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Flag, ChevronRight, ChevronLeft, Clock } from 'lucide-react';
import { Candidate } from '../services/supabaseClient';
import { candidateService } from '../services/candidateService';

interface ScreeningPanelProps {
  candidate: Candidate;
  analystEmail: string;
  onNext: () => void;
  onPrevious: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
  onUpdate: () => void;
}

export default function ScreeningPanel({
  candidate,
  analystEmail,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious,
  onUpdate
}: ScreeningPanelProps) {
  const [rejectionReasons, setRejectionReasons] = useState<string[]>(candidate.rejection_reasons || []);
  const [notes, setNotes] = useState(candidate.notes || '');
  const [reasons, setReasons] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReasons();
  }, []);

  useEffect(() => {
    setRejectionReasons(candidate.rejection_reasons || []);
    setNotes(candidate.notes || '');
  }, [candidate]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'a' || e.key === 'A') {
        handleApprove();
      } else if (e.key === 'r' || e.key === 'R') {
        if (rejectionReasons.length > 0) {
          handleReject();
        }
      } else if (e.key === 'f' || e.key === 'F') {
        handleFlag();
      } else if (e.key === 'ArrowRight' && hasNext) {
        onNext();
      } else if (e.key === 'ArrowLeft' && hasPrevious) {
        onPrevious();
      } else if (e.key >= '0' && e.key <= '9') {
        const reason = reasons.find(r => r.shortcut_key === e.key);
        if (reason) {
          toggleReason(reason.reason);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [rejectionReasons, hasNext, hasPrevious, reasons]);

  const loadReasons = async () => {
    try {
      const data = await candidateService.getRejectionReasons();
      setReasons(data);
    } catch (error) {
      console.error('Erro ao carregar motivos:', error);
    }
  };

  const toggleReason = (reason: string) => {
    setRejectionReasons(prev =>
      prev.includes(reason)
        ? prev.filter(r => r !== reason)
        : [...prev, reason]
    );
  };

  const handleApprove = async () => {
    setLoading(true);
    try {
      await candidateService.updateCandidateStatus(
        candidate.registration_number,
        'Aprovado',
        analystEmail,
        [],
        notes
      );
      onUpdate();
      if (hasNext) onNext();
    } catch (error) {
      console.error('Erro ao aprovar:', error);
      alert('Erro ao aprovar candidato');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (rejectionReasons.length === 0) {
      alert('Selecione pelo menos um motivo de reprovação');
      return;
    }

    setLoading(true);
    try {
      await candidateService.updateCandidateStatus(
        candidate.registration_number,
        'Reprovado',
        analystEmail,
        rejectionReasons,
        notes
      );
      onUpdate();
      if (hasNext) onNext();
    } catch (error) {
      console.error('Erro ao reprovar:', error);
      alert('Erro ao reprovar candidato');
    } finally {
      setLoading(false);
    }
  };

  const handleFlag = async () => {
    try {
      await candidateService.flagCandidate(
        candidate.registration_number,
        !candidate.flagged
      );
      onUpdate();
    } catch (error) {
      console.error('Erro ao marcar:', error);
    }
  };

  const groupedReasons = reasons.reduce((acc, reason) => {
    if (!acc[reason.category]) {
      acc[reason.category] = [];
    }
    acc[reason.category].push(reason);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200">
      <div className="p-4 border-b border-slate-200 bg-slate-50">
        <h3 className="font-bold text-slate-800 mb-2">Triagem Rápida</h3>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Clock className="w-4 h-4" />
          <span>Use atalhos: A (aprovar) • R (reprovar) • F (marcar) • 0-9 (motivos)</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Motivos de Reprovação
          </label>
          <div className="space-y-3">
            {Object.entries(groupedReasons).map(([category, categoryReasons]) => (
              <div key={category}>
                <h4 className="text-xs font-semibold text-slate-600 mb-2">{category}</h4>
                <div className="space-y-1">
                  {categoryReasons.map((reason) => (
                    <label
                      key={reason.id}
                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={rejectionReasons.includes(reason.reason)}
                        onChange={() => toggleReason(reason.reason)}
                        className="mt-1 w-4 h-4 text-blue-600 rounded"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-800">{reason.reason}</span>
                          {reason.shortcut_key && (
                            <kbd className="px-2 py-0.5 bg-slate-200 text-slate-700 text-xs rounded font-mono">
                              {reason.shortcut_key}
                            </kbd>
                          )}
                        </div>
                        {reason.description && (
                          <p className="text-xs text-slate-500 mt-0.5">{reason.description}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Observações
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            rows={4}
            placeholder="Adicione observações sobre este candidato..."
          />
        </div>
      </div>

      <div className="p-4 border-t border-slate-200 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleApprove}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 font-semibold"
          >
            <CheckCircle className="w-5 h-5" />
            <span>Aprovar</span>
            <kbd className="ml-auto px-2 py-0.5 bg-green-700 text-green-100 text-xs rounded font-mono">A</kbd>
          </button>

          <button
            onClick={handleReject}
            disabled={loading || rejectionReasons.length === 0}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 font-semibold"
          >
            <XCircle className="w-5 h-5" />
            <span>Reprovar</span>
            <kbd className="ml-auto px-2 py-0.5 bg-red-700 text-red-100 text-xs rounded font-mono">R</kbd>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={onPrevious}
            disabled={!hasPrevious || loading}
            className="flex items-center justify-center gap-1 px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Anterior</span>
          </button>

          <button
            onClick={handleFlag}
            disabled={loading}
            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all text-sm font-medium ${
              candidate.flagged
                ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-400'
                : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Flag className="w-4 h-4" />
            <kbd className="px-2 py-0.5 bg-slate-200 text-slate-700 text-xs rounded font-mono">F</kbd>
          </button>

          <button
            onClick={onNext}
            disabled={!hasNext || loading}
            className="flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
          >
            <span>Próximo</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
