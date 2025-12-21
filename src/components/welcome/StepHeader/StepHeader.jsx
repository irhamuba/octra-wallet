import React from 'react';
import { ChevronLeftIcon } from '../../shared/Icons/Icons';
import './StepHeader.css';

/**
 * StepHeader Component
 * Layout:
 * ┌─────────────────────────────────┐
 * │  ←     Create Password          │  ← Back + Title in same row
 * │         ●───●───○               │  ← Step indicators below
 * └─────────────────────────────────┘
 */
export function StepHeader({
    title,
    currentStep,
    totalSteps = 3,
    onBack
}) {
    return (
        <div className="step-header">
            {/* Row 1: Back Button + Title */}
            <div className="step-header-row">
                <button className="step-header-back" onClick={onBack}>
                    <ChevronLeftIcon size={20} />
                </button>
                <span className="step-header-title">{title}</span>
                <div className="step-header-spacer" />
            </div>

            {/* Row 2: Step Indicators */}
            <div className="step-header-indicators">
                {Array.from({ length: totalSteps }, (_, i) => {
                    const stepNum = i + 1;
                    const isActive = stepNum === currentStep;
                    const isCompleted = stepNum < currentStep;

                    return (
                        <React.Fragment key={stepNum}>
                            <div
                                className={`step-header-dot ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                            >
                                {isCompleted ? '✓' : stepNum}
                            </div>
                            {stepNum < totalSteps && (
                                <div className={`step-header-line ${isCompleted ? 'completed' : ''}`} />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
}

export default StepHeader;
