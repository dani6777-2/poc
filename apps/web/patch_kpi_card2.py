with open('/Users/PERSONAL/Documents/poc/apps/web/src/components/molecules/KpiCard.jsx', 'r') as f:
    text = f.read()

# Make padding more responsive
text = text.replace('className={`p-6 md:p-8 flex flex-col',
                    'className={`p-5 lg:p-6 xl:p-8 flex flex-col')

# Make badge padding smaller
text = text.replace('px-5 py-2 font-black uppercase tracking-[0.3em] text-[10px] w-fit',
                    'px-4 py-1.5 font-black uppercase tracking-[0.2em] text-[9px] w-fit')

# Scale the text size responsively and add min-w-0 for safety
text = text.replace('className="tabular-nums drop-shadow-sm tracking-tighter text-4xl lg:text-5xl font-black"',
                    'className="tabular-nums drop-shadow-sm tracking-tighter text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-black truncate w-full block"')

text = text.replace('className="relative z-10 flex-1 flex flex-col justify-center"',
                    'className="relative z-10 flex-1 flex flex-col justify-center min-w-0"')

with open('/Users/PERSONAL/Documents/poc/apps/web/src/components/molecules/KpiCard.jsx', 'w') as f:
    f.write(text)
