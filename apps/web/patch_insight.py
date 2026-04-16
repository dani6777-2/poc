with open('/Users/PERSONAL/Documents/poc/apps/web/src/components/organisms/InsightPanel.jsx', 'r') as f:
    text = f.read()

text = text.replace('className="p-6 lg:p-10 border-none shadow-premium relative bg-secondary overflow-hidden h-full"',
                    'className="p-6 lg:p-8 flex flex-col border border-border-base shadow-md relative bg-secondary hover:shadow-lg transition-all duration-500 rounded-[2rem] h-full overflow-hidden"')

with open('/Users/PERSONAL/Documents/poc/apps/web/src/components/organisms/InsightPanel.jsx', 'w') as f:
    f.write(text)
