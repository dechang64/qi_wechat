// 云函数: counselors
// 跨社区查询咨询师
// 入参: { community_id?: "c_A", specialty?: "焦虑" }
// 出参: { total, counselors }

const COUNSELORS = [
  { _id: 1, name: "X 老师", title: "主任咨询师",  community_id: "c_A", specialties: ["焦虑", "抑郁", "职场压力"], bio: "15 年经验, 国家二级", slots: ["09:00","11:00","14:00","16:00"] },
  { _id: 2, name: "Y 老师", title: "副主任咨询师", community_id: "c_A", specialties: ["青少年", "家庭"], bio: "擅长青少年心理", slots: ["10:00","15:00"] },
  { _id: 3, name: "Z 老师", title: "咨询师",       community_id: "c_B", specialties: ["情绪", "创伤"], bio: "认知行为疗法 CBT", slots: ["09:00","14:00"] },
  { _id: 4, name: "W 老师", title: "咨询师",       community_id: "c_B", specialties: ["婚姻", "家庭"], bio: "家庭系统治疗", slots: ["10:00","11:00","16:00"] },
  { _id: 5, name: "V 老师", title: "主任咨询师",  community_id: "c_C", specialties: ["焦虑", "失眠"], bio: "ACT + 正念",   slots: ["09:00","11:00"] },
  { _id: 6, name: "U 老师", title: "咨询师",       community_id: "c_D", specialties: ["职场", "人际"], bio: "10 年企业 EAP", slots: ["14:00","16:00"] },
  { _id: 7, name: "T 老师", title: "咨询师",       community_id: "c_E", specialties: ["儿童", "青少年"], bio: "游戏治疗",    slots: ["10:00"] },
  { _id: 8, name: "S 老师", title: "副主任",       community_id: "c_A", specialties: ["创伤", "PTSD"], bio: "EMDR 认证",   slots: ["14:00"] },
  { _id: 9, name: "R 老师", title: "咨询师",       community_id: "c_C", specialties: ["女性议题", "情绪"], bio: "人本主义 + 叙事", slots: ["15:00","16:00"] },
  { _id: 10, name: "Q 老师", title: "咨询师",       community_id: "c_B", specialties: ["老年", "慢病"], bio: "老年心理",    slots: ["09:00"] },
];

exports.main = async (event, context) => {
  const { community_id, specialty } = event || {};
  let result = COUNSELORS;
  if (community_id && community_id !== "all") {
    result = result.filter(c => c.community_id === community_id);
  }
  if (specialty) {
    result = result.filter(c => (c.specialties || []).includes(specialty));
  }
  return {
    code: 0,
    total: result.length,
    counselors: result,
  };
};
