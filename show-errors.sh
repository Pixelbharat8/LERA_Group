#!/bin/bash

# Show errors from all service logs

echo "🔍 Checking for errors in service logs..."
echo "=========================================="

for service in identity_service academy_service attendance_service payment_service payroll_service connect_service ai_gateway rule_engine; do
    if [ -f "/tmp/${service}.log" ]; then
        echo ""
        echo "📋 $service:"
        echo "---"
        # Show last 30 lines and filter for errors
        tail -30 "/tmp/${service}.log" | grep -i "error\|exception\|failed\|cannot\|unable" || echo "   No errors found in last 30 lines"
    else
        echo ""
        echo "📋 $service:"
        echo "   ⚠️  Log file not found at /tmp/${service}.log"
    fi
done

echo ""
echo "=========================================="
echo "📝 View full log: cat /tmp/<service_name>.log"
