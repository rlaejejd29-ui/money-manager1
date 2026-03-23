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

  const [reportYear, setReportYear] = useState("2025");
  const [reportMonth, setReportMonth] = useState("10");

  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

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
    setSalesYearInput(todayYear);
    setSalesMonthInput(todayMonth);
    setSalesDayInput(todayDay);
    setSalesClient("");
    setSalesItemName("");
    setSalesAmount("");
    setSalesMemo("");
    setSalesEditId(null);
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
    setSalesYearInput(y);
    setSalesMonthInput(m);
    setSalesDayInput(d);
    setSalesClient(item.client || "");
    setSalesItemName(item.item_name || "");
    setSalesAmount(String(item.amount ?? ""));
    setSalesMemo(item.memo || "");
    setMenu("sales");
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

  const filteredList = useMemo
