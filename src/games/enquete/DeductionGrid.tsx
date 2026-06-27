export type Mark = '' | 'yes' | 'no';

export function cycleMark(m: Mark): Mark {
  return m === '' ? 'no' : m === 'no' ? 'yes' : '';
}

/**
 * A suspect × value deduction grid (the player's notepad). Cells cycle
 * empty → ✗ → ✓ on click. This is the core "prise de notes / élimination
 * progressive / marquage des liens" surface.
 */
export function DeductionGrid({
  caption,
  rows,
  cols,
  marks,
  onToggle,
  highlightCol,
}: {
  caption: string;
  rows: string[];
  cols: string[];
  marks: Record<string, Mark>;
  onToggle: (rowIdx: number, colIdx: number) => void;
  highlightCol?: number;
}) {
  return (
    <div className="card" style={{ overflowX: 'auto', padding: 14 }}>
      <div className="row-between" style={{ marginBottom: 8 }}>
        <strong>{caption}</strong>
        <span className="faint">Clic : ✗ → ✓ → vide</span>
      </div>
      <table className="table" style={{ minWidth: 420 }}>
        <thead>
          <tr>
            <th />
            {cols.map((c, i) => (
              <th
                key={c}
                style={{
                  textAlign: 'center',
                  background:
                    highlightCol === i
                      ? 'color-mix(in srgb, var(--accent) 18%, transparent)'
                      : undefined,
                }}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={r}>
              <td style={{ fontWeight: 600 }}>{r}</td>
              {cols.map((c, ci) => {
                const mark = marks[`${ri}-${ci}`] ?? '';
                return (
                  <td key={c} style={{ textAlign: 'center', padding: 4 }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      aria-label={`${r} / ${c} : ${
                        mark === 'yes' ? 'oui' : mark === 'no' ? 'non' : 'indéterminé'
                      }`}
                      style={{
                        width: 38,
                        height: 38,
                        padding: 0,
                        fontSize: '1.1rem',
                        color:
                          mark === 'yes'
                            ? 'var(--success)'
                            : mark === 'no'
                            ? 'var(--danger)'
                            : 'var(--text-faint)',
                      }}
                      onClick={() => onToggle(ri, ci)}
                    >
                      {mark === 'yes' ? '✓' : mark === 'no' ? '✗' : '·'}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
