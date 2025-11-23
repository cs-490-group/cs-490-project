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
import EmploymentList from "./pages/employment/EmploymentList";
import SetPassword from "./pages/setPassword";
import ForgotPassword from "./pages/forgotPassword";
import ResetPassword from "./pages/resetPassword";
import SkillsList from "./pages/skills/SkillList";
import EducationList from "./pages/education/EducationList";
import CertificationList from "./pages/certifications/CertificationList";
import ProjectsList from "./pages/projects/ProjectList";
import JobsList from "./pages/jobs/JobList";
import CoverLetter from "./pages/coverLetter/coverLetter";
import CoverLetterEditPage from "./pages/coverLetter/CoverLetterEditPage";
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
import { FlashProvider, FlashMessage } from "./context/flashContext";
import "bootstrap-icons/font/bootstrap-icons.css";
import '@fortawesome/fontawesome-free/css/all.min.css';


// inside your router


// import Dashboard from "./pages/dashboard";
import Dashboard from "./pages/dashboard";


export function App() {
  const location = useLocation();
  
  return (
    <div className="App">
      <header>
        
        <>
    
          <FlashProvider>
            <FlashMessage />
              <Nav key={location.pathname} />
              <Routes>
                <Route path = "/" element = {<Home />} />
                <Route path = "/register" element = {<Register />} />
                <Route path = "/login" element = {<Login />} />
                <Route path = "/profile" element = {<Profile />} />
                <Route path="/employment-history" element={<EmploymentList />} />
                <Route path = "/forgotPassword" element = {<ForgotPassword />} />
                <Route path = "/set-password" element = {<SetPassword />} />
                <Route path = "/dashboard" element = {<Dashboard />} />
                <Route path = "/resetPassword/:token" element = {<ResetPassword />}/>
                <Route path = "/coverLetter" element = {<CoverLetter />} />
                <Route path="/cover-letter/edit/:id" element={<CoverLetterEditPage />} />

              <Route path="/skills" element={<SkillsList />} />
              <Route path="/education" element={<EducationList />} />
              <Route path="/certifications" element={<CertificationList />} />
              <Route path="/projects" element={<ProjectsList />} />
              <Route path="/jobs" element={<JobsList />} />
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
              <Route path="/interview/questions/:roleId" element={<RoleQuestions />} />
              <Route path="/interview/questions/practice/:questionId" element={<PracticeQuestion />} />
              </Routes>
            </FlashProvider>
          </>

      </header>
    </div>
  );
}