import Image from "next/image";

/**
 * Universal musical poster with emoji fallback.
 *
 * Supports two modes:
 *  - **fill** (default): parent must be position:relative with defined dimensions.
 *  - **fixed**: renders at an explicit width/height.
 */

interface PosterImageBaseProps {
  src: string | null | undefined;
  alt: string;
  /** Border radius in px (default 8) */
  borderRadius?: number;
}

interface FillProps extends PosterImageBaseProps {
  mode?: "fill";
  sizes?: string;
}

interface FixedProps extends PosterImageBaseProps {
  mode: "fixed";
  width: number;
  height: number;
}

type PosterImageProps = FillProps | FixedProps;

export default function PosterImage(props: PosterImageProps) {
  const { src, alt, borderRadius = 8 } = props;

  if (!src) {
    return <span className="poster-emoji">🎭</span>;
  }

  if (props.mode === "fixed") {
    return (
      <Image
        src={src}
        alt={alt}
        width={props.width}
        height={props.height}
        style={{ objectFit: "cover", borderRadius }}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={props.sizes ?? "140px"}
      style={{ objectFit: "cover" }}
    />
  );
}
