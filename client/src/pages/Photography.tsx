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
}

export default function Photography() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  // Categories for the filter
  const categories = ["all", "urban", "nature", "people"];

  // Fetch photos using React Query
  const { data: photos = [], isError, isLoading } = useQuery({
    queryKey: ['photos', activeFilter],
    queryFn: async () => {
      const endpoint = activeFilter === 'all' 
        ? '/api/photos' 
        : `/api/photos?category=${activeFilter}`;
        
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
              className="flex justify-center mb-10 flex-wrap gap-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveFilter(category)}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeFilter === category
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </motion.div>

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
                    {activeFilter !== "all" 
                      ? `No images found in the ${activeFilter} category. Try selecting a different category.`
                      : "No images found. Add some images to your photography folders to get started."
                    }
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
                    className="overflow-hidden rounded-lg shadow-md cursor-pointer h-64 md:h-80"
                    onClick={() => openPhotoModal(photo)}
                    whileHover={{ 
                      scale: 1.03,
                      transition: { duration: 0.3 } 
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <img
                      src={photo.url}
                      alt={photo.title}
                      className="w-full h-full object-cover transition-transform duration-500"
                      onError={(e) => {
                        // If image fails to load, replace with placeholder
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
                      }}
                    />
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
              <img 
                src={selectedPhoto.url} 
                alt={selectedPhoto.title} 
                className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
              />
              <button
                onClick={closePhotoModal}
                className="absolute top-4 right-4 bg-black/50 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                aria-label="Close"
              >
                <span className="text-2xl">&times;</span>
              </button>
              <div className="bg-white p-4 absolute bottom-0 left-0 right-0 bg-opacity-90 backdrop-blur-sm">
                <h3 className="font-bold text-lg">{selectedPhoto.title}</h3>
                <p className="text-gray-600">Category: {selectedPhoto.category.charAt(0).toUpperCase() + selectedPhoto.category.slice(1)}</p>
              </div>
            </motion.div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}