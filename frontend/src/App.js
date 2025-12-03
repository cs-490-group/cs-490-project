import React from "react";
import { Routes, Route, useLocation } from 'react-router-dom';
import Nav from "./tools/nav";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
// import logo from './logo.svg';
import './App.css';
import Home from "./pages/home";
import Login from "./pages/login";
import Register from "./pages/register";
import Profile from "./pages/profile";
import CreateGroup from "./pages/createGroup";
import GroupPage from "./pages/groupPage";
import SetupTeam from "./pages/teams/setupTeam";
import SharedProgressView from "./pages/teams/SharedProgressView";
import EmploymentList from "./pages/employment/EmploymentList";
import SetPassword from "./pages/setPassword";
import ForgotPassword from "./pages/forgotPassword";
import ResetPassword from "./pages/resetPassword";
import SkillsList from "./pages/skills/SkillList";
import EducationList from "./pages/education/EducationList";
import CertificationList from "./pages/certifications/CertificationList";
import ProjectsList from "./pages/projects/ProjectList";
import JobsList from "./pages/jobs/JobList";
import OffersPage from "./pages/offers/OffersPage";
import CoverLetter from "./pages/coverLetter/coverLetter";
import CoverLetterEditPage from "./pages/coverLetter/CoverLetterEditPage";
import CoverLetterSharingPage from "./pages/coverLetter/CoverLetterSharingPage";
import PublicCoverLetterPage from "./pages/coverLetter/PublicCoverLetterPage";
import ResumeList from "./pages/resumes/ResumeList";
import ResumeEditor from "./pages/resumes/ResumeEditor";
import ResumePreviewPage from "./pages/resumes/ResumePreviewPage";
import VersionManagementPage from "./pages/resumes/VersionManagementPage";
import SharingAndFeedbackPage from "./pages/resumes/SharingAndFeedbackPage";
import PublicSharePage from "./pages/resumes/PublicSharePage";
import ExportResumePage from "./pages/resumes/ExportResumePage";
import TemplateLibraryPage from "./pages/resumes/TemplateLibraryPage";
import QuestionLibrary from "./pages/interview/QuestionLibrary";
import IndustryRoles from "./pages/interview/IndustryRoles";
import RoleQuestions from "./pages/interview/RoleQuestions";
import PracticeQuestion from "./pages/interview/PracticeQuestion";
import MyPractice from "./pages/interview/MyPractice";
import Progress from "./pages/interview/Progress";
import MockInterviewStart from "./pages/interview/MockInterviewStart";
import MockInterviewQuestion from "./pages/interview/MockInterviewQuestion";
import MockInterviewSummary from "./pages/interview/MockInterviewSummary";
import ScheduleInterview from './pages/interview/ScheduleInterview';
import InterviewPreparation from './pages/interview/InterviewPreparation';
import InterviewAnalytics from './pages/interview/InterviewAnalytics';
import FollowUpManager from './pages/interview/FollowUpManager';
import WritingPractice from './pages/interview/WritingPractice';
import SuccessProbability from './pages/interview/SuccessProbability';
import CompleteInterview from './pages/interview/CompleteInterview';
import InterviewCalendar from './pages/interview/InterviewCalendar';
import InterviewPerformanceTracking from './pages/interview/InterviewPerformanceTracking';
import PipelineManagement from './pages/pipeline/PipelineManagement';
import { FlashProvider, FlashMessage } from "./context/flashContext";
import { JobProvider } from "./context/JobContext";
import "bootstrap-icons/font/bootstrap-icons.css";
import '@fortawesome/fontawesome-free/css/all.min.css';


// inside your router


// import Dashboard from "./pages/dashboard";
import Dashboard from "./pages/dashboard";
import TeamsDashboard from "./pages/teamsDashboard";


export function App() {
  const location = useLocation();
  
  return (
    <div className="App">
      <header>

        <>

          <FlashProvider>
            <FlashMessage />
            <JobProvider>
              <Nav key={location.pathname} />
              <Routes>
                <Route path = "/" element = {<Home />} />
                <Route path = "/register" element = {<Register />} />
                <Route path = "/login" element = {<Login />} />
                <Route path = "/profile" element = {<Profile />} />
                <Route path = "/newGroup" element = {<CreateGroup />} />
                <Route path = "/group/:groupId" element = {<GroupPage />} />
                <Route path="/setup-team" element={<SetupTeam />} />
                <Route path="/teams" element={<TeamsDashboard />} />
                <Route path="/shared-progress/:teamId/:memberId/:email?" element={<SharedProgressView />} />
                <Route path="/employment-history" element={<EmploymentList />} />
                <Route path = "/forgotPassword" element = {<ForgotPassword />} />
                <Route path = "/set-password" element = {<SetPassword />} />
                <Route path = "/dashboard" element = {<Dashboard />} />
                <Route path = "/resetPassword/:token" element = {<ResetPassword />}/>
                <Route path = "/cover-Letter" element = {<CoverLetter />} />
                <Route path="/cover-letter/edit/:id" element={<CoverLetterEditPage />} />
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
              <Route path="/pipeline-management" element={<PipelineManagement />} />
              </Routes>
            </JobProvider>
            </FlashProvider>
          </>

      </header>
    </div>
  );
}