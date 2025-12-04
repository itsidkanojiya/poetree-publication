import { addNewPaper } from '../services/paperService';

export const savePaper = async (user, divContents, logoFile, type) => {
  try {
    if (!user || !user.id) {
      console.error("User not found");
      alert("User not authenticated.");
      return;
    }

    const now = new Date();
    const formattedTime = now.toLocaleTimeString();
    const formattedDate = now.toISOString().split("T")[0];

    const formData = new FormData();
    formData.append("user_id", user.id);
    formData.append("type", type);
    formData.append("school_name", "NA");
    formData.append("standard", "NA");
    formData.append("timing", formattedTime);
    formData.append("date", formattedDate);
    formData.append("division", "NA");
    formData.append("address", "NA");
    formData.append("subject", "NA");
    formData.append("board", "NA");
    formData.append("body", divContents);

    if (logoFile) {
      formData.append("logo", logoFile);
    }

    await addNewPaper(formData);

    alert("Paper saved successfully!");
  } catch (error) {
    // alert("Failed to save paper. " + (error.response?.data?.message || error.message));
    console.error("Error saving paper:", error.response?.data || error);
  }
};
