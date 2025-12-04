import { createContext, useContext, useState } from "react";

const HeaderContext = createContext();

export const HeaderProvider = ({ children }) => {
  const [headers, setHeaders] = useState([
    {
      id: 1,
      image: "", // Optional school logo
      schoolName: "ST. XAVIER'S PRIMARY SCHOOL",
      studentName: "",
      class: "III-A",
      rollNo: "",
      subject: "English",
      date: "",
      styleType: "style1",
      layoutType: "primary", // Standards 1-5
    },
    {
      id: 2,
      image: "", // Optional school logo
      schoolName: "DAV PUBLIC SCHOOL",
      studentName: "",
      class: "VII-B",
      rollNo: "",
      section: "",
      subject: "Mathematics",
      date: "",
      styleType: "style2",
      layoutType: "middle", // Standards 6-8
    },
    {
      id: 3,
      image: "", // Optional school logo
      schoolName: "KENDRIYA VIDYALAYA",
      studentName: "",
      class: "X-A",
      rollNo: "23",
      subject: "Science",
      date: "",
      assignmentType: "ASSIGNMENT / CLASS WORK",
      styleType: "style3",
      layoutType: "high", // Standards 9-10
    },
    {
      id: 4,
      image: "", // Optional school logo
      schoolName: "DELHI PUBLIC SCHOOL",
      schoolAddress: "Sector 45, Gurgaon, Haryana",
      affiliation: "Affiliated to CBSE, New Delhi (School Code: 123456)",
      studentName: "",
      classStream: "XII - Science",
      rollNo: "",
      subject: "Physics",
      topic: "",
      date: "",
      styleType: "style4",
      layoutType: "senior", // Standards 11-12
    },
  ]);

  return (
    <HeaderContext.Provider value={{ headers, setHeaders }}>
      {children}
    </HeaderContext.Provider>
  );
};

export const useHeader = () => useContext(HeaderContext);
