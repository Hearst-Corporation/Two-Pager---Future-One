import styles from '../hearst.module.css';

function joinClasses(...values) {
  return values.filter(Boolean).join(' ');
}

function resolveBodyClass(variant) {
  switch (variant) {
    case 'instrument':
      return styles.cockpitBody;
    case 'data':
    case 'editorial':
      return joinClasses(styles.cockpitBodyFlow, styles.cockpitBodyContent);
    case 'home':
    default:
      return styles.cockpitBodyFlow;
  }
}

export default function HearstPageShell({
  eyebrow,
  title,
  context,
  variant = 'editorial',
  bodyClassName,
  headerClassName,
  bodyAriaLive,
  bodyAriaBusy,
  children,
}) {
  const isInstrument = variant === 'instrument';

  return (
    <main
      className={joinClasses(
        styles.cockpitFrame,
        isInstrument && styles.cockpitFrameLocked,
      )}
    >
      <header
        className={joinClasses(
          styles.pageHead,
          variant === 'home' && styles.pageHeadHome,
          isInstrument && styles.pageHeadInstrument,
          headerClassName,
        )}
      >
        {eyebrow ? <div className={styles.pageEyebrow}>{eyebrow}</div> : null}
        <h1 className={styles.pageTitle}>{title}</h1>
        {context ? <p className={styles.pageContext}>{context}</p> : null}
      </header>

      <div
        className={joinClasses(resolveBodyClass(variant), bodyClassName)}
        aria-live={bodyAriaLive}
        aria-busy={bodyAriaBusy}
      >
        {children}
      </div>
    </main>
  );
}
