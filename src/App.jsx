import React from "react";
import { Routes, Route, Link, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import About from "./pages/About";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ResetPassword from "./pages/auth/ResetPassword";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Overview from "./components/Dashboard/Overview";
import Header from "./components/Dashboard/Header";
import EditHeader from "./components/Dashboard/EditHeader";
import PdfPreview from "./components/Dashboard/PdfPreview";
import Worksheets from "./components/Dashboard/Worksheets";
import Answersheets from "./components/Dashboard/Answersheets";
import CustomPaper from "./components/Dashboard/CustomPaper";
import History from "./pages/History";
import ViewPaperPage from "./components/Dashboard/ViewPaperPage";
import ProtectedRoute from "./routes/ProtectedRoute";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import ChangePassword from "./pages/ChangePassword";
import VerifyOtp from "./pages/auth/VerifyOtp";
import SubjectRequests from "./pages/SubjectRequests";
import Animations from "./pages/Animations";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminPanel from "./pages/admin/AdminPanel";
import AdminProtectedRoute from "./routes/AdminProtectedRoute";
import AdminOverview from "./components/Admin/AdminOverview";
import TeachersManagement from "./components/Admin/Teachers/TeachersManagement";
import SubjectTitleManagement from "./components/Admin/SubjectTitles/SubjectTitleManagement";
import QuestionManagement from "./components/Admin/Questions/QuestionManagement";
import AnswerSheetManagement from "./components/Admin/AnswerSheets/AnswerSheetManagement";
import WorksheetManagement from "./components/Admin/Worksheets/WorksheetManagement";
import TemplateList from "./components/Admin/Templates/TemplateList";
import CreateTemplate from "./components/Admin/Templates/CreateTemplate";
import TemplateDetails from "./components/Admin/Templates/TemplateDetails";
import BrowseTemplates from "./components/Dashboard/BrowseTemplates";
import ViewTemplate from "./components/Dashboard/ViewTemplate";
import CustomizePaper from "./components/Dashboard/CustomizePaper";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/auth">
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route path="verify-otp" element={<VerifyOtp />} />
      </Route>

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      >
        <Route index="true" element={<Overview />} />
        <Route path="generate">
          <Route path="header" element={<Header />} />
          <Route path="edit-header/:id" element={<EditHeader />} />
          <Route path="pdf-preview" element={<PdfPreview />} />
          <Route path="worksheets" element={<Worksheets />} />
          <Route path="answersheets" element={<Answersheets />} />
          <Route path="custompaper" element={<CustomPaper />} />
        </Route>
        <Route path="history" element={<History />} />
        <Route path="view/:id" element={<ViewPaperPage />} />
        <Route path="profile" element={<Profile />} />
        <Route path="edit-profile" element={<EditProfile />} />
        <Route path="change-password" element={<ChangePassword />} />
        <Route path="subject-requests" element={<SubjectRequests />} />
        <Route path="animations" element={<Animations />} />
        <Route path="templates" element={<BrowseTemplates />} />
        <Route path="templates/:id" element={<ViewTemplate />} />
        <Route path="papers/:id/customize" element={<CustomizePaper />} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin">
        <Route path="login" element={<AdminLogin />} />
        <Route
          path=""
          element={
            <AdminProtectedRoute>
              <AdminPanel />
            </AdminProtectedRoute>
          }
        >
          <Route index="true" element={<AdminOverview />} />
          <Route path="teachers" element={<TeachersManagement />} />
          <Route path="teachers/pending" element={<TeachersManagement />} />
          <Route path="teachers/active" element={<TeachersManagement />} />
          <Route path="teachers/subject-requests" element={<TeachersManagement />} />
          <Route path="subject-titles" element={<SubjectTitleManagement />} />
          <Route path="questions" element={<QuestionManagement />} />
          <Route path="questions/:type" element={<QuestionManagement />} />
          <Route path="answer-sheets" element={<AnswerSheetManagement />} />
          <Route path="worksheets" element={<WorksheetManagement />} />
          <Route path="templates" element={<TemplateList />} />
          <Route path="templates/create" element={<CreateTemplate />} />
          <Route path="templates/:id" element={<TemplateDetails />} />
          <Route path="profile" element={<Profile />} />
          <Route path="edit-profile" element={<EditProfile />} />
          <Route path="change-password" element={<ChangePassword />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
