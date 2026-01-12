import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Upload, Image, School, MapPin } from "lucide-react";
import { getProfile, updateProfile } from "../services/authService";
import Toast from "../components/Common/Toast";

const EditProfile = () => {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    school_name: "",
    address: "",
    logo: null,
    logoPreview: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await getProfile();
      const userData = response?.user || response?.data || response;
      
      setUser(userData);
      setFormData({
        school_name: userData.school_name || "",
        address: userData.address || "",
        logo: null,
        logoPreview: userData.logo || userData.logo_url || null,
      });
    } catch (error) {
      console.error("Error loading profile:", error);
      // Fallback to localStorage if API fails
      const storedUser = JSON.parse(localStorage.getItem("user") || "null");
      if (storedUser) {
        setUser(storedUser);
        setFormData({
          school_name: storedUser.school_name || "",
          address: storedUser.address || "",
          logo: null,
          logoPreview: storedUser.logo || storedUser.logo_url || null,
        });
      }
      setToast({
        show: true,
        message: "Failed to load profile. Using cached data.",
        type: "warning",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const preview = URL.createObjectURL(file);
      setFormData((prev) => ({
        ...prev,
        logo: file,
        logoPreview: preview,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      
      const profileData = {
        school_name: formData.school_name,
        address: formData.address,
        logo: formData.logo, // File object or null
      };

      const response = await updateProfile(profileData);
      const updatedUser = response?.user || response?.data || response;

      // Update localStorage with new user data
      if (updatedUser) {
        const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
        const updatedUserData = {
          ...currentUser,
          school_name: updatedUser.school_name || formData.school_name,
          address: updatedUser.address || formData.address,
          logo: updatedUser.logo || updatedUser.logo_url || currentUser.logo,
        };
        localStorage.setItem("user", JSON.stringify(updatedUserData));
      }

      setToast({
        show: true,
        message: "Profile updated successfully!",
        type: "success",
      });

      setTimeout(() => {
        navigate("/dashboard/profile");
      }, 1500);
    } catch (error) {
      setToast({
        show: true,
        message: error.response?.data?.message || "Failed to update profile",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => navigate("/dashboard/profile")}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Edit Profile
                </h1>
                <p className="text-gray-600 mt-1">
                  Update your school information
                </p>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* School Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <School className="w-4 h-4" />
                  School Name
                </label>
                <input
                  type="text"
                  name="school_name"
                  value={formData.school_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition outline-none"
                  placeholder="Enter school name"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  School Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition outline-none"
                  placeholder="Enter school address"
                />
              </div>

              {/* Logo Upload */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  School Logo
                </label>

                <div className="flex flex-col gap-3">
                  <label className="relative cursor-pointer bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2.5 rounded-lg shadow-lg hover:from-blue-600 hover:to-indigo-700 transition w-fit flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Choose Logo Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </label>

                  {formData.logoPreview && (
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                      <img
                        src={formData.logoPreview}
                        alt="Logo Preview"
                        className="w-20 h-20 rounded-lg object-cover border-2 border-gray-300"
                      />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-green-600">
                          ✓ Logo {formData.logo ? "selected" : "uploaded"}
                        </p>
                        <p className="text-xs text-gray-500">
                          Preview shown above
                        </p>
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-gray-500">
                    Upload a logo image file. This will be used in all your papers.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => navigate("/dashboard/profile")}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditProfile;





