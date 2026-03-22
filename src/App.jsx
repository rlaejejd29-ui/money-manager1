import React from "react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";

export default function App() {
  const today = new Date();
  const currentYear = String(today.getFullYear());
  const currentMonth = String(today.getMonth() + 1).padStart(2, "0");
  const currentDay = String(today.getDate()).padStart(2, "0");

  const [menu, setMenu] = useState("manage");
  const [list, setList] = useState([]);
  const [scheduleList, setScheduleList] = useState([]);

  const [text, setText] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const [yearInput, setYearInput] = useState(currentYear);
  const [monthInput, setMonthInput] = useState(currentMonth);
  const [dayInput, setDayInput] = useState(currentDay);

  const [type, setType] = useState("지출");
  const [category, setCategory] = useState("식비");
  const [payment, setPayment] = useState("현대카드");

  const [year, setYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");

  const [reportYear, setReportYear] = useState(currentYear);
  const [reportMonth, setReportMonth] = useState(currentMonth);

  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  const [scheduleTitle, setScheduleTitle] = useState("");
  const [scheduleContent, setScheduleContent] = useState("");
  const [scheduleYearInput, setScheduleYearInput] = useState(currentYear);
  const [scheduleMonthInput, setScheduleMonthInput] = useState(currentMonth);
  const [scheduleDayInput, setScheduleDayInput] = useState(currentDay);
  const [scheduleEditId, setScheduleEditId] = useState(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  const [calendarYear, setCalendarYear] = useState(Number(currentYear));
  const [calendarMonth, setCalendarMonth] = useState(Number(currentMonth));
  const [selectedScheduleDate, setSelectedScheduleDate] = useState(
    `${currentYear}-${currentMonth}-${currentDay}`
  );

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

  useEffect(() => {
    fetchData();
    fetchSchedules();
  }, []);

  const resetForm = () => {
    setText("");
    setAmount("");
    setNote("");
    setType("지출");
    setCategory("식비");
    setPayment("현대카드");
    setYearInput(currentYear);
    setMonthInput(currentMonth);
    setDayInput(currentDay);
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
 
