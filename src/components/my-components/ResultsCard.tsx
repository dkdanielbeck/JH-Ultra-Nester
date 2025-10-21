import type { NestingParent, NestingResults } from "@/lib/types";
import { formatEuropeanFloat } from "@/lib/utils";

interface ResultsCardProps {
  language: string;
  endResults: NestingResults;
}

export default function ResultsCard({
  language,
  endResults,
}: ResultsCardProps) {
  function formatResultsLine(item: NestingParent, index: number) {
    const noPrice =
      !item.weight || item.weight === 0 || !item.price || item.price === 0
        ? true
        : false;

    const calculatedPrice = item.count * (item.price * item.weight);
    const calculatedPriceFixed = calculatedPrice.toFixed(2);
    return (
      <li className="flex" key={index}>
        <p>
          <li>
            {" "}
            <strong>{item.count}</strong>{" "}
            <em>
              {item.name} ({item.size} mm)
            </em>
            {!noPrice && (
              <>
                {" = "}
                <strong>
                  {formatEuropeanFloat(parseFloat(calculatedPriceFixed))} kr.
                </strong>
              </>
            )}
          </li>
        </p>
      </li>
    );
  }

  function getTotalPrice(nestingParent: NestingParent[]) {
    const totalPrice = nestingParent.reduce((sum, item) => {
      return sum + item.count * ((item.price ?? 0) * (item.weight ?? 0));
    }, 0);

    return totalPrice === 0 ? (
      <></>
    ) : (
      <p className="mt-2 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
        Total:{" "}
        <strong>
          {formatEuropeanFloat(parseFloat(totalPrice.toFixed(2)))} kr.
        </strong>
      </p>
    );
  }

  return (
    <>
      <h2 className="text-xl font-semibold mb-2 pl-4 mt-4">
        {language === "da" ? "Resultat" : "Result"}
      </h2>
      <div
        style={{ borderRadius: "10px" }}
        className="p-4 bg-muted text-xs sm:text-base"
      >
        <ul className="list-disc list-inside space-y-1">
          {endResults.nestingParent.map((parent, index) =>
            formatResultsLine(parent, index)
          )}
        </ul>
        {getTotalPrice(endResults.nestingParent)}
      </div>
    </>
  );
}
