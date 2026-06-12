-- Insert sample notifications for testing
-- Run this script to add notifications to the database

-- First, delete existing test notifications to avoid duplicates
DELETE FROM notifications WHERE id IN (
    'i1b2c3d4-e5f6-7890-abcd-ef1234567891',
    'i1b2c3d4-e5f6-7890-abcd-ef1234567892',
    'i1b2c3d4-e5f6-7890-abcd-ef1234567893',
    'i1b2c3d4-e5f6-7890-abcd-ef1234567894',
    'i1b2c3d4-e5f6-7890-abcd-ef1234567895',
    'i1b2c3d4-e5f6-7890-abcd-ef1234567896',
    'i1b2c3d4-e5f6-7890-abcd-ef1234567897',
    'i1b2c3d4-e5f6-7890-abcd-ef1234567898',
    'i1b2c3d4-e5f6-7890-abcd-ef1234567899',
    'i1b2c3d4-e5f6-7890-abcd-ef123456789a',
    'i1b2c3d4-e5f6-7890-abcd-ef123456789b'
);

-- Insert notifications
INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
VALUES 
    -- Broadcast notifications (user_id NULL = for all users)
    ('i1b2c3d4-e5f6-7890-abcd-ef1234567891', NULL, 'System Update', 'New features have been added to the platform. Check out the improved dashboard!', 'info', false, NOW() - INTERVAL '1 hour'),
    ('i1b2c3d4-e5f6-7890-abcd-ef1234567892', NULL, 'New Assignment Posted', 'A new assignment has been posted for your class. Please review and complete.', 'info', false, NOW() - INTERVAL '2 hours'),
    ('i1b2c3d4-e5f6-7890-abcd-ef1234567893', NULL, 'Attendance Reminder', 'Please mark attendance for today classes before 5 PM', 'warning', false, NOW() - INTERVAL '30 minutes'),
    ('i1b2c3d4-e5f6-7890-abcd-ef1234567894', NULL, 'Payment Received', 'Payment confirmation for January tuition has been processed', 'success', true, NOW() - INTERVAL '1 day'),
    
    -- CEO specific notifications (Ledia Balliu - e0000000-0000-0000-0000-000000000002)
    ('i1b2c3d4-e5f6-7890-abcd-ef1234567895', 'e0000000-0000-0000-0000-000000000002', 'Monthly Report Ready', 'The January 2026 monthly performance report is ready for review', 'info', false, NOW() - INTERVAL '5 minutes'),
    ('i1b2c3d4-e5f6-7890-abcd-ef1234567896', 'e0000000-0000-0000-0000-000000000002', 'New Enrollment Request', 'A new student enrollment request requires your approval', 'approval', false, NOW() - INTERVAL '15 minutes'),
    ('i1b2c3d4-e5f6-7890-abcd-ef1234567897', 'e0000000-0000-0000-0000-000000000002', 'Budget Review', 'Q1 2026 budget proposal needs your review and approval', 'approval', false, NOW() - INTERVAL '45 minutes'),
    
    -- Chairman specific notifications (Rahul Sharma - e0000000-0000-0000-0000-000000000001)
    ('i1b2c3d4-e5f6-7890-abcd-ef1234567898', 'e0000000-0000-0000-0000-000000000001', 'Board Meeting Scheduled', 'Monthly board meeting scheduled for Feb 15, 2026', 'info', false, NOW() - INTERVAL '10 minutes'),
    ('i1b2c3d4-e5f6-7890-abcd-ef1234567899', 'e0000000-0000-0000-0000-000000000001', 'Strategic Plan Review', 'Annual strategic plan document requires your final approval', 'approval', false, NOW() - INTERVAL '20 minutes'),
    
    -- Director notifications (e0000000-0000-0000-0000-000000000004)
    ('i1b2c3d4-e5f6-7890-abcd-ef123456789a', 'e0000000-0000-0000-0000-000000000004', 'Staff Performance Review', 'Q4 2025 staff performance reviews are due this week', 'warning', false, NOW() - INTERVAL '3 hours'),
    ('i1b2c3d4-e5f6-7890-abcd-ef123456789b', 'e0000000-0000-0000-0000-000000000004', 'New Course Proposal', 'IELTS Advanced course proposal submitted for review', 'info', false, NOW() - INTERVAL '1 hour');

-- Show count
SELECT COUNT(*) as total_notifications FROM notifications;
SELECT user_id, COUNT(*) as count FROM notifications GROUP BY user_id;
