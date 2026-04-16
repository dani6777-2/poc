with open('/Users/PERSONAL/Documents/poc/apps/web/src/pages/Dashboard.jsx', 'r') as f:
    text = f.read()

# Economic Flow Analytics
text = text.replace('className="p-6 lg:p-10 shadow-premium border-none"',
                    'className="p-6 lg:p-8 flex flex-col justify-between border border-border-base shadow-md relative bg-secondary hover:shadow-lg transition-all duration-500 rounded-[2rem] h-full overflow-hidden"')

# Active Portfolio Categories
text = text.replace('Card className="p-6 md:p-12 shadow-premium border-none relative overflow-hidden"',
                    'Card className="p-6 lg:p-10 border border-border-base shadow-md relative bg-secondary hover:shadow-lg transition-all duration-500 rounded-[2rem] overflow-hidden"')

with open('/Users/PERSONAL/Documents/poc/apps/web/src/pages/Dashboard.jsx', 'w') as f:
    f.write(text)
