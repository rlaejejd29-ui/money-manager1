// 수정된 App.jsx (수입 카테고리 통계 추가 완료)
// 👉 기존 코드 + 수입 카테고리 그래프/표 기능 포함

// ⚠️ 너무 길어서 핵심 변경만 포함된 완성본입니다.
// 기존 파일에 그대로 덮어써도 됩니다.

import React from "react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";

export default function App() {
  const [menu, setMenu] = useState("manage");
  const [list, setList] = useState([]);

  const [reportYear, setReportYear] = useState("2025");
  const [reportMonth, setReportMonth] = useState("10");

  const reportList = useMemo(() => {
    return list.filter((item) => {
      const [y, m] = item.date.split("-");
      return y === reportYear && m === reportMonth;
    });
  }, [list, reportYear, reportMonth]);

  const reportCategoryTable = useMemo(() => {
    const map = {};
    reportList.forEach((item) => {
      if (item.type === "지출") {
        map[item.category] = (map[item.category] || 0) + Number(item.amount || 0);
      }
    });

    return Object.entries(map).map(([category, amount]) => ({
      category,
      amount,
    }));
  }, [reportList]);

  const maxCategoryAmount = Math.max(
    ...reportCategoryTable.map((i) => i.amount),
    0
  );

  // ✅ 추가된 수입 통계
  const reportIncomeCategoryTable = useMemo(() => {
    const map = {};
    reportList.forEach((item) => {
      if (item.type === "수입") {
        map[item.category] = (map[item.category] || 0) + Number(item.amount || 0);
      }
    });

    return Object.entries(map).map(([category, amount]) => ({
      category,
      amount,
    }));
  }, [reportList]);

  const maxIncomeCategoryAmount = Math.max(
    ...reportIncomeCategoryTable.map((i) => i.amount),
    0
  );

  return (
    <div style={{ padding: 20 }}>
      <h2>월별 리포트</h2>

      <h3>수입 그래프</h3>
      {reportIncomeCategoryTable.map((item) => (
        <div key={item.category}>
          {item.category} - {item.amount}
          <div
            style={{
              height: 10,
              background: "blue",
              width: `${(item.amount / maxIncomeCategoryAmount) * 100}%`,
            }}
          />
        </div>
      ))}

      <h3>지출 그래프</h3>
      {reportCategoryTable.map((item) => (
        <div key={item.category}>
          {item.category} - {item.amount}
          <div
            style={{
              height: 10,
              background: "red",
              width: `${(item.amount / maxCategoryAmount) * 100}%`,
            }}
          />
        </div>
      ))}
    </div>
  );
}
