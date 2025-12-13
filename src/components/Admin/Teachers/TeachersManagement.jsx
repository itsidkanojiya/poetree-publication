import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import TeachersList from "./TeachersList";
import SubjectRequests from "./SubjectRequests";
import { Users, UserCheck, UserX, BookOpen } from "lucide-react";

const TeachersManagement = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    // Determine active tab from URL
    if (location.pathname.includes("subject-requests")) return "requests";
    if (location.pathname.includes("pending")) return "pending";
    if (location.pathname.includes("active")) return "active";
    return "all";
  });

  const tabs = [
    { id: "all", name: "All Teachers", icon: Users, href: "/admin/teachers" },
    {
      id: "pending",
      name: "Pending Teachers",
      icon: UserX,
      href: "/admin/teachers/pending",
    },
    {
      id: "active",
      name: "Active Teachers",
      icon: UserCheck,
      href: "/admin/teachers/active",
    },
    {
      id: "requests",
      name: "Subject Requests",
      icon: BookOpen,
      href: "/admin/teachers/subject-requests",
    },
  ];

  const getFilterType = () => {
    if (activeTab === "pending") return "pending";
    if (activeTab === "active") return "active";
    return "all";
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Teacher Management
        </h1>
        <p className="text-gray-600">Manage teachers, their status, and subject requests</p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <Link
                key={tab.id}
                to={tab.href}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 font-medium transition-all ${
                  isActive
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.name}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div>
        {activeTab === "requests" ? (
          <SubjectRequests />
        ) : (
          <TeachersList filterType={getFilterType()} />
        )}
      </div>
    </div>
  );
};

export default TeachersManagement;

