import { useNavigate } from "react-router-dom";

const HeaderCard = ({
  header,
  disableHover,
  disableStyles = false,
  width = "full",
  typeOfPaper,
}) => {
  const navigate = useNavigate();

  // Safety check for header
  if (!header) {
    return null;
  }

  const styles = {
    style1:
      "bg-white p-6 shadow-xl border-4 border-double border-black rounded-lg",
    style2:
      "bg-gradient-to-r from-gray-50 via-white to-gray-50 p-6 shadow-xl border-2 border-gray-800 rounded-lg",
    style3: "bg-white p-6 shadow-xl border-b-4 border-gray-700 rounded-lg",
    style4: "bg-white p-6 shadow-xl border-2 border-black rounded-lg",
  };

  // Set default values if missing
  const safeHeader = {
    layoutType: header.layoutType || "primary",
    styleType: header.styleType || "style1",
    ...header,
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
          "w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full border-3 border-gray-800",
        style2:
          "w-14 h-14 bg-gradient-to-br from-red-500 to-red-700 rounded-xl border-2 border-gray-800 shadow-md",
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
      style1: "w-12 h-12 rounded-full",
      style2: "w-14 h-14 rounded-xl",
      style3: "w-16 h-16 rounded-lg",
      style4: "w-20 h-20 rounded-full",
    };

    return (
      <img
        src={safeHeader.image}
        alt="School Logo"
        className={`${
          sizeClasses[safeHeader.styleType]
        } object-cover border-2 border-gray-800 shadow-md flex-shrink-0`}
      />
    );
  };

  return (
    <div
      key={header.id}
      className={`relative w-[${width}] h-fit p-4 cursor-pointer 
      ${disableHover ? "" : "transition-transform hover:scale-105"} 
      ${appliedStyle}`}
      onClick={() =>
        navigate(`/dashboard/generate/edit-header/${header.id}`, {
          state: { header, from: typeOfPaper },
        })
      }
    >
      {/* Style 1: Primary Classes (1-5) */}
      {safeHeader.layoutType === "primary" && (
        <div className="border-4 border-double border-black p-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            {renderLogo()}
            <h1 className="text-xl font-bold">{header.schoolName}</h1>
          </div>
          <div className="h-0.5 bg-black my-3"></div>
          <div className="flex justify-between text-sm mt-3">
            <span>
              <strong>Name:</strong> {header.studentName || "_________________"}
            </span>
            <span>
              <strong>Class:</strong> {header.class}
            </span>
          </div>
          <div className="flex justify-between text-sm mt-2">
            <span>
              <strong>Subject:</strong> {header.subject}
            </span>
            <span>
              <strong>Date:</strong> {header.date || "__/__/____"}
            </span>
          </div>
        </div>
      )}

      {/* Style 2: Middle Classes (6-8) */}
      {safeHeader.layoutType === "middle" && (
        <div className="border-2 border-gray-800 rounded-md p-4 bg-gradient-to-r from-gray-50 via-white to-gray-50">
          <div className="flex items-center justify-center gap-3 mb-3">
            {renderLogo()}
            <h1 className="text-2xl font-bold text-gray-800 underline">
              {header.schoolName}
            </h1>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <strong>Name:</strong> {header.studentName || "_________________"}
            </div>
            <div>
              <strong>Roll No:</strong> {header.rollNo || "________"}
            </div>
            <div>
              <strong>Class:</strong> {header.class}
            </div>
            <div>
              <strong>Section:</strong> {header.section || "_______"}
            </div>
            <div>
              <strong>Subject:</strong> {header.subject}
            </div>
            <div>
              <strong>Date:</strong> {header.date || "__/__/____"}
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
                {header.schoolName}
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
              <h1 className="text-2xl font-bold">{header.schoolName}</h1>
              <p className="text-sm italic mt-1">{header.schoolAddress}</p>
              <p className="text-xs font-bold mt-1">{header.affiliation}</p>
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
