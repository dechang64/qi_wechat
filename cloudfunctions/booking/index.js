// 云函数: booking
// 入参: { counselor_id, community_id, booking_date, booking_time, mode, phone, notes? }
// 出参: { booking_id, status: "pending", ... }

const cloud = require("wx-server-sdk");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const db = cloud.database();

  // upsert user
  const userRes = await db.collection("users").where({ wx_openid: OPENID }).get();
  let userId;
  if (userRes.data && userRes.data.length) {
    userId = userRes.data[0]._id;
  } else {
    const ins = await db.collection("users").add({
      data: {
        wx_openid: OPENID,
        phone: event.phone || "",
        created_at: Date.now(),
      },
    });
    userId = ins._id;
  }

  // 写 booking
  const res = await db.collection("bookings").add({
    data: {
      user_id: userId,
      counselor_id: event.counselor_id,
      counselor_name: event.counselor_name || "",
      community_id: event.community_id,
      booking_date: event.booking_date,
      booking_time: event.booking_time,
      mode: event.mode || "onsite",
      notes: event.notes || "",
      status: "pending",
      created_at: Date.now(),
    },
  });

  return {
    code: 0,
    booking_id: res._id,
    status: "pending",
    counselor_id: event.counselor_id,
    counselor_name: event.counselor_name,
    community_id: event.community_id,
    booking_date: event.booking_date,
    booking_time: event.booking_time,
    mode: event.mode,
    note: "预约成功, 咨询师会通过短信联系您确认",
  };
};
