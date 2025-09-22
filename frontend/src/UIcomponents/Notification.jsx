export default function Notification({ type = 'info', children }) {
  const style = type === 'error' ? 'error' : 'note';
  return <div className={style}>{children}</div>;
}


