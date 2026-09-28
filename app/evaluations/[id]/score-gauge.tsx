import { scoreBand } from "@/scoring/bands";

const ARC =
  "M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831";

export function ScoreGauge({
  score,
  size = 104,
}: {
  score: number | null;
  size?: number;
}) {
  const percent =
    score === null ? 0 : Math.max(0, Math.min(100, score * 10));
  const band = scoreBand(score);

  return (
    <div className="gauge-wrap" style={{ width: size, height: size }}>
      <svg viewBox="0 0 36 36" className="gauge">
        <path className="gauge-track" d={ARC} fill="none" strokeWidth="3" />
        <path
          className={`gauge-value ${band?.className ?? ""}`}
          d={ARC}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${percent}, 100`}
        />
      </svg>
      <div className="gauge-center">
        <span className={`gauge-number ${band?.className ?? ""}`}>
          {score === null ? "—" : score.toFixed(1)}
        </span>
      </div>
    </div>
  );
}
