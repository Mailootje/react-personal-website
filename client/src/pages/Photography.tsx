import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container } from "@/components/ui/container";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface Photo {
  id: string;
  url: string;
  title: string;
  category: string;
  subcategory: string | null;
}

// Function to get a proxied image URL
function getProxiedImageUrl(originalUrl: string): string {
  return `/api/image-proxy?url=${encodeURIComponent(originalUrl)}`;
}

export default function Photography() {
  const [activeCategory, setActiveCategory] = useState("root");
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  // Categories for the filter (now using countries)
  const categories = ["root", "Belgium", "Germany", "Netherlands", "Spain"];
  
  // Category display names
  const categoryDisplayNames = {
    "root": "Featured",
    "Belgium": "Belgium",
    "Germany": "Germany",
    "Netherlands": "Netherlands",
    "Spain": "Spain"
  };

  // Change category and reset subcategory
  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setActiveSubcategory(null);
  };

  // Fetch subcategories for the selected category
  const { data: subcategories = [], isLoading: isLoadingSubcategories } = useQuery({
    queryKey: ['subcategories', activeCategory],
    queryFn: async () => {
      // Don't fetch subcategories for the root category
      if (activeCategory === "root") return [];
      
      const endpoint = `/api/photos/subcategories?category=${activeCategory}`;
      return apiRequest<string[]>(endpoint);
    },
    enabled: activeCategory !== "root" // Only run this query if not in root category
  });

  // Fetch photos using React Query
  const { data: photos = [], isError, isLoading } = useQuery({
    queryKey: ['photos', activeCategory, activeSubcategory],
    queryFn: async () => {
      let endpoint = `/api/photos?category=${activeCategory}`;
      if (activeSubcategory) {
        endpoint += `&subcategory=${activeSubcategory}`;
      }
      return apiRequest<Photo[]>(endpoint);
    }
  });

  const openPhotoModal = (photo: Photo) => {
    setSelectedPhoto(photo);
    document.body.style.overflow = "hidden"; // Prevent scrolling when modal is open
  };

  const closePhotoModal = () => {
    setSelectedPhoto(null);
    document.body.style.overflow = "auto"; // Re-enable scrolling
  };

  useEffect(() => {
    // Add escape key listener to close modal
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closePhotoModal();
      }
    };
    window.addEventListener('keydown', handleEsc);
    
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = "auto"; // Ensure scrolling is restored when component unmounts
    };
  }, []);

  return (
    <div className="font-sans bg-background text-foreground">
      <Header />
      <main>
        <section className="py-20 px-6">
          <Container maxWidth="6xl">
            <motion.div 
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Photography</h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                A collection of my favorite photographic moments, capturing the beauty in everyday life and extraordinary places.
              </p>
            </motion.div>

            <motion.div 
              className="flex justify-center mb-6 flex-wrap gap-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeCategory === category
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {categoryDisplayNames[category as keyof typeof categoryDisplayNames]}
                </button>
              ))}
            </motion.div>
            
            {/* Subcategory Filter - Only shown when activeCategory is not root and subcategories are available */}
            {activeCategory !== "root" && subcategories.length > 0 && (
              <motion.div 
                className="flex justify-center mb-10 flex-wrap gap-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <button
                  onClick={() => setActiveSubcategory(null)}
                  className={`px-4 py-1 rounded-full text-xs font-medium transition-colors ${
                    activeSubcategory === null
                      ? "bg-primary/80 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  All
                </button>
                {subcategories.map((subcategory) => (
                  <button
                    key={subcategory}
                    onClick={() => setActiveSubcategory(subcategory)}
                    className={`px-4 py-1 rounded-full text-xs font-medium transition-colors ${
                      activeSubcategory === subcategory
                        ? "bg-primary/80 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {subcategory}
                  </button>
                ))}
              </motion.div>
            )}
            
            {/* Loading indicator for subcategories */}
            {activeCategory !== "root" && isLoadingSubcategories && subcategories.length === 0 && (
              <div className="flex justify-center mb-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            )}

            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  <p className="mt-4 text-muted-foreground">Loading images...</p>
                </div>
              </div>
            ) : isError ? (
              <div className="flex justify-center py-12">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                  <p className="font-bold">Error</p>
                  <p>There was an error loading the images. Please check if the image folders exist or try again later.</p>
                </div>
              </div>
            ) : photos.length === 0 ? (
              <div className="flex justify-center py-12">
                <div className="text-center">
                  <p className="text-xl mb-2">No images found</p>
                  <p className="text-muted-foreground">
                    {`No images found in the ${categoryDisplayNames[activeCategory as keyof typeof categoryDisplayNames]} category. Try selecting a different category.`}
                  </p>
                </div>
              </div>
            ) : (
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {photos.map((photo) => (
                  <motion.div
                    key={photo.id}
                    className="overflow-hidden rounded-lg shadow-md cursor-pointer flex flex-col"
                    onClick={() => openPhotoModal(photo)}
                    whileHover={{ 
                      scale: 1.03,
                      transition: { duration: 0.3 } 
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="h-56 md:h-64 overflow-hidden">
                      <img
                        src={getProxiedImageUrl(photo.url)}
                        alt={photo.title}
                        className="w-full h-full object-cover transition-transform duration-500"
                        onError={(e) => {
                          console.error(`Failed to load image: ${photo.url}`);
                          // If image fails to load, replace with placeholder
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Image+Not+Available';
                          // Add a class to indicate error
                          (e.target as HTMLImageElement).classList.add('image-error');
                        }}
                        crossOrigin="anonymous"
                      />
                    </div>
                    <div className="p-3 bg-white">
                      <h3 className="font-medium text-sm truncate">{photo.title}</h3>
                      <p className="text-xs text-gray-500 truncate">{photo.category}{photo.subcategory && ` • ${photo.subcategory}`}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </Container>
        </section>

        {/* Photo Modal */}
        {selectedPhoto && (
          <div 
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={closePhotoModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="relative max-w-5xl max-h-[90vh] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col bg-white rounded-lg overflow-hidden">
                <img 
                  src={getProxiedImageUrl(selectedPhoto.url)} 
                  alt={selectedPhoto.title} 
                  className="w-full h-auto max-h-[80vh] object-contain"
                  onError={(e) => {
                    console.error(`Failed to load modal image: ${selectedPhoto.url}`);
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x600?text=Image+Not+Available';
                  }}
                  crossOrigin="anonymous"
                />
                <div className="p-4 bg-white">
                  <h3 className="font-bold text-lg">{selectedPhoto.title}</h3>
                  <div className="flex flex-wrap gap-2 text-gray-600 text-sm mt-1">
                    <span>Category: {categoryDisplayNames[selectedPhoto.category as keyof typeof categoryDisplayNames] || selectedPhoto.category}</span>
                    {selectedPhoto.subcategory && (
                      <span className="flex items-center">
                        <span className="mx-2 text-gray-400">•</span>
                        <span>Location: {selectedPhoto.subcategory}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={closePhotoModal}
                className="absolute top-4 right-4 bg-black/50 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                aria-label="Close"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </motion.div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}