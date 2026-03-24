import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";

export default function App() {
  // ================= 로그인 =================
  const [session, setSession] = useState(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMode, setAuthMode] = useState("login");

  // ================= 메뉴 =================
  const [menu, setMenu] = useState("manage");

  // ================= 데이터 =================
  const [list, setList] = useState([]);
  const [salesList, setSalesList] = useState([]);

  // ================= 입력 =================
  const [text, setText] = useState("");
  const [amount, setAmount] = useState("");

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  // ================= 로그인 체크 =================
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  // ================= 로그인 =================
  const handleAuth = async () => {
    if (!authEmail || !authPassword) {
      alert("입력하세요");
      return;
    }

    if (authMode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPassword,
      });
      if (error) alert(error.message);
    } else {
      const { error } = await supabase.auth.signUp({
        email: authEmail,
        password: authPassword,
      });
      if (error) alert(error.message);
      else alert("회원가입 완료");
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  // ================= 데이터 불러오기 =================
  const fetchAll = async () => {
    if (!session) return;

    const { data } = await supabase.from("money").select("*");
    setList(data || []);

    const { data: sales } = await supabase.from("sales").select("*");
    setSalesList(sales || []);
  };

  useEffect(() => {
    fetchAll();
  }, [session]);

  // ================= 추가 =================
  const addItem = async () => {
    if (!amount) return;

    await supabase.from("money").insert([
      {
        date: todayStr,
        amount: Number(amount),
        content: text,
      },
    ]);

    setText("");
    setAmount("");
    fetchAll();
  };

  const addSales = async () => {
    if (!amount) return;

    await supabase.from("sales").insert([
      {
        date: todayStr,
        amount: Number(amount),
        client: text,
      },
    ]);

    setText("");
    setAmount("");
    fetchAll();
  };

  // ================= 계산 =================
  const totalMoney = useMemo(
    () => list.reduce((s, i) => s + Number(i.amount || 0), 0),
    [list]
  );

  const totalSales = useMemo(
    () => salesList.reduce((s, i) => s + Number(i.amount || 0), 0),
    [salesList]
  );

  // ================= 로그인 화면 =================
  if (!session) {
    return (
      <div style={{ padding: 40 }}>
        <h2>로그인</h2>

        <input
          placeholder="이메일"
          value={authEmail}
          onChange={(e) => setAuthEmail(e.target.value)}
          style={input}
        />

        <input
          type="password"
          placeholder="비밀번호"
          value={authPassword}
          onChange={(e) => setAuthPassword(e.target.value)}
          style={input}
        />

        <button onClick={handleAuth} style={button}>
          {authMode === "login" ? "로그인" : "회원가입"}
        </button>

        <button
          onClick={() =>
            setAuthMode(authMode === "login" ? "signup" : "login")
          }
          style={subButton}
        >
          모드 변경
        </button>
      </div>
    );
  }

  // ================= 메인 화면 =================
  return (
    <div style={container}>
      <h1>📊 관리 시스템</h1>

      <button onClick={logout} style={subButton}>
        로그아웃
      </button>

      {/* 메뉴 */}
      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <button onClick={() => setMenu("manage")} style={button}>
          자금
        </button>
        <button onClick={() => setMenu("sales")} style={button}>
          매출
        </button>
      </div>

      {/* ================= 자금 ================= */}
      {menu === "manage" && (
        <>
          <h2>총 금액: {totalMoney.toLocaleString()}원</h2>

          <div style={box}>
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
            <button onClick={addItem} style={button}>
              추가
            </button>
          </div>

          <table style={table}>
            <tbody>
              {list.map((i) => (
                <tr key={i.id}>
                  <td>{i.date}</td>
                  <td>{i.content}</td>
                  <td>{i.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* ================= 매출 ================= */}
      {menu === "sales" && (
        <>
          <h2>총 매출: {totalSales.toLocaleString()}원</h2>

          <div style={box}>
            <input
              placeholder="거래처"
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
            <button onClick={addSales} style={button}>
              추가
            </button>
          </div>

          <table style={table}>
            <tbody>
              {salesList.map((i) => (
                <tr key={i.id}>
                  <td>{i.date}</td>
                  <td>{i.client}</td>
                  <td>{i.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

// 스타일
const container = { padding: 40 };
const box = { marginTop: 20, display: "grid", gap: 10 };
const input = { padding: 10 };
const button = { padding: 10, background: "#a5b4fc" };
const subButton = { padding: 10, background: "#ddd", marginLeft: 10 };
const table = { marginTop: 20, width: "100%" };
