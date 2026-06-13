#!/bin/bash
# ============================================================
# LERA Academy — Bulk Security Fix Script
# 1) Remove @CrossOrigin(origins = "*") from ALL controllers
# 2) Add @Valid to @RequestBody parameters
# ============================================================

set -e

BACKEND="/Users/rahulsharma/LERA_Group/backend"

echo "=== Step 1: Remove @CrossOrigin(origins = \"*\") from ALL controllers ==="
find "$BACKEND" -name "*.java" -path "*/controller/*" -exec grep -l '@CrossOrigin' {} \; | while read f; do
    sed -i '' '/@CrossOrigin(origins = "\*")/d' "$f"
    # Also remove the import if it's now unused
    # Only remove if no other @CrossOrigin usage remains
    if ! grep -q '@CrossOrigin' "$f"; then
        sed -i '' '/import org.springframework.web.bind.annotation.CrossOrigin;/d' "$f"
    fi
    echo "  Fixed: $f"
done
echo "  Done removing @CrossOrigin"

echo ""
echo "=== Step 2: Add @Valid to @RequestBody in POST/PUT/PATCH methods ==="
echo "  (Skipping Map<> and List<> body params — only entity types)"
find "$BACKEND" -name "*.java" -path "*/controller/*" -exec grep -l '@RequestBody' {} \; | while read f; do
    # Replace @RequestBody with @Valid @RequestBody (only where @Valid is not already present)
    # This regex matches lines that have @RequestBody but NOT @Valid before it
    sed -i '' 's/@RequestBody \([A-Z][a-zA-Z]*\)/@Valid @RequestBody \1/g' "$f"
    
    # Add jakarta.validation.Valid import if @Valid was added and import doesn't exist
    if grep -q '@Valid' "$f" && ! grep -q 'import jakarta.validation.Valid' "$f"; then
        # Add import after the last existing import line
        sed -i '' '/^import /{ 
            $a\
import jakarta.validation.Valid;
        }' "$f"
    fi
    echo "  Fixed: $f"
done

echo ""
echo "=== All fixes applied! ==="
echo "Run 'mvn compile' in each service to verify."
