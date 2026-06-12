#!/bin/bash
# LERA Academy - Image Setup Script
# Run this script after downloading images from Facebook

echo "🖼️ LERA Academy Image Setup"
echo "=========================="
echo ""
echo "Please save the downloaded Facebook images with these names:"
echo ""
echo "📁 /frontend/public/images/gallery/"
echo "   - lera-classroom-teacher.jpg  (Teacher helping students write)"
echo "   - lera-students-writing.jpg   (Students with navy uniform)"
echo "   - lera-kids-crafts.jpg        (Kids doing bunny craft activity)"
echo "   - lera-classroom-modern.jpg   (Modern classroom view)"
echo "   - lera-center.jpg             (Center exterior/building)"
echo "   - lera-students-group.jpg     (Group photo)"
echo ""
echo "📁 /frontend/public/images/logo/"
echo "   - lera-logo.png               (Logo with book and stars)"
echo "   - lera-logo-white.png         (White version)"
echo "   - lera-icon.png               (Small icon)"
echo ""
echo "📁 /frontend/public/images/courses/"
echo "   - ielts-prep.jpg              (IELTS preparation class)"
echo "   - business-english.jpg        (Business English class)"
echo ""
echo "✅ After placing images, restart the frontend:"
echo "   cd frontend && npm run dev"
echo ""

# Check if images directory exists
if [ -d "frontend/public/images/gallery" ]; then
    echo "📂 Gallery directory exists"
    ls -la frontend/public/images/gallery/
else
    echo "❌ Gallery directory missing - creating..."
    mkdir -p frontend/public/images/gallery
fi

if [ -d "frontend/public/images/logo" ]; then
    echo "📂 Logo directory exists"
    ls -la frontend/public/images/logo/
else
    echo "❌ Logo directory missing - creating..."
    mkdir -p frontend/public/images/logo
fi

if [ -d "frontend/public/images/courses" ]; then
    echo "📂 Courses directory exists"
    ls -la frontend/public/images/courses/
else
    echo "❌ Courses directory missing - creating..."
    mkdir -p frontend/public/images/courses
fi

echo ""
echo "🎉 Setup complete! Now save your images to the folders above."
