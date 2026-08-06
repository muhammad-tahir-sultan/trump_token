import Image from "next/image";

type DogecoinLogoProps = {
  size?: number;
};

export function DogecoinLogo({ size = 44 }: DogecoinLogoProps) {
  return (
    <Image
      alt="Dogecoin"
      className="rounded-full object-cover"
      height={size}
      priority
      src="/dogecoin-logo.png"
      width={size}
    />
  );
}
