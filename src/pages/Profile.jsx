import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../services/apiClient";
import { getProfile, updateWorksheetWatermarkOpacity, updateWorksheetWatermarkSettings } from "../services/authService";
import {
  User,
  Mail,
  Phone,
  MapPin,
  School,
  BookOpen,
  Shield,
  Key,
  Trash2,
  CheckCircle,
  XCircle,
  Edit,
  GraduationCap,
  Image,
  FileText,
} from "lucide-react";
import Loader from "../components/Common/loader/loader";

const DEFAULT_WATERMARK_OPACITY = 0.3;
const DEFAULT_WATERMARK_ROTATION = -25;
const DEFAULT_WATERMARK_BEND = 0;
const WATERMARK_TYPE_OPTIONS = [
  { value: "none", label: "None" },
  { value: "text", label: "Text only" },
  { value: "image", label: "Image only" },
  { value: "text_and_image", label: "Text and image" },
];

const Profile = () => {
  const [user, setUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [watermarkType, setWatermarkType] = useState("text");
  const [watermarkText, setWatermarkText] = useState("");
  const [watermarkOpacity, setWatermarkOpacity] = useState(DEFAULT_WATERMARK_OPACITY);
  const [watermarkRotation, setWatermarkRotation] = useState(DEFAULT_WATERMARK_ROTATION);
  const [watermarkBend, setWatermarkBend] = useState(DEFAULT_WATERMARK_BEND);
  const [watermarkSaving, setWatermarkSaving] = useState(false);
  const [watermarkError, setWatermarkError] = useState(null);
  const saveTimeoutRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser) {
      navigate("/auth/login");
      return;
    }
    setUser(storedUser);
    setWatermarkOpacity(
      typeof storedUser.worksheet_watermark_opacity === "number"
        ? storedUser.worksheet_watermark_opacity
        : DEFAULT_WATERMARK_OPACITY
    );
    const wt = storedUser.worksheet_watermark_type;
    if (wt === "none" || wt === "text" || wt === "image" || wt === "text_and_image") {
      setWatermarkType(wt);
    }
    setWatermarkText(typeof storedUser.worksheet_watermark_text === "string" ? storedUser.worksheet_watermark_text : "");
    const rot = storedUser.worksheet_watermark_rotation;
    setWatermarkRotation(typeof rot === "number" && rot >= -180 && rot <= 180 ? rot : DEFAULT_WATERMARK_ROTATION);
    const bend = storedUser.worksheet_watermark_bend;
    setWatermarkBend(typeof bend === "number" && bend >= -20 && bend <= 20 ? bend : DEFAULT_WATERMARK_BEND);
    loadProfile();
  }, [navigate]);

  const loadProfile = useCallback(async () => {
    try {
      setProfileLoading(true);
      const response = await getProfile();
      const userData = response?.user ?? response?.data ?? response;
      if (userData) {
        setUser(userData);
        const opacity = userData.worksheet_watermark_opacity ?? DEFAULT_WATERMARK_OPACITY;
        setWatermarkOpacity(typeof opacity === "number" ? opacity : DEFAULT_WATERMARK_OPACITY);
        const wt = userData.worksheet_watermark_type;
        if (wt === "none" || wt === "text" || wt === "image" || wt === "text_and_image") {
          setWatermarkType(wt);
        }
        setWatermarkText(typeof userData.worksheet_watermark_text === "string" ? userData.worksheet_watermark_text : "");
        const rot = userData.worksheet_watermark_rotation;
        setWatermarkRotation(typeof rot === "number" && rot >= -180 && rot <= 180 ? rot : DEFAULT_WATERMARK_ROTATION);
        const bend = userData.worksheet_watermark_bend;
        setWatermarkBend(typeof bend === "number" && bend >= -20 && bend <= 20 ? bend : DEFAULT_WATERMARK_BEND);
        const currentStored = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem("user", JSON.stringify({ ...currentStored, ...userData }));
      }
    } catch {
      // Keep existing user state from localStorage
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const persistWatermarkSettings = useCallback(
    async (updates) => {
      try {
        setWatermarkSaving(true);
        setWatermarkError(null);
        const payload = {
          type: updates.type ?? watermarkType,
          text: updates.text !== undefined ? updates.text : watermarkText,
          opacity: updates.opacity !== undefined ? updates.opacity : watermarkOpacity,
          rotation: updates.rotation !== undefined ? updates.rotation : watermarkRotation,
          bend: updates.bend !== undefined ? updates.bend : watermarkBend,
        };
        await updateWorksheetWatermarkSettings(payload);
        setUser((prev) => {
          if (!prev) return null;
          const next = { ...prev };
          if (payload.type != null) next.worksheet_watermark_type = payload.type;
          if (payload.text !== undefined) next.worksheet_watermark_text = payload.text;
          if (payload.opacity != null) next.worksheet_watermark_opacity = payload.opacity;
          if (payload.rotation != null) next.worksheet_watermark_rotation = payload.rotation;
          if (payload.bend != null) next.worksheet_watermark_bend = payload.bend;
          return next;
        });
        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        if (payload.type != null) stored.worksheet_watermark_type = payload.type;
        if (payload.text !== undefined) stored.worksheet_watermark_text = payload.text;
        if (payload.opacity != null) stored.worksheet_watermark_opacity = payload.opacity;
        if (payload.rotation != null) stored.worksheet_watermark_rotation = payload.rotation;
        if (payload.bend != null) stored.worksheet_watermark_bend = payload.bend;
        localStorage.setItem("user", JSON.stringify(stored));
      } catch {
        setWatermarkError("Could not save watermark settings.");
      } finally {
        setWatermarkSaving(false);
      }
    },
    [watermarkType, watermarkText, watermarkOpacity, watermarkRotation, watermarkBend]
  );

  const handleWatermarkSliderChange = (e) => {
    const value = Number(e.target.value) / 100;
    setWatermarkOpacity(value);
    setWatermarkError(null);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      persistWatermarkSettings({ opacity: value });
    }, 500);
  };

  const handleWatermarkTypeChange = (e) => {
    const value = e.target.value;
    if (!["none", "text", "image", "text_and_image"].includes(value)) return;
    setWatermarkType(value);
    setWatermarkError(null);
    persistWatermarkSettings({ type: value });
  };

  const handleWatermarkTextChange = (e) => {
    const value = e.target.value;
    setWatermarkText(value);
    setWatermarkError(null);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      persistWatermarkSettings({ text: value });
    }, 500);
  };

  const handleWatermarkRotationChange = (e) => {
    const value = Number(e.target.value);
    setWatermarkRotation(value);
    setWatermarkError(null);
    persistWatermarkSettings({ rotation: value });
  };

  const handleWatermarkBendChange = (e) => {
    const value = Number(e.target.value);
    setWatermarkBend(value);
    setWatermarkError(null);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      persistWatermarkSettings({ bend: value });
    }, 300);
  };

  const handleDeleteAccount = async () => {
    try {
      const response = await apiClient.delete("/auth/delete-account");

      if (response.status === 200) {
        alert("Account deleted successfully.");
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        navigate("/auth/login");
      }
    } catch (error) {
      if (error.response?.status === 401) {
        alert("Unauthorized: Please log in again.");
      } else {
        alert("Failed to delete account. Please try again later.");
        console.error(error);
      }
    }
    setShowDeleteModal(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                My Profile
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your account information
              </p>
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          {/* Header Banner */}
          <div className="h-32 bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 relative">
            <div className="absolute -bottom-16 left-8">
              <div className="w-32 h-32 bg-white rounded-2xl shadow-xl flex items-center justify-center border-4 border-white">
                <User className="w-16 h-16 text-indigo-600" />
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="pt-20 px-8 pb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-800">
                  {user.name}
                </h2>
                <p className="text-gray-600 flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </p>
              </div>
              <button
                onClick={() => navigate(user.user_type === "admin" ? "/admin/edit-profile" : "/dashboard/edit-profile")}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-indigo-700 transition shadow-lg"
              >
                <Edit className="w-5 h-5" />
                Edit Profile
              </button>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-bold text-gray-800">
                    Personal Information
                  </h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Full Name</p>
                      <p className="font-semibold text-gray-800">{user.name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Email Address</p>
                      <p className="font-semibold text-gray-800">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Phone Number</p>
                      <p className="font-semibold text-gray-800">
                        {user.phone_number || "Not provided"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Username</p>
                      <p className="font-semibold text-gray-800">
                        {user.username}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Account Type</p>
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full mt-1">
                        {user.user_type}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* School Information */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                <div className="flex items-center gap-2 mb-4">
                  <School className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-bold text-gray-800">
                    School Information
                  </h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <School className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">School Name</p>
                      <p className="font-semibold text-gray-800">
                        {user.school_name || "Not provided"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Principal Name</p>
                      <p className="font-semibold text-gray-800">
                        {user.school_principal_name || "Not provided"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Address</p>
                      <p className="font-semibold text-gray-800">
                        {user.address || (user.school_address_city
                          ? `${user.school_address_city}, ${user.school_address_state}`
                          : "Not provided")}
                      </p>
                    </div>
                  </div>
                  {user.logo && (
                    <div className="flex items-start gap-3">
                      <Image className="w-5 h-5 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">School Logo</p>
                        <img
                          src={user.logo || user.logo_url}
                          alt="School Logo"
                          className="w-16 h-16 rounded-lg object-cover border-2 border-gray-300 mt-1"
                        />
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Pincode</p>
                      <p className="font-semibold text-gray-800">
                        {user.school_address_pincode || "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Worksheet appearance (header & watermark preview) */}
              <div className="md:col-span-2 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-amber-600" />
                  <h3 className="text-lg font-bold text-gray-800">
                    Worksheet appearance
                  </h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Choose what appears as the watermark on every page of your downloaded worksheets. Opacity applies to text and/or image when shown.
                </p>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Watermark
                  </label>
                  <select
                    value={watermarkType}
                    onChange={handleWatermarkTypeChange}
                    className="w-full max-w-xs rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    aria-label="Watermark type"
                  >
                    {WATERMARK_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                {(watermarkType === "text" || watermarkType === "text_and_image") && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Watermark text (optional)
                    </label>
                    <input
                      type="text"
                      value={watermarkText}
                      onChange={handleWatermarkTextChange}
                      placeholder={user?.school_name || "e.g. Your School Name"}
                      maxLength={200}
                      className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      aria-label="Custom watermark text"
                    />
                    <p className="text-xs text-gray-500 mt-1">Leave empty to use your school name.</p>
                  </div>
                )}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Watermark opacity
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={Math.round(watermarkOpacity * 100)}
                      onChange={handleWatermarkSliderChange}
                      className="flex-1 h-2 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                      aria-label="Watermark opacity"
                      disabled={watermarkType === "none"}
                    />
                    <span className="text-sm font-semibold text-gray-700 w-10">
                      {Math.round(watermarkOpacity * 100)}%
                    </span>
                  </div>
                  {watermarkType === "none" && (
                    <p className="text-xs text-gray-500 mt-1">Opacity is ignored when watermark is None.</p>
                  )}
                  {watermarkSaving && (
                    <p className="text-xs text-amber-700 mt-1">Saving…</p>
                  )}
                  {watermarkError && (
                    <p className="text-sm text-red-600 mt-1">{watermarkError}</p>
                  )}
                </div>
                {watermarkType !== "none" && (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Watermark rotation (degrees)
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="-90"
                          max="90"
                          value={watermarkRotation}
                          onChange={handleWatermarkRotationChange}
                          className="flex-1 h-2 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                          aria-label="Watermark rotation"
                        />
                        <span className="text-sm font-semibold text-gray-700 w-12 tabular-nums">
                          {watermarkRotation}°
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Diagonal is around -25°.</p>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Watermark bend / skew (degrees)
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="-20"
                          max="20"
                          value={watermarkBend}
                          onChange={handleWatermarkBendChange}
                          className="flex-1 h-2 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                          aria-label="Watermark bend"
                        />
                        <span className="text-sm font-semibold text-gray-700 w-12 tabular-nums">
                          {watermarkBend}°
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Slant for a bent look. 0 = no skew.</p>
                    </div>
                  </>
                )}
                {/* Preview: worksheet header (same style as paper header) + watermark mock */}
                <div className="mt-4">
                  <p className="text-xs font-medium text-gray-600 mb-2">Preview</p>
                  <div className="relative bg-gray-100 rounded-lg overflow-hidden shadow-inner aspect-[3/2] max-h-44 p-1">
                    {/* Worksheet header mock: white bg, black border, like paper header */}
                    <div className="bg-white border-2 border-black rounded p-2 flex items-center justify-center gap-2">
                      {(user.worksheet_preview?.logo_url || user.logo || user.logo_url) ? (
                        <img
                          src={user.worksheet_preview?.logo_url || user.logo || user.logo_url}
                          alt="School logo"
                          className="h-8 w-8 object-contain flex-shrink-0 border border-gray-300 rounded"
                        />
                      ) : (
                        <div className="h-8 w-8 flex items-center justify-center bg-gray-700 text-white text-xs font-bold rounded flex-shrink-0">
                          {(user.worksheet_preview?.school_name || user.school_name || "Y")
                            .split(" ")
                            .map((w) => w[0])
                            .join("")
                            .substring(0, 2)
                            .toUpperCase()}
                        </div>
                      )}
                      <div className="flex flex-col items-center text-center min-w-0 flex-1">
                        <span className="text-xs font-bold text-gray-900 uppercase leading-tight block">
                          {user.worksheet_preview?.school_name || user.school_name || "Your School"}
                        </span>
                        {(user.address ||
                          user.school_address_city ||
                          (user.school_address_city && user.school_address_state)) && (
                          <span className="text-[10px] text-gray-600 mt-0.5 block">
                            {user.address ||
                              (user.school_address_city && user.school_address_state
                                ? `${user.school_address_city}, ${user.school_address_state}`
                                : user.school_address_city || "")}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Watermark mock: none / text / image / text_and_image, with rotation and bend */}
                    {watermarkType !== "none" && (
                      <div
                        className="absolute inset-0 flex flex-col items-center justify-center gap-1 pointer-events-none"
                        aria-hidden
                      >
                        {(watermarkType === "text" || watermarkType === "text_and_image") && (
                          <span
                            className="text-lg font-bold text-gray-400 whitespace-nowrap"
                            style={{
                              opacity: watermarkOpacity,
                              transform: `rotate(${watermarkRotation}deg) skewX(${watermarkBend}deg)`,
                            }}
                          >
                            {watermarkText.trim() || user?.school_name || "Your School"}
                          </span>
                        )}
                        {(watermarkType === "image" || watermarkType === "text_and_image") && (
                          <div
                            className="flex items-center justify-center"
                            style={{
                              opacity: watermarkOpacity,
                              transform: `rotate(${watermarkRotation}deg) skewX(${watermarkBend}deg)`,
                            }}
                          >
                            {(user.worksheet_preview?.logo_url || user.logo || user.logo_url) ? (
                              <img
                                src={user.worksheet_preview?.logo_url || user.logo || user.logo_url}
                                alt=""
                                className="h-10 w-10 object-contain"
                              />
                            ) : (
                              <div className="h-10 w-10 flex items-center justify-center bg-gray-500 text-white text-xs font-bold rounded">
                                {(user?.school_name || "Y").split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Academic Information - Only show for non-admin users */}
              {user.user_type !== "admin" && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpen className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-bold text-gray-800">
                      Academic Information
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <BookOpen className="w-5 h-5 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Subject</p>
                        <p className="font-semibold text-gray-800">
                          {user.subject || "Not provided"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <BookOpen className="w-5 h-5 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Subject Title</p>
                        <p className="font-semibold text-gray-800">
                          {user.subject_title || "Not provided"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <GraduationCap className="w-5 h-5 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Standard</p>
                        <p className="font-semibold text-gray-800">
                          {user.standard || "Not provided"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Verification Status - Only show for non-admin users */}
              {user.user_type !== "admin" && (
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-5 h-5 text-orange-600" />
                    <h3 className="text-lg font-bold text-gray-800">
                      Verification Status
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <div className="flex items-center gap-2">
                        <Mail className="w-5 h-5 text-gray-500" />
                        <span className="font-medium text-gray-700">
                          Email Verified
                        </span>
                      </div>
                      {user.is_verified ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-semibold">Yes</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-red-600">
                          <XCircle className="w-5 h-5" />
                          <span className="font-semibold">No</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <div className="flex items-center gap-2">
                        <Phone className="w-5 h-5 text-gray-500" />
                        <span className="font-medium text-gray-700">
                          Phone Verified
                        </span>
                      </div>
                      {user.is_number_verified ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-semibold">Yes</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-red-600">
                          <XCircle className="w-5 h-5" />
                          <span className="font-semibold">No</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Account Actions
          </h3>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => navigate(user.user_type === "admin" ? "/admin/change-password" : "/dashboard/change-password")}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-indigo-700 transition shadow-lg"
            >
              <Key className="w-5 h-5" />
              Change Password
            </button>
            {/* Delete Account - Only show for non-admin users */}
            {user.user_type !== "admin" && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-lg hover:from-red-600 hover:to-red-700 transition shadow-lg"
              >
                <Trash2 className="w-5 h-5" />
                Delete Account
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">
                Delete Account?
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete your account? This action cannot
              be undone and all your data will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteAccount}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition"
              >
                Yes, Delete My Account
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
