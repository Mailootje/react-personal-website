import { Container } from "@/components/ui/container";

export function Hero() {
  return (
    <header id="home" className="header">
      <div className="overlay"></div>
      <div className="header-content container">
        <h1 className="header-title">
          <div className="up">
            <span className="js-animate-element js-animate-fast-out">H</span>
            <span className="js-animate-element js-animate-fast-out">i</span>
            <span className="js-animate-element js-animate-fast-out">!</span>
          </div>
          <div className="down">
            <span className="js-animate-element js-animate-fast-out">I</span>
            <span className="js-animate-element js-animate-fast-out">'</span>
            <span className="js-animate-element js-animate-fast-out">m</span>
            <span className="js-animate-element js-animate-fast-out"> </span>
            <span className="js-animate-element js-animate-fast-out">M</span>
            <span className="js-animate-element js-animate-fast-out">a</span>
            <span className="js-animate-element js-animate-fast-out">i</span>
            <span className="js-animate-element js-animate-fast-out">l</span>
            <span className="js-animate-element js-animate-fast-out">o</span>
          </div>
          <div className="header-subtitle">
            <span className="js-animate-element js-animate-fast-out">S</span>
            <span className="js-animate-element js-animate-fast-out">O</span>
            <span className="js-animate-element js-animate-fast-out">F</span>
            <span className="js-animate-element js-animate-fast-out">T</span>
            <span className="js-animate-element js-animate-fast-out">W</span>
            <span className="js-animate-element js-animate-fast-out">A</span>
            <span className="js-animate-element js-animate-fast-out">R</span>
            <span className="js-animate-element js-animate-fast-out">E</span>
          </div>
          <div className="header-subtitle">
            <span className="js-animate-element js-animate-fast-out">D</span>
            <span className="js-animate-element js-animate-fast-out">E</span>
            <span className="js-animate-element js-animate-fast-out">V</span>
            <span className="js-animate-element js-animate-fast-out">E</span>
            <span className="js-animate-element js-animate-fast-out">L</span>
            <span className="js-animate-element js-animate-fast-out">O</span>
            <span className="js-animate-element js-animate-fast-out">P</span>
            <span className="js-animate-element js-animate-fast-out">E</span>
            <span className="js-animate-element js-animate-fast-out">R</span>
          </div>
        </h1>
      </div>
    </header>
  );
}
