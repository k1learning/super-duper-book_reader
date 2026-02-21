import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Next/Previous spread navigation and page number indicator.
 */
const PageNavigation = ({ currentSpreadIndex, totalSpreads, onPrev, onNext, leftPageNum, rightPageNum }) => {
    const canPrev = currentSpreadIndex > 0;
    const canNext = currentSpreadIndex < totalSpreads - 1;

    return (
        <div className="page-navigation">
            <button
                type="button"
                className="page-nav-btn"
                onClick={onPrev}
                disabled={!canPrev}
                aria-label="Previous page"
            >
                <ChevronLeft size={24} />
            </button>
            <div className="page-nav-indicator">
                {leftPageNum != null && rightPageNum != null
                    ? `${String(leftPageNum).padStart(2, '0')} – ${String(rightPageNum).padStart(2, '0')}`
                    : `Page ${currentSpreadIndex + 1} of ${totalSpreads}`}
            </div>
            <button
                type="button"
                className="page-nav-btn"
                onClick={onNext}
                disabled={!canNext}
                aria-label="Next page"
            >
                <ChevronRight size={24} />
            </button>
        </div>
    );
};

export default PageNavigation;
