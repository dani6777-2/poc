with open('/Users/PERSONAL/Documents/poc/apps/web/src/pages/Dashboard.jsx', 'r') as f:
    text = f.read()

# First Card (Health Score)
text = text.replace('className="p-6 lg:p-10 flex items-center gap-6 lg:p-10 border-none shadow-premium relative overflow-hidden group"',
                    'className="p-6 lg:p-8 flex flex-col xl:flex-row items-center justify-center gap-6 border border-border-base shadow-md relative bg-secondary hover:shadow-lg transition-all duration-500 rounded-[2rem] overflow-hidden group"')

# Third Card (AI Asset Location)
text = text.replace('className="p-6 lg:p-10 flex flex-col justify-center gap-5 md:p-8 border-none shadow-premium bg-linear-to-br from-secondary to-transparent"',
                    'className="p-6 lg:p-8 flex flex-col justify-center gap-5 border border-border-base shadow-md relative bg-secondary hover:shadow-lg transition-all duration-500 rounded-[2rem]"')


with open('/Users/PERSONAL/Documents/poc/apps/web/src/pages/Dashboard.jsx', 'w') as f:
    f.write(text)
