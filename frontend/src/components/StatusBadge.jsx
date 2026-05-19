import { statusClass } from "../utils";

export function StatusBadge({ status }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusClass(status)}`}>
      {status}
    </span>
  );
}
