import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface DisqualificationReason {
  id: string;
  reason: string;
  is_active: boolean;
}

interface DisqualificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reasonId: string, notes: string) => void;
  candidateName: string;
}

export default function DisqualificationModal({
  isOpen,
  onClose,
  onConfirm,
  candidateName
}: DisqualificationModalProps) {
  const [reasons, setReasons] = useState<DisqualificationReason[]>([]);
  const [selectedReasonId, setSelectedReasonId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadReasons();
    }
  }, [isOpen]);

  async function loadReasons() {
    try {
      setLoading(true);
      const { googleSheetsService } = await import('../services/googleSheets');
      const result = await googleSheetsService.getDisqualificationReasons();

      if (!result.success) {
        throw new Error(result.error || 'Erro ao carregar motivos');
      }

      setReasons(result.data || []);
    } catch (error) {
      console.error('Erro ao carregar motivos:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleConfirm() {
    if (!selectedReasonId) {
      alert('Por favor, selecione um motivo de desclassificação');
      return;
    }
    onConfirm(selectedReasonId, notes);
    handleClose();
  }

  function handleClose() {
    setSelectedReasonId('');
    setNotes('');
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">
            Desclassificar Candidato
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <p className="text-sm text-gray-600">Candidato:</p>
            <p className="text-lg font-semibold text-gray-800">{candidateName}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivo da Desclassificação *
            </label>
            {loading ? (
              <div className="text-sm text-gray-500">Carregando motivos...</div>
            ) : (
              <div className="space-y-2">
                {reasons.map((reason) => (
                  <label
                    key={reason.id}
                    className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedReasonId === reason.id
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={reason.id}
                      checked={selectedReasonId === reason.id}
                      onChange={(e) => setSelectedReasonId(e.target.value)}
                      className="mt-1 mr-3"
                    />
                    <span className="text-sm text-gray-700">{reason.reason}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Adicione observações adicionais sobre a desclassificação..."
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedReasonId}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Desclassificar
          </button>
        </div>
      </div>
    </div>
  );
}
