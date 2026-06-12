'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, User, Calendar, Phone, Mail, MapPin, 
  BookOpen, Clock, DollarSign, FileText, Activity,
  Users, Award, AlertCircle, CheckCircle, XCircle
} from 'lucide-react';
import { apiFetch } from '../../../../lib/api';

interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  createdAt: string;
  profileImage?: string;
  center?: {
    id: string;
    name: string;
  };
}

interface ActivityItem {
  id: string;
  activityType: string;
  entityType?: string;
  entityId?: string;
  title?: string;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

interface ClassSwitch {
  id: string;
  oldClassName?: string;
  newClassName: string;
  reason?: string;
  switchedAt: string;
}

export default function UnifiedUserProfilePage() {
  const params = useParams();
  const userId = params.id as string;
  
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [classSwitches, setClassSwitches] = useState<ClassSwitch[]>([]);
  const [activityCounts, setActivityCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateFilter, setDateFilter] = useState('monthly');

  // Fetch all user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;
      
      setLoading(true);
      try {
        // Fetch user profile
        const userData = await apiFetch(`/api/users/${userId}`).catch(() => null);
        if (userData) setUser(userData);

        const activityData = await apiFetch(`/api/user-activity/user/${userId}/filter/${dateFilter}`).catch(() => []);
        setActivities(Array.isArray(activityData) ? activityData : []);

        const countsData = await apiFetch(`/api/user-activity/user/${userId}/counts`).catch(() => ({}));
        setActivityCounts(countsData && typeof countsData === 'object' ? countsData : {});

        const switchData = await apiFetch(`/api/class-switch/student/${userId}`).catch(() => []);
        setClassSwitches(Array.isArray(switchData) ? switchData : []);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId, dateFilter]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'ENROLLMENT': return <BookOpen className="h-4 w-4 text-blue-500" />;
      case 'PAYMENT': return <DollarSign className="h-4 w-4 text-green-500" />;
      case 'ATTENDANCE': return <CheckCircle className="h-4 w-4 text-purple-500" />;
      case 'CLASS_SWITCH': return <Activity className="h-4 w-4 text-orange-500" />;
      case 'DOCUMENT': return <FileText className="h-4 w-4 text-gray-500" />;
      default: return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'activity', label: 'Activity Timeline', icon: Activity },
    { id: 'classes', label: 'Class History', icon: BookOpen },
    { id: 'payments', label: 'Payments', icon: DollarSign },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'documents', label: 'Documents', icon: FileText },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">User Not Found</h2>
          <p className="text-gray-500 mb-4">The user with ID {userId} could not be found.</p>
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center text-blue-600 hover:underline mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-3xl font-bold">
              {user.fullName?.charAt(0) || 'U'}
            </div>
            
            {/* User Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">{user.fullName}</h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  user.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                  user.status === 'INACTIVE' ? 'bg-gray-100 text-gray-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {user.status}
                </span>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {user.role}
                </span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{user.phone}</span>
                  </div>
                )}
                {user.center && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{user.center.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {formatDate(user.createdAt)}</span>
                </div>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{activityCounts.total || 0}</div>
                <div className="text-xs text-gray-500">Total Activities</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{activityCounts.payment || 0}</div>
                <div className="text-xs text-gray-500">Payments</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">{activityCounts.attendance || 0}</div>
                <div className="text-xs text-gray-500">Attendance</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-orange-600">{classSwitches.length}</div>
                <div className="text-xs text-gray-500">Class Switches</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm mb-6">
        <div className="flex border-b overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Date Filter */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Filter by:</span>
          {['daily', 'weekly', 'monthly', 'yearly'].map(filter => (
            <button
              key={filter}
              onClick={() => setDateFilter(filter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateFilter === filter
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">User Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3">User ID</h3>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">{userId}</code>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3">Role</h3>
                <span className="text-blue-600">{user.role}</span>
              </div>
            </div>
            
            {/* Recent Activity Summary */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-3">Recent Activity</h3>
              {activities.length === 0 ? (
                <p className="text-gray-500">No recent activity</p>
              ) : (
                <div className="space-y-3">
                  {activities.slice(0, 5).map(activity => (
                    <div key={activity.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                      {getActivityIcon(activity.activityType)}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.title || activity.activityType}</p>
                        <p className="text-xs text-gray-500">{activity.description}</p>
                      </div>
                      <span className="text-xs text-gray-400">{formatDate(activity.createdAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Activity Timeline</h2>
            {activities.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No activities found for the selected period</p>
            ) : (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                
                <div className="space-y-4">
                  {activities.map(activity => (
                    <div key={activity.id} className="relative pl-10">
                      {/* Timeline dot */}
                      <div className="absolute left-2 top-2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full"></div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getActivityIcon(activity.activityType)}
                            <span className="font-medium">{activity.title || activity.activityType}</span>
                          </div>
                          <span className="text-sm text-gray-500">{formatDate(activity.createdAt)}</span>
                        </div>
                        {activity.description && (
                          <p className="text-sm text-gray-600">{activity.description}</p>
                        )}
                        {activity.entityType && (
                          <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                            {activity.entityType}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'classes' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Class Switch History</h2>
            {classSwitches.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No class switches recorded</p>
            ) : (
              <div className="space-y-4">
                {classSwitches.map(switchItem => (
                  <div key={switchItem.id} className="border rounded-lg p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        {switchItem.oldClassName && (
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded">
                              {switchItem.oldClassName}
                            </span>
                            <span className="text-gray-400">→</span>
                          </div>
                        )}
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded">
                          {switchItem.newClassName}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">{formatDate(switchItem.switchedAt)}</div>
                        {switchItem.reason && (
                          <div className="text-xs text-gray-400 mt-1">Reason: {switchItem.reason}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Payment History</h2>
            <p className="text-gray-500 text-center py-8">
              Payment data is loaded from the payment service. 
              <br />
              <Link href={`/dashboard/academy/students/${userId}`} className="text-blue-600 hover:underline">
                View full payment details in student profile
              </Link>
            </p>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Attendance Records</h2>
            <p className="text-gray-500 text-center py-8">
              Attendance data is loaded from the attendance service.
              <br />
              <Link href={`/dashboard/academy/students/${userId}`} className="text-blue-600 hover:underline">
                View full attendance details in student profile
              </Link>
            </p>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Documents</h2>
            <p className="text-gray-500 text-center py-8">
              Document data is linked to user profile.
              <br />
              <Link href={`/dashboard/academy/students/${userId}`} className="text-blue-600 hover:underline">
                View and upload documents in student profile
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
