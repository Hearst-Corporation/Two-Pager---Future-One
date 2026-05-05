import Header from '@/components/landing/Header';
import Hero from '@/components/landing/Hero';
import SectionOpportunity from '@/components/landing/SectionOpportunity';
import SectionHub from '@/components/landing/SectionHub';
import SectionPartners from '@/components/landing/SectionPartners';
import SectionLife from '@/components/landing/SectionLife';
import SectionMethod from '@/components/landing/SectionMethod';
import SectionCampus from '@/components/landing/SectionCampus';
import SectionFinalCTA from '@/components/landing/SectionFinalCTA';
import Footer from '@/components/landing/Footer';
import CustomCursor from '@/components/landing/CustomCursor';

export default function Home() {
  return (
    <>
      <CustomCursor />
      <Header />
      <main>
        <Hero />
        <SectionOpportunity />
        <SectionHub />
        <SectionPartners />
        <SectionLife />
        <SectionMethod />
        <SectionCampus />
        <SectionFinalCTA />
        <Footer />
      </main>
    </>
  );
}
