with open('/Users/PERSONAL/Documents/poc/apps/web/src/components/organisms/ComparisonBlock.jsx', 'r') as f:
    text = f.read()

# ComparisonBlock Header
text = text.replace('className="p-5 md:p-8 flex items-center justify-between cursor-pointer hover:bg-tx-primary/[0.02] transition-colors"',
                    'className="p-4 flex items-center justify-between cursor-pointer hover:bg-tx-primary/[0.02] transition-colors"')
text = text.replace('className="text-3xl grayscale group-hover:grayscale-0 transition-all duration-500 filter drop-shadow-sm"',
                    'className="text-2xl grayscale group-hover:grayscale-0 transition-all duration-500 filter drop-shadow-sm"')
text = text.replace('className="text-[14px] font-black text-tx-primary uppercase tracking-[0.3em]"',
                    'className="text-[12px] font-black text-tx-primary uppercase tracking-[0.2em]"')
text = text.replace('<div className="flex items-center gap-5">',
                    '<div className="flex items-center gap-4">')

# Header stats
text = text.replace('className="flex gap-6 md:p-12 items-center"', 'className="flex gap-4 md:px-6 md:py-2 items-center"')
text = text.replace('className="hidden md:flex gap-6 lg:p-10 text-[11px] font-black uppercase tracking-[0.2em]"',
                    'className="hidden md:flex gap-6 lg:px-6 lg:py-2 text-[10px] font-black uppercase tracking-[0.2em]"')
text = text.replace('className="flex flex-col items-end text-right"', 'className="flex flex-col items-end text-right scale-90 origin-right"')

# Compare table row styling
text = text.replace('className="p-7 pl-10"', 'className="p-3 pl-6"')
text = text.replace('className="p-7 text-right"', 'className="p-3 text-right"')
text = text.replace('className="p-7 text-right font-black tracking-tighter text-[11px] opacity-40"', 
                    'className="p-3 text-right font-black tracking-tighter text-[10px] opacity-40"')

# Reduce footer heights
text = text.replace('className="font-black text-[12px] text-tx-primary uppercase tracking-[0.3em] h-20"',
                    'className="font-black text-[11px] text-tx-primary uppercase tracking-[0.2em] h-14"')


with open('/Users/PERSONAL/Documents/poc/apps/web/src/components/organisms/ComparisonBlock.jsx', 'w') as f:
    f.write(text)
