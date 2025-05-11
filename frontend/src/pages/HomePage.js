  const handleImageSelect = (image) => {
    setSelectedImage(image);
    
    // Store selected image in sessionStorage for cross-page access
    sessionStorage.setItem('selectedImage', JSON.stringify(image));
    if (image.prompt) {
      sessionStorage.setItem('imagePrompt', image.prompt);
    }
  };