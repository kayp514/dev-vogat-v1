import { CheckCircle2, Circle } from "lucide-react"

interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
}

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center space-x-2 mb-8">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div key={index} className="flex items-center">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full border-2 
              ${
                index + 1 <= currentStep
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted text-muted-foreground"
              }`}
          >
            {index + 1 < currentStep ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
          </div>
          {index < totalSteps - 1 && (
            <div className={`h-0.5 w-12 ${index + 1 < currentStep ? "bg-primary" : "bg-muted"}`} />
          )}
        </div>
      ))}
    </div>
  )
}