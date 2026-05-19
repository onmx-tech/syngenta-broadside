import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  rounded?: string;
};

export function BrownCard({ children, className = "", rounded = "rounded-[18px]" }: Props) {
  return (
    <div className={`relative overflow-hidden ${rounded} ${className}`}>
      <div className={`absolute inset-0 bg-[#887e31] ${rounded}`} />
      <div
        className={`absolute inset-0 mix-blend-overlay ${rounded}`}
        style={{
          backgroundImage:
            "radial-gradient(circle at center, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0) 70%)",
        }}
      />
      <div className={`absolute inset-0 bg-[#765827] ${rounded}`} />
      <div
        className={`absolute inset-0 mix-blend-overlay ${rounded}`}
        style={{
          backgroundImage:
            "linear-gradient(132deg, rgba(255,255,255,0.24) 55%, rgba(0,0,0,0.24) 88%)",
        }}
      />
      <div
        className={`absolute inset-0 mix-blend-overlay ${rounded}`}
        style={{
          backgroundImage:
            "linear-gradient(-78deg, rgba(255,255,255,0.15) 35%, rgba(0,0,0,0.15) 82%)",
        }}
      />
      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  );
}
