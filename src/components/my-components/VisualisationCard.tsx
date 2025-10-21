import type { ParentLayout } from "@/lib/types";

interface VisualisationCardProps {
  layout: ParentLayout;
  scaleFactor: number;
  isLength?: boolean;
}

export default function VisualisationCard({
  layout,
  scaleFactor,
  isLength,
}: VisualisationCardProps) {
  const width = layout.width * scaleFactor;
  const height = layout.length * scaleFactor;
  const stroke = 4;
  const inset = stroke / 2;

  const getText = () => {
    if (isLength) {
      return `${layout.parentName} ${layout.parentSize.slice(0, -4)} mm`;
    } else {
      return `${layout.parentName} ${layout.parentSize} mm`;
    }
  };
  return (
    <div className="mb-4">
      <h3 className="text-lg font-semibold mb-2">{getText()}</h3>
      <svg
        className="sheet mx-auto"
        width={width}
        height={height}
        viewBox={`0 0 ${layout.width} ${layout.length}`}
      >
        {layout.rectangles.map((rectangle, idx) => (
          <rect
            key={idx}
            x={rectangle.x + inset}
            y={rectangle.y + inset}
            width={
              (rectangle.rotated ? rectangle.length : rectangle.width) - stroke
            }
            height={
              (rectangle.rotated ? rectangle.width : rectangle.length) - stroke
            }
            fill="#009eba"
            stroke="#0F47A1"
            strokeWidth={stroke}
          />
        ))}
      </svg>
    </div>
  );
}
