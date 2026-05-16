import { useState, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const fmt = (n) => {
  if (n >= 1_000_000) return `£${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 2)}M`;
  if (n >= 1_000) return `£${Math.round(n / 1_000)}K`;
  return `£${Math.round(n)}`;
};

const fmtTime = (months) => {
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0) return `${m}m`;
  if (m === 0) return `${y}y`;
  return `${y}y ${m}m`;
};

const MILESTONES = [
  { value: 10_000, icon: "🌱", label: "£10K" },
  { value: 50_000, icon: "🔥", label: "£50K" },
  { value: 100_000, icon: "💼", label: "£100K" },
  { value: 250_000, icon: "🏠", label: "£250K" },
  { value: 500_000, icon: "🚀", label: "£500K" },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 14px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
        <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 2 }}>{label}</p>
        <p style={{ fontSize: 14, fontWeight: 700, color: "#1d4ed8" }}>{fmt(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

export default function ProfitCalculator() {
  const [mode, setMode] = useState("fixed"); // "fixed" | "compound"
  const [monthlyProfit, setMonthlyProfit] = useState(2000);
  const [taxRate, setTaxRate] = useState(20);
  const [target, setTarget] = useState(1_000_000);
  const [compoundRate, setCompoundRate] = useState(5); // % monthly growth for compound mode

  const calc = useMemo(() => {
    const tax = taxRate / 100;
    const netMonthly = monthlyProfit * (1 - tax);

    if (mode === "fixed") {
      if (netMonthly <= 0) return null;
      const monthsToTarget = Math.ceil(target / netMonthly);
      const totalEarned = monthlyProfit * monthsToTarget;
      const totalTax = totalEarned - netMonthly * monthsToTarget;

      // Chart data — sample ~20 points
      const step = Math.max(1, Math.floor(monthsToTarget / 20));
      const chartData = [];
      for (let m = step; m <= monthsToTarget; m += step) {
        chartData.push({ month: `Mo ${m}`, cumulative: Math.min(netMonthly * m, target) });
      }
      if (chartData[chartData.length - 1]?.month !== `Mo ${monthsToTarget}`) {
        chartData.push({ month: `Mo ${monthsToTarget}`, cumulative: target });
      }

      // Milestones
      const milestones = MILESTONES.map(ms => ({
        ...ms,
        months: ms.value <= target ? Math.ceil(ms.value / netMonthly) : null,
      }));

      return { monthsToTarget, totalEarned, totalTax, netMonthly, chartData, milestones };
    } else {
      // Compound mode: monthly profit reinvested, growing at compoundRate%/month
      const rate = compoundRate / 100;
      let cumulative = 0;
      let month = 0;
      const chartData = [];
      const milestoneHits = {};
      let totalGross = 0;

      while (cumulative < target && month < 10000) {
        month++;
        const grossThisMonth = monthlyProfit * Math.pow(1 + rate, month - 1);
        const netThisMonth = grossThisMonth * (1 - tax);
        totalGross += grossThisMonth;
        cumulative += netThisMonth;

        MILESTONES.forEach(ms => {
          if (!milestoneHits[ms.value] && cumulative >= ms.value) {
            milestoneHits[ms.value] = month;
          }
        });

        if (month % Math.max(1, Math.floor(month / 20)) === 0 || month === 1) {
          chartData.push({ month: `Mo ${month}`, cumulative: Math.min(cumulative, target) });
        }
      }

      const milestones = MILESTONES.map(ms => ({
        ...ms,
        months: milestoneHits[ms.value] || null,
      }));

      return {
        monthsToTarget: month,
        totalEarned: totalGross,
        totalTax: totalGross - (totalGross * (1 - tax)),
        netMonthly,
        chartData,
        milestones,
      };
    }
  }, [mode, monthlyProfit, taxRate, target, compoundRate]);

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    border: "1.5px solid #e5e7eb",
    borderRadius: 8,
    fontSize: 16,
    color: "#111827",
    outline: "none",
    fontFamily: "inherit",
    transition: "border-color 0.2s",
  };

  const tabStyle = (active) => ({
    flex: 1,
    padding: "9px 0",
    border: active ? "none" : "none",
    borderRadius: 8,
    background: active ? "#fff" : "transparent",
    color: active ? "#111827" : "#6b7280",
    fontWeight: active ? 600 : 500,
    fontSize: 14,
    cursor: "pointer",
    boxShadow: active ? "0 1px 4px rgba(0,0,0,0.12)" : "none",
    transition: "all 0.2s",
    fontFamily: "inherit",
  });

  return (
    <div style={{
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      background: "#f9fafb",
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      padding: "24px 16px",
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 16,
        padding: 24,
        width: "100%",
        maxWidth: 480,
        boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}>

        {/* Mode Toggle */}
        <div>
          <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 8, fontWeight: 500 }}>Calculation mode</p>
          <div style={{
            display: "flex",
            background: "#f3f4f6",
            borderRadius: 10,
            padding: 4,
            gap: 4,
          }}>
            <button style={tabStyle(mode === "fixed")} onClick={() => setMode("fixed")}>
              Fixed monthly profit
            </button>
            <button style={tabStyle(mode === "compound")} onClick={() => setMode("compound")}>
              Compounding returns
            </button>
          </div>
        </div>

        {/* Inputs */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: "#6b7280", fontWeight: 500, display: "block", marginBottom: 6 }}>
              Monthly profit (£)
            </label>
            <input
              type="number"
              style={inputStyle}
              value={monthlyProfit}
              onChange={e => setMonthlyProfit(Number(e.target.value))}
              min={0}
              onFocus={e => e.target.style.borderColor = "#3b82f6"}
              onBlur={e => e.target.style.borderColor = "#e5e7eb"}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#6b7280", fontWeight: 500, display: "block", marginBottom: 6 }}>
              Tax rate on profits (%)
            </label>
            <input
              type="number"
              style={inputStyle}
              value={taxRate}
              onChange={e => setTaxRate(Number(e.target.value))}
              min={0} max={100}
              onFocus={e => e.target.style.borderColor = "#3b82f6"}
              onBlur={e => e.target.style.borderColor = "#e5e7eb"}
            />
          </div>
        </div>

        {mode === "compound" && (
          <div>
            <label style={{ fontSize: 12, color: "#6b7280", fontWeight: 500, display: "block", marginBottom: 6 }}>
              Monthly growth rate (%)
            </label>
            <input
              type="number"
              style={{ ...inputStyle, maxWidth: 220 }}
              value={compoundRate}
              onChange={e => setCompoundRate(Number(e.target.value))}
              min={0.1} max={100} step={0.1}
              onFocus={e => e.target.style.borderColor = "#3b82f6"}
              onBlur={e => e.target.style.borderColor = "#e5e7eb"}
            />
          </div>
        )}

        <div>
          <label style={{ fontSize: 12, color: "#6b7280", fontWeight: 500, display: "block", marginBottom: 6 }}>
            Target (£)
          </label>
          <input
            type="number"
            style={{ ...inputStyle, maxWidth: 220 }}
            value={target}
            onChange={e => setTarget(Number(e.target.value))}
            min={1}
            onFocus={e => e.target.style.borderColor = "#3b82f6"}
            onBlur={e => e.target.style.borderColor = "#e5e7eb"}
          />
        </div>

        {/* Stats Cards */}
        {calc && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
            {[
              { label: "Time to target", value: fmtTime(calc.monthsToTarget), sub: `${Math.floor(calc.monthsToTarget/12)} years, ${calc.monthsToTarget%12} months` },
              { label: "Net monthly gain", value: fmt(calc.netMonthly), sub: "after tax" },
              { label: "Total earned", value: fmt(calc.totalEarned), sub: "gross profits over period" },
              { label: "Tax paid", value: fmt(calc.totalTax), sub: "total over period" },
            ].map((s, i) => (
              <div key={i} style={{
                background: "#f9fafb",
                borderRadius: 10,
                padding: "12px 10px",
                border: "1px solid #f3f4f6",
              }}>
                <p style={{ fontSize: 10, color: "#9ca3af", marginBottom: 4, fontWeight: 500 }}>{s.label}</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 2 }}>{s.value}</p>
                <p style={{ fontSize: 9.5, color: "#9ca3af" }}>{s.sub}</p>
              </div>
            ))}
          </div>
        )}

        {/* Chart */}
        {calc && calc.chartData.length > 1 && (
          <div style={{ width: "100%", height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={calc.chartData} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickFormatter={v => fmt(v)}
                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  width={46}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="cumulative"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#profitGrad)"
                  dot={{ r: 3, fill: "#3b82f6", strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "#1d4ed8" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Milestones */}
        {calc && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {calc.milestones.filter(ms => ms.value <= target).map((ms, i) => (
              <div key={i} style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "11px 14px",
                background: "#f9fafb",
                borderRadius: 10,
                border: "1px solid #f3f4f6",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 18 }}>{ms.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>{ms.label}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#6b7280" }}>
                  {ms.months ? fmtTime(ms.months) : "—"}
                </span>
              </div>
            ))}

            {/* Target milestone */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "11px 14px",
              background: "#eff6ff",
              borderRadius: 10,
              border: "1.5px solid #bfdbfe",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18 }}>🏆</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#1d4ed8" }}>Target: {fmt(target)}</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#1d4ed8" }}>
                {fmtTime(calc.monthsToTarget)}
              </span>
            </div>
          </div>
        )}

        {!calc && (
          <div style={{ textAlign: "center", color: "#9ca3af", fontSize: 14, padding: "20px 0" }}>
            Enter valid values above to see your projection.
          </div>
        )}
      </div>
    </div>
  );
}
