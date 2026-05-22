interface StepperProps {
  steps: string[];
  currentStep: number;
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className="flex items-center justify-center gap-2 py-6">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center gap-2">
          <div
            className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
              ${
                index < currentStep
                  ? 'bg-violet-600 text-white'
                  : index === currentStep
                  ? 'bg-violet-100 text-violet-600 ring-2 ring-violet-600'
                  : 'bg-gray-100 text-gray-400'
              }
            `}
          >
            {index < currentStep ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              index + 1
            )}
          </div>
          {index < steps.length - 1 && (
            <div
              className={`w-8 h-0.5 ${
                index < currentStep ? 'bg-violet-600' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
