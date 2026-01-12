import { createContext, useContext, useState } from "react";

const HeaderContext = createContext();

export const HeaderProvider = ({ children }) => {
  const [headers, setHeaders] = useState([
    {
      id: 1,
      image: "", // School logo
      schoolName: "ST. XAVIER'S PRIMARY SCHOOL",
      address: "",
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
      address: "",
      contact: "",
      documentTitle: "",
      class: "VII-B",
      studentName: "",
      rollNo: "",
      section: "",
      subject: "Mathematics",
      date: "",
      styleType: "style2",
      layoutType: "middle", // Standards 6-8
    },
  ]);

  return (
    <HeaderContext.Provider value={{ headers, setHeaders }}>
      {children}
    </HeaderContext.Provider>
  );
};

export const useHeader = () => useContext(HeaderContext);
