import styles from '../hearst.module.css';

export default function HearstPageShell({ eyebrow, title, context, children }) {
  return (
    <>
      <header className={styles.pageHead}>
        {eyebrow && <div className={styles.eyebrow}>{eyebrow}</div>}
        <h1 className={styles.title}>{title}</h1>
        {context && <p className={styles.context}>{context}</p>}
      </header>
      {children}
    </>
  );
}
