import { useEffect, useState } from "react";
import { Car } from "@/lib/cars";
import { resolveImage, resolveImageSync } from "@/lib/image";

export function CarImage({
  car,
  className,
  alt,
  loading = "lazy",
}: {
  car: Pick<Car, "cover_image" | "brand" | "model"> | { cover_image: string | null; brand?: string; model?: string };
  className?: string;
  alt?: string;
  loading?: "lazy" | "eager";
}) {
  const initial = resolveImageSync(car.cover_image);
  const [src, setSrc] = useState<string | null>(initial);

  useEffect(() => {
    if (!src) {
      resolveImage(car.cover_image).then(setSrc);
    }
  }, [car.cover_image, src]);

  if (!src) {
    return <div className={`${className ?? ""} bg-charcoal`} />;
  }

  return (
    <img
      src={src}
      alt={alt ?? (`${car.brand ?? ""} ${car.model ?? ""}`.trim() || "سيارة فاخرة")}
      className={className}
      loading={loading}
    />
  );
}
