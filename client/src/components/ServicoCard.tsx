interface ServicoCardProps {
  nome: string;
  descricao?: string;
  duracao: number;
  preco: string;
  selected?: boolean;
  onClick?: () => void;
}

export function ServicoCard({
  nome,
  descricao,
  duracao,
  preco,
  selected,
  onClick,
}: ServicoCardProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full p-5 rounded-3xl border-2 text-left transition-all
        ${
          selected
            ? 'border-violet-600 bg-violet-50'
            : 'border-gray-100 bg-white hover:border-gray-200'
        }
      `}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{nome}</h3>
          {descricao && (
            <p className="text-sm text-gray-500 mt-1">{descricao}</p>
          )}
          <div className="flex items-center gap-3 mt-3">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {duracao} min
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-lg font-bold text-violet-600">
            R$ {preco}
          </span>
        </div>
      </div>
      {selected && (
        <div className="mt-3 flex justify-end">
          <div className="w-6 h-6 bg-violet-600 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      )}
    </button>
  );
}
