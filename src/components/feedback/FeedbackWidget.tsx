import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Bug, X, Send, Camera, 
  Loader, CheckCircle, AlertCircle 
} from 'lucide-react';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { haptics } from '../../utils/hapticFeedback';
import { analyticsService } from '../../services/analyticsService';

export const FeedbackWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<'bug' | 'feedback' | 'feature_request'>('feedback');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const captureScreenshot = async () => {
    haptics.tap();
    setIsOpen(false); // Hide widget before capture
    
    setTimeout(async () => {
      try {
        const canvas = await html2canvas(document.body, {
          scale: 0.8,
          logging: false,
          useCORS: true,
        });
        
        const dataUrl = canvas.toDataURL('image/png');
        setScreenshot(dataUrl);
        setIsOpen(true);
        toast.success('Screenshot captured!');
      } catch (error) {
        console.error('Failed to capture screenshot:', error);
        toast.error('Failed to capture screenshot');
        setIsOpen(true);
      }
    }, 100);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Please add a title');
      return;
    }

    setIsSubmitting(true);
    haptics.tap();

    try {
      // Get current app state
      const appState = {
        currentPage: window.location.pathname,
        timestamp: new Date().toISOString(),
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        theme: document.documentElement.getAttribute('data-theme'),
      };

      // Submit feedback to Firebase
      await addDoc(collection(db, 'feedback_reports'), {
        type,
        title,
        description,
        screenshot_url: screenshot,
        page_url: window.location.href,
        user_agent: navigator.userAgent,
        device_info: {
          platform: navigator.platform,
          language: navigator.language,
          online: navigator.onLine,
        },
        app_state: appState,
        user_id: localStorage.getItem('analytics_user_id'),
        created_at: serverTimestamp(),
      });

      // Track the feedback submission
      // Track feedback submission
      analyticsService.trackEvent('feedback_submitted', {
        feedback_type: type,
        has_screenshot: !!screenshot,
      });

      setShowSuccess(true);
      haptics.success();
      
      // Reset form
      setTimeout(() => {
        setIsOpen(false);
        setShowSuccess(false);
        setTitle('');
        setDescription('');
        setScreenshot(null);
        setType('feedback');
      }, 2000);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      toast.error('Failed to submit feedback');
      haptics.error();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Feedback Button */}
      <motion.button
        className="fixed bottom-28 left-5 z-40 glass-surface-elevated p-4 rounded-2xl shadow-lg"
        onClick={() => {
          haptics.tap();
          setIsOpen(true);
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ x: -100 }}
        animate={{ x: 0 }}
        transition={{ delay: 1, type: 'spring' }}
      >
        <MessageSquare size={24} className="text-primary" />
      </motion.button>

      {/* Feedback Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              className="bg-surface-elevated w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 safe-area-bottom"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              {showSuccess ? (
                <motion.div
                  className="text-center py-8"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
                  <h3 className="text-heading-2 text-primary mb-2">Thank You!</h3>
                  <p className="text-body text-secondary">
                    Your feedback has been submitted
                  </p>
                </motion.div>
              ) : (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-heading-2 text-primary">Send Feedback</h2>
                    <motion.button
                      onClick={() => setIsOpen(false)}
                      className="p-2 rounded-xl hover:bg-surface-tertiary transition-colors"
                      whileTap={{ scale: 0.9 }}
                    >
                      <X size={24} className="text-secondary" />
                    </motion.button>
                  </div>

                  {/* Type Selection */}
                  <div className="flex gap-3 mb-6">
                    {[
                      { value: 'bug', label: 'Bug Report', icon: Bug },
                      { value: 'feedback', label: 'Feedback', icon: MessageSquare },
                      { value: 'feature_request', label: 'Feature', icon: AlertCircle }
                    ].map((option) => (
                      <motion.button
                        key={option.value}
                        onClick={() => setType(option.value as any)}
                        className={`flex-1 p-3 rounded-xl border transition-all ${
                          type === option.value
                            ? 'border-primary-500 bg-primary-500/10 text-primary'
                            : 'border-border-primary text-secondary hover:border-primary-300'
                        }`}
                        whileTap={{ scale: 0.95 }}
                      >
                        <option.icon size={20} className="mx-auto mb-1" />
                        <span className="text-xs block">{option.label}</span>
                      </motion.button>
                    ))}
                  </div>

                  {/* Title Input */}
                  <input
                    type="text"
                    placeholder="Brief title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-4 bg-surface-tertiary rounded-xl text-primary placeholder-tertiary mb-4"
                  />

                  {/* Description */}
                  <textarea
                    placeholder="Describe in detail..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full p-4 bg-surface-tertiary rounded-xl text-primary placeholder-tertiary mb-4 resize-none"
                  />

                  {/* Screenshot */}
                  {screenshot ? (
                    <div className="relative mb-4">
                      <img
                        src={screenshot}
                        alt="Screenshot"
                        className="w-full h-32 object-cover rounded-xl"
                      />
                      <motion.button
                        onClick={() => setScreenshot(null)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-lg"
                        whileTap={{ scale: 0.9 }}
                      >
                        <X size={16} />
                      </motion.button>
                    </div>
                  ) : (
                    <motion.button
                      onClick={captureScreenshot}
                      className="w-full p-4 border-2 border-dashed border-border-primary rounded-xl mb-4 flex items-center justify-center text-secondary hover:border-primary-300 transition-colors"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <Camera size={20} className="mr-2" />
                      Capture Screenshot
                    </motion.button>
                  )}

                  {/* Submit Button */}
                  <motion.button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !title.trim()}
                    className={`w-full p-4 rounded-xl font-semibold flex items-center justify-center ${
                      isSubmitting || !title.trim()
                        ? 'bg-surface-tertiary text-tertiary'
                        : 'bg-gradient-to-r from-primary-500 to-primary-700 text-white'
                    }`}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader size={20} className="animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send size={20} className="mr-2" />
                        Send Feedback
                      </>
                    )}
                  </motion.button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};