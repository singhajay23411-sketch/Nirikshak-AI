import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare, AlertTriangle, Send, CheckCircle2, Shield,
  Info, Sparkles, Check, ArrowRight, HelpCircle, FileText
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import Footer from '../Footer';

const FeedbackView = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isHi = language === 'hi';

  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'dataIssue'

  // General Feedback Form State
  const [generalForm, setGeneralForm] = useState({
    feedbackType: 'General Feedback',
    category: 'General',
    title: '',
    description: '',
    priority: 'Medium',
    email: ''
  });

  // Data Issue Form State
  const [issueForm, setIssueForm] = useState({
    relatedEntity: '',
    dataCategory: 'Financial Expenditure',
    issueType: 'Over-reported expenditure',
    title: '',
    description: '',
    evidence: '',
    priority: 'High',
    email: ''
  });

  // Submission States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null); // { ticketId, type }
  const [errors, setErrors] = useState({});

  // Validate General Form
  const validateGeneralForm = () => {
    const newErrors = {};
    if (!generalForm.title.trim()) newErrors.title = 'Title is required';
    if (!generalForm.description.trim()) newErrors.description = 'Description is required';
    else if (generalForm.description.length < 10) newErrors.description = 'Description must be at least 10 characters';

    if (generalForm.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(generalForm.email.trim())) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate Data Issue Form
  const validateIssueForm = () => {
    const newErrors = {};
    if (!issueForm.relatedEntity.trim()) newErrors.relatedEntity = 'Related MP or Constituency is required';
    if (!issueForm.title.trim()) newErrors.title = 'Title is required';
    if (!issueForm.description.trim()) newErrors.description = 'Description is required';
    else if (issueForm.description.length < 15) newErrors.description = 'Please provide detailed description of the data anomaly';

    if (issueForm.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(issueForm.email.trim())) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGeneralSubmit = (e) => {
    e.preventDefault();
    if (!validateGeneralForm()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const ticketId = `FB-${Math.floor(100000 + Math.random() * 900000)}`;
      setSubmitSuccess({ ticketId, type: 'feedback' });
      setGeneralForm({
        feedbackType: 'General Feedback',
        category: 'General',
        title: '',
        description: '',
        priority: 'Medium',
        email: ''
      });
      setErrors({});
    }, 800);
  };

  const handleIssueSubmit = (e) => {
    e.preventDefault();
    if (!validateIssueForm()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const ticketId = `ISSUE-${Math.floor(100000 + Math.random() * 900000)}`;
      setSubmitSuccess({ ticketId, type: 'issue' });
      setIssueForm({
        relatedEntity: '',
        dataCategory: 'Financial Expenditure',
        issueType: 'Over-reported expenditure',
        title: '',
        description: '',
        evidence: '',
        priority: 'High',
        email: ''
      });
      setErrors({});
    }, 800);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem', width: '100%', padding: '0.5rem 0 3rem 0' }}>
      
      {/* ─── CENTERED FORM CONTAINER (MAX-WIDTH 880px) ─── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: '880px', width: '100%', margin: '0 auto' }}>
        
        {/* ─── 1. CENTERED PAGE HEADER ─── */}
        <div style={{ textAlign: 'center', margin: '0.25rem 0 0.5rem 0' }}>
          <h1
            style={{
              fontFamily: 'var(--font-serif-primary)',
              fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
              fontWeight: 800,
              color: '#1D1E22',
              margin: '0 0 0.5rem 0',
              lineHeight: 1.2
            }}
          >
            {isHi ? 'मुद्दा / प्रतिपुष्टि दर्ज करें' : 'Report an Issue'}
          </h1>
          <p style={{ fontSize: '0.96rem', color: 'var(--color-text-secondary)', maxWidth: '520px', margin: '0 auto', lineHeight: 1.5 }}>
            {isHi
              ? 'डेटा विसंगतियों की रिपोर्ट करके या प्रतिक्रिया देकर प्लेटफ़ॉर्म को बेहतर बनाने में हमारी सहायता करें'
              : 'Help us improve by reporting data issues or providing feedback'}
          </p>
        </div>

      {/* ─── 3. TAB SWITCHER (PRIMARY GREEN BTN-TEAL & SECONDARY BTN-OUTLINE-DARK) ─── */}
      <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => { setActiveTab('general'); setSubmitSuccess(null); setErrors({}); }}
          className={activeTab === 'general' ? 'btn-teal' : 'btn-outline-dark'}
          style={{
            padding: '0.65rem 1.4rem',
            fontSize: '0.88rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            cursor: 'pointer'
          }}
        >
          <MessageSquare size={16} />
          <span>{isHi ? 'सामान्य प्रतिक्रिया' : 'General Feedback'}</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('dataIssue'); setSubmitSuccess(null); setErrors({}); }}
          className={activeTab === 'dataIssue' ? 'btn-teal' : 'btn-outline-dark'}
          style={{
            padding: '0.65rem 1.4rem',
            fontSize: '0.88rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            cursor: 'pointer'
          }}
        >
          <AlertTriangle size={16} />
          <span>{isHi ? 'डेटा विसंगति रिपोर्ट' : 'Report Data Issue'}</span>
        </button>
      </div>

      {/* ─── 4. FORM CARD ─── */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1.5px solid #1D1E22',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '3px 4px 0px #1D1E22',
          padding: '2rem 2.25rem'
        }}
      >
        {/* Success State Banner */}
        {submitSuccess && (
          <div
            style={{
              background: '#E8F5E9',
              border: '1.5px solid #1E7E34',
              borderRadius: 'var(--radius-md)',
              padding: '1.5rem',
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem'
            }}
          >
            <CheckCircle2 size={24} color="#1E7E34" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
            <div>
              <h4 style={{ margin: '0 0 0.25rem 0', color: '#1E7E34', fontSize: '1.1rem', fontWeight: 800 }}>
                {submitSuccess.type === 'issue' ? 'Data Issue Logged Successfully' : 'Feedback Submitted Successfully'}
              </h4>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#2E7D32' }}>
                Thank you for contributing. Reference ID: <strong>{submitSuccess.ticketId}</strong>. Our audit team will cross-verify this submission with official MoSPI records.
              </p>
              <button
                type="button"
                onClick={() => setSubmitSuccess(null)}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #1E7E34',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.35rem 0.85rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#1E7E34',
                  cursor: 'pointer'
                }}
              >
                Submit Another Response
              </button>
            </div>
          </div>
        )}

        {/* TAB 1: GENERAL FEEDBACK FORM */}
        {activeTab === 'general' ? (
          <form onSubmit={handleGeneralSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.4rem', fontWeight: 800, color: '#1D1E22', margin: '0 0 0.35rem 0' }}>
                Submit Feedback
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                Share your experience, suggestions, or report bugs to help us improve the MPLADS dashboard.
              </p>
            </div>

            {/* Row 1: Feedback Type & Category */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#1D1E22', marginBottom: '0.35rem' }}>
                  Feedback Type <span style={{ color: '#D9534F' }}>*</span>
                </label>
                <select
                  value={generalForm.feedbackType}
                  onChange={(e) => setGeneralForm({ ...generalForm, feedbackType: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    fontSize: '0.86rem',
                    border: '1.5px solid #1D1E22',
                    borderRadius: 'var(--radius-sm)',
                    background: '#FAF8F3',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="General Feedback">General Feedback</option>
                  <option value="Feature Request">Feature Request</option>
                  <option value="Bug Report">Bug Report</option>
                  <option value="UI / UX Improvement">UI / UX Improvement</option>
                  <option value="Performance & Speed">Performance & Speed</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#1D1E22', marginBottom: '0.35rem' }}>
                  Category <span style={{ color: '#D9534F' }}>*</span>
                </label>
                <select
                  value={generalForm.category}
                  onChange={(e) => setGeneralForm({ ...generalForm, category: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    fontSize: '0.86rem',
                    border: '1.5px solid #1D1E22',
                    borderRadius: 'var(--radius-sm)',
                    background: '#FAF8F3',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="General">General</option>
                  <option value="MP Performance Profile">MP Performance Profile</option>
                  <option value="State-wise Metrics">State-wise Metrics</option>
                  <option value="Projects Data & Search">Projects Data & Search</option>
                  <option value="Visualizations & Charts">Visualizations & Charts</option>
                </select>
              </div>
            </div>

            {/* Row 2: Title */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#1D1E22', marginBottom: '0.35rem' }}>
                Title <span style={{ color: '#D9534F' }}>*</span>
              </label>
              <input
                type="text"
                value={generalForm.title}
                onChange={(e) => {
                  setGeneralForm({ ...generalForm, title: e.target.value });
                  if (errors.title) setErrors({ ...errors, title: null });
                }}
                placeholder="Brief summary of your feedback"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  fontSize: '0.86rem',
                  border: errors.title ? '1.5px solid #D9534F' : '1.5px solid #1D1E22',
                  borderRadius: 'var(--radius-sm)',
                  background: '#FAF8F3',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {errors.title && <span style={{ fontSize: '0.74rem', color: '#D9534F', marginTop: '0.2rem', display: 'block' }}>{errors.title}</span>}
            </div>

            {/* Full Width: Description with Character Count */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1D1E22' }}>
                  Description <span style={{ color: '#D9534F' }}>*</span>
                </label>
                <span style={{ fontSize: '0.72rem', color: generalForm.description.length > 950 ? '#D9534F' : 'var(--color-text-muted)' }}>
                  {generalForm.description.length} / 1000
                </span>
              </div>
              <textarea
                rows={5}
                maxLength={1000}
                value={generalForm.description}
                onChange={(e) => {
                  setGeneralForm({ ...generalForm, description: e.target.value });
                  if (errors.description) setErrors({ ...errors, description: null });
                }}
                placeholder="Please provide detailed information about your feedback..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '0.86rem',
                  fontFamily: 'var(--font-sans)',
                  border: errors.description ? '1.5px solid #D9534F' : '1.5px solid #1D1E22',
                  borderRadius: 'var(--radius-sm)',
                  background: '#FAF8F3',
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'vertical'
                }}
              />
              {errors.description && <span style={{ fontSize: '0.74rem', color: '#D9534F', marginTop: '0.2rem', display: 'block' }}>{errors.description}</span>}
            </div>

            {/* Row 3: Priority & Contact Email */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#1D1E22', marginBottom: '0.35rem' }}>
                  Priority
                </label>
                <select
                  value={generalForm.priority}
                  onChange={(e) => setGeneralForm({ ...generalForm, priority: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    fontSize: '0.86rem',
                    border: '1.5px solid #1D1E22',
                    borderRadius: 'var(--radius-sm)',
                    background: '#FAF8F3',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#1D1E22', marginBottom: '0.35rem' }}>
                  Contact Email (Optional)
                </label>
                <input
                  type="email"
                  value={generalForm.email}
                  onChange={(e) => {
                    setGeneralForm({ ...generalForm, email: e.target.value });
                    if (errors.email) setErrors({ ...errors, email: null });
                  }}
                  placeholder="your.email@example.com"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    fontSize: '0.86rem',
                    border: errors.email ? '1.5px solid #D9534F' : '1.5px solid #1D1E22',
                    borderRadius: 'var(--radius-sm)',
                    background: '#FAF8F3',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                {errors.email && <span style={{ fontSize: '0.74rem', color: '#D9534F', marginTop: '0.2rem', display: 'block' }}>{errors.email}</span>}
              </div>
            </div>

            {/* Bottom Submit Button */}
            <div style={{ marginTop: '0.5rem' }}>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-teal"
                style={{
                  padding: '0.75rem 1.75rem',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.7 : 1
                }}
              >
                <Send size={15} />
                <span>
                  {isSubmitting
                    ? (isHi ? 'प्रतिक्रिया सबमिट की जा रही है...' : 'Submitting Feedback...')
                    : (isHi ? 'प्रतिक्रिया सबमिट करें' : 'Submit Feedback')}
                </span>
              </button>
            </div>
          </form>
        ) : (
          /* TAB 2: REPORT DATA ISSUE FORM */
          <form onSubmit={handleIssueSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.4rem', fontWeight: 800, color: '#1D1E22', margin: '0 0 0.35rem 0' }}>
                Report Data Inconsistency / Anomaly
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                Report inaccurate fund figures, missing projects, or discrepancies with official MoSPI / District records.
              </p>
            </div>

            {/* Row 1: Related Entity & Data Category */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#1D1E22', marginBottom: '0.35rem' }}>
                  Related MP / Constituency <span style={{ color: '#D9534F' }}>*</span>
                </label>
                <input
                  type="text"
                  value={issueForm.relatedEntity}
                  onChange={(e) => {
                    setIssueForm({ ...issueForm, relatedEntity: e.target.value });
                    if (errors.relatedEntity) setErrors({ ...errors, relatedEntity: null });
                  }}
                  placeholder="e.g. Smt. Darshana Singh / Varanasi LS"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    fontSize: '0.86rem',
                    border: errors.relatedEntity ? '1.5px solid #D9534F' : '1.5px solid #1D1E22',
                    borderRadius: 'var(--radius-sm)',
                    background: '#FAF8F3',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                {errors.relatedEntity && <span style={{ fontSize: '0.74rem', color: '#D9534F', marginTop: '0.2rem', display: 'block' }}>{errors.relatedEntity}</span>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#1D1E22', marginBottom: '0.35rem' }}>
                  Data Category <span style={{ color: '#D9534F' }}>*</span>
                </label>
                <select
                  value={issueForm.dataCategory}
                  onChange={(e) => setIssueForm({ ...issueForm, dataCategory: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    fontSize: '0.86rem',
                    border: '1.5px solid #1D1E22',
                    borderRadius: 'var(--radius-sm)',
                    background: '#FAF8F3',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="Financial Expenditure">Financial Expenditure Figures</option>
                  <option value="Work Completion Status">Work Completion Status</option>
                  <option value="Installment Disbursals">Installment Disbursals</option>
                  <option value="Project Cost Deviation">Project Cost Deviation</option>
                  <option value="Constituency Mapping">Constituency / MP Mapping</option>
                </select>
              </div>
            </div>

            {/* Row 2: Issue Type & Title */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#1D1E22', marginBottom: '0.35rem' }}>
                  Issue Type <span style={{ color: '#D9534F' }}>*</span>
                </label>
                <select
                  value={issueForm.issueType}
                  onChange={(e) => setIssueForm({ ...issueForm, issueType: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    fontSize: '0.86rem',
                    border: '1.5px solid #1D1E22',
                    borderRadius: 'var(--radius-sm)',
                    background: '#FAF8F3',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="Over-reported expenditure">Over-reported expenditure</option>
                  <option value="Incomplete work marked completed">Incomplete work marked as completed</option>
                  <option value="Duplicate project record">Duplicate project record detected</option>
                  <option value="Missing release installment">Missing fund release installment</option>
                  <option value="Incorrect implementing agency">Incorrect implementing agency tagged</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#1D1E22', marginBottom: '0.35rem' }}>
                  Title <span style={{ color: '#D9534F' }}>*</span>
                </label>
                <input
                  type="text"
                  value={issueForm.title}
                  onChange={(e) => {
                    setIssueForm({ ...issueForm, title: e.target.value });
                    if (errors.title) setErrors({ ...errors, title: null });
                  }}
                  placeholder="Summary of the data discrepancy"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    fontSize: '0.86rem',
                    border: errors.title ? '1.5px solid #D9534F' : '1.5px solid #1D1E22',
                    borderRadius: 'var(--radius-sm)',
                    background: '#FAF8F3',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                {errors.title && <span style={{ fontSize: '0.74rem', color: '#D9534F', marginTop: '0.2rem', display: 'block' }}>{errors.title}</span>}
              </div>
            </div>

            {/* Full Width: Description */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1D1E22' }}>
                  Detailed Description <span style={{ color: '#D9534F' }}>*</span>
                </label>
                <span style={{ fontSize: '0.72rem', color: issueForm.description.length > 950 ? '#D9534F' : 'var(--color-text-muted)' }}>
                  {issueForm.description.length} / 1000
                </span>
              </div>
              <textarea
                rows={5}
                maxLength={1000}
                value={issueForm.description}
                onChange={(e) => {
                  setIssueForm({ ...issueForm, description: e.target.value });
                  if (errors.description) setErrors({ ...errors, description: null });
                }}
                placeholder="Explain the specific data discrepancy, ground reality, and affected project/sanction ID..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '0.86rem',
                  fontFamily: 'var(--font-sans)',
                  border: errors.description ? '1.5px solid #D9534F' : '1.5px solid #1D1E22',
                  borderRadius: 'var(--radius-sm)',
                  background: '#FAF8F3',
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'vertical'
                }}
              />
              {errors.description && <span style={{ fontSize: '0.74rem', color: '#D9534F', marginTop: '0.2rem', display: 'block' }}>{errors.description}</span>}
            </div>

            {/* Evidence & Priority Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#1D1E22', marginBottom: '0.35rem' }}>
                  Evidence / Reference Details (Optional)
                </label>
                <input
                  type="text"
                  value={issueForm.evidence}
                  onChange={(e) => setIssueForm({ ...issueForm, evidence: e.target.value })}
                  placeholder="e.g. RTI Ref #1029 / Work Order #WO-88"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    fontSize: '0.86rem',
                    border: '1.5px solid #1D1E22',
                    borderRadius: 'var(--radius-sm)',
                    background: '#FAF8F3',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#1D1E22', marginBottom: '0.35rem' }}>
                  Priority
                </label>
                <select
                  value={issueForm.priority}
                  onChange={(e) => setIssueForm({ ...issueForm, priority: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    fontSize: '0.86rem',
                    border: '1.5px solid #1D1E22',
                    borderRadius: 'var(--radius-sm)',
                    background: '#FAF8F3',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical / Fraud Risk</option>
                </select>
              </div>
            </div>

            {/* Contact Email */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#1D1E22', marginBottom: '0.35rem' }}>
                Contact Email (Optional)
              </label>
              <input
                type="email"
                value={issueForm.email}
                onChange={(e) => {
                  setIssueForm({ ...issueForm, email: e.target.value });
                  if (errors.email) setErrors({ ...errors, email: null });
                }}
                placeholder="your.email@example.com"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  fontSize: '0.86rem',
                  border: errors.email ? '1.5px solid #D9534F' : '1.5px solid #1D1E22',
                  borderRadius: 'var(--radius-sm)',
                  background: '#FAF8F3',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {errors.email && <span style={{ fontSize: '0.74rem', color: '#D9534F', marginTop: '0.2rem', display: 'block' }}>{errors.email}</span>}
            </div>

            {/* Submit Button */}
            <div style={{ marginTop: '0.5rem' }}>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-teal"
                style={{
                  padding: '0.75rem 1.75rem',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.7 : 1
                }}
              >
                <AlertTriangle size={15} />
                <span>
                  {isSubmitting
                    ? (isHi ? 'मुद्दा दर्ज किया जा रहा है...' : 'Logging Issue...')
                    : (isHi ? 'मुद्दा दर्ज करें' : 'Submit Issue')}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ─── 5. INFORMATIONAL CARD ─── */}
      <div
        style={{
          background: '#FAF8F3',
          border: '1.5px solid #1D1E22',
          borderRadius: 'var(--radius-md)',
          boxShadow: '2px 3px 0px #1D1E22',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}
      >
        <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#E8F0FE', color: '#1A73E8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Shield size={22} />
        </div>
        <div>
          <h4 style={{ margin: '0 0 0.2rem 0', fontSize: '0.95rem', fontWeight: 800, color: '#1D1E22' }}>
            Your feedback helps us improve
          </h4>
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.35 }}>
            All reports and suggestions are reviewed by Nirikshak AI analysts and cross-checked against official MoSPI e-Saksham records to maintain public data integrity.
          </p>
        </div>
      </div>

      </div>

      {/* ─── FOOTER ─── */}
      <Footer hideCTAButtons={true} />
    </div>
  );
};

export default FeedbackView;
