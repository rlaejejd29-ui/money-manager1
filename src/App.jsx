import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";

export default function App() {
  const [menu, setMenu] = useState("manage");

  const [salesList, setSalesList] = useState([]);
  const [client, setClient] = useState("");
  const [content, setContent] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const [yearInput, setYearInput] = useState("2026");
  const [monthInput, setMonthInput] = useState("01");
  const [dayInput, setDayInput] = useState("01");

  const [reportYear, setReportYear] = useState("2026");
  const [reportMonth, setReportMonth] = useState("01");

  const fetchSales = async () => {
    const { data } = await supabase
      .from("sales")
      .select("*")
      .order("date", { ascending: true });

    setSalesList(data || []);
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const addSales = async () => {
    if (!client || !amount) return;

    const date = `${yearInput}-${monthInput}-${dayInput}`;

    await supabase.from("sales").insert([
      {
        date,
        client,
        content,
        amount: Number(amount),
        memo: note,
      },
    ]);

    setClient("");
    setContent("");
    setAmount("");
    setNote("");

    fetchSales();
  };

  const totalSales = useMemo(() => {
    return salesList.reduce((sum, i) => sum + Number(i.amount || 0), 0);
  }, [salesList]);

  const monthlySales = useMemo(() => {
    return salesList.filter((item) => {
      const [y, m] = item.date.split("-");
      return y === reportYear && m === reportMonth;
    });
  }, [salesList, reportYear, reportMonth]);

  const clientChart = useMemo(() => {
    const map = {};

    monthlySales.forEach((item) => {
      map[item.client] =
        (map[item.client] || 0) + Number(item.amount || 0);
    });

    return Object.entries(map)
      .map(([client, amount]) => ({ client, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [monthlySales]);

  const maxAmount =
    clientChart.length > 0
      ? Math.max(...clientChart.map((i) => i.amount))
      : 0;

  return (
    <div style={container}>
      <h1 style={title}>💰 매출 관리 시스템</h1>

      <div style={menuWrap}>
        <button onClick={() => setMenu("manage")} style={menuButton}>
          매출 입력
        </button>
        <button onClick={() => setMenu("report")} style={menuButton}>
          매출 분석
        </button>
      </div>

      {/* 총 매출 카드 */}
      <div style={card}>
        총 매출<br />
        <b>{totalSales.toLocaleString()}원</b>
      </div>

      {/* 매출 입력 */}
      {menu === "manage" && (
        <>
          <div style={box}>
            <div style={{ display: "flex", gap: 10 }}>
              <select value={yearInput} onChange={(e) => setYearInput(e.target.value)}>
                {[2025, 2026, 2027].map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </select>

              <select value={monthInput} onChange={(e) => setMonthInput(e.target.value)}>
                {[...Array(12)].map((_, i) => {
                  const m = String(i + 1).padStart(2, "0");
                  return <option key={m}>{m}</option>;
                })}
              </select>

              <select value={dayInput} onChange={(e) => setDayInput(e.target.value)}>
                {[...Array(31)].map((_, i) => {
                  const d = String(i + 1).padStart(2, "0");
                  return <option key={d}>{d}</option>;
                })}
              </select>
            </div>

            <input placeholder="거래처명" value={client} onChange={(e) => setClient(e.target.value)} />
            <input placeholder="내용" value={content} onChange={(e) => setContent(e.target.value)} />
            <input type="number" placeholder="금액" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <input placeholder="비고" value={note} onChange={(e) => setNote(e.target.value)} />

            <button onClick={addSales}>추가</button>
          </div>

          <table style={table}>
            <thead>
              <tr>
                <th>날짜</th>
                <th>거래처</th>
                <th>내용</th>
                <th>금액</th>
                <th>비고</th>
              </tr>
            </thead>
            <tbody>
              {salesList.map((item) => (
                <tr key={item.id}>
                  <td>{item.date}</td>
                  <td>{item.client}</td>
                  <td>{item.content}</td>
                  <td>{item.amount.toLocaleString()}원</td>
                  <td>{item.memo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* 분석 */}
      {menu === "report" && (
        <>
          <div style={{ display: "flex", gap: 10 }}>
            <select value={reportYear} onChange={(e) => setReportYear(e.target.value)}>
              {[2025, 2026, 2027].map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>

            <select value={reportMonth} onChange={(e) => setReportMonth(e.target.value)}>
              {[...Array(12)].map((_, i) => {
                const m = String(i + 1).padStart(2, "0");
                return <option key={m}>{m}</option>;
              })}
            </select>
          </div>

          <div style={box}>
            <h3>거래처별 매출</h3>

            {clientChart.map((item) => (
              <div key={item.client}>
                <div>
                  {item.client} - {item.amount.toLocaleString()}원
                </div>

                <div style={barBg}>
                  <div
                    style={{
                      ...barFill,
                      width: `${(item.amount / maxAmount) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* 스타일 */
const container = { padding: 40 };
const title = { fontSize: 28 };
const menuWrap = { display: "flex", gap: 10 };
const menuButton = { padding: 10 };
const box = { marginTop: 20, display: "grid", gap: 10 };
const card = { background: "#dbeafe", padding: 20, marginTop: 20 };
const table = { width: "100%", marginTop: 20 };

const barBg = {
  width: "100%",
  height: 10,
  background: "#eee",
};

const barFill = {
  height: "100%",
  background: "pink",
};
