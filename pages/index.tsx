import type { Liff } from "@line/liff";
import type { NextPage } from "next";
import Head from "next/head";
import { useState } from "react";
import styles from "../styles/Home.module.css";

// 予約情報の型定義
interface Reservation {
  id: string;
  date: string;
  time: string;
  menuId: string;
  stylistId: string;
  customerName: string;
  customerPhone: string;
  status: 'confirmed' | 'cancelled';
}

const Home: NextPage<{ liff: Liff | null; liffError: string | null }> = ({
  liff,
  liffError
}) => {
  const [isReserving, setIsReserving] = useState(false);
  const [editingReservationId, setEditingReservationId] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [selectedMenu, setSelectedMenu] = useState("");
  const [selectedStylist, setSelectedStylist] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [reservations, setReservations] = useState<Reservation[]>([
    // 仮のデータ（本来はAPIから取得）
    {
      id: "1",
      date: "2024-04-16",
      time: "11:00",
      menuId: "cut",
      stylistId: "stylist1",
      customerName: "山田 太郎",
      customerPhone: "090-1234-5678",
      status: "confirmed"
    }
  ]);

  const menus = [
    { id: "cut", name: "カット", price: 5000, time: 60 },
    { id: "color", name: "カラー", price: 8000, time: 90 },
    { id: "perm", name: "パーマ", price: 10000, time: 120 },
    { id: "cut_color", name: "カット+カラー", price: 12000, time: 150 },
    { id: "cut_perm", name: "カット+パーマ", price: 14000, time: 180 }
  ];

  const stylists = [
    { id: "stylist1", name: "山田 太郎", image: "/stylist1.jpg" },
    { id: "stylist2", name: "佐藤 花子", image: "/stylist2.jpg" },
    { id: "stylist3", name: "鈴木 一郎", image: "/stylist3.jpg" }
  ];

  const timeSlots = [
    "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
    "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30", "18:00", "18:30"
  ];

  const steps = [
    { number: 1, label: "メニューを選ぶ", icon: "📋" },
    { number: 2, label: "スタイリストを選ぶ", icon: "💇" },
    { number: 3, label: "日時を指定する", icon: "📅" },
    { number: 4, label: "お客様情報入力", icon: "📝" },
    { number: 5, label: "予約内容の確認", icon: "✓" }
  ];

  // カレンダーの日付を生成
  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = [];

    // 当月の日付を追加（過去の日付は除外）
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      if (date >= today) {
        days.push({ date, isCurrentMonth: true });
      }
    }

    // 次月の日付を追加（6週間分の日付を確保）
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({ date, isCurrentMonth: false });
    }

    return days;
  };

  // 予約可能な時間帯を取得
  const getAvailableTimes = (date: Date) => {
    if (!selectedMenu || !selectedStylist) return [];
    
    const menu = menus.find(m => m.id === selectedMenu);
    if (!menu) return [];

    // 仮の予約済み時間帯（本来はAPIから取得）
    const bookedTimes: { [key: string]: string[] } = {
      "2024-04-16": ["10:00", "10:30", "13:00", "13:30", "14:00"],
      "2024-04-17": ["11:00", "11:30", "15:00", "15:30"],
      "2024-04-18": ["12:00", "12:30", "16:00", "16:30"],
    };

    const dateStr = date.toISOString().split('T')[0];
    const booked = bookedTimes[dateStr] || [];
    
    // メニューの所要時間を考慮して予約可能な時間帯を計算
    return timeSlots.filter(time => {
      // 予約済みの時間は除外
      if (booked.includes(time)) return false;

      // メニューの所要時間を考慮
      const startTime = new Date(`${dateStr}T${time}`);
      const endTime = new Date(startTime.getTime() + menu.time * 60000);
      const endTimeStr = endTime.toTimeString().slice(0, 5);

      // メニューの所要時間内に予約が入っていないか確認
      for (let i = timeSlots.indexOf(time) + 1; 
           i < timeSlots.length && timeSlots[i] <= endTimeStr; 
           i++) {
        if (booked.includes(timeSlots[i])) return false;
      }

      return true;
    });
  };

  const handleMenuSelect = (menu: string) => {
    setSelectedMenu(menu);
    setStep(2);
  };

  const handleStylistSelect = (stylist: string) => {
    setSelectedStylist(stylist);
    setStep(3);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date.toISOString());
    setSelectedTime(""); // 日付が変更されたら時間をリセット
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep(4); // 時間を選択したら次のステップへ
  };

  const handleConfirm = () => {
    if (!selectedMenu || !selectedStylist || !selectedDate || !selectedTime || !customerName || !customerPhone) {
      alert("すべての項目を選択してください");
      return;
    }

    const newReservation: Reservation = {
      id: editingReservationId || Date.now().toString(),
      date: new Date(selectedDate).toISOString().split('T')[0],
      time: selectedTime,
      menuId: selectedMenu,
      stylistId: selectedStylist,
      customerName,
      customerPhone,
      status: "confirmed"
    };

    if (editingReservationId) {
      // 既存の予約を更新
      setReservations(reservations.map(r => 
        r.id === editingReservationId ? newReservation : r
      ));
      alert("予約内容を変更しました！");
    } else {
      // 新規予約を追加
      setReservations([...reservations, newReservation]);
      alert("予約が完了しました！");
    }
    
    // 状態をリセット
    setIsReserving(false);
    setEditingReservationId(null);
    setStep(1);
    setSelectedMenu("");
    setSelectedStylist("");
    setSelectedDate("");
    setSelectedTime("");
    setCustomerName("");
    setCustomerPhone("");
  };

  const startNewReservation = () => {
    setIsReserving(true);
    setEditingReservationId(null);
    setStep(1);
  };

  const handleEditReservation = (reservation: Reservation) => {
    setIsReserving(true);
    setEditingReservationId(reservation.id);
    setSelectedMenu(reservation.menuId);
    setSelectedStylist(reservation.stylistId);
    setSelectedDate(new Date(reservation.date).toISOString());
    setSelectedTime(reservation.time);
    setCustomerName(reservation.customerName);
    setCustomerPhone(reservation.customerPhone);
    setStep(1);
  };

  const handleCancelReservation = (reservation: Reservation) => {
    if (window.confirm('予約をキャンセルしてもよろしいですか？')) {
      setReservations(reservations.map(r => 
        r.id === reservation.id ? { ...r, status: 'cancelled' } : r
      ));
      alert('予約をキャンセルしました。');
    }
  };

  const formatDateTime = (date: string, time: string) => {
    return new Date(date).toLocaleDateString('ja-JP') + ' ' + time;
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleStepClick = (stepNumber: number) => {
    if (stepNumber < step) {
      setStep(stepNumber);
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>美容院予約 - LIFF App</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        {liffError && (
          <div className={styles.error}>
            <p>LIFF init failed.</p>
            <p><code>{liffError}</code></p>
          </div>
        )}

        {liff && !isReserving && (
          <div className={styles.content}>
            <h1 className={styles.title}>Hair Salon</h1>
            
            <div className={styles.reservationList}>
              <div className={styles.listHeader}>
                <h2 className={styles.sectionTitle}>予約一覧</h2>
                <button className={styles.newReservationButton} onClick={startNewReservation}>
                  新規予約
                </button>
              </div>
              
              {reservations.length === 0 ? (
                <p className={styles.noReservations}>予約はありません</p>
              ) : (
                <div className={styles.reservationItems}>
                  {reservations.map((reservation) => (
                    <div key={reservation.id} className={styles.reservationItem}>
                      <div className={styles.reservationHeader}>
                        <span className={styles.reservationDate}>
                          {formatDateTime(reservation.date, reservation.time)}
                        </span>
                        <div className={styles.reservationActions}>
                          {reservation.status === 'confirmed' && (
                            <>
                              <button 
                                className={styles.editReservationButton}
                                onClick={() => handleEditReservation(reservation)}
                              >
                                予約内容を変更
                              </button>
                              <button 
                                className={styles.cancelReservationButton}
                                onClick={() => handleCancelReservation(reservation)}
                              >
                                予約を取り消す
                              </button>
                            </>
                          )}
                          <span className={`${styles.reservationStatus} ${styles[reservation.status]}`}>
                            {reservation.status === 'confirmed' ? '予約済み' : 'キャンセル済み'}
                          </span>
                        </div>
                      </div>
                      <div className={styles.reservationDetails}>
                        <p>
                          <span className={styles.label}>メニュー：</span>
                          {menus.find(m => m.id === reservation.menuId)?.name}
                        </p>
                        <p>
                          <span className={styles.label}>スタイリスト：</span>
                          {stylists.find(s => s.id === reservation.stylistId)?.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {liff && isReserving && (
          <div className={styles.content}>
            <div className={styles.reservingHeader}>
              <button className={styles.backButton} onClick={() => setIsReserving(false)}>
                ← 予約一覧に戻る
              </button>
              <h1 className={styles.title}>新規予約</h1>
            </div>

            <div className={styles.progressBar}>
              {steps.map((s) => (
                <div
                  key={s.number}
                  className={`${styles.progressStep} ${step === s.number ? styles.active : ''} ${step > s.number ? styles.completed : ''}`}
                  onClick={() => handleStepClick(s.number)}
                >
                  <div className={styles.progressNumber}>
                    {step > s.number ? "✓" : s.number}
                  </div>
                  <div className={styles.progressLabel}>{s.label}</div>
                </div>
              ))}
            </div>
            
            {step === 1 && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>メニューを選択</h2>
                <div className={styles.menuList}>
                  {menus.map((menu) => (
                    <div
                      key={menu.id}
                      className={`${styles.menuItem} ${selectedMenu === menu.id ? styles.selected : ''}`}
                      onClick={() => handleMenuSelect(menu.id)}
                    >
                      <div className={styles.menuInfo}>
                        <h3 className={styles.menuName}>{menu.name}</h3>
                        <div className={styles.menuDetails}>
                          <span className={styles.price}>¥{menu.price.toLocaleString()}</span>
                          <span className={styles.time}>{menu.time}分</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>スタイリストを選択</h2>
                <div className={styles.stylistList}>
                  {stylists.map((stylist) => (
                    <div
                      key={stylist.id}
                      className={`${styles.stylistItem} ${selectedStylist === stylist.id ? styles.selected : ''}`}
                      onClick={() => handleStylistSelect(stylist.id)}
                    >
                      <div className={styles.stylistImage}>
                        <img src={stylist.image} alt={stylist.name} />
                      </div>
                      <div className={styles.stylistName}>{stylist.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>日時を選択</h2>
                <div className={styles.calendarHeader}>
                  <button onClick={handlePrevMonth} className={styles.monthButton}>←</button>
                  <span className={styles.monthTitle}>
                    {currentMonth.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })}
                  </span>
                  <button onClick={handleNextMonth} className={styles.monthButton}>→</button>
                </div>
                <div className={styles.calendarGrid}>
                  {['月', '火', '水', '木', '金', '土', '日'].map((day) => (
                    <div key={day} className={styles.calendarDayHeader}>{day}</div>
                  ))}
                  {getCalendarDays().map(({ date, isCurrentMonth }, index) => {
                    const isSelected = selectedDate === date.toISOString();
                    const availableTimes = isCurrentMonth ? getAvailableTimes(date) : [];
                    const isAvailable = availableTimes.length > 0;
                    const dateStr = date.toLocaleDateString('ja-JP', { day: 'numeric' });
                    
                    return (
                      <div
                        key={index}
                        className={`${styles.calendarDay} 
                          ${!isCurrentMonth ? styles.otherMonth : ''} 
                          ${isSelected ? styles.selected : ''} 
                          ${isAvailable ? styles.available : styles.unavailable}`}
                        onClick={() => isAvailable && handleDateSelect(date)}
                      >
                        <span className={styles.date}>{dateStr}</span>
                        {isAvailable && <span className={styles.availableIndicator}></span>}
                      </div>
                    );
                  })}
                </div>
                
                {selectedDate && (
                  <div className={styles.timeSelector}>
                    <h3 className={styles.timeTitle}>時間帯を選択</h3>
                    <div className={styles.timeGrid}>
                      {getAvailableTimes(new Date(selectedDate)).map((time) => (
                        <button
                          key={time}
                          className={`${styles.timeButton} ${selectedTime === time ? styles.selected : ''}`}
                          onClick={() => handleTimeSelect(time)}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 4 && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>お客様情報入力</h2>
                <div className={styles.formGroup}>
                  <label className={styles.label}>お名前</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className={styles.input}
                    placeholder="山田 太郎"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>電話番号</label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className={styles.input}
                    placeholder="090-1234-5678"
                  />
                </div>
                <button
                  className={styles.nextButton}
                  onClick={() => setStep(5)}
                  disabled={!customerName || !customerPhone}
                >
                  次へ進む
                </button>
              </div>
            )}

            {step === 5 && (
              <div className={styles.confirmationSection}>
                <h2 className={styles.sectionTitle}>予約内容の確認</h2>
                <div className={styles.confirmationDetails}>
                  <div className={styles.confirmationItem}>
                    <span className={styles.label}>メニュー：</span>
                    <span className={styles.value}>
                      {menus.find(m => m.id === selectedMenu)?.name}
                      <button className={styles.editButton} onClick={() => setStep(1)}>
                        変更
                      </button>
                    </span>
                  </div>
                  <div className={styles.confirmationItem}>
                    <span className={styles.label}>スタイリスト：</span>
                    <span className={styles.value}>
                      {stylists.find(s => s.id === selectedStylist)?.name}
                      <button className={styles.editButton} onClick={() => setStep(2)}>
                        変更
                      </button>
                    </span>
                  </div>
                  <div className={styles.confirmationItem}>
                    <span className={styles.label}>日時：</span>
                    <span className={styles.value}>
                      {selectedDate && new Date(selectedDate).toLocaleDateString('ja-JP')}
                      {selectedTime && ` ${selectedTime}`}
                      <button className={styles.editButton} onClick={() => setStep(3)}>
                        変更
                      </button>
                    </span>
                  </div>
                  <div className={styles.confirmationItem}>
                    <span className={styles.label}>お名前：</span>
                    <span className={styles.value}>
                      {customerName}
                      <button className={styles.editButton} onClick={() => setStep(4)}>
                        変更
                      </button>
                    </span>
                  </div>
                  <div className={styles.confirmationItem}>
                    <span className={styles.label}>電話番号：</span>
                    <span className={styles.value}>
                      {customerPhone}
                      <button className={styles.editButton} onClick={() => setStep(4)}>
                        変更
                      </button>
                    </span>
                  </div>
                </div>
                <button
                  className={styles.confirmButton}
                  onClick={handleConfirm}
                  disabled={!selectedMenu || !selectedStylist || !selectedDate || !selectedTime || !customerName || !customerPhone}
                >
                  予約を確定する
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;
