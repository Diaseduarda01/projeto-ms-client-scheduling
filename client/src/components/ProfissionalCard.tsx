interface ProfissionalCardProps {
  nome: string;
  foto?: string;
  selected?: boolean;
  onClick?: () => void;
}

export function ProfissionalCard({
  nome,
  foto,
  selected,
  onClick,
}: ProfissionalCardProps) {
  return (
    <button
      onClick={onClick}
      className={`
        p-4 rounded-3xl border-2 text-center transition-all flex flex-col items-center gap-3
        ${
          selected
            ? 'border-violet-600 bg-violet-50'
            : 'border-gray-100 bg-white hover:border-gray-200'
        }
      `}
    >
      {foto ? (
        <img
          src={foto}
          alt={nome}
          className="w-16 h-16 rounded-full object-cover"
        />
      ) : (
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
          <span className="text-2xl text-gray-400 font-medium">
            {nome.charAt(0)}
          </span>
        </div>
      )}
      <span className="font-medium text-gray-900">{nome}</span>
      {selected && (
        <div className="w-6 h-6 bg-violet-600 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </button>
  );
}
