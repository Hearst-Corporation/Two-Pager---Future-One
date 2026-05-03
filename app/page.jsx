import Header from '@/components/landing/Header';
import Hero from '@/components/landing/Hero';
import SectionOpportunity from '@/components/landing/SectionOpportunity';
import SectionGallery from '@/components/landing/SectionGallery';
import SectionMethod from '@/components/landing/SectionMethod';
import SectionHub from '@/components/landing/SectionHub';
import SectionCampus from '@/components/landing/SectionCampus';
import SectionFinalCTA from '@/components/landing/SectionFinalCTA';
import Footer from '@/components/landing/Footer';

export default function Home() {
  return (
    <main>
      <Header />
      <Hero />
      <SectionOpportunity />
      <SectionGallery />
      <SectionMethod />
      <SectionHub />
      <SectionCampus />
      <SectionFinalCTA />
      <Footer />
    </main>
  );
}
