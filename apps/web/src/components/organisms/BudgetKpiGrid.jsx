import React from 'react';
import BudgetKpiCard from '../molecules/BudgetKpiCard';

/**
 * BudgetKpiGrid
 * Section displaying consolidated budget KPIs.
 */
const BudgetKpiGrid = ({ 
  totalRevenue, 
  totalBudget, 
  totalActual, 
  balance, 
  pct, 
  fmt 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
       <BudgetKpiCard 
          label="Operating Capital"
          value={fmt(totalRevenue || 0)}
          subtitle={totalRevenue > 0 ? 'Verified from Revenues' : 'No records'}
          variant="success"
       />
       <BudgetKpiCard 
          label="Assigned Limit"
          value={fmt(totalBudget)}
          subtitle="Sum of all categories"
       />
       <BudgetKpiCard 
          label="Actual Expense"
          value={fmt(totalActual)}
          subtitle="Synced with Registry"
          variant="yellow"
       />
       <BudgetKpiCard 
          label="Net Remainder"
          value={fmt(balance)}
          subtitle={totalRevenue > 0 ? 'Revenue - Actual' : 'Limit - Actual'}
          variant={balance < 0 ? 'danger' : 'success'}
          highlight
       />
       <BudgetKpiCard 
          label="Execution"
          value=""
          progress={pct}
          progressVariant="accent"
       />
    </div>
  );
};

export default BudgetKpiGrid;
