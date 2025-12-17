import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../services/api';
import { getCurrentUser, getUrlParams } from '../utils/auth';

/**
 * Approvals List Page
 * Shows pending approval requests for the logged-in decision maker
 */
export default function ApprovalsList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [approvals, setApprovals] = useState([]);
  const [error, setError] = useState(null);
  
  // Get decision maker user_id from URL params, localStorage, or fallback to mock data
  const getDecisionMakerId = () => {
    // First, try URL parameters (from Directory redirect)
    const urlParams = getUrlParams();
    if (urlParams.user_id) {
      return urlParams.user_id;
    }
    
    // Second, try localStorage (stored by initializeAuthFromUrl)
    const user = getCurrentUser();
    if (user && user.id) {
      return user.id;
    }
    
    // Fallback to mock data for development/testing
    return '550e8400-e29b-41d4-a716-446655440010'; // John Manager from TechCorp
  };
  
  const [decisionMakerId, setDecisionMakerId] = useState(getDecisionMakerId());

  // Update decisionMakerId when auth changes (check after auth initialization completes)
  useEffect(() => {
    // Wait a bit for App.jsx auth initialization to complete
    const checkAuth = () => {
      const newDecisionMakerId = getDecisionMakerId();
      if (newDecisionMakerId !== decisionMakerId) {
        setDecisionMakerId(newDecisionMakerId);
      }
    };

    // Check immediately
    checkAuth();

    // Check again after a short delay (to catch auth initialization from App.jsx)
    const timeout = setTimeout(checkAuth, 1000);

    // Listen for storage events (when auth is updated)
    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [decisionMakerId]);

  useEffect(() => {
    loadApprovals();
  }, [decisionMakerId]);

  const loadApprovals = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getPendingApprovals(decisionMakerId);
      setApprovals(response.approvals || []);
    } catch (err) {
      console.error('Failed to load approvals:', err);
      setError(err.message || 'Failed to load approvals');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-slate-900 dark:to-slate-800">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-slate-900 dark:to-slate-800">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-primary-800 dark:text-primary-300 mb-2">
            Pending Approvals
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Review and approve learning path requests
          </p>
        </div>

        {!decisionMakerId ? (
          <Card>
            <div className="text-center py-8">
              <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                Please log in as a decision maker to view approval requests.
              </p>
              <PrimaryButton onClick={() => navigate('/')}>
                Go to Dashboard
              </PrimaryButton>
            </div>
          </Card>
        ) : error ? (
          <Card>
            <div className="text-center py-8">
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <PrimaryButton onClick={loadApprovals}>
                Try Again
              </PrimaryButton>
            </div>
          </Card>
        ) : approvals.length === 0 ? (
          <Card>
            <div className="text-center py-8">
              <p className="text-neutral-600 dark:text-neutral-400">
                No pending approval requests at this time.
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {approvals.map((approval) => (
              <Card key={approval.id} hover>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-primary-800 dark:text-primary-300 mb-1">
                      {approval.learningPathId || 'Learning Path Approval'}
                    </h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                      Requested on {formatDate(approval.createdAt)}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        approval.status === 'pending'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
                          : approval.status === 'changes_requested'
                          ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                      }`}>
                        {approval.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div>
                    <PrimaryButton
                      onClick={() => navigate(`/approvals/${approval.id}`)}
                      disabled={approval.status === 'approved' || approval.status === 'rejected'}
                    >
                      {approval.status === 'pending' ? 'Review' : 'View'}
                    </PrimaryButton>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

