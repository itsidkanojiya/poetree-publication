import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import MinNavbar from "../../components/MinNavbar";
import Toast from "../../components/Common/Toast";
import Loader from "../../components/Common/loader/loader";
import apiClient from "../../services/apiClient";
import {
  User,
  Mail,
  Phone,
  Lock,
  School,
  MapPin,
  BookOpen,
  CheckCircle,
  X,
  Plus,
} from "lucide-react";

const Register = () => {
  const { login, registerUser } = useAuth();
  const navigate = useNavigate();

  const [personalInfo, setPersonalInfo] = useState({
    name: "",
    email: "",
    phone_number: "",
    username: "",
    password: "",
    school_name: "",
    school_address_state: "",
    school_address_pincode: "",
    school_address_city: "",
    school_principal_name: "",
    subjects: [], // Changed to array for multiple subjects
  });

  // Indian States List (static - all users are Indian)
  const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
    "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
  ];

  const [states] = useState(INDIAN_STATES);
  const [cities, setCities] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loadingPincode, setLoadingPincode] = useState(false);

  // State for managing multiple subject selections
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  // Each selected subject will have: { subjectId, subjectName, titles: [], selectedTitles: [] }

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  // States are now static - no need to fetch

  // Fetch subjects on component mount
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await apiClient.get("/subjects");
        const subjectsData = response.data || [];
        setSubjects(
          subjectsData.map((sub) => ({
            id: sub.subject_id,
            name: sub.subject_name,
          }))
        );
      } catch (error) {
        console.error("Error fetching subjects:", error);
      }
    };
    fetchSubjects();
  }, []);

  // Fetch cities from pincode API when state is selected
  // Note: Cities will be populated when pincode is entered or can be manually selected
  const fetchCitiesForState = async (stateName) => {
    // For now, we'll let users select city manually or from pincode
    // The pincode API will provide the city automatically
    setCities([]); // Clear cities when state changes
  };

  const handleStateChange = (event) => {
    const stateName = event.target.value;
    setPersonalInfo({ 
      ...personalInfo, 
      school_address_state: stateName,
      school_address_city: "" // Clear city when state changes
    });
    setCities([]); // Clear cities when state changes
  };

  const handlePincodeChange = async (event) => {
    const pincode = event.target.value.replace(/\D/g, ''); // Only allow digits
    setPersonalInfo({ ...personalInfo, school_address_pincode: pincode });

    if (pincode.length === 6) {
      setLoadingPincode(true);
      try {
        const response = await fetch(
          `https://api.postalpincode.in/pincode/${pincode}`
        );
        const data = await response.json();
        
        if (data && data[0] && data[0].Status === "Success" && data[0].PostOffice && data[0].PostOffice.length > 0) {
          const postOfficeData = data[0].PostOffice[0];
          
          // Get unique cities from all post offices in this pincode
          const uniqueCities = [...new Set(data[0].PostOffice.map(po => po.District))];
          
          setPersonalInfo({
            ...personalInfo,
            school_address_pincode: pincode,
            school_address_city: postOfficeData.District,
            school_address_state: postOfficeData.State,
          });
          
          // Set cities list for dropdown
          setCities(uniqueCities);
          
          setToast({
            show: true,
            message: "City and State auto-filled from pincode!",
            type: "success",
          });
        } else {
          setToast({
            show: true,
            message: "Invalid pincode. Please enter a valid Indian pincode.",
            type: "error",
          });
        }
      } catch (error) {
        console.error("Error fetching city and state for pincode:", error);
        setToast({
          show: true,
          message: "Failed to fetch location details. Please try again or enter manually.",
          type: "error",
        });
      } finally {
        setLoadingPincode(false);
      }
    } else if (pincode.length > 0 && pincode.length < 6) {
      // Clear city and state if pincode is incomplete
      setPersonalInfo({
        ...personalInfo,
        school_address_city: "",
        school_address_state: "",
      });
      setCities([]);
    }
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setPersonalInfo({ ...personalInfo, [name]: value });
  };

  // Add a new subject selection
  const addSubjectSelection = () => {
    setSelectedSubjects([
      ...selectedSubjects,
      {
        id: Date.now(),
        subjectId: "",
        subjectName: "",
        titles: [],
        selectedTitles: [],
      },
    ]);
  };

  // Remove a subject selection
  const removeSubjectSelection = (id) => {
    setSelectedSubjects(selectedSubjects.filter((s) => s.id !== id));
  };

  // Handle subject change for a specific selection
  const handleSubjectChange = async (id, subjectId) => {
    const subject = subjects.find((s) => s.id === parseInt(subjectId));

    try {
      const response = await apiClient.get(`/subject/${subjectId}/titles`);
      const titlesData = response.data || [];
      const titles = titlesData.map((title) => ({
        id: title.subject_title_id,
        name: title.title_name,
      }));

      setSelectedSubjects(
        selectedSubjects.map((s) =>
          s.id === id
            ? {
                ...s,
                subjectId,
                subjectName: subject?.name || "",
                titles,
                selectedTitles: [],
              }
            : s
        )
      );
    } catch (error) {
      console.error("Error fetching subject titles:", error);
    }
  };

  // Handle multiple title selection for a specific subject
  const handleTitleToggle = (id, titleId) => {
    setSelectedSubjects(
      selectedSubjects.map((s) => {
        if (s.id === id) {
          const selected = s.selectedTitles.includes(titleId)
            ? s.selectedTitles.filter((t) => t !== titleId)
            : [...s.selectedTitles, titleId];
          return { ...s, selectedTitles: selected };
        }
        return s;
      })
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;

    // Validate that at least one subject is selected
    if (selectedSubjects.length === 0) {
      setToast({
        show: true,
        message: "Please select at least one subject.",
        type: "warning",
      });
      return;
    }

    // Validate that all selections have required fields
    const isValid = selectedSubjects.every(
      (s) => s.subjectId && s.selectedTitles.length > 0
    );
    if (!isValid) {
      setToast({
        show: true,
        message:
          "Please complete all subject selections with at least one subject title.",
        type: "warning",
      });
      return;
    }

    setLoading(true);
    setError("");

    // Format data for backend API - Multiple Subjects format
    // Extract unique subject IDs
    const subjects = [
      ...new Set(selectedSubjects.map((s) => parseInt(s.subjectId))),
    ];

    // Format subject_titles as array of objects
    const subject_titles = selectedSubjects.flatMap((s) =>
      s.selectedTitles.map((titleId) => ({
        subject_id: parseInt(s.subjectId),
        subject_title_id: parseInt(titleId),
      }))
    );

    // Remove subjects from personalInfo if it exists (cleanup)
    const { subjects: _, ...cleanPersonalInfo } = personalInfo;

    try {
      const response = await apiClient.post(
        "/auth/signup",
        {
          ...cleanPersonalInfo,
          subjects,
          subject_titles,
          user_type: "admin",
        },
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.status === 201 || response.status === 200) {
        setToast({
          show: true,
          message: "Registration successful! Please verify your email.",
          type: "success",
        });
        // Navigate after showing toast
        setTimeout(() => {
          navigate("/auth/verify-otp", {
            state: {
              email: personalInfo.email,
              userId: response.data.user?.id,
            },
          });
        }, 2000);
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Registration failed!";
      setError(errorMessage);
      setToast({
        show: true,
        message: errorMessage,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setPersonalInfo({
      name: "",
      email: "",
      phone_number: "",
      username: "",
      password: "",
      school_name: "",
      school_address_state: "",
      school_address_pincode: "",
      school_address_city: "",
      school_principal_name: "",
      subjects: [],
    });
    setSelectedSubjects([]);
  };

  return (
    <>
      <MinNavbar />
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Welcome to Poetree
            </h1>
            <p className="text-xl text-gray-600">
              Your All-in-One Teaching Companion
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Information */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <User className="w-6 h-6 text-blue-600" />
                Personal Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="name"
                      value={personalInfo.name}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition outline-none"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Username *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="username"
                      value={personalInfo.username}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition outline-none"
                      placeholder="Choose a username"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      name="password"
                      value={personalInfo.password}
                      onChange={handleInputChange}
                      autoComplete="new-password"
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition outline-none"
                      placeholder="Create a strong password"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={personalInfo.email}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition outline-none"
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      name="phone_number"
                      value={personalInfo.phone_number}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition outline-none"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* School Information */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <School className="w-6 h-6 text-blue-600" />
                School Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    School Name
                  </label>
                  <input
                    type="text"
                    name="school_name"
                    value={personalInfo.school_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition outline-none"
                    placeholder="Enter school name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Principal's Name
                  </label>
                  <input
                    type="text"
                    name="school_principal_name"
                    value={personalInfo.school_principal_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition outline-none"
                    placeholder="Principal's name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Pincode <span className="text-blue-600 text-xs">(Auto-fills City & State)</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="school_address_pincode"
                      value={personalInfo.school_address_pincode}
                      onChange={handlePincodeChange}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition outline-none"
                      placeholder="Enter 6-digit pincode"
                      maxLength="6"
                      pattern="[0-9]{6}"
                    />
                    {loadingPincode && (
                      <div className="absolute right-3 top-3.5">
                        <Loader size="sm" className="inline-block" />
                      </div>
                    )}
                  </div>
                  {personalInfo.school_address_pincode.length === 6 && !loadingPincode && personalInfo.school_address_city && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ City and State auto-filled!
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    State
                  </label>
                  <select
                    name="school_address_state"
                    value={personalInfo.school_address_state}
                    onChange={handleStateChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition outline-none"
                  >
                    <option value="">Select State</option>
                    {states.map((state, index) => (
                      <option key={index} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    City {cities.length > 0 && <span className="text-green-600 text-xs">(From Pincode)</span>}
                  </label>
                  {cities.length > 0 ? (
                    <select
                      name="school_address_city"
                      value={personalInfo.school_address_city}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-green-200 bg-green-50 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition outline-none"
                    >
                      <option value="">Select City</option>
                      {cities.map((city, index) => (
                        <option key={index} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      name="school_address_city"
                      value={personalInfo.school_address_city}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition outline-none"
                      placeholder="Enter city name or enter pincode first"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Subjects Selection */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                  Teaching Subjects
                </h2>
                <button
                  type="button"
                  onClick={addSubjectSelection}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition shadow-lg"
                >
                  <Plus className="w-5 h-5" />
                  Add Subject
                </button>
              </div>

              {selectedSubjects.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    No subjects added yet. Click "Add Subject" to get started.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {selectedSubjects.map((selection, index) => (
                    <div
                      key={selection.id}
                      className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-800">
                          Subject {index + 1}
                        </h3>
                        <button
                          type="button"
                          onClick={() => removeSubjectSelection(selection.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="space-y-4">
                        {/* Subject Selection */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Subject *
                          </label>
                          <select
                            value={selection.subjectId}
                            onChange={(e) =>
                              handleSubjectChange(selection.id, e.target.value)
                            }
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition outline-none"
                            required
                          >
                            <option value="">Select Subject</option>
                            {subjects.map((sub) => (
                              <option key={sub.id} value={sub.id}>
                                {sub.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Multiple Title Selection */}
                        {selection.titles.length > 0 && (
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Select Subject Titles * (You can select multiple)
                            </label>
                            <div className="flex flex-wrap gap-2 p-4 bg-white rounded-lg border-2 border-gray-200 min-h-[100px]">
                              {selection.titles.length === 0 ? (
                                <p className="text-gray-500 text-sm">
                                  Please select a subject first
                                </p>
                              ) : (
                                selection.titles.map((title) => (
                                  <button
                                    key={title.id}
                                    type="button"
                                    onClick={() =>
                                      handleTitleToggle(selection.id, title.id)
                                    }
                                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                                      selection.selectedTitles.includes(
                                        title.id
                                      )
                                        ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg transform scale-105"
                                        : "bg-white border-2 border-gray-300 text-gray-700 hover:border-blue-500 hover:shadow-md"
                                    }`}
                                  >
                                    {selection.selectedTitles.includes(
                                      title.id
                                    ) && (
                                      <CheckCircle className="w-4 h-4 inline mr-1" />
                                    )}
                                    {title.name}
                                  </button>
                                ))
                              )}
                            </div>
                            {selection.selectedTitles.length > 0 && (
                              <p className="mt-2 text-xs text-blue-600 font-semibold">
                                {selection.selectedTitles.length} title
                                {selection.selectedTitles.length !== 1
                                  ? "s"
                                  : ""}{" "}
                                selected
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col items-center gap-4">
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "SIGNING UP..." : "SIGN UP"}
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-8 py-3 bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold rounded-lg shadow-lg hover:shadow-xl transition"
                >
                  CLEAR
                </button>
              </div>

              <p className="text-gray-600">
                Already have an Account?{" "}
                <Link
                  to="/auth/login"
                  className="text-blue-600 hover:text-blue-700 font-bold underline"
                >
                  Login
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default Register;
