import React, { Suspense, lazy, useEffect } from "react";
import { Routes, Route, useLocation } from 'react-router-dom';
import posthog from 'posthog-js';
import Nav from "./tools/nav";
import { Banner } from "./components/Banner";

// ONLY import your custom CSS - Bootstrap loads from CDN now
import './App.css';

import { FlashProvider, FlashMessage } from "./context/flashContext";
import { JobProvider } from "./context/JobContext";

// --- CRITICAL IMPORTS (Load these instantly) ---
import Home from "./pages/home";
import Login from "./pages/login";
import Register from "./pages/register";

// --- LAZY IMPORTS (Load these only when clicked) ---
const Profile = lazy(() => import("./pages/profile"));
const AnalyticsPage = lazy(() => import("./pages/analytics/analytics"));
const CreateGroup = lazy(() => import("./pages/createGroup"));
const GroupPage = lazy(() => import("./pages/groupPage"));
const SetupTeam = lazy(() => import("./pages/teams/setupTeam"));
const TeamsDashboard = lazy(() => import("./pages/teamsDashboard"));
const EnterpriseDashboard = lazy(() => import("./pages/EnterpriseDashboard"));
const SetupOrganization = lazy(() => import("./pages/enterprise/SetupOrganization"));
const SharedProgressView = lazy(() => import("./pages/teams/SharedProgressView"));
const EmploymentList = lazy(() => import("./pages/employment/EmploymentList"));
const ForgotPassword = lazy(() => import("./pages/forgotPassword"));
const SetPassword = lazy(() => import("./pages/setPassword"));
const Dashboard = lazy(() => import("./pages/dashboard"));
const ResetPassword = lazy(() => import("./pages/resetPassword"));
const CoverLetter = lazy(() => import("./pages/coverLetter/coverLetter"));
const CoverLetterEditPage = lazy(() => import("./pages/coverLetter/CoverLetterEditPage"));
const JobMatchingPage = lazy(() => import("./pages/jobs/JobMatchingPage"));
const SkillsGapPage = lazy(() => import("./pages/jobs/SkillsGapPage"));
const CoverLetterSharingPage = lazy(() => import("./pages/coverLetter/CoverLetterSharingPage"));
const PublicCoverLetterPage = lazy(() => import("./pages/coverLetter/PublicCoverLetterPage"));
const SkillsList = lazy(() => import("./pages/skills/SkillList"));
const EducationList = lazy(() => import("./pages/education/EducationList"));
const CertificationList = lazy(() => import("./pages/certifications/CertificationList"));
const ProjectsList = lazy(() => import("./pages/projects/ProjectList"));
const JobsList = lazy(() => import("./pages/jobs/JobList"));
const OffersPage = lazy(() => import("./pages/offers/OffersPage"));
const ResumeList = lazy(() => import("./pages/resumes/ResumeList"));
const TemplateLibraryPage = lazy(() => import("./pages/resumes/TemplateLibraryPage"));
const ResumeEditor = lazy(() => import("./pages/resumes/ResumeEditor"));
const ResumePreviewPage = lazy(() => import("./pages/resumes/ResumePreviewPage"));
const VersionManagementPage = lazy(() => import("./pages/resumes/VersionManagementPage"));
const SharingAndFeedbackPage = lazy(() => import("./pages/resumes/SharingAndFeedbackPage"));
const PublicSharePage = lazy(() => import("./pages/resumes/PublicSharePage"));
const ExportResumePage = lazy(() => import("./pages/resumes/ExportResumePage"));
const QuestionLibrary = lazy(() => import("./pages/interview/QuestionLibrary"));
const IndustryRoles = lazy(() => import("./pages/interview/IndustryRoles"));
const RoleQuestions = lazy(() => import("./pages/interview/RoleQuestions"));
const PracticeQuestion = lazy(() => import("./pages/interview/PracticeQuestion"));
const MyPractice = lazy(() => import("./pages/interview/MyPractice"));
const Progress = lazy(() => import("./pages/interview/Progress"));
const MockInterviewStart = lazy(() => import("./pages/interview/MockInterviewStart"));
const MockInterviewQuestion = lazy(() => import("./pages/interview/MockInterviewQuestion"));
const MockInterviewSummary = lazy(() => import("./pages/interview/MockInterviewSummary"));
const ScheduleInterview = lazy(() => import("./pages/interview/ScheduleInterview"));
const InterviewPreparation = lazy(() => import("./pages/interview/InterviewPreparation"));
const InterviewAnalytics = lazy(() => import("./pages/interview/InterviewAnalytics"));
const FollowUpManager = lazy(() => import("./pages/interview/FollowUpManager"));
const WritingPractice = lazy(() => import("./pages/interview/WritingPractice"));
const SuccessProbability = lazy(() => import("./pages/interview/SuccessProbability"));
const CompleteInterview = lazy(() => import("./pages/interview/CompleteInterview"));
const InterviewCalendar = lazy(() => import("./pages/interview/InterviewCalendar"));
const InterviewPerformanceTracking = lazy(() => import("./pages/interview/InterviewPerformanceTracking"));
const TechnicalPrepHome = lazy(() => import("./pages/TechnicalPrep/TechnicalPrepHome"));
const CodingChallenges = lazy(() => import("./pages/TechnicalPrep/CodingChallenges"));
const SystemDesignChallenges = lazy(() => import("./pages/TechnicalPrep/SystemDesignChallenges"));
const CaseStudyChallenges = lazy(() => import("./pages/TechnicalPrep/CaseStudyChallenges"));
const ChallengeWorkspace = lazy(() => import("./pages/TechnicalPrep/ChallengeWorkspace"));
const ChallengeResults = lazy(() => import("./pages/TechnicalPrep/ChallengeResults"));
const WhiteboardingTips = lazy(() => import("./pages/TechnicalPrep/WhiteboardingTips"));
const PipelineManagement = lazy(() => import("./pages/pipeline/PipelineManagement"));
const NetworkOverview = lazy(() => import("./pages/network/NetworkOverview"));
const ReferralManagement = lazy(() => import("./pages/network/ReferralManagement"));
const NetworkEventManagement = lazy(() => import("./pages/network/NetworkEventManagement"));
const ContactDetail = lazy(() => import("./pages/network/ContactDetail"));
const InformationalInterviewManagement = lazy(() => import("./pages/network/InformationalInterviewManagement"));
const InterviewDetail = lazy(() => import("./pages/network/InterviewDetail"));
const MentorshipManagement = lazy(() => import("./pages/network/MentorshipManagement"));
const DiscoveryPage = lazy(() => import("./pages/network/DiscoveryPage"));
const NetworkingAnalytics = lazy(() => import("./pages/network/NetworkingAnalytics"));
const APIMetricsPage = lazy(() => import("./pages/APIMetrics"));
const LinkedInCallback = lazy(() => import("./pages/callback/linkedin"));
const LeetCodeDetails = lazy(() => import("./pages/LeetCodeDetails"));
const HackerRankDetails = lazy(() => import("./pages/HackerRankDetails"));
const CodecademyDetails = lazy(() => import("./pages/CodecademyDetails"));

// inside your router


export function App() {
  const location = useLocation();

  useEffect(() => {
  
  if (posthog.has_opted_in_capturing()) {
    posthog.capture('$pageview');

    const userUuid = localStorage.getItem("uuid");
    const userEmail = localStorage.getItem("email");

    if (userUuid) {
      posthog.identify(userUuid, {
        email: userEmail,
      });
    }
  }
}, [location]);
  
  return (
    <div className="App">
      <Banner />
      <FlashProvider>
        <FlashMessage />
        <JobProvider>
          <header>
            <Nav key={location.pathname} />
          </header>
          <main role="main" id="main-content" style={{ minHeight: '80vh' }}>
            <Suspense fallback={
              <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh', background: 'rgba(6, 78, 59, 0.05)' }}>
                <div style={{ color: '#10b981' }}>Loading Metamorphosis...</div>
              </div>
            }>
              <Routes>
                {/* Standard Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                
                {/* Lazy Loaded Routes */}
                <Route path="/profile" element={<Profile />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/newGroup" element={<CreateGroup />} />
                <Route path="/group/:groupId" element={<GroupPage />} />
                <Route path="/setup-team" element={<SetupTeam />} />
                <Route path="/teams" element={<TeamsDashboard />} />
                <Route path="/enterprise" element={<EnterpriseDashboard />} />
                <Route path="/setup-org" element={<SetupOrganization />} />
                <Route path="/shared-progress/:teamId/:memberId/:email?" element={<SharedProgressView />} />
                <Route path="/employment-history" element={<EmploymentList />} />
                <Route path="/forgotPassword" element={<ForgotPassword />} />
                <Route path="/set-password" element={<SetPassword />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/resetPassword/:token" element={<ResetPassword />}/>
                <Route path="/cover-Letter" element={<CoverLetter />} />
                <Route path="/cover-letter/edit/:id" element={<CoverLetterEditPage />} />
                <Route path="/job-matching" element={<JobMatchingPage />} />
                <Route path="/jobs/:jobId/skills-gap" element={<SkillsGapPage />} />
                <Route path="/cover-letter/feedback/:id" element={<CoverLetterSharingPage />} />
                <Route path="/cover-letter/public/:token" element={<PublicCoverLetterPage />} />

                <Route path="/skills" element={<SkillsList />} />
                <Route path="/education" element={<EducationList />} />
                <Route path="/certifications" element={<CertificationList />} />
                <Route path="/projects" element={<ProjectsList />} />
                <Route path="/jobs" element={<JobsList />} />
                <Route path="/offers" element={<OffersPage />} />
                <Route path="/resumes" element={<ResumeList />} />
                <Route path="/resumes/templates" element={<TemplateLibraryPage />} />
                <Route path="/resumes/edit/:id" element={<ResumeEditor />} />
                <Route path="/resumes/preview/:id" element={<ResumePreviewPage />} />
                <Route path="/resumes/versions/:id" element={<VersionManagementPage />} />
                <Route path="/resumes/feedback/:id" element={<SharingAndFeedbackPage />} />
                <Route path="/resumes/public/:token" element={<PublicSharePage />} />
                <Route path="/resumes/export/:id" element={<ExportResumePage />} />

                {/* Interview Question Bank Routes */}
                <Route path="/interview/question-library" element={<QuestionLibrary />} />
                <Route path="/interview/industry/:industryId" element={<IndustryRoles />} />
                <Route path="/interview/my-practice" element={<MyPractice />} />
                <Route path="/interview/progress" element={<Progress />} />
                <Route path="/interview/questions/practice/:questionId" element={<PracticeQuestion />} />
                <Route path="/interview/questions/:roleId" element={<RoleQuestions />} />

                {/* Mock Interview Routes */}
                <Route path="/interview/mock-interview-start" element={<MockInterviewStart />} />
                <Route path="/interview/mock-interview/:sessionId" element={<MockInterviewQuestion />} />
                <Route path="/interview/mock-interview-summary/:sessionId" element={<MockInterviewSummary />} />
                
                {/* Other Interview Routes */}
                <Route path="/interview/schedule-interview" element={<ScheduleInterview />} />
                <Route path="/interview/prepare/:scheduleId" element={<InterviewPreparation />} />
                <Route path="/interview/analytics" element={<InterviewAnalytics />} />
                <Route path="/interview/follow-up" element={<FollowUpManager />} />
                <Route path="/interview/writing-practice" element={<WritingPractice />} />
                <Route path="/interview/success-probability" element={<SuccessProbability />} />
                <Route path="/interview/complete/:scheduleId" element={<CompleteInterview />} />
                <Route path="/interview/calendar" element={<InterviewCalendar />} />
                <Route path="/interview/performance" element={<InterviewPerformanceTracking />} />

                {/* Technical Preparation Routes */}
                <Route path="/technical-prep" element={<TechnicalPrepHome />} />
                <Route path="/technical-prep/coding" element={<CodingChallenges />} />
                <Route path="/technical-prep/system-design" element={<SystemDesignChallenges />} />
                <Route path="/technical-prep/case-study" element={<CaseStudyChallenges />} />
                <Route path="/technical-prep/whiteboarding" element={<WhiteboardingTips />} />
                <Route path="/technical-prep/challenge/:challengeId" element={<ChallengeWorkspace />} />
                <Route path="/technical-prep/results/:attemptId" element={<ChallengeResults />} />
                <Route path="/pipeline-management" element={<PipelineManagement />} />
                
                <Route path="/network" element={<NetworkOverview />} />
                <Route path="/network/referrals" element={<ReferralManagement />} />
                <Route path="/network/events" element={<NetworkEventManagement />} />
                <Route path="/network/contact/:contactId" element={<ContactDetail />} />
                <Route path="/network/interviews" element={<InformationalInterviewManagement />} />
                <Route path="/network/interview/:interviewId" element={<InterviewDetail />} />
                <Route path="/network/mentorship" element={<MentorshipManagement />} />
                <Route path="/network/discovery" element={<DiscoveryPage />} />
                <Route path="/network/analytics" element={<NetworkingAnalytics />} />
                <Route path="/api-metrics" element={<APIMetricsPage />} />
                <Route path="/callback/linkedin" element={<LinkedInCallback />} />
              <Route path="/leetcode/:username" element={<LeetCodeDetails />} />
              <Route path="/hackerrank/:username" element={<HackerRankDetails />} />
              <Route path="/codecademy/:username" element={<CodecademyDetails />} />
              </Routes>
            </Suspense>
          </main>
        </JobProvider>
      </FlashProvider>
    </div>
  );
}