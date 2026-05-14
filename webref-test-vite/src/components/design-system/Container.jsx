export default function Container({ children, className = "" }) {
  return (
    <div
      className={`mx-auto w-full max-w-[1500px] px-6 md:px-10 lg:px-14 ${className}`}
    >
      {children}
    </div>
  );
}
