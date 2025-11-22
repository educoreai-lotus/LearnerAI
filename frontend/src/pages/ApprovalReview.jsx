import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import LoadingSpinner from '../components/LoadingSpinner';
import Toast from '../components/Toast';
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
      const response = await api.getApprovalDetails(approvalId);
      setApprovalData(response.approval);
      setLearningPath(response.learningPath);
    } catch (err) {
      console.error('Failed to load approval:', err);
      if (err.message.includes('403') || err.message.includes('permission')) {
        setError('unauthorized');
      } else if (err.message.includes('404') || err.message.includes('not found')) {
        setError('notfound');
      } else {
        setError('general');
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

  if (error === 'notfound' || !approvalData || !learningPath) {
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
                The approval request you're looking for doesn't exist or has been removed.
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

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
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
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Requested by</p>
                  <p className="text-neutral-900 dark:text-white font-medium">
                    {learningPath.requester.name}
                  </p>
                </div>
              )}
            </Card>

            {/* Modules */}
            {modules.length > 0 && (
              <Card>
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">
                  Learning Modules
                </h3>
                <div className="space-y-4">
                  {modules.map((module, index) => (
                    <div
                      key={index}
                      className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 bg-neutral-50 dark:bg-slate-700/50"
                    >
                      <h4 className="font-semibold text-neutral-900 dark:text-white mb-2">
                        {module.module_title || module.title || `Module ${index + 1}`}
                      </h4>
                      {module.module_description && (
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                          {module.module_description}
                        </p>
                      )}
                      {module.subtopics && module.subtopics.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2">
                            Subtopics:
                          </p>
                          <ul className="list-disc list-inside text-sm text-neutral-700 dark:text-neutral-300 space-y-1">
                            {module.subtopics.map((subtopic, subIndex) => (
                              <li key={subIndex}>{subtopic}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Decision Panel */}
          <div className="lg:col-span-1">
            <Card>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
                Your Decision
              </h3>

              {approvalData.status !== 'pending' && (
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

              {approvalData.status === 'pending' && (
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
                  <span className="text-neutral-600 dark:text-neutral-400">ID:</span>
                  <span className="ml-2 text-neutral-900 dark:text-white font-mono text-xs">
                    {approvalData.id}
                  </span>
                </div>
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

