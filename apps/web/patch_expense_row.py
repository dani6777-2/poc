import re

with open('/Users/PERSONAL/Documents/poc/apps/web/src/components/molecules/ExpenseMatrixRow.jsx', 'r') as f:
    text = f.read()

# Reduce row height
text = text.replace('className={`hover:bg-tx-primary/[0.04] transition-all group ${auto ? "bg-accent/[0.03]" : ""} h-20`}', 
                    'className={`hover:bg-tx-primary/[0.04] transition-all group ${auto ? "bg-accent/[0.03]" : ""} h-14`}')

# Reduce first cell padding
text = text.replace('className="p-5 pl-10"', 'className="p-3 pl-6"')

# Reduce input height and padding
text = text.replace('className="w-full h-12', 'className="w-full h-10')

# Reduce VarBadge container padding
text = text.replace('className="p-5 text-right"', 'className="p-3 text-right"')

# Write back
with open('/Users/PERSONAL/Documents/poc/apps/web/src/components/molecules/ExpenseMatrixRow.jsx', 'w') as f:
    f.write(text)
