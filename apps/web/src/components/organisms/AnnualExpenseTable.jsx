import React from 'react';
import MonthViewBlock from './MonthViewBlock';
import AnnualCapitalBlock from './AnnualCapitalBlock';
import ComparisonBlock from './ComparisonBlock';

const AnnualExpenseTable = (props) => {
  const { view, loading } = props;

  if (loading && view === 'month') {
    return (
      <div className="py-40 flex flex-col items-center gap-4 animate-pulse">
        <div className="w-10 h-10 border-4 border-accent/10 border-t-accent rounded-full animate-spin" />
        <p className="text-xs font-black uppercase tracking-[0.3em] text-tx-muted">Synchronizing cost centers...</p>
      </div>
    );
  }

  return (
    <>
      {view === 'month' && <MonthViewBlock {...props} />}
      {view === 'annual' && <AnnualCapitalBlock {...props} />}
      {view === 'comp' && <ComparisonBlock {...props} />}
    </>
  );
};

export default AnnualExpenseTable;
