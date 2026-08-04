export const API_BASE = import.meta.env.VITE_API_URL || "";

export const getImageUrl = (imagePath) => {
  if (!imagePath) return "https://via.placeholder.com/150?text=No+Image";
  if (
    imagePath.startsWith("http://") || 
    imagePath.startsWith("https://") || 
    imagePath.startsWith("data:") || 
    imagePath.startsWith("blob:")
  ) {
    return imagePath;
  }
  return `${API_BASE}/uploads/${imagePath}`;
};
