with open('/Users/PERSONAL/Documents/poc/apps/web/src/components/organisms/AnnualCapitalBlock.jsx', 'r') as f:
    text = f.read()

# Reduce card header padding
text = text.replace('className="p-5 md:p-8 flex items-center justify-between cursor-pointer border-b border-border-base/40 bg-tx-primary/[0.01] hover:bg-tx-primary/[0.03] transition-colors"', 
                    'className="p-4 md:p-5 flex items-center justify-between cursor-pointer border-b border-border-base/40 bg-tx-primary/[0.01] hover:bg-tx-primary/[0.03] transition-colors"')

text = text.replace('className="text-[14px] font-black uppercase tracking-[0.3em] text-tx-primary"',
                    'className="text-[12px] font-black uppercase tracking-[0.2em] text-tx-primary"')
text = text.replace('<div className="flex items-center gap-5">',
                    '<div className="flex items-center gap-4">')

# table cell sizes
text = text.replace('className="p-4 pl-10 min-w-[300px]"', 'className="p-3 pl-6 min-w-[250px]"')
text = text.replace('className="h-full px-4 text-left w-full min-w-[120px] bg-transparent text-sm focus:outline-none focus:bg-tx-primary/5 focus:ring-1 focus:ring-accent/30 rounded-xl transition-all"',
                    'className="h-10 px-3 text-left w-full min-w-[100px] bg-transparent text-[13px] focus:outline-none focus:bg-tx-primary/5 focus:ring-1 focus:ring-accent/30 rounded-xl transition-all"')

# Header padding (main top block)
text = text.replace('className="p-6 lg:p-10 border-b border-border-base bg-tx-primary/[0.02] flex items-center justify-between"',
                    'className="p-4 lg:p-6 border-b border-border-base bg-tx-primary/[0.02] flex items-center justify-between"')


with open('/Users/PERSONAL/Documents/poc/apps/web/src/components/organisms/AnnualCapitalBlock.jsx', 'w') as f:
    f.write(text)
