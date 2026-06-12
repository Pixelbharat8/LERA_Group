#!/bin/bash

cd "$(dirname "$0")"
cd backend/attendance_service

echo "🚀 Starting Attendance Service with Leave Management..."
echo "📁 Working Directory: $(pwd)"
echo ""

mvn clean install -DskipTests && mvn spring-boot:run -DskipTests
