import { Container } from "@/components/ui/container";
import { motion } from "framer-motion";

export function Blog() {
  return (
    <section id="blog" className="section">
      <Container maxWidth="5xl">
        <div className="text-center">
          <p className="section-subtitle">Recent Posts?</p>
          <h6 className="section-title mb-6">Blog</h6>
          
          <div className="blog-card">
            <div className="blog-card-header">
              <img src="/assets/imgs/img-1.webp" className="blog-card-img-1" alt="GIMTransfer company" />
            </div>
            <div className="blog-card-body">
              <a href="https://www.gimtransfer.com/" target="_blank" rel="noopener noreferrer">
                <h5 className="blog-card-title">GIMTransfer - Geometric Information Model</h5>
              </a>
              <p className="blog-card-caption">
                <a href="#">By: Mailo</a>
              </p>
              <p>
                GIMTransfer is a company that focuses on developing a new product for the CAD industry. 
                The company is developing a product that can compress files up to 200x while supporting 
                various CAD files such as STL, GLB, GLTF, CAD and more. GIMTransfer is a small company 
                with great potential and a spontaneous work atmosphere. The company focuses on innovation 
                and collaboration to provide the best solution for the CAD industry.
              </p>
              <p><b><strong>My thoughts on the company during my internship:</strong></b></p>
              <p>
                I found GIMTransfer to be a great company to work for due to several reasons. Firstly, 
                I enjoyed working on a product that offered a new solution for the CAD industry, with 
                the capability to compress files without loss of quality. This made my work interesting 
                and challenging. Secondly, the work atmosphere at GIMTransfer was spontaneous and fun. 
                The employees were always willing to help and collaborate. This made it easy to communicate 
                and work on projects, which made my experience at the company pleasant. In conclusion, 
                GIMTransfer was a great company to work for due to the interesting projects, spontaneous 
                work atmosphere, growth opportunities and focus on innovation and collaboration.
              </p>
            </div>
          </div>
          
          <div className="blog-card">
            <div className="blog-card-header">
              <img src="/assets/imgs/img-2.webp" className="blog-card-img-2" alt="GET company" />
            </div>
            <div className="blog-card-body">
              <h5 className="blog-card-title">GET - Gemini Embedded Technology</h5>
              <p className="blog-card-caption">
                <a href="#">By: Mailo</a>
              </p>
              <p>
                Gemini Embedded Technology is a company that focuses on the development of embedded devices. 
                The company develops products and improves them so that they are energy-efficient and can 
                contribute to a more sustainable future. This company has a lot of potential in the growing 
                market of sustainable technology and can become an important player in the future development 
                of embedded devices.
              </p>
              <p><b><strong>My thoughts on the company during my internship:</strong></b></p>
              <p>
                Working at Gemini Embedded Technology was a valuable experience for me. The company's focus 
                on sustainable technology aligned with my personal values, and I appreciated being part of 
                a team that was committed to making a positive impact. The technical challenges I faced 
                were stimulating, and I had the opportunity to work with cutting-edge embedded systems. 
                The supportive environment and mentorship I received significantly enhanced my skills in 
                this specialized field. Overall, my internship at GET provided me with practical experience 
                and insights into the rapidly growing sustainable technology sector.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}