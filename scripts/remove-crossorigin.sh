#!/bin/bash
# Remove @CrossOrigin(origins = "*") from ALL Java controller files
# CORS is now handled centrally by SecurityConfig in each service

echo "=== Removing @CrossOrigin(origins = \"*\") from all controllers ==="

find /Users/rahulsharma/LERA_Group/backend -name "*.java" -path "*/controller/*" -exec \
  sed -i '' '/@CrossOrigin(origins = "\*")/d' {} \;

# Count remaining
remaining=$(grep -rl '@CrossOrigin' /Users/rahulsharma/LERA_Group/backend --include="*.java" 2>/dev/null | wc -l)
echo "Files still containing @CrossOrigin: $remaining"

echo "=== Also removing unused CrossOrigin imports ==="
find /Users/rahulsharma/LERA_Group/backend -name "*.java" -path "*/controller/*" -exec \
  sed -i '' '/^import org.springframework.web.bind.annotation.CrossOrigin;$/d' {} \;

echo "=== Done! CORS is now handled centrally by SecurityConfig ==="
