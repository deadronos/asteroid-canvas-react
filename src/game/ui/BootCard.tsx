export default function BootCard({ title, message }: { title: string; message: string }) {
  return (
    <div className="boot-overlay">
      <div className="boot-card">
        <h1>{title}</h1>
        <p>{message}</p>
      </div>
    </div>
  );
}