import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const HeaderCard = ({
  header,
  disableHover,
  disableStyles = false,
  width = "full",
  typeOfPaper,
  disableNavigation = false,
}) => {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);

  // Load user profile data for school info
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (user) {
      setUserProfile({
        schoolName: user.school_name || "",
        address:
          user.address ||
          (user.school_address_city && user.school_address_state
            ? `${user.school_address_city}, ${user.school_address_state}`
            : user.school_address || ""),
        logo: user.logo || user.logo_url || null,
      });
    }
  }, []);

  // Safety check for header
  if (!header) {
    return null;
  }

  // Merge user profile data with header (user profile takes precedence for school info)
  const mergedHeader = {
    ...header,
    schoolName: userProfile?.schoolName || header.schoolName || "",
    address: userProfile?.address || header.address || "",
    image: userProfile?.logo || header.image || header.logo || null,
    documentTitle: header.documentTitle || header.paper_title || null,
  };

  const styles = {
    style1:
      "bg-white p-6 shadow-xl border-4 border-double border-black rounded-lg",
    style2:
      "bg-gradient-to-r from-gray-50 via-white to-gray-50 p-6 shadow-xl border-2 border-gray-800 rounded-lg",
    style3: "bg-white p-6 shadow-xl border-b-4 border-gray-700 rounded-lg",
    style4: "bg-white p-6 shadow-xl border-2 border-black rounded-lg",
  };

  // Set default values if missing (use merged header with user profile data)
  const safeHeader = {
    layoutType: mergedHeader.layoutType || "primary",
    styleType: mergedHeader.styleType || "style1",
    ...mergedHeader,
  };

  const appliedStyle = !disableStyles ? styles[safeHeader.styleType] : "";

  // Render logo (either image or initials)
  const renderLogo = () => {
    if (!safeHeader.image) {
      // Generate initials from school name
      const initials =
        safeHeader.schoolName
          ?.split(" ")
          .map((word) => word[0])
          .join("")
          .substring(0, 3)
          .toUpperCase() || "SCH";

      const logoStyles = {
        style1:
          "w-12 h-12 bg-purple-600 flex items-center justify-center text-white font-bold text-sm",
        style2: "w-20 h-20 flex items-center justify-center bg-white",
        style3:
          "w-16 h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-lg border-2 border-green-900 shadow-lg",
        style4:
          "w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full border-3 border-gray-800 shadow-lg",
      };

      return (
        <div
          className={`${
            logoStyles[safeHeader.styleType]
          } flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}
        >
          {initials}
        </div>
      );
    }

    const sizeClasses = {
      style1: "w-12 h-12",
      style2: "w-20 h-20",
      style3: "w-16 h-16 rounded-lg",
      style4: "w-20 h-20 rounded-full",
    };

    // Remove border for style1 and style2, keep for style3 and style4
    const borderClass =
      safeHeader.styleType === "style1" || safeHeader.styleType === "style2"
        ? ""
        : "border-2 border-gray-800";

    return (
      <img
        src={safeHeader.image}
        alt="School Logo"
        className={`${
          sizeClasses[safeHeader.styleType]
        } object-cover ${borderClass} shadow-md flex-shrink-0`}
      />
    );
  };

  return (
    <div
      key={header.id}
      className={`relative w-[${width}] h-fit p-4 ${
        disableNavigation ? "" : "cursor-pointer"
      } 
      ${disableHover ? "" : "transition-transform hover:scale-105"} 
      ${appliedStyle}`}
      onClick={
        disableNavigation
          ? undefined
          : () =>
              navigate(`/dashboard/generate/edit-header/${header.id}`, {
                state: { header, from: typeOfPaper },
              })
      }
    >
      {/* Style 1: Primary Classes (1-5) */}
      {safeHeader.layoutType === "primary" && (
        <div className={`border-4 border-double border-black ${disableStyles ? 'p-2' : 'p-4'}`}>
          {/* Top section: Logo and School Name - Centered */}
          <div className="flex items-center justify-center gap-3 mb-1">
            {renderLogo()}
            <div className="flex flex-col items-center text-center">
              <h1 className="text-xl font-bold uppercase text-center">
                {safeHeader.schoolName || "SCHOOL NAME"}
              </h1>
              {safeHeader.address && (
                <p className="text-xs text-gray-700 mt-1 text-center">
                  {safeHeader.address}
                </p>
              )}
              {/* Paper Title (Document Title) - Medium bold, centered */}
              {safeHeader.documentTitle && (
                <p className="text-sm font-bold text-gray-900 mt-2 text-center">
                  {safeHeader.documentTitle}
                </p>
              )}
            </div>
          </div>

          {/* Horizontal separator line */}
          <div className="h-0.5 bg-black my-3 w-full"></div>

          {/* Bottom section: Name and Subject on first row; Class, Date, Marks on second row */}
          <div className="flex flex-col gap-2 mt-3">
            {/* First row: Name and Subject */}
            <div className="flex justify-between items-start text-sm">
              <div>
                <strong>Name:</strong>{" "}
                <span className="border-b border-black border-dotted inline-block min-w-[200px]">
                  {header.studentName || ""}
                </span>
              </div>
              <div>
                <strong>Subject:</strong> {header.subject || "Maths"}
              </div>
            </div>

            {/* Second row: Class (left), Date (middle), Marks (right) */}
            <div className="flex justify-between items-start text-sm">
              <div>
                <strong>Class:</strong>{" "}
                {(() => {
                  const classValue = header.class || "Standard 1";
                  // Extract just the number from "Standard X" or return the number if it's just a number
                  const match = classValue.match(/\d+/);
                  return match ? match[0] : classValue;
                })()}
              </div>
              <div>
                <strong>Date:</strong>{" "}
                {(() => {
                  const dateValue = header.date || new Date().toISOString().split("T")[0];
                  // Convert yyyy-mm-dd to mm-dd-yyyy
                  if (dateValue.includes("-")) {
                    const [year, month, day] = dateValue.split("-");
                    return `${month}-${day}-${year}`;
                  }
                  // If already in mm-dd-yyyy or other format, return as is
                  return dateValue;
                })()}
              </div>
              <div>
                <strong>Marks:</strong> {header.totalMarks ?? header.marks ?? "80"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Style 2: Middle Classes (6-8) */}
      {safeHeader.layoutType === "middle" && (
        <div className={`border-2 border-gray-800 rounded-md ${disableStyles ? 'p-2' : 'p-4'} bg-white`}>
          <div className="flex items-start gap-4">
            {/* Logo on the left */}
            <div className="flex-shrink-0">{renderLogo()}</div>

            {/* Text content on the right */}
            <div className="flex-1">
              {/* School Name - Largest, bold, uppercase, centered */}
              <h1 className="text-xl font-bold uppercase text-gray-900 mb-1 text-center">
                {safeHeader.schoolName || "SCHOOL NAME"}
              </h1>

              {/* Address and Contact - Smallest font, centered */}
              {(safeHeader.address || safeHeader.contact) && (
                <p className="text-xs text-gray-700 mb-2 text-center">
                  {safeHeader.address || ""}
                  {safeHeader.address && safeHeader.contact && " "}
                  {safeHeader.contact && `© ${safeHeader.contact}`}
                </p>
              )}

              {/* Document Title (Paper Title) - Medium bold, centered */}
              {safeHeader.documentTitle && (
                <p className="text-sm font-bold text-gray-900 mb-1 text-center">
                  {safeHeader.documentTitle}
                </p>
              )}

              {/* Grade/Class - Medium bold, centered */}
              {safeHeader.class && (
                <p className="text-sm font-bold text-gray-900 text-center">
                  Grade : {safeHeader.class}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Style 3: High School (9-10) */}
      {safeHeader.layoutType === "high" && (
        <div className="border-b-4 border-gray-700 pb-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-3">
              {renderLogo()}
              <h1 className="text-2xl font-bold text-gray-800">
                {safeHeader.schoolName}
              </h1>
            </div>
            <div className="text-right text-sm">
              <div>Class: {header.class}</div>
              <div>Roll No: {header.rollNo}</div>
            </div>
          </div>
          <div className="text-center text-lg font-bold underline my-3">
            {header.assignmentType}
          </div>
          <div className="flex justify-between text-sm">
            <span>
              <strong>Name:</strong>{" "}
              {header.studentName || "_____________________"}
            </span>
            <span>
              <strong>Subject:</strong> {header.subject}
            </span>
            <span>
              <strong>Date:</strong> {header.date || "__/__/____"}
            </span>
          </div>
        </div>
      )}

      {/* Style 4: Senior Secondary (11-12) */}
      {safeHeader.layoutType === "senior" && (
        <div className="border-2 border-black p-4">
          <div className="flex items-center gap-4 border-b-2 border-black pb-3 mb-3">
            {renderLogo()}
            <div className="flex-1 text-center">
              <h1 className="text-2xl font-bold">{safeHeader.schoolName}</h1>
              <p className="text-sm italic mt-1">
                {safeHeader.address || safeHeader.schoolAddress}
              </p>
              <p className="text-xs font-bold mt-1">{safeHeader.affiliation}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <strong className="inline-block w-28">Student Name:</strong>
              {header.studentName || "_____________________"}
            </div>
            <div>
              <strong className="inline-block w-28">Class/Stream:</strong>
              {header.classStream}
            </div>
            <div>
              <strong className="inline-block w-28">Roll Number:</strong>
              {header.rollNo || "__________"}
            </div>
            <div>
              <strong className="inline-block w-28">Date:</strong>
              {header.date || "__/__/____"}
            </div>
            <div>
              <strong className="inline-block w-28">Subject:</strong>
              {header.subject}
            </div>
            <div>
              <strong className="inline-block w-28">Topic:</strong>
              {header.topic || "_____________________"}
            </div>
          </div>
        </div>
      )}

      {!disableHover && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition rounded-lg">
          <button className="bg-white text-black px-4 py-2 rounded-lg shadow-md font-semibold hover:bg-gray-200 transition">
            Edit Header
          </button>
        </div>
      )}
    </div>
  );
};

export default HeaderCard;
