import { useIsMobile } from '../hooks/useIsMobile';

interface ContentSectionProps {
  heading: string;
  subheading: string;
  cardTitle: string;
  body: string;
}

const ContentSection: React.FC<ContentSectionProps> = ({ heading, subheading, cardTitle, body }) => {
  const isMobile = useIsMobile();

  return (
    <section style={{
      width: '100%',
      maxWidth: 1200,
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      padding: isMobile ? '40px 20px' : 64,
      gap: isMobile ? 32 : 48,
      background: '#F0F1F5',
      boxSizing: 'border-box',
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 8,
      }}>
        <h2 style={{
          fontSize: isMobile ? 20 : 24,
          fontWeight: 600,
          lineHeight: 1.2,
          letterSpacing: '-0.02em',
          color: '#1E1E1E',
          margin: 0,
        }}>
          {heading}
        </h2>
        <p style={{
          fontSize: isMobile ? 16 : 20,
          fontWeight: 400,
          lineHeight: 1.2,
          color: '#757575',
          margin: 0,
        }}>
          {subheading}
        </p>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 8,
        width: '100%',
      }}>
        <h3 style={{
          fontSize: isMobile ? 18 : 24,
          fontWeight: 600,
          lineHeight: 1.2,
          letterSpacing: '-0.02em',
          color: '#1E1E1E',
          margin: 0,
        }}>
          {cardTitle}
        </h3>
        <p style={{
          fontSize: 16,
          fontWeight: 400,
          lineHeight: 1.4,
          color: '#757575',
          margin: 0,
        }}>
          {body}
        </p>
      </div>
    </section>
  );
};

export default ContentSection;
