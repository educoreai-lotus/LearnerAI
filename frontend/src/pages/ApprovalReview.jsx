import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import LoadingSpinner from '../components/LoadingSpinner';
import Toast from '../components/Toast';
import LearningPathTimeline from '../components/LearningPathTimeline';
import api from '../services/api';

/**
 * Approval Review Page
 * Allows decision maker to review learning path and approve or request changes
 */
export default function ApprovalReview() {
  const { approvalId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [toast, setToast] = useState(null);
  const [approvalData, setApprovalData] = useState(null);
  const [learningPath, setLearningPath] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadApprovalData();
  }, [approvalId]);

  const loadApprovalData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading approval details for:', approvalId);
      const response = await api.getApprovalDetails(approvalId);
      console.log('Approval response:', response);
      
      if (!response || !response.approval) {
        console.error('Invalid response structure:', response);
        setError('notfound');
        return;
      }
      
      setApprovalData(response.approval);
      
      if (!response.learningPath) {
        console.error('Learning path not found in response:', response);
        setError('notfound');
        return;
      }
      
      setLearningPath(response.learningPath);
    } catch (err) {
      console.error('Failed to load approval:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        response: err.response
      });
      
      if (err.message.includes('403') || err.message.includes('permission') || err.message.includes('Forbidden')) {
        setError('unauthorized');
      } else if (err.message.includes('404') || err.message.includes('not found') || err.message.includes('Not Found')) {
        setError('notfound');
      } else {
        setError('general');
        // Show error toast
        setToast({ 
          message: `Failed to load approval: ${err.message}`, 
          type: 'error' 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setSubmitting(true);
      await api.approvePath(approvalId);
      setToast({ message: 'Learning path approved successfully!', type: 'success' });
      setTimeout(() => {
        navigate('/approvals');
      }, 1500);
    } catch (err) {
      setToast({ message: err.message || 'Failed to approve learning path', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!feedback.trim()) {
      setToast({ message: 'Please provide feedback when requesting changes', type: 'error' });
      return;
    }

    try {
      setSubmitting(true);
      await api.requestChanges(approvalId, feedback);
      setToast({ message: 'Changes requested successfully!', type: 'success' });
      setTimeout(() => {
        navigate('/approvals');
      }, 1500);
    } catch (err) {
      setToast({ message: err.message || 'Failed to request changes', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const hideToast = () => {
    setToast(null);
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

  if (error === 'unauthorized') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-slate-900 dark:to-slate-800">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <div className="text-center py-8">
              <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
                Access Denied
              </h2>
              <p className="text-neutral-600 dark:text-neutral-300 mb-6">
                You do not have permission to review this approval request.
              </p>
              <PrimaryButton onClick={() => navigate('/')}>
                Go to Dashboard
              </PrimaryButton>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (error === 'notfound') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-slate-900 dark:to-slate-800">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <div className="text-center py-8">
              <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-200 mb-4">
                Approval Not Found
              </h2>
              <p className="text-neutral-600 dark:text-neutral-300 mb-6">
                The approval request you're looking for doesn't exist or the learning path hasn't been created yet.
              </p>
              <PrimaryButton onClick={() => navigate('/approvals')}>
                View All Approvals
              </PrimaryButton>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (error === 'general') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-slate-900 dark:to-slate-800">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <div className="text-center py-8">
              <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
                Error Loading Approval
              </h2>
              <p className="text-neutral-600 dark:text-neutral-300 mb-6">
                There was an error loading the approval details. Please try again.
              </p>
              <div className="flex gap-3 justify-center">
                <PrimaryButton onClick={loadApprovalData}>
                  Retry
                </PrimaryButton>
                <PrimaryButton onClick={() => navigate('/approvals')} variant="secondary">
                  Back to Approvals
                </PrimaryButton>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!approvalData || !learningPath) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-slate-900 dark:to-slate-800">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <div className="text-center py-8">
              <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-200 mb-4">
                Missing Data
              </h2>
              <p className="text-neutral-600 dark:text-neutral-300 mb-6">
                {!approvalData && 'Approval data is missing.'}
                {!learningPath && 'Learning path data is missing.'}
              </p>
              <PrimaryButton onClick={() => navigate('/approvals')}>
                View All Approvals
              </PrimaryButton>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const modules = learningPath.modules || [];
  const pathTitle = learningPath.title || 'Learning Path';
  const pathDescription = learningPath.description || learningPath.goal || '';
  
  // Prepare path data for LearningPathTimeline component
  const pathDataForTimeline = {
    pathData: {
      learning_modules: modules,
      total_estimated_duration_hours: learningPath.duration || 0,
      path_title: pathTitle,
      path_description: pathDescription
    },
    pathTitle: pathTitle,
    totalDurationHours: learningPath.duration || 0
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-slate-900 dark:to-slate-800">
      <Header />
      {toast && (
        <div className={`fixed top-4 right-4 z-50 ${
          toast.type === 'success' ? 'bg-green-500 dark:bg-green-600' : 'bg-red-500 dark:bg-red-600'
        } text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] max-w-md`}>
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={hideToast}
            className="text-white hover:text-gray-200 font-bold text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>
      )}

      <main className="pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => navigate('/approvals')}
                className="group flex items-center gap-3 px-5 py-3 bg-white dark:bg-slate-800 border-2 border-primary-600 dark:border-primary-500 text-primary-700 dark:text-primary-400 rounded-lg font-semibold shadow-md hover:shadow-lg hover:bg-primary-50 dark:hover:bg-slate-700 hover:border-primary-700 dark:hover:border-primary-400 transition-all duration-200 transform hover:-translate-y-0.5"
                type="button"
              >
                <svg 
                  className="w-5 h-5 transition-transform duration-200 group-hover:-translate-x-1" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back to Approvals</span>
              </button>
            </div>
          <h1 className="text-3xl font-bold text-primary-800 dark:text-primary-300 mb-2">
            Learning Path Review
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Review the learning path and make your decision
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Learning Path Overview */}
            <Card>
              <h2 className="text-2xl font-bold text-primary-800 dark:text-primary-300 mb-4">
                {pathTitle}
              </h2>
              
              {pathDescription && (
                <p className="text-neutral-700 dark:text-neutral-300 mb-6">
                  {pathDescription}
                </p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {learningPath.duration && (
                  <div className="bg-neutral-50 dark:bg-slate-700 p-4 rounded-lg">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Duration</p>
                    <p className="text-lg font-semibold text-neutral-900 dark:text-white">
                      {learningPath.duration} hours
                    </p>
                  </div>
                )}
                {learningPath.difficulty && (
                  <div className="bg-neutral-50 dark:bg-slate-700 p-4 rounded-lg">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Difficulty</p>
                    <p className="text-lg font-semibold text-neutral-900 dark:text-white">
                      {learningPath.difficulty}
                    </p>
                  </div>
                )}
                {learningPath.audience && (
                  <div className="bg-neutral-50 dark:bg-slate-700 p-4 rounded-lg">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Audience</p>
                    <p className="text-lg font-semibold text-neutral-900 dark:text-white">
                      {learningPath.audience}
                    </p>
                  </div>
                )}
              </div>

              {learningPath.requester && (
                <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4 mt-4">
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Learner:</p>
                  <p className="text-neutral-900 dark:text-white font-medium">
                    {learningPath.requester.name}
                  </p>
                </div>
              )}
            </Card>

            {/* Full Learning Path with Modules, Steps, and Skills */}
            {modules.length > 0 && (
              <Card>
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-6">
                  Learning Path Details
                </h3>
                <LearningPathTimeline path={pathDataForTimeline} />
              </Card>
            )}
          </div>

          {/* Decision Panel */}
          <div className="lg:col-span-1">
            <Card>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
                Your Decision
              </h3>

              {approvalData.status !== 'pending' && approvalData.status !== 'changes_requested' && (
                <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Status: <strong>{approvalData.status.replace('_', ' ').toUpperCase()}</strong>
                  </p>
                  {approvalData.feedback && (
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
                      {approvalData.feedback}
                    </p>
                  )}
                </div>
              )}

              {approvalData.status === 'changes_requested' && (
                <div className="mb-4 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <p className="text-sm text-orange-800 dark:text-orange-200 mb-2">
                    Status: <strong>CHANGES REQUESTED</strong>
                  </p>
                  {approvalData.feedback && (
                    <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">
                      <strong>Previous Feedback:</strong> {approvalData.feedback}
                    </p>
                  )}
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    Review the updated learning path and approve if changes have been addressed.
                  </p>
                </div>
              )}

              {(approvalData.status === 'pending' || approvalData.status === 'changes_requested') && (
                <>
                  {!showFeedback ? (
                    <div className="space-y-3">
                      <PrimaryButton
                        onClick={handleApprove}
                        disabled={submitting}
                        className="w-full"
                      >
                        {submitting ? 'Processing...' : 'Approve'}
                      </PrimaryButton>
                      <PrimaryButton
                        onClick={() => setShowFeedback(true)}
                        disabled={submitting}
                        variant="secondary"
                        className="w-full"
                      >
                        Request Changes
                      </PrimaryButton>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                          Feedback (Required)
                        </label>
                        <textarea
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          placeholder="Please provide specific feedback on what changes are needed..."
                          rows={6}
                          className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-slate-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
                        />
                      </div>
                      <div className="flex gap-3">
                        <PrimaryButton
                          onClick={handleRequestChanges}
                          disabled={submitting || !feedback.trim()}
                          className="flex-1"
                        >
                          {submitting ? 'Submitting...' : 'Submit'}
                        </PrimaryButton>
                        <PrimaryButton
                          onClick={() => {
                            setShowFeedback(false);
                            setFeedback('');
                          }}
                          disabled={submitting}
                          variant="secondary"
                        >
                          Cancel
                        </PrimaryButton>
                      </div>
                    </div>
                  )}
                </>
              )}
            </Card>

            {/* Approval Info */}
            <Card className="mt-4">
              <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
                Approval Details
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-neutral-600 dark:text-neutral-400">Created:</span>
                  <span className="ml-2 text-neutral-900 dark:text-white">
                    {new Date(approvalData.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {learningPath.decisionMaker && (
                  <div>
                    <span className="text-neutral-600 dark:text-neutral-400">Decision Maker:</span>
                    <span className="ml-2 text-neutral-900 dark:text-white">
                      {learningPath.decisionMaker.name}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
      </main>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </div>
  );
}

