import Image from "next/image";

export function AppLogo({ size = 40 }: { size?: number }) {
  return (
    <Image
      src="/nemo-logo.png"
      alt="Nemo Care"
      width={size}
      height={size}
      className="object-contain"
      priority
    />
  );
}
