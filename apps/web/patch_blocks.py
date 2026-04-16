import re

files = [
    "/Users/PERSONAL/Documents/poc/apps/web/src/components/organisms/MonthViewBlock.jsx",
    "/Users/PERSONAL/Documents/poc/apps/web/src/components/organisms/AnnualCapitalBlock.jsx",
    "/Users/PERSONAL/Documents/poc/apps/web/src/components/organisms/ComparisonBlock.jsx"
]

for path in files:
    with open(path, "r") as f:
        text = f.read()
        
    text = text.replace(
        'className="overflow-hidden border-none shadow-premium relative"', 
        'className="overflow-hidden border border-border-base shadow-md relative bg-secondary hover:shadow-lg transition-all duration-500"'
    )
    
    with open(path, "w") as f:
        f.write(text)
