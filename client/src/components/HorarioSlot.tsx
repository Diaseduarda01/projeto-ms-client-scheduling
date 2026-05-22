interface HorarioSlotProps {
  horario: string;
  profissional?: string;
  selected?: boolean;
  onClick?: () => void;
}

export function HorarioSlot({
  horario,
  profissional,
  selected,
  onClick,
}: HorarioSlotProps) {
  return (
    <button
      onClick={onClick}
      className={`
        px-4 py-3 rounded-2xl border-2 transition-all text-center
        ${
          selected
            ? 'border-violet-600 bg-violet-600 text-white'
            : 'border-gray-100 bg-white hover:border-violet-200 text-gray-900'
        }
      `}
    >
      <span className="font-semibold">{horario}</span>
      {profissional && (
        <span className={`block text-xs mt-1 ${selected ? 'text-violet-100' : 'text-gray-400'}`}>
          {profissional}
        </span>
      )}
    </button>
  );
}
