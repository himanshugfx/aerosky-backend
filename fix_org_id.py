import os
import re

patterns = [
    # Remove select: { organizationId: true }
    (re.compile(r'select:\s*{\s*organizationId:\s*true\s*}', re.MULTILINE), ''),
    # Remove organizationId: ...,
    (re.compile(r'organizationId:\s*[^,\n]+,?', re.MULTILINE), ''),
    # Remove where.organizationId = ...;
    (re.compile(r'where\.organizationId\s*=\s*[^;\n]+;', re.MULTILINE), ''),
    # Remove const { ..., organizationId } = ...;
    (re.compile(r',\s*organizationId\b'), ''),
    (re.compile(r'\borganizationId\s*,\s*'), ''),
    # Remove targetOrgId logic
    (re.compile(r'const\s+targetOrgId\s*=[^;\n]+;', re.MULTILINE), ''),
    # Remove organization relation Selection
    (re.compile(r'organization:\s*{\s*select:\s*{\s*name:\s*true\s*}\s*},?', re.MULTILINE), ''),
    # Remove if block checking organizationId
    (re.compile(r'if\s*\(auth\.user\.role\s*!==\s*\'SUPER_ADMIN\'\s*&&\s*existingDrone\.organizationId\s*!==\s*auth\.user\.organizationId\)\s*\{\s*return\s*NextResponse\.json\({[^}]*}\s*,\s*{\s*status:\s*403\s*}\);\s*}', re.MULTILINE), '// Scoping check removed'),
]

# Specifically target drones detail detail as it was failing
def fix_file(path):
    with open(path, 'r') as f:
        content = f.read()
    
    new_content = content
    # Handle the drones detail scoping block more specifically as it was tricky
    new_content = re.sub(r'// Organization scoping check\s+if\s*\(auth\.user\.role\s*!==\s*\'SUPER_ADMIN\'\s*&&\s*existingDrone\.organizationId\s*!==\s*auth\.user\.organizationId\)\s*{\s*return\s*NextResponse\.json\({[^}]*}\s*,\s*{\s*status:\s*403\s*}\);\s*}', '// Scoping check removed', new_content, flags=re.MULTILINE)
    
    # Handle the select block
    new_content = re.sub(r'select:\s*{\s*organizationId:\s*true\s*}', '/* select: { organizationId: true } removed */', new_content)
    
    # Handle simple property assignments
    new_content = re.sub(r'organizationId:\s*user\.organizationId,?', '', new_content)
    new_content = re.sub(r'organizationId:\s*targetOrgId,?', '', new_content)
    new_content = re.sub(r'where\.organizationId\s*=\s*auth\.user\.organizationId;?', '', new_content)
    new_content = re.sub(r',\s*organizationId\b', '', new_content)
    new_content = re.sub(r'\borganizationId\s*,\s*', '', new_content)
    
    # Write back
    if new_content != content:
        with open(path, 'w') as f:
            f.write(new_content)
        print(f"Fixed {path}")

# Run for all api files
for root, dirs, files in os.walk('src/app/api'):
    for file in files:
        if file.endswith('.ts') or file.endswith('.tsx'):
            fix_file(os.path.join(root, file))
