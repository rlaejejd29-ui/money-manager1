import React from "react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";

export default function App() {
  const [menu, setMenu] = useState("manage");
  const [list, setList] = useState([]);
  const [scheduleList, setScheduleList] = useState([]);
  const [salesList, setSalesList] = useState([]);

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

  const isFilterActive = !!year || !!selectedMonth;
  console.log("year:", year);
console.log("month:", selectedMonth);
console.log("isFilterActive:", isFilterActive);

  const [reportYear, setReportYear] = useState("2025");
  const [reportMonth, setReportMonth] = useState("10");

  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState("");
  const [existingReceiptUrl, setExistingReceiptUrl] = useState("");
  const [existingReceiptPath, setExistingReceiptPath] = useState("");
  const [existingReceiptName, setExistingReceiptName] = useState("");
  const [existingReceiptType, setExistingReceiptType] = useState("");
  const [removeExistingReceipt, setRemoveExistingReceipt] = useState(false);

  const today = new Date();
  const todayYear = String(today.getFullYear());
  const todayMonth = String(today.getMonth() + 1).padStart(2, "0");
  const todayDay = String(today.getDate()).padStart(2, "0");
  const todayString = `${todayYear}-${todayMonth}-${todayDay}`;

  const [scheduleTitle, setScheduleTitle] = useState("");
  const [scheduleContent, setScheduleContent] = useState("");
  const [scheduleYearInput, setScheduleYearInput] = useState(todayYear);
  const [scheduleMonthInput, setScheduleMonthInput] = useState(todayMonth);
  const [scheduleDayInput, setScheduleDayInput] = useState(todayDay);
  const [scheduleEditId, setScheduleEditId] = useState(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth() + 1);
  const [selectedScheduleDate, setSelectedScheduleDate] = useState(todayString);

  const [salesYearInput, setSalesYearInput] = useState(todayYear);
  const [salesMonthInput, setSalesMonthInput] = useState(todayMonth);
  const [salesDayInput, setSalesDayInput] = useState(todayDay);
  const [salesClient, setSalesClient] = useState("");
  const [salesItemName, setSalesItemName] = useState("");
  const [salesAmount, setSalesAmount] = useState("");
  const [salesMemo, setSalesMemo] = useState("");
  const [salesEditId, setSalesEditId] = useState(null);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesFilterYear, setSalesFilterYear] = useState(todayYear);
  const [salesFilterMonth, setSalesFilterMonth] = useState(todayMonth);

  const fetchData = async () => {
    const { data, error } = await supabase
      .from("money")
      .select("*")
      .order("date", { ascending: true })
      .order("id", { ascending: true });

    if (error) {
      console.log(error);
      alert("자금 데이터 불러오기 실패");
      return;
    }

    setList(data || []);
  };

  const fetchSchedules = async () => {
    const { data, error } = await supabase
      .from("schedules")
      .select("*")
      .order("date", { ascending: true })
      .order("id", { ascending: true });

    if (error) {
      console.log(error);
      alert("일정 데이터 불러오기 실패");
      return;
    }

    setScheduleList(data || []);
  };

  const fetchSales = async () => {
    const { data, error } = await supabase
      .from("sales")
      .select("*")
      .order("date", { ascending: true })
      .order("id", { ascending: true });

    if (error) {
      console.log(error);
      alert("매출 데이터 불러오기 실패");
      return;
    }

    setSalesList(data || []);
  };

  useEffect(() => {
    fetchData();
    fetchSchedules();
    fetchSales();
  }, []);

  useEffect(() => {
    return () => {
      if (receiptPreview && receiptPreview.startsWith("blob:")) {
        URL.revokeObjectURL(receiptPreview);
      }
    };
  }, [receiptPreview]);

  const isPdfFile = (fileType = "", fileName = "") => {
    return (
      fileType === "application/pdf" ||
      String(fileName).toLowerCase().endsWith(".pdf")
    );
  };

  const getReceiptFilePath = (file) => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "dat";
    const safeDate = new Date().toISOString().replace(/[:.]/g, "-");
    const random = Math.random().toString(36).slice(2, 10);
    return `money/${safeDate}-${random}.${ext}`;
  };

  const uploadReceiptFile = async (file) => {
    const filePath = getReceiptFilePath(file);

    const { error: uploadError } = await supabase.storage
      .from("receipts")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from("receipts").getPublicUrl(filePath);

    return {
      receipt_url: data.publicUrl,
      receipt_path: filePath,
      receipt_name: file.name,
      receipt_type: file.type,
    };
  };

  const deleteReceiptFile = async (filePath) => {
    if (!filePath) return;

    const { error } = await supabase.storage.from("receipts").remove([filePath]);

    if (error) {
      console.log("첨부파일 삭제 실패:", error);
    }
  };

  const handleReceiptChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
      "application/pdf",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert("이미지(PNG, JPG, WEBP) 또는 PDF 파일만 업로드할 수 있어요.");
      return;
    }

    if (receiptPreview && receiptPreview.startsWith("blob:")) {
      URL.revokeObjectURL(receiptPreview);
    }

    setReceiptFile(file);
    setReceiptPreview(isPdfFile(file.type, file.name) ? "" : URL.createObjectURL(file));
    setRemoveExistingReceipt(false);
  };

  const removeReceiptFromForm = () => {
    if (receiptPreview && receiptPreview.startsWith("blob:")) {
      URL.revokeObjectURL(receiptPreview);
    }

    setReceiptFile(null);
    setReceiptPreview("");
    if (existingReceiptUrl) {
      setRemoveExistingReceipt(true);
    }
  };

  const resetForm = () => {
    if (receiptPreview && receiptPreview.startsWith("blob:")) {
      URL.revokeObjectURL(receiptPreview);
    }

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

    setReceiptFile(null);
    setReceiptPreview("");
    setExistingReceiptUrl("");
    setExistingReceiptPath("");
    setExistingReceiptName("");
    setExistingReceiptType("");
    setRemoveExistingReceipt(false);
  };

  const resetScheduleForm = () => {
    setScheduleTitle("");
    setScheduleContent("");
    const [y, m, d] = selectedScheduleDate.split("-");
    setScheduleYearInput(y);
    setScheduleMonthInput(m);
    setScheduleDayInput(d);
    setScheduleEditId(null);
  };

  const resetSalesForm = () => {
    setSalesClient("");
    setSalesItemName("");
    setSalesAmount("");
    setSalesMemo("");
    setSalesYearInput(todayYear);
    setSalesMonthInput(todayMonth);
    setSalesDayInput(todayDay);
    setSalesEditId(null);
  };

  const addItem = async () => {
    if (!amount) {
      alert("금액을 입력해주세요.");
      return;
    }

    const date = `${yearInput}-${monthInput}-${dayInput}`;
    setLoading(true);

    try {
      let finalReceiptUrl = existingReceiptUrl || "";
      let finalReceiptPath = existingReceiptPath || "";
      let finalReceiptName = existingReceiptName || "";
      let finalReceiptType = existingReceiptType || "";

      if (removeExistingReceipt && existingReceiptPath) {
        await deleteReceiptFile(existingReceiptPath);
        finalReceiptUrl = "";
        finalReceiptPath = "";
        finalReceiptName = "";
        finalReceiptType = "";
      }

      if (receiptFile) {
        if (existingReceiptPath) {
          await deleteReceiptFile(existingReceiptPath);
        }

        const uploaded = await uploadReceiptFile(receiptFile);
        finalReceiptUrl = uploaded.receipt_url;
        finalReceiptPath = uploaded.receipt_path;
        finalReceiptName = uploaded.receipt_name;
        finalReceiptType = uploaded.receipt_type;
      }

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
            receipt_url: finalReceiptUrl || null,
            receipt_path: finalReceiptPath || null,
            receipt_name: finalReceiptName || null,
            receipt_type: finalReceiptType || null,
          })
          .eq("id", editId);

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
          receipt_url: finalReceiptUrl || null,
          receipt_path: finalReceiptPath || null,
          receipt_name: finalReceiptName || null,
          receipt_type: finalReceiptType || null,
        },
      ]);

      if (error) {
        console.log(error);
        alert("저장 실패");
        return;
      }

      await fetchData();
      resetForm();
    } catch (error) {
      console.log(error);
      alert("첨부파일 업로드 또는 저장 중 오류가 발생했어요.");
    } finally {
      setLoading(false);
    }
  };

  const addSchedule = async () => {
    if (!scheduleTitle.trim()) {
      alert("일정 제목을 입력해주세요.");
      return;
    }

    const date = `${scheduleYearInput}-${scheduleMonthInput}-${scheduleDayInput}`;
    setScheduleLoading(true);

    if (scheduleEditId) {
      const { error } = await supabase
        .from("schedules")
        .update({
          date,
          title: scheduleTitle,
          content: scheduleContent,
        })
        .eq("id", scheduleEditId);

      setScheduleLoading(false);

      if (error) {
        console.log(error);
        alert("일정 수정 실패");
        return;
      }

      await fetchSchedules();
      resetScheduleForm();
      return;
    }

    const { error } = await supabase.from("schedules").insert([
      {
        date,
        title: scheduleTitle,
        content: scheduleContent,
        is_done: false,
      },
    ]);

    setScheduleLoading(false);

    if (error) {
      console.log(error);
      alert("일정 저장 실패");
      return;
    }

    await fetchSchedules();
    resetScheduleForm();
  };

  const addSales = async () => {
    if (!salesClient.trim() || !salesItemName.trim() || !salesAmount) {
      alert("거래처명, 품목/내용, 금액을 입력해주세요.");
      return;
    }

    const date = `${salesYearInput}-${salesMonthInput}-${salesDayInput}`;
    setSalesLoading(true);

    if (salesEditId) {
      const { error } = await supabase
        .from("sales")
        .update({
          date,
          client: salesClient,
          item_name: salesItemName,
          amount: Number(salesAmount),
          memo: salesMemo,
        })
        .eq("id", salesEditId);

      setSalesLoading(false);

      if (error) {
        console.log(error);
        alert("매출 수정 실패");
        return;
      }

      await fetchSales();
      resetSalesForm();
      return;
    }

    const { error } = await supabase.from("sales").insert([
      {
        date,
        client: salesClient,
        item_name: salesItemName,
        amount: Number(salesAmount),
        memo: salesMemo,
      },
    ]);

    setSalesLoading(false);

    if (error) {
      console.log(error);
      alert("매출 저장 실패");
      return;
    }

    await fetchSales();
    resetSalesForm();
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

    if (receiptPreview && receiptPreview.startsWith("blob:")) {
      URL.revokeObjectURL(receiptPreview);
    }

    setReceiptFile(null);
    setReceiptPreview(
      isPdfFile(item.receipt_type, item.receipt_name) ? "" : item.receipt_url || ""
    );
    setExistingReceiptUrl(item.receipt_url || "");
    setExistingReceiptPath(item.receipt_path || "");
    setExistingReceiptName(item.receipt_name || "");
    setExistingReceiptType(item.receipt_type || "");
    setRemoveExistingReceipt(false);

    setMenu("manage");
  };

  const startEditSchedule = (item) => {
    const [y, m, d] = item.date.split("-");
    setScheduleEditId(item.id);
    setScheduleTitle(item.title || "");
    setScheduleContent(item.content || "");
    setScheduleYearInput(y);
    setScheduleMonthInput(m);
    setScheduleDayInput(d);
    setSelectedScheduleDate(item.date);
    setCalendarYear(Number(y));
    setCalendarMonth(Number(m));
    setMenu("schedule");
  };

  const startEditSales = (item) => {
    const [y, m, d] = item.date.split("-");
    setSalesEditId(item.id);
    setSalesClient(item.client || "");
    setSalesItemName(item.item_name || "");
    setSalesAmount(String(item.amount ?? ""));
    setSalesMemo(item.memo || "");
    setSalesYearInput(y);
    setSalesMonthInput(m);
    setSalesDayInput(d);
    setMenu("sales");
  };

  const deleteItem = async (item) => {
    const ok = window.confirm("삭제할까요?");
    if (!ok) return;

    if (item.receipt_path) {
      await deleteReceiptFile(item.receipt_path);
    }

    const { error } = await supabase.from("money").delete().eq("id", item.id);

    if (error) {
      console.log(error);
      alert("삭제 실패");
      return;
    }

    await fetchData();
    if (editId === item.id) resetForm();
  };

  const deleteSchedule = async (id) => {
    const ok = window.confirm("일정을 삭제할까요?");
    if (!ok) return;

    const { error } = await supabase.from("schedules").delete().eq("id", id);

    if (error) {
      console.log(error);
      alert("일정 삭제 실패");
      return;
    }

    await fetchSchedules();
    if (scheduleEditId === id) resetScheduleForm();
  };

  const deleteSales = async (id) => {
    const ok = window.confirm("매출 내역을 삭제할까요?");
    if (!ok) return;

    const { error } = await supabase.from("sales").delete().eq("id", id);

    if (error) {
      console.log(error);
      alert("매출 삭제 실패");
      return;
    }

    await fetchSales();
    if (salesEditId === id) resetSalesForm();
  };

  const toggleScheduleDone = async (item) => {
    const { error } = await supabase
      .from("schedules")
      .update({ is_done: !item.is_done })
      .eq("id", item.id);

    if (error) {
      console.log(error);
      alert("완료 상태 변경 실패");
      return;
    }

    await fetchSchedules();
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
      .map(([categoryName, categoryAmount]) => ({
        category: categoryName,
        amount: categoryAmount,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [reportList]);

  const maxCategoryAmount = useMemo(() => {
    if (reportCategoryTable.length === 0) return 0;
    return Math.max(...reportCategoryTable.map((item) => item.amount));
  }, [reportCategoryTable]);

  const reportIncomeCategoryTable = useMemo(() => {
  const map = {};
  reportList.forEach((item) => {
    if (item.type === "수입") {
      map[item.category] = (map[item.category] || 0) + Number(item.amount || 0);
    }
  });

  return Object.entries(map)
    .map(([categoryName, categoryAmount]) => ({
      category: categoryName,
      amount: categoryAmount,
    }))
    .sort((a, b) => b.amount - a.amount);
}, [reportList]);

const maxIncomeCategoryAmount = useMemo(() => {
  if (reportIncomeCategoryTable.length === 0) return 0;
  return Math.max(...reportIncomeCategoryTable.map((item) => item.amount));
}, [reportIncomeCategoryTable]);

  const undoneScheduleCount = useMemo(() => {
    return scheduleList.filter((item) => !item.is_done).length;
  }, [scheduleList]);

  const doneScheduleCount = useMemo(() => {
    return scheduleList.filter((item) => item.is_done).length;
  }, [scheduleList]);

  const selectedDateSchedules = useMemo(() => {
    return scheduleList
      .filter((item) => item.date === selectedScheduleDate)
      .sort((a, b) => a.id - b.id);
  }, [scheduleList, selectedScheduleDate]);

  const schedulesByDate = useMemo(() => {
    const map = {};
    scheduleList.forEach((item) => {
      if (!map[item.date]) map[item.date] = [];
      map[item.date].push(item);
    });
    return map;
  }, [scheduleList]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(calendarYear, calendarMonth - 1, 1);
    const lastDate = new Date(calendarYear, calendarMonth, 0).getDate();
    const startWeekday = firstDay.getDay();

    const cells = [];

    for (let i = 0; i < startWeekday; i += 1) {
      cells.push(null);
    }

    for (let day = 1; day <= lastDate; day += 1) {
      const date = `${calendarYear}-${String(calendarMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      cells.push({
        day,
        date,
        schedules: schedulesByDate[date] || [],
      });
    }

    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    return cells;
  }, [calendarYear, calendarMonth, schedulesByDate]);

  const changeCalendarMonth = (diff) => {
    let newYear = calendarYear;
    let newMonth = calendarMonth + diff;

    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }

    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }

    setCalendarYear(newYear);
    setCalendarMonth(newMonth);
  };

  const selectCalendarDate = (date) => {
    setSelectedScheduleDate(date);
    const [y, m, d] = date.split("-");
    setScheduleYearInput(y);
    setScheduleMonthInput(m);
    setScheduleDayInput(d);
    setScheduleEditId(null);
    setScheduleTitle("");
    setScheduleContent("");
  };

  const weekNames = ["일", "월", "화", "수", "목", "금", "토"];

  const totalSalesAll = useMemo(() => {
    return salesList.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [salesList]);

  const filteredSales = useMemo(() => {
    return salesList
      .filter((item) => {
        const [y, m] = item.date.split("-");
        return y === salesFilterYear && m === salesFilterMonth;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [salesList, salesFilterYear, salesFilterMonth]);

  const totalSalesAmount = useMemo(() => {
    return filteredSales.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [filteredSales]);

  const salesByClient = useMemo(() => {
    const map = {};
    filteredSales.forEach((item) => {
      const clientName = item.client || "거래처 없음";
      map[clientName] = (map[clientName] || 0) + Number(item.amount || 0);
    });

    return Object.entries(map)
      .map(([clientName, clientAmount]) => ({
        client: clientName,
        amount: clientAmount,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredSales]);

  const maxSalesClientAmount = useMemo(() => {
    if (salesByClient.length === 0) return 0;
    return Math.max(...salesByClient.map((item) => item.amount));
  }, [salesByClient]);

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
        <button
          onClick={() => setMenu("schedule")}
          style={menu === "schedule" ? activeMenuButton : menuButton}
        >
          일정 관리
        </button>
        <button
          onClick={() => setMenu("sales")}
          style={menu === "sales" ? activeMenuButton : menuButton}
        >
          매출 관리
        </button>
      </div>

      {(menu === "manage" || menu === "report") && (
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
      )}

      {menu === "schedule" && (
        <div style={{ display: "flex", gap: 20 }}>
          <div style={cardBlue}>
            진행 중 일정
            <br />
            <b>{undoneScheduleCount}건</b>
          </div>
          <div style={cardPink}>
            완료 일정
            <br />
            <b>{doneScheduleCount}건</b>
          </div>
        </div>
      )}

      {menu === "sales" && (
        <div style={{ display: "flex", gap: 20 }}>
          <div style={salesTopCard}>
            전체 총매출
            <br />
            <b>{totalSalesAll.toLocaleString()}원</b>
          </div>
          <div style={salesMonthCard}>
            {salesFilterYear}년 {Number(salesFilterMonth)}월 총매출
            <br />
            <b>{totalSalesAmount.toLocaleString()}원</b>
          </div>
        </div>
      )}

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

  {/* 🔥 여기 추가 */}
  {isFilterActive && (
    <div style={{
      background: "#fff3cd",
      padding: "8px 12px",
      borderRadius: 8,
      fontSize: 13,
      marginBottom: 10
    }}>
      ⚠️ 현재 필터가 적용되어 일부 데이터만 보이고 있어요
    </div>
  )}

  {isFilterActive && (
    <button
      onClick={() => {
        setYear("");
        setSelectedMonth("");
      }}
      style={{
        marginBottom: 10,
        padding: "6px 10px",
        borderRadius: 8,
        background: "#e0e7ff",
        border: "none",
        cursor: "pointer"
      }}
    >
      전체 보기
    </button>
  )}

  {/* 👇 기존 코드 그대로 아래 유지 */}
            <div style={{ display: "flex", gap: 10 }}>
              <select value={yearInput} onChange={(e) => setYearInput(e.target.value)} style={input}>
                {[2024, 2025, 2026].map((y) => (
                  <option key={y} value={String(y)}>
                    {y}
                  </option>
                ))}
              </select>

              <select value={monthInput} onChange={(e) => setMonthInput(e.target.value)} style={input}>
                {[...Array(12)].map((_, i) => {
                  const m = String(i + 1).padStart(2, "0");
                  return (
                    <option key={m} value={m}>
                      {i + 1}월
                    </option>
                  );
                })}
              </select>

              <select value={dayInput} onChange={(e) => setDayInput(e.target.value)} style={input}>
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
              <option>대여비</option>
              <option>소모품비</option>
              <option>교통비</option>
              <option>소프트웨어비</option>
              <option>보험</option>
              <option>행사입점비</option>
              <option>행정처리비</option>
              <option>숙박비</option>
              <option>카드대금</option>
              <option>카드매출</option>
              <option>정산비</option>
              <option>기타</option>
            </select>

            <select value={payment} onChange={(e) => setPayment(e.target.value)} style={input}>
              <option>현대카드</option>
              <option>국민카드</option>
              <option>현금</option>
              <option>국민은행</option>
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

            <div style={receiptBox}>
              <div style={receiptLabel}>증빙 첨부 (이미지 / PDF)</div>

              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
                onChange={handleReceiptChange}
                style={input}
              />

              {receiptFile ? (
                <div style={previewWrap}>
                  <div style={fileInfoText}>선택 파일: {receiptFile.name}</div>

                  {isPdfFile(receiptFile.type, receiptFile.name) ? (
                    <div style={pdfPreviewBox}>📄 PDF 파일 선택됨</div>
                  ) : (
                    <img src={receiptPreview} alt="영수증 미리보기" style={previewImage} />
                  )}

                  <div style={{ display: "flex", gap: 10 }}>
                    <button type="button" onClick={removeReceiptFromForm} style={subButton}>
                      첨부 제거
                    </button>
                  </div>
                </div>
              ) : existingReceiptUrl && !removeExistingReceipt ? (
                <div style={previewWrap}>
                  <div style={fileInfoText}>
                    현재 파일: {existingReceiptName || "첨부파일"}
                  </div>

                  {isPdfFile(existingReceiptType, existingReceiptName) ? (
                    <div style={pdfPreviewBox}>📄 저장된 PDF 파일</div>
                  ) : (
                    <img src={existingReceiptUrl} alt="영수증 미리보기" style={previewImage} />
                  )}

                  <div style={{ display: "flex", gap: 10 }}>
                    <a
                      href={existingReceiptUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={linkButton}
                    >
                      파일 열기
                    </a>
                    <button type="button" onClick={removeReceiptFromForm} style={subButton}>
                      첨부 제거
                    </button>
                  </div>
                </div>
              ) : (
                <div style={receiptEmptyText}>첨부된 파일이 없습니다.</div>
              )}
            </div>

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
                <th style={th}>증빙</th>
                <th style={th}>관리</th>
              </tr>
            </thead>

            <tbody>
  {filteredList.length === 0 ? (
    <tr>
      <td colSpan="9" style={{ padding: 20, textAlign: "center" }}>
        {isFilterActive ? (
          <>
            📂 조건에 맞는 데이터가 없어요 <br />
            👉 "전체 보기"를 눌러보세요!
          </>
        ) : (
          <>📭 아직 등록된 내역이 없어요</>
        )}
      </td>
    </tr>
  ) : (
    filteredList.map((item) => (
                <tr key={item.id}>
                  <td style={td}>{item.date}</td>
                  <td style={td}>{item.type}</td>
                  <td style={td}>{item.category}</td>
                  <td style={td}>{item.payment}</td>
                  <td style={td}>{item.content || "-"}</td>
                  <td
                    style={{
                      ...td,
                      backgroundColor: item.type === "지출" ? "#ffd6d6" : "#dbeafe",
                      fontWeight: "bold",
                    }}
                  >
                    {Number(item.amount).toLocaleString()}원
                  </td>
                  <td style={td}>{item.memo || "-"}</td>
                  <td style={td}>
                    {item.receipt_url ? (
                      <div style={receiptCellWrap}>
                        {isPdfFile(item.receipt_type, item.receipt_name) ? (
                          <>
                            <div style={pdfThumb}>PDF</div>
                            <a
                              href={item.receipt_url}
                              target="_blank"
                              rel="noreferrer"
                              style={receiptLink}
                            >
                              열기
                            </a>
                          </>
                        ) : (
                          <>
                            <img src={item.receipt_url} alt="영수증" style={receiptThumb} />
                            <a
                              href={item.receipt_url}
                              target="_blank"
                              rel="noreferrer"
                              style={receiptLink}
                            >
                              보기
                            </a>
                          </>
                        )}
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td style={td}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                      <button onClick={() => startEdit(item)} style={editButton}>
                        수정
                      </button>
                      <button onClick={() => deleteItem(item)} style={deleteButton}>
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
            <select value={reportYear} onChange={(e) => setReportYear(e.target.value)} style={input}>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>

            <select value={reportMonth} onChange={(e) => setReportMonth(e.target.value)} style={input}>
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
  <h3 style={sectionTitle}>카테고리별 수입 그래프</h3>
  {reportIncomeCategoryTable.length === 0 ? (
    <p>데이터가 없습니다.</p>
  ) : (
    reportIncomeCategoryTable.map((item) => (
      <div key={item.category} style={{ marginBottom: 14 }}>
        <div style={barLabelRow}>
          <span>{item.category}</span>
          <span>{item.amount.toLocaleString()}원</span>
        </div>
        <div style={barBg}>
          <div
            style={{
              ...barFill,
              width: `${(item.amount / maxIncomeCategoryAmount) * 100}%`,
              background: "linear-gradient(90deg, #60a5fa, #3b82f6)",
            }}
          />
        </div>
      </div>
    ))
  )}
</div>

<div style={chartBox}>
  <h3 style={sectionTitle}>카테고리별 수입 표</h3>
  <table style={table}>
    <thead>
      <tr>
        <th style={th}>카테고리</th>
        <th style={th}>수입 합계</th>
      </tr>
    </thead>
    <tbody>
      {reportIncomeCategoryTable.length === 0 ? (
        <tr>
          <td style={td} colSpan={2}>데이터 없음</td>
        </tr>
      ) : (
        reportIncomeCategoryTable.map((item) => (
          <tr key={item.category}>
            <td style={td}>{item.category}</td>
            <td style={{ ...td, fontWeight: "bold", color: "#2563eb" }}>
              {item.amount.toLocaleString()}원
            </td>
          </tr>
        ))
      )}
    </tbody>
  </table>
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
                          backgroundColor: item.type === "지출" ? "#ffd6d6" : "#dbeafe",
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

      {menu === "schedule" && (
        <>
          <div style={calendarHeaderWrap}>
            <button onClick={() => changeCalendarMonth(-1)} style={menuButton}>
              이전달
            </button>
            <div style={calendarTitle}>
              {calendarYear}년 {calendarMonth}월
            </div>
            <button onClick={() => changeCalendarMonth(1)} style={menuButton}>
              다음달
            </button>
          </div>

          <div style={calendarBox}>
            <div style={calendarGridHeader}>
              {weekNames.map((name) => (
                <div key={name} style={calendarHeaderCell}>
                  {name}
                </div>
              ))}
            </div>

            <div style={calendarGridBody}>
              {calendarDays.map((cell, idx) => {
                if (!cell) {
                  return <div key={`empty-${idx}`} style={calendarEmptyCell} />;
                }

                const isSelected = cell.date === selectedScheduleDate;
                const isToday = cell.date === todayString;

                return (
                  <div
                    key={cell.date}
                    style={{
                      ...calendarCell,
                      ...(isSelected ? calendarCellSelected : {}),
                      ...(isToday ? calendarCellToday : {}),
                    }}
                    onClick={() => selectCalendarDate(cell.date)}
                  >
                    <div style={calendarDayNumber}>{cell.day}</div>

                    <div style={calendarScheduleList}>
                      {cell.schedules.slice(0, 3).map((item) => (
                        <div
                          key={item.id}
                          style={item.is_done ? calendarDoneChip : calendarPendingChip}
                        >
                          {item.title}
                        </div>
                      ))}
                      {cell.schedules.length > 3 && (
                        <div style={calendarMoreText}>+{cell.schedules.length - 3}개</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={selectedDateCard}>
            <h3 style={sectionTitle}>선택 날짜: {selectedScheduleDate}</h3>

            <div style={box}>
              <div style={{ display: "flex", gap: 10 }}>
                <select
                  value={scheduleYearInput}
                  onChange={(e) => setScheduleYearInput(e.target.value)}
                  style={input}
                >
                  {[2024, 2025, 2026].map((y) => (
                    <option key={y} value={String(y)}>
                      {y}
                    </option>
                  ))}
                </select>

                <select
                  value={scheduleMonthInput}
                  onChange={(e) => setScheduleMonthInput(e.target.value)}
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
                  value={scheduleDayInput}
                  onChange={(e) => setScheduleDayInput(e.target.value)}
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

              <input
                placeholder="일정 제목"
                value={scheduleTitle}
                onChange={(e) => setScheduleTitle(e.target.value)}
                style={input}
              />

              <input
                placeholder="일정 내용"
                value={scheduleContent}
                onChange={(e) => setScheduleContent(e.target.value)}
                style={input}
              />

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={addSchedule} style={button} disabled={scheduleLoading}>
                  {scheduleLoading ? "저장 중..." : scheduleEditId ? "수정 저장" : "일정 추가"}
                </button>
                {scheduleEditId && (
                  <button onClick={resetScheduleForm} style={subButton}>
                    수정 취소
                  </button>
                )}
              </div>
            </div>

            <table style={table}>
              <thead>
                <tr>
                  <th style={th}>제목</th>
                  <th style={th}>내용</th>
                  <th style={th}>상태</th>
                  <th style={th}>관리</th>
                </tr>
              </thead>

              <tbody>
                {selectedDateSchedules.length === 0 ? (
                  <tr>
                    <td style={td} colSpan={4}>
                      이 날짜의 일정이 없습니다.
                    </td>
                  </tr>
                ) : (
                  selectedDateSchedules.map((item) => (
                    <tr key={item.id}>
                      <td style={{ ...td, fontWeight: "bold" }}>{item.title || "-"}</td>
                      <td style={td}>{item.content || "-"}</td>
                      <td style={td}>
                        <button
                          onClick={() => toggleScheduleDone(item)}
                          style={item.is_done ? doneButton : pendingButton}
                        >
                          {item.is_done ? "완료" : "진행 중"}
                        </button>
                      </td>
                      <td style={td}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                          <button onClick={() => startEditSchedule(item)} style={editButton}>
                            수정
                          </button>
                          <button onClick={() => deleteSchedule(item.id)} style={deleteButton}>
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {menu === "sales" && (
        <>
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <select
              value={salesFilterYear}
              onChange={(e) => setSalesFilterYear(e.target.value)}
              style={input}
            >
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>

            <select
              value={salesFilterMonth}
              onChange={(e) => setSalesFilterMonth(e.target.value)}
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

          <div style={box}>
            <div style={{ display: "flex", gap: 10 }}>
              <select
                value={salesYearInput}
                onChange={(e) => setSalesYearInput(e.target.value)}
                style={input}
              >
                {[2024, 2025, 2026].map((y) => (
                  <option key={y} value={String(y)}>
                    {y}
                  </option>
                ))}
              </select>

              <select
                value={salesMonthInput}
                onChange={(e) => setSalesMonthInput(e.target.value)}
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
                value={salesDayInput}
                onChange={(e) => setSalesDayInput(e.target.value)}
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

            <input
              placeholder="거래처명"
              value={salesClient}
              onChange={(e) => setSalesClient(e.target.value)}
              style={input}
            />

            <input
              placeholder="품목 / 내용"
              value={salesItemName}
              onChange={(e) => setSalesItemName(e.target.value)}
              style={input}
            />

            <input
              type="number"
              placeholder="금액"
              value={salesAmount}
              onChange={(e) => setSalesAmount(e.target.value)}
              style={input}
            />

            <input
              placeholder="비고"
              value={salesMemo}
              onChange={(e) => setSalesMemo(e.target.value)}
              style={input}
            />

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={addSales} style={button} disabled={salesLoading}>
                {salesLoading ? "저장 중..." : salesEditId ? "수정 저장" : "매출 추가"}
              </button>
              {salesEditId && (
                <button onClick={resetSalesForm} style={subButton}>
                  수정 취소
                </button>
              )}
            </div>
          </div>

          <div style={reportWrap}>
            <div style={chartBox}>
              <h3 style={sectionTitle}>거래처별 월 매출 그래프</h3>
              {salesByClient.length === 0 ? (
                <p>데이터가 없습니다.</p>
              ) : (
                salesByClient.map((item) => (
                  <div key={item.client} style={{ marginBottom: 14 }}>
                    <div style={barLabelRow}>
                      <span>{item.client}</span>
                      <span>{item.amount.toLocaleString()}원</span>
                    </div>
                    <div style={salesBarBg}>
                      <div
                        style={{
                          ...salesBarFill,
                          width: `${(item.amount / maxSalesClientAmount) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={chartBox}>
              <h3 style={sectionTitle}>거래처별 월 매출 표</h3>
              <table style={table}>
                <thead>
                  <tr>
                    <th style={th}>거래처명</th>
                    <th style={th}>매출 합계</th>
                  </tr>
                </thead>
                <tbody>
                  {salesByClient.length === 0 ? (
                    <tr>
                      <td style={td} colSpan={2}>
                        데이터가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    salesByClient.map((item) => (
                      <tr key={item.client}>
                        <td style={td}>{item.client}</td>
                        <td style={{ ...td, background: "#dbeafe", fontWeight: "bold" }}>
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
                  <th style={th}>거래처명</th>
                  <th style={th}>품목/내용</th>
                  <th style={th}>금액</th>
                  <th style={th}>비고</th>
                  <th style={th}>관리</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.length === 0 ? (
                  <tr>
                    <td style={td} colSpan={6}>
                      데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((item) => (
                    <tr key={item.id}>
                      <td style={td}>{item.date}</td>
                      <td style={td}>{item.client || "-"}</td>
                      <td style={td}>{item.item_name || "-"}</td>
                      <td style={{ ...td, background: "#dbeafe", fontWeight: "bold" }}>
                        {Number(item.amount).toLocaleString()}원
                      </td>
                      <td style={td}>{item.memo || "-"}</td>
                      <td style={td}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                          <button onClick={() => startEditSales(item)} style={editButton}>
                            수정
                          </button>
                          <button onClick={() => deleteSales(item.id)} style={deleteButton}>
                            삭제
                          </button>
                        </div>
                      </td>
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
  flexWrap: "wrap",
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

const linkButton = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "12px 16px",
  background: "#dbeafe",
  borderRadius: 10,
  color: "#1d4ed8",
  textDecoration: "none",
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

const pendingButton = {
  padding: "8px 12px",
  background: "#fde68a",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  color: "#374151",
  fontWeight: "bold",
};

const doneButton = {
  padding: "8px 12px",
  background: "#bbf7d0",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  color: "#166534",
  fontWeight: "bold",
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

const salesTopCard = {
  background: "#ede9fe",
  padding: 30,
  borderRadius: 15,
  flex: 1,
  textAlign: "center",
  color: "#5b21b6",
};

const salesMonthCard = {
  background: "#dbeafe",
  padding: 30,
  borderRadius: 15,
  flex: 1,
  textAlign: "center",
  color: "#1d4ed8",
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

const salesBarBg = {
  width: "100%",
  height: 18,
  background: "#f3f4f6",
  borderRadius: 999,
  overflow: "hidden",
};

const salesBarFill = {
  height: "100%",
  background: "#c4b5fd",
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

const calendarHeaderWrap = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: 20,
  marginBottom: 20,
  gap: 10,
};

const calendarTitle = {
  fontSize: 24,
  fontWeight: "bold",
  color: "#374151",
};

const calendarBox = {
  background: "#ffffff",
  padding: 20,
  borderRadius: 15,
  marginTop: 10,
};

const calendarGridHeader = {
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  gap: 8,
  marginBottom: 8,
};

const calendarHeaderCell = {
  textAlign: "center",
  fontWeight: "bold",
  padding: "10px 0",
  background: "#e0e7ff",
  borderRadius: 10,
};

const calendarGridBody = {
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  gap: 8,
};

const calendarCell = {
  minHeight: 120,
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 8,
  cursor: "pointer",
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const calendarCellSelected = {
  border: "2px solid #818cf8",
  background: "#eef2ff",
};

const calendarCellToday = {
  boxShadow: "inset 0 0 0 2px #fca5a5",
};

const calendarEmptyCell = {
  minHeight: 120,
  background: "transparent",
};

const calendarDayNumber = {
  fontWeight: "bold",
  fontSize: 16,
};

const calendarScheduleList = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const calendarPendingChip = {
  fontSize: 12,
  padding: "4px 6px",
  borderRadius: 8,
  background: "#fde68a",
  color: "#374151",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const calendarDoneChip = {
  fontSize: 12,
  padding: "4px 6px",
  borderRadius: 8,
  background: "#bbf7d0",
  color: "#166534",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const calendarMoreText = {
  fontSize: 12,
  color: "#6b7280",
};

const selectedDateCard = {
  background: "#ffffff",
  padding: 20,
  borderRadius: 15,
  marginTop: 20,
};

const receiptBox = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 16,
  display: "grid",
  gap: 12,
};

const receiptLabel = {
  fontWeight: "bold",
  color: "#374151",
};

const previewWrap = {
  display: "grid",
  gap: 10,
};

const previewImage = {
  width: 220,
  maxWidth: "100%",
  borderRadius: 12,
  border: "1px solid #d1d5db",
  objectFit: "cover",
};

const pdfPreviewBox = {
  width: 220,
  maxWidth: "100%",
  padding: 24,
  borderRadius: 12,
  border: "1px solid #d1d5db",
  background: "#f8fafc",
  textAlign: "center",
  fontWeight: "bold",
};

const fileInfoText = {
  color: "#374151",
  fontSize: 14,
  wordBreak: "break-all",
};

const receiptEmptyText = {
  color: "#6b7280",
  fontSize: 14,
};

const receiptCellWrap = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 6,
};

const receiptThumb = {
  width: 70,
  height: 70,
  objectFit: "cover",
  borderRadius: 8,
  border: "1px solid #d1d5db",
};

const pdfThumb = {
  width: 70,
  height: 70,
  borderRadius: 8,
  border: "1px solid #d1d5db",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#f3f4f6",
  fontWeight: "bold",
};

const receiptLink = {
  color: "#2563eb",
  textDecoration: "none",
  fontWeight: "bold",
  fontSize: 13,
};
