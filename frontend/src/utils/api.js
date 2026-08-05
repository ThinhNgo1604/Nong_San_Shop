export const API_BASE = import.meta.env.VITE_API_URL || "";

export const DEFAULT_PRODUCT_IMAGE = "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=500&auto=format&fit=crop";

export const getImageUrl = (imagePath) => {
  if (!imagePath || imagePath === "undefined" || imagePath === "null" || imagePath === "[object Object]") {
    return DEFAULT_PRODUCT_IMAGE;
  }
  const str = String(imagePath).trim();
  if (!str) return DEFAULT_PRODUCT_IMAGE;

  if (
    str.startsWith("http://") || 
    str.startsWith("https://") || 
    str.startsWith("data:") || 
    str.startsWith("blob:")
  ) {
    return str;
  }
  return `${API_BASE}/uploads/${str}`;
};

export const handleImageError = (e) => {
  if (e && e.target) {
    e.target.onerror = null;
    e.target.src = DEFAULT_PRODUCT_IMAGE;
  }
};

