import Header from "./components/Header.jsx";
import Hero from "./components/Hero.jsx";
import Projects from "./components/Projects.jsx";
import Featured from "./components/Featured.jsx";
import Stack from "./components/Stack.jsx";
import Experience from "./components/Experience.jsx";
import Contact from "./components/Contact.jsx";
import Footer from "./components/Footer.jsx";
import { useReveal } from "./hooks/useReveal.js";

export default function App() {
  useReveal();
  return (
    <>
      <Header />
      <Hero />
      <Projects />
      <Featured />
      <Stack />
      <Experience />
      <Contact />
      <Footer />
    </>
  );
}
