import { Container } from "@/components/ui/container";
import { navigationItems, socialLinks, contactInfo } from "@/lib/data";
import { scrollToElement } from "@/lib/utils";

export function Footer() {
  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    e.preventDefault();
    const elementId = href.replace("#", "");
    scrollToElement(elementId);
  };

  return (
    <footer className="bg-[#111827] text-white py-12 px-6">
      <Container maxWidth="6xl">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <a
              href="#hero"
              className="text-2xl font-bold text-white flex items-center space-x-2 mb-4"
              onClick={(e) => handleNavClick(e, "#hero")}
            >
              <span className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-primary">
                <img 
                  src="/assets/images/profile/profile-photo.webp" 
                  alt="Mailo Bedo" 
                  className="w-full h-full object-cover"
                />
              </span>
              <span>Mailo Bedo</span>
            </a>
            <p className="text-gray-400 mb-6 max-w-md">
              A passionate Full Stack Developer specializing in creating elegant
              solutions with modern web technologies. Let's work together to
              bring your ideas to life.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors"
                  aria-label={link.name}
                >
                  <i className={`${link.icon} text-lg`}></i>
                </a>
              ))}
            </div>
          </div>

          <div>
            <h6 className="text-lg font-bold mb-4">Quick Links</h6>
            <ul className="space-y-2">
              {navigationItems.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className="text-gray-400 hover:text-white transition-colors"
                    onClick={(e) => handleNavClick(e, item.href)}
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h6 className="text-lg font-bold mb-4">Contact Info</h6>
            <ul className="space-y-3">
              <li className="flex items-start">
                <i className="ri-map-pin-2-line text-primary mt-1 mr-3"></i>
                <span className="text-gray-400">{contactInfo.location}</span>
              </li>
              <li className="flex items-start">
                <i className="ri-mail-line text-primary mt-1 mr-3"></i>
                <span className="text-gray-400">{contactInfo.email}</span>
              </li>
              <li className="flex items-start">
                <i className="ri-phone-line text-primary mt-1 mr-3"></i>
                <span className="text-gray-400">{contactInfo.phone}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Mailo Bedo. All rights reserved.
            </p>
            <p className="text-gray-400 text-sm mt-2 md:mt-0">
              Designed & Built with <span className="text-red-500">❤</span>
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-purple-900/40 to-cyan-900/40 rounded-lg p-4 mt-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div>
                <h3 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-cyan-400 inline-block text-transparent bg-clip-text">Animated Experience</h3>
                <p className="text-gray-400 text-sm">Check out our special animated scrolling experience</p>
              </div>
              <div className="flex gap-3">
                <a href="/experience" className="text-white text-sm bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 px-4 py-2 rounded-md transition-colors">
                  Try it Now
                </a>
                <a href="/animation-guide" className="text-white text-sm bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-md transition-colors">
                  Learn More
                </a>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}
