// 云函数: communities
// 列出 5 个 mock 社区
// 入参: 无
// 出参: { communities: [...] }

const COMMUNITIES = [
  { _id: "c_A", name: "苏州工业园社区", address: "工业园区" },
  { _id: "c_B", name: "姑苏区社区",     address: "姑苏区" },
  { _id: "c_C", name: "高新区社区",     address: "高新区" },
  { _id: "c_D", name: "吴中区社区",     address: "吴中区" },
  { _id: "c_E", name: "相城区社区",     address: "相城区" },
];

exports.main = async (event, context) => {
  const { OPENID } = context;
  console.log(`[communities] user=${OPENID}`);

  return {
    code: 0,
    message: "ok",
    communities: COMMUNITIES,
  };
};
