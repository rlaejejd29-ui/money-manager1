import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";

export default function App() {
  const [menu, setMenu] = useState("manage");
  const [list, setList] = useState([]);

  const [text, setText] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const [yearInput, setYearInput] = useState("2026");
  const [monthInput, setMonthInput] = useState("01");
  const [dayInput, setDayInput] = useState("01");

  const [type, setType] = useState("지출");
  const [category, setCategory] = useState("식비");
  const [payment, setPayment] = useState("현대카드");

  const [year, setYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");

  const [reportYear, setReportYear] = useState("2025");
  const [reportMonth, setReportMonth] = useState("10");

  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    const { data, error } = await supabase
      .from("money")
      .select("*")
      .order("date", { ascending: true })
      .order("id", { ascending: true });

    if (error) {
      console.log(error);
      alert("데이터 불러오기 실패");
      return;
    }

    setList(data || []);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setText("");
    setAmount("");
    setNote("");
    setType("지출");
    setCategory("식비");
    setPayment("현대카드");
    setYearInput("2026");
    setMonthInput("01");
    setDayInput("01");
    setEditId(null);
  };

  const addItem = async () => {
    if (!amount) return;

    const date = `${yearInput}-${monthInput}-${dayInput}`;
    setLoading(true);

    if (editId) {
      const { error } = await supabase
        .from("money")
        .update({
          date,
          type,
          category,
          payment,
          content: text,
          amount: Number(amount),
          memo: note,
        })
        .eq("id", editId);

      setLoading(false);

      if (error) {
        console.log(error);
        alert("수정 실패");
        return;
      }

      await fetchData();
      resetForm();
      return;
    }

    const { error } = await supabase.from("money").insert([
      {
        date,
        type,
        category,
        payment,
        content: text,
        amount: Number(amount),
        memo: note,
      },
    ]);

    setLoading(false);

    if (error) {
      console.log(error);
      alert("저장 실패");
      return;
    }

    await fetchData();
    resetForm();
  };

  const startEdit = (item) => {
    const [y, m, d] = item.date.split("-");
    setEditId(item.id);
    setText(item.content || "");
    setAmount(String(item.amount ?? ""));
    setNote(item.memo || "");
    setYearInput(y);
    setMonthInput(m);
    setDayInput(d);
    setType(item.type);
    setCategory(item.category);
    setPayment(item.payment);
    setMenu("manage");
  };

  const deleteItem = async (id) => {
    const ok = window.confirm("삭제할까요?");
    if (!ok) return;

    const { error } = await supabase.from("money").delete().eq("id", id);

    if (error) {
      console.log(error);
      alert("삭제 실패");
      return;
    }

    await fetchData();
    if (editId === id) resetForm();
  };

  const totalExpense = useMemo(() => {
    return list
      .filter((i) => i.type === "지출")
      .reduce((sum, i) => sum + Number(i.amount || 0), 0);
  }, [list]);

  const totalIncome = useMemo(() => {
    return list
      .filter((i) => i.type === "수입")
      .reduce((sum, i) => sum + Number(i.amount || 0), 0);
  }, [list]);

  const filteredList = useMemo(() => {
    const filtered = list.filter((item) => {
      const [y, m] = item.date.split("-");
      return (!year || y === year) && (!selectedMonth || m === selectedMonth);
    });

    return [...filtered].sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [list, year, selectedMonth]);

  const reportList = useMemo(() => {
    return list
      .filter((item) => {
        const [y, m] = item.date.split("-");
        return y === reportYear && m === reportMonth;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [list, reportYear, reportMonth]);

  const reportIncome = useMemo(() => {
    return reportList
      .filter((item) => item.type === "수입")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [reportList]);

  const reportExpense = useMemo(() => {
    return reportList
      .filter((item) => item.type === "지출")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [reportList]);

  const reportProfit = reportIncome - reportExpense;

  const reportCategoryTable = useMemo(() => {
    const map = {};
    reportList.forEach((item) => {
      if (item.type === "지출") {
        map[item.category] = (map[item.category] || 0) + Number(item.amount || 0);
      }
    });

    return Object.entries(map)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [reportList]);

  const maxCategoryAmount = useMemo(() => {
    if (reportCategoryTable.length === 0) return 0;
    return Math.max(...reportCategoryTable.map((item) => item.amount));
  }, [reportCategoryTable]);

  return (
    <div style={container}>
      <h1 style={title}>📊 기업 자금 관리 시스템</h1>

      <div style={menuWrap}>
        <button
          onClick={() => setMenu("manage")}
          style={menu === "manage" ? activeMenuButton : menuButton}
        >
          내역 관리
        </button>
        <button
          onClick={() => setMenu("report")}
          style={menu === "report" ? activeMenuButton : menuButton}
        >
          월별 리포트
        </button>
      </div>

      <div style={{ display: "flex", gap: 20 }}>
        <div style={cardBlue}>
          총 수입
          <br />
          <b>{totalIncome.toLocaleString()}원</b>
        </div>
        <div style={cardPink}>
          총 지출
          <br />
          <b>{totalExpense.toLocaleString()}원</b>
        </div>
      </div>

      {menu === "manage" && (
        <>
          <div style={{ display: "flex", gap: 10 }}>
            <select value={year} onChange={(e) => setYear(e.target.value)} style={input}>
              <option value="">년도</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>

            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={input}
            >
              <option value="">월</option>
              {[...Array(12)].map((_, i) => {
                const m = String(i + 1).padStart(2, "0");
                return (
                  <option key={m} value={m}>
                    {i + 1}월
                  </option>
                );
              })}
            </select>
          </div>

          <div style={box}>
            <div style={{ display: "flex", gap: 10 }}>
              <select
                value={yearInput}
                onChange={(e) => setYearInput(e.target.value)}
                style={input}
              >
                {[2024, 2025, 2026].map((y) => (
                  <option key={y} value={String(y)}>
                    {y}
                  </option>
                ))}
              </select>

              <select
                value={monthInput}
                onChange={(e) => setMonthInput(e.target.value)}
                style={input}
              >
                {[...Array(12)].map((_, i) => {
                  const m = String(i + 1).padStart(2, "0");
                  return (
                    <option key={m} value={m}>
                      {i + 1}월
                    </option>
                  );
                })}
              </select>

              <select
                value={dayInput}
                onChange={(e) => setDayInput(e.target.value)}
                style={input}
              >
                {[...Array(31)].map((_, i) => {
                  const d = String(i + 1).padStart(2, "0");
                  return (
                    <option key={d} value={d}>
                      {i + 1}일
                    </option>
                  );
                })}
              </select>
            </div>

            <select value={type} onChange={(e) => setType(e.target.value)} style={input}>
              <option value="지출">지출</option>
              <option value="수입">수입</option>
            </select>

            <select value={category} onChange={(e) => setCategory(e.target.value)} style={input}>
              <option>식자재</option>
              <option>식비</option>
              <option>임대료</option>
              <option>소모품비</option>
              <option>교통비</option>
              <option>소프트웨어비</option>
              <option>보험</option>
            </select>

            <select value={payment} onChange={(e) => setPayment(e.target.value)} style={input}>
              <option>현대카드</option>
              <option>국민카드</option>
              <option>현금</option>
              <option>계좌이체</option>
            </select>

            <input
              placeholder="내용"
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={input}
            />

            <input
              type="number"
              placeholder="금액"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={input}
            />

            <input
              placeholder="비고"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={input}
            />

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={addItem} style={button} disabled={loading}>
                {loading ? "저장 중..." : editId ? "수정 저장" : "추가"}
              </button>
              {editId && (
                <button onClick={resetForm} style={subButton}>
                  수정 취소
                </button>
              )}
            </div>
          </div>

          <table style={table}>
            <thead>
              <tr>
                <th style={th}>날짜</th>
                <th style={th}>구분</th>
                <th style={th}>카테고리</th>
                <th style={th}>결제수단</th>
                <th style={th}>내용</th>
                <th style={th}>금액</th>
                <th style={th}>비고</th>
                <th style={th}>관리</th>
              </tr>
            </thead>

            <tbody>
              {filteredList.map((item) => (
                <tr key={item.id}>
                  <td style={td}>{item.date}</td>
                  <td style={td}>{item.type}</td>
                  <td style={td}>{item.category}</td>
                  <td style={td}>{item.payment}</td>
                  <td style={td}>{item.content || "-"}</td>
                  <td
                    style={{
                      ...td,
                      backgroundColor:
                        item.type === "지출" ? "#ffd6d6" : "#dbeafe",
                      fontWeight: "bold",
                    }}
                  >
                    {Number(item.amount).toLocaleString()}원
                  </td>
                  <td style={td}>{item.memo || "-"}</td>
                  <td style={td}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                      <button onClick={() => startEdit(item)} style={editButton}>
                        수정
                      </button>
                      <button onClick={() => deleteItem(item.id)} style={deleteButton}>
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {menu === "report" && (
        <>
          <div style={{ display: "flex", gap: 10 }}>
            <select
              value={reportYear}
              onChange={(e) => setReportYear(e.target.value)}
              style={input}
            >
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>

            <select
              value={reportMonth}
              onChange={(e) => setReportMonth(e.target.value)}
              style={input}
            >
              {[...Array(12)].map((_, i) => {
                const m = String(i + 1).padStart(2, "0");
                return (
                  <option key={m} value={m}>
                    {i + 1}월
                  </option>
                );
              })}
            </select>
          </div>

          <div style={{ display: "flex", gap: 20 }}>
            <div style={reportCardBlue}>
              월 수입
              <br />
              <b>{reportIncome.toLocaleString()}원</b>
            </div>
            <div style={reportCardPink}>
              월 지출
              <br />
              <b>{reportExpense.toLocaleString()}원</b>
            </div>
            <div style={reportCardPurple}>
              순이익
              <br />
              <b>{reportProfit.toLocaleString()}원</b>
            </div>
          </div>

          <div style={reportWrap}>
            <div style={chartBox}>
              <h3 style={sectionTitle}>카테고리별 지출 그래프</h3>
              {reportCategoryTable.length === 0 ? (
                <p>데이터가 없습니다.</p>
              ) : (
                reportCategoryTable.map((item) => (
                  <div key={item.category} style={{ marginBottom: 14 }}>
                    <div style={barLabelRow}>
                      <span>{item.category}</span>
                      <span>{item.amount.toLocaleString()}원</span>
                    </div>
                    <div style={barBg}>
                      <div
                        style={{
                          ...barFill,
                          width: `${(item.amount / maxCategoryAmount) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={chartBox}>
              <h3 style={sectionTitle}>카테고리별 지출 표</h3>
              <table style={table}>
                <thead>
                  <tr>
                    <th style={th}>카테고리</th>
                    <th style={th}>지출 합계</th>
                  </tr>
                </thead>
                <tbody>
                  {reportCategoryTable.length === 0 ? (
                    <tr>
                      <td style={td} colSpan={2}>
                        데이터가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    reportCategoryTable.map((item) => (
                      <tr key={item.category}>
                        <td style={td}>{item.category}</td>
                        <td style={{ ...td, background: "#ffd6d6", fontWeight: "bold" }}>
                          {item.amount.toLocaleString()}원
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div style={chartBox}>
            <h3 style={sectionTitle}>월별 전체 내역</h3>
            <table style={table}>
              <thead>
                <tr>
                  <th style={th}>날짜</th>
                  <th style={th}>구분</th>
                  <th style={th}>카테고리</th>
                  <th style={th}>결제수단</th>
                  <th style={th}>내용</th>
                  <th style={th}>금액</th>
                  <th style={th}>비고</th>
                </tr>
              </thead>
              <tbody>
                {reportList.length === 0 ? (
                  <tr>
                    <td style={td} colSpan={7}>
                      데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  reportList.map((item) => (
                    <tr key={item.id}>
                      <td style={td}>{item.date}</td>
                      <td style={td}>{item.type}</td>
                      <td style={td}>{item.category}</td>
                      <td style={td}>{item.payment}</td>
                      <td style={td}>{item.content || "-"}</td>
                      <td
                        style={{
                          ...td,
                          backgroundColor:
                            item.type === "지출" ? "#ffd6d6" : "#dbeafe",
                          fontWeight: "bold",
                        }}
                      >
                        {Number(item.amount).toLocaleString()}원
                      </td>
                      <td style={td}>{item.memo || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

/* 스타일 */
const container = {
  padding: 40,
  background: "#fef6f9",
  minHeight: "100vh",
  color: "#374151",
  fontFamily: "sans-serif",
};

const title = {
  fontSize: 32,
  color: "#7c83fd",
};

const menuWrap = {
  display: "flex",
  gap: 10,
  marginBottom: 20,
};

const menuButton = {
  padding: "12px 18px",
  borderRadius: 10,
  border: "1px solid #d1d5db",
  background: "#ffffff",
  cursor: "pointer",
  color: "#374151",
  fontWeight: "bold",
};

const activeMenuButton = {
  ...menuButton,
  background: "#c7d2fe",
};

const box = {
  background: "#f0fdf4",
  padding: 20,
  borderRadius: 15,
  display: "grid",
  gap: 10,
  marginTop: 20,
};

const input = {
  padding: 12,
  borderRadius: 10,
  border: "1px solid #ddd",
  background: "#fff",
  color: "#374151",
};

const button = {
  padding: 12,
  background: "#a5b4fc",
  border: "none",
  borderRadius: 10,
  cursor: "pointer",
  color: "#374151",
  fontWeight: "bold",
};

const subButton = {
  padding: 12,
  background: "#e5e7eb",
  border: "none",
  borderRadius: 10,
  cursor: "pointer",
  color: "#374151",
  fontWeight: "bold",
};

const editButton = {
  padding: "8px 12px",
  background: "#bfdbfe",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  color: "#374151",
  fontWeight: "bold",
};

const deleteButton = {
  padding: "8px 12px",
  background: "#9ca3af",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  color: "#fff",
};

const cardBlue = {
  background: "#dbeafe",
  padding: 30,
  borderRadius: 15,
  flex: 1,
};

const cardPink = {
  background: "#ffe4e6",
  padding: 30,
  borderRadius: 15,
  flex: 1,
};

const reportCardBlue = {
  background: "#dbeafe",
  padding: 24,
  borderRadius: 15,
  flex: 1,
};

const reportCardPink = {
  background: "#ffe4e6",
  padding: 24,
  borderRadius: 15,
  flex: 1,
};

const reportCardPurple = {
  background: "#ede9fe",
  padding: 24,
  borderRadius: 15,
  flex: 1,
};

const reportWrap = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 20,
  marginTop: 20,
};

const chartBox = {
  background: "#ffffff",
  padding: 20,
  borderRadius: 15,
  marginTop: 20,
};

const sectionTitle = {
  marginTop: 0,
  marginBottom: 16,
  color: "#374151",
};

const barLabelRow = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: 6,
  fontSize: 14,
};

const barBg = {
  width: "100%",
  height: 18,
  background: "#f3f4f6",
  borderRadius: 999,
  overflow: "hidden",
};

const barFill = {
  height: "100%",
  background: "#fca5a5",
  borderRadius: 999,
};

const table = {
  width: "100%",
  background: "#fff",
  marginTop: 20,
  color: "#374151",
  borderCollapse: "collapse",
  border: "1px solid #d1d5db",
};

const th = {
  border: "1px solid #d1d5db",
  padding: "12px 10px",
  background: "#e0e7ff",
};

const td = {
  border: "1px solid #d1d5db",
  padding: "10px",
  textAlign: "center",
};
