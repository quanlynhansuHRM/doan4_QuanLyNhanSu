module.exports = {
  apps: [
    { name: "nhanvien_api", script: "nhanvien_api.js", env: { PORT: 5000 } },
    { name: "phongban_api", script: "phongban_api.js", env: { PORT: 5005 } },
    {
      name: "themnhansu_api",
      script: "themnhansu_api.js",
      env: { PORT: 5004 },
    },
    { name: "don_xinnghi", script: "quanlydon_api.js", env: { PORT: 5014 } },
    { name: "luong", script: "luong_api.js", env: { PORT: 5012 } },
    { name: "thongke", script: "thongke_api.js", env: { PORT: 5003 } },
    { name: "chamcong", script: "chamcong_api.js", env: { PORT: 5011 } },
    { name: "themanh", script: "themanh_api.js", env: { PORT: 5008 } },
    { name: "capnhatns_api", script: "capnhatns_api.js", env: { PORT: 5001 } },
    { name: "thempb", script: "thempb_api.js", env: { PORT: 5009 } },
    { name: "xemlichlamviec", script: "taolich_api.js", env: { PORT: 5002 } },
    { name: "xoanhanvien", script: "xoanhansu_api.js", env: { PORT: 5006 } },
    { name: "login", script: "phanquyen_api.js", env: { PORT: 5007 } },
    {
      name: "xemlichlamvieccanhan",
      script: "xemlichcanhan_api.js",
      env: { PORT: 5010 },
    },
  ],
};
