import './presentation-tokens.css';

export default function PresentationLayout({ children }) {
  return (
    <div
      className="presentation-scope"
      style={{ minHeight: '100vh', background: '#1A1D24' }}
    >
      {children}
    </div>
  );
}
