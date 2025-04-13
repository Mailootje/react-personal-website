import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container } from "@/components/ui/container";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface Photo {
  id: number;
  url: string;
  title: string;
  category: string;
}

export default function Photography() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [photos, setPhotos] = useState<Photo[]>([
    {
      id: 1,
      url: "https://images.unsplash.com/photo-1682686580433-2af05ee670ad?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3",
      title: "Urban Scene",
      category: "urban",
    },
    {
      id: 2,
      url: "https://images.unsplash.com/photo-1682687220923-c58b9a4592ea?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3",
      title: "Mountain View",
      category: "nature",
    },
    {
      id: 3,
      url: "https://images.unsplash.com/photo-1682687220945-616c768269f9?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3",
      title: "Portrait",
      category: "people",
    },
    {
      id: 4,
      url: "https://images.unsplash.com/photo-1682687220208-22d7a2543e88?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3",
      title: "City Lights",
      category: "urban",
    },
    {
      id: 5,
      url: "https://images.unsplash.com/photo-1695653420507-b1b4cdd3e272?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3",
      title: "Ocean View",
      category: "nature",
    },
    {
      id: 6,
      url: "https://images.unsplash.com/photo-1682687220199-76c6e2a71bd7?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3",
      title: "Street Life",
      category: "people",
    },
    {
      id: 7,
      url: "https://images.unsplash.com/photo-1711282493063-e29ab9850c24?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3",
      title: "Architectural Details",
      category: "urban",
    },
    {
      id: 8,
      url: "https://images.unsplash.com/photo-1695653244652-26494a57775e?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3",
      title: "Sunset",
      category: "nature",
    },
    {
      id: 9,
      url: "https://images.unsplash.com/photo-1682687220945-616c768269f9?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3",
      title: "Travel Portraits",
      category: "people",
    },
  ]);
  const [filteredPhotos, setFilteredPhotos] = useState<Photo[]>(photos);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  // Categories for the filter
  const categories = ["all", "urban", "nature", "people"];

  useEffect(() => {
    if (activeFilter === "all") {
      setFilteredPhotos(photos);
    } else {
      setFilteredPhotos(photos.filter(photo => photo.category === activeFilter));
    }
  }, [activeFilter, photos]);

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

            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {filteredPhotos.map((photo) => (
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
                  />
                </motion.div>
              ))}
            </motion.div>
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