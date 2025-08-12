import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Circle } from 'lucide-react';
import { CompleteBrandProfile } from './cbrand-wizard';
import { calculateProgress } from './form-validation';

interface ProgressIndicatorProps {
  brandProfile: CompleteBrandProfile;
  currentStep: number;
}

export function ProgressIndicator({ brandProfile, currentStep }: ProgressIndicatorProps) {
  const progress = calculateProgress(brandProfile);

  const steps = [
    {
      id: 1,
      title: 'Website Analysis',
      progress: progress.byStep.step1,
      status: getStepStatus(1, currentStep, progress.byStep.step1),
    },
    {
      id: 2,
      title: 'Brand Details',
      progress: progress.byStep.step2,
      status: getStepStatus(2, currentStep, progress.byStep.step2),
    },
    {
      id: 3,
      title: 'Logo Upload',
      progress: progress.byStep.step3,
      status: getStepStatus(3, currentStep, progress.byStep.step3),
    },
  ];

  return (
    <div className="space-y-3">
      {/* Overall Progress */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-medium text-gray-700">Overall Progress</span>
          <Badge variant={progress.overall === 100 ? 'default' : 'secondary'} className="text-xs px-2 py-0">
            {progress.overall}% Complete
          </Badge>
        </div>
        <Progress value={progress.overall} className="h-1.5" />
      </div>

      {/* Step-by-step Progress */}
      <div className="space-y-2">
        {steps.map((step) => (
          <div key={step.id} className="flex items-center space-x-2">
            <div className="flex-shrink-0">
              {step.status === 'complete' && (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              {step.status === 'current' && (
                <AlertCircle className="h-4 w-4 text-blue-500" />
              )}
              {step.status === 'pending' && (
                <Circle className="h-4 w-4 text-gray-300" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-0.5">
                <span className={`text-xs font-medium ${step.status === 'current' ? 'text-blue-700' :
                  step.status === 'complete' ? 'text-green-700' :
                    'text-gray-500'
                  }`}>
                  {step.title}
                </span>
                <span className="text-xs text-gray-500">
                  {step.progress}%
                </span>
              </div>
              <Progress
                value={step.progress}
                className={`h-1 ${step.status === 'current' ? 'bg-blue-100' :
                  step.status === 'complete' ? 'bg-green-100' :
                    'bg-gray-100'
                  }`}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Completion Status */}
      {progress.overall === 100 && (
        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
          <div className="flex items-center">
            <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
            <span className="text-xs font-medium text-green-800">
              Profile complete!
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function getStepStatus(
  stepId: number,
  currentStep: number,
  stepProgress: number
): 'complete' | 'current' | 'pending' {
  if (stepProgress === 100) return 'complete';
  if (stepId === currentStep) return 'current';
  if (stepId < currentStep) return 'complete';
  return 'pending';
}
