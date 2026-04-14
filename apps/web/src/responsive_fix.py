import os
import re

directories_to_scan = ['../web/src/pages', '../web/src/components', '../web/src/templates']

replacements = {
    r'\bp-16\b': 'p-6 lg:p-16',
    r'\bp-14\b': 'p-6 lg:p-14',
    r'\bp-12\b': 'p-5 lg:p-12',
    r'\bp-10\b': 'p-5 lg:p-10',
    r'\bp-8\b': 'p-4 lg:p-8',
    r'\bgap-10\b': 'gap-5 lg:gap-10',
    r'\bgap-8\b': 'gap-4 lg:gap-8',
    r'\bgap-12\b': 'gap-6 lg:gap-12',
}

for root_dir in directories_to_scan:
    if not os.path.exists(root_dir): continue
    for foldername, subfolders, filenames in os.walk(root_dir):
        for filename in filenames:
            if filename.endswith(".jsx") or filename.endswith(".js"):
                filepath = os.path.join(foldername, filename)
                with open(filepath, 'r') as f:
                    content = f.read()

                original_content = content
                for pattern, replacement in replacements.items():
                    # only replace if not already replaced
                    # a bit tricky but regex with exact word match
                    content = re.sub(pattern, replacement, content)

                if content != original_content:
                    with open(filepath, 'w') as f:
                        f.write(content)
                    print(f"Updated {filepath}")
