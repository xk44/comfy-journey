import axios from 'axios';
import authService from './authService';

const API_URL = process.env.REACT_APP_BACKEND_URL || "";

// Upload an image file
const uploadImage = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await authService.authAxios.post(`${API_URL}/api/upload-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

// Save an external image to the gallery
const saveExternalImage = async (url, prompt, metadata) => {
  try {
    const response = await authService.authAxios.post(`${API_URL}/api/save-image`, {
      url,
      prompt,
      metadata
    });
    
    return response.data;
  } catch (error) {
    console.error('Error saving external image:', error);
    throw error;
  }
};

// Get user's saved images
const getUserImages = async () => {
  try {
    const response = await authService.authAxios.get(`${API_URL}/api/users/images`);
    return response.data;
  } catch (error) {
    console.error('Error getting user images:', error);
    throw error;
  }
};

// Delete an image from the gallery
const deleteImage = async (imageId) => {
  try {
    const response = await authService.authAxios.delete(`${API_URL}/api/users/images/${imageId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};

// Share an image to external platforms
const shareImage = async (imageId, platforms) => {
  try {
    const response = await authService.authAxios.post(`${API_URL}/api/users/share/${imageId}`, {
      platforms
    });
    return response.data;
  } catch (error) {
    console.error('Error sharing image:', error);
    throw error;
  }
};

// Copy an image URL to clipboard
const copyImageUrl = (url) => {
  navigator.clipboard.writeText(url)
    .then(() => true)
    .catch((error) => {
      console.error('Error copying to clipboard:', error);
      return false;
    });
};

// Generate a local URL for sharing
const getShareableUrl = (imageId) => {
  return `${window.location.origin}/share/${imageId}`;
};

const imageService = {
  uploadImage,
  saveExternalImage,
  getUserImages,
  deleteImage,
  shareImage,
  copyImageUrl,
  getShareableUrl
};

export default imageService;
