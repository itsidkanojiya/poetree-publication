import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import About from "./pages/About";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ResetPassword from "./pages/auth/ResetPassword";
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
import VerifyOtp from "./pages/auth/VerifyOtp";
import SubjectRequests from "./pages/SubjectRequests";
import Animations from "./pages/Animations";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/auth">
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
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
        <Route path="subject-requests" element={<SubjectRequests />} />
        <Route path="animations" element={<Animations />} />
      </Route>
    </Routes>
  );
}

export default App;
