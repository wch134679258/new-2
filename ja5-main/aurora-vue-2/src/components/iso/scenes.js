// ============================================================
//  七个室内场景的布置表
// ------------------------------------------------------------
//  坐标都在房间内部（0..w / 0..d），z 是高度。
//  walls 画在墙上，props 摆在地上（按 x+y 自动排序）。
// ============================================================

export const SCENES = {
  /* ---------------- 家 ---------------- */
  home: {
    title: '小屋',
    sub: '玄关 · 客厅 · 卧室 · 后院',
    room: { w: 7.4, d: 6.6, h: 66, floor: '#f2ddca', wallL: '#f7e6ec', wallR: '#fdf1e8' },
    walls: [
      { type: 'windowWall', face: 'left', u0: 0.6, u1: 2.6, z0: 24, z1: 56 },
      { type: 'poster', face: 'right', u0: 0.9, u1: 2.0, z0: 26, z1: 44, c: '#f2a8bd', c2: '#a8c6d9' },
      { type: 'poster', face: 'right', u0: 5.0, u1: 5.8, z0: 30, z1: 42, c: '#c9a06a', c2: '#e6d3c4' }
    ],
    // 一道隔墙分出卧室（主厅 -> 侧室，门洞能看见里面）；
    // 玄关不砌墙，用矮鞋柜 + 地垫分区，视线才通透
    dividers: [
      {
        axis: 'x', at: 4.6, from: 0.3, to: 4.4, h: 42,
        face: '#e6c9d5', cap: '#cca5b6',
        door: { at: 2.4, w: 0.95, z: 34 }
      }
    ],
    props: [
      // 玄关（房间最靠镜头的一角）
      { type: 'rug', x: 1.1, y: 5.4, w: 1.7, d: 1.0, c: '#e8d3c0', c2: '#f4e6d8' },
      { type: 'benchLong', x: 1.15, y: 4.9, w: 1.5, d: 0.44 },
      { type: 'shelf', x: 3.4, y: 5.2, w: 0.5, d: 1.2, h: 26, rows: 2, c: '#d9b48c' },
      { type: 'plant', x: 0.5, y: 6.0, size: 0.78 },
      // 客厅：电视靠后墙，沙发面朝它，茶几在前
      { type: 'tvWall', x: 1.25, y: 0.12, w: 2.5 },
      { type: 'rug', x: 1.2, y: 1.6, w: 2.9, d: 2.6, c: '#f7dfe6', c2: '#fdedf1' },
      { type: 'sofa', x: 1.35, y: 1.95, w: 2.4, d: 0.88 },
      { type: 'table', x: 1.85, y: 3.15, w: 1.4, d: 0.72, h: 12, top: '#d9b18e' },
      { type: 'cushion', x: 1.2, y: 3.95 },
      { type: 'floorLamp', x: 0.35, y: 0.5 },
      { type: 'plant', x: 4.1, y: 0.45, size: 0.86 },
      // 卧室（隔墙另一侧）：飘窗在最里，床横着放，书桌靠右墙
      { type: 'bayWindow', x: 5.0, y: 0.06, w: 1.85, d: 0.7 },
      { type: 'bed', x: 4.95, y: 1.35, w: 2.0, d: 2.5 },
      { type: 'desk', x: 4.95, y: 4.15, w: 1.55, d: 0.7 },
      { type: 'deskLamp', x: 5.15, y: 4.3, z: 14 },
      { type: 'chair', x: 5.4, y: 4.95 },
      { type: 'shelf', x: 6.98, y: 1.4, w: 0.36, d: 1.8, h: 40, rows: 3 },
      { type: 'plant', x: 6.85, y: 5.3, size: 0.7 }
    ],
    // 前景：贴着镜头的花枝，压住左下角，画面才有纵深
    foreground: [
      { type: 'plant', x: 2.55, y: 6.15, size: 1.02 }
    ],
    // 后院：房间前方的一块草地
    extras: [
      { kind: 'ground', x: 0, y: 6.6, w: 4.4, d: 2.6, fill: '#d7e4c8' },
      { type: 'fence', x: 0.1, y: 7.5, w: 4.2 },
      { type: 'flowerBed', x: 0.4, y: 8.2, w: 2.2, d: 0.7 },
      { type: 'swing', x: 3.0, y: 8.6 }
    ],
    labels: [
      { t: '玄关', x: 1.9, y: 6.35, z: 22 },
      { t: '客厅', x: 2.35, y: 1.55, z: 44 },
      { t: '卧室', x: 6.15, y: 3.05, z: 44 },
      { t: '后院', x: 3.3, y: 8.2, z: 24 }
    ]
  },

  /* ---------------- 书店 ---------------- */
  home_book: {
    title: '书店',
    sub: '橱窗 · 主厅 · 阁楼',
    room: { w: 7.4, d: 6.4, h: 72, floor: '#eddcc6', wallL: '#f3e3d4', wallR: '#f8ece0' },
    // dividers-batch：阁楼用一道矮隔墙隔开，门洞朝主厅
    dividers: [
      { axis: 'x', at: 5.3, from: 0.4, to: 5.9, h: 44, face: '#e8d2bf', cap: '#cfb29b', door: { at: 1.55, w: 0.95, z: 36 } }
    ],
    foreground: [{ type: 'plant', x: 2.4, y: 5.95, size: 1.0 }],
    walls: [
      { type: 'windowWall', face: 'left', u0: 0.6, u1: 3.0, z0: 10, z1: 46 },
      { type: 'poster', face: 'right', u0: 0.8, u1: 2.2, z0: 34, z1: 54, c: '#d4708c', c2: '#7f9fc9' }
    ],
    props: [
      // 橱窗里的展示台
      { type: 'table', x: 0.4, y: 1.0, w: 2.2, d: 0.6, h: 14, top: '#e8d3b8' },
      { type: 'shelf', x: 0.5, y: 1.9, w: 2.1, d: 0.45, h: 30, rows: 2, c: '#d9b48c' },
      // 主厅书架
      { type: 'shelf', x: 2.8, y: 0.4, w: 2.2, d: 0.55, h: 52, rows: 4 },
      { type: 'shelf', x: 2.8, y: 2.1, w: 2.2, d: 0.55, h: 52, rows: 4 },
      { type: 'shelf', x: 2.8, y: 3.4, w: 1.8, d: 0.55, h: 42, rows: 3 },
      // 阅读角
      { type: 'rug', x: 0.4, y: 3.6, w: 2.6, d: 2.0, c: '#e9dcc9', c2: '#f6ecdd' },
      { type: 'table', x: 1.0, y: 4.0, w: 1.2, d: 0.8, h: 12 },
      { type: 'chair', x: 0.4, y: 4.2 },
      { type: 'chair', x: 2.3, y: 4.2 },
      { type: 'lamp', x: 0.5, y: 5.8 },
      { type: 'plant', x: 6.6, y: 5.4, size: 0.9 },
      { type: 'shelf', x: 6.3, y: 2.4, w: 0.9, d: 0.5, h: 34, rows: 2, c: '#b08a6a' },
      // 阁楼：靠窗的懒人坐垫 + 一小摞书
      { type: 'floorCushion', x: 5.6, y: 4.05, c: '#e2c4d2' },
      { type: 'floorCushion', x: 6.55, y: 4.35, c: '#cfdcea' },
      { type: 'table', x: 5.85, y: 4.85, w: 0.8, d: 0.5, h: 9, top: '#e0c8a8' }
    ],
    labels: [
      { t: '橱窗', x: 1.4, y: 1.6, z: 40 },
      { t: '主厅', x: 3.9, y: 2.8, z: 52 },
      { t: '阁楼', x: 6.4, y: 2.0, z: 46 },
      { t: '阅读角', x: 1.5, y: 5.25, z: 34 }
    ]
  },

  /* ---------------- 便利店 ---------------- */
  store: {
    title: '便利店',
    sub: '进门 · 主区域 · 收银台',
    room: { w: 7.2, d: 6.2, h: 64, floor: '#eef1e6', wallL: '#e8f0e4', wallR: '#f4f8ee' },
    dividers: [
      { axis: 'x', at: 2.35, from: 0.35, to: 3.6, h: 40, face: '#dfe9db', cap: '#c6d4c1', door: { at: 2.1, w: 1.0, z: 34 } }
    ],
    foreground: [{ type: 'plant', x: 1.35, y: 5.6, size: 0.95 }],
    walls: [
      { type: 'windowWall', face: 'left', u0: 0.8, u1: 3.2, z0: 12, z1: 48 },
      { type: 'poster', face: 'right', u0: 0.6, u1: 1.8, z0: 34, z1: 52, c: '#e0576f', c2: '#7fa8a0' }
    ],
    props: [
      // 进门地垫
      { type: 'rug', x: 0.5, y: 4.6, w: 1.5, d: 1.1, c: '#dfe6da', c2: '#eef3ea' },
      // 主区域货架
      { type: 'shelf', x: 2.6, y: 0.5, w: 3.4, d: 0.5, h: 42, rows: 4 },
      { type: 'shelf', x: 2.6, y: 2.1, w: 3.4, d: 0.5, h: 42, rows: 4 },
      { type: 'fridge', x: 2.6, y: 3.6, w: 1.4, d: 0.6 },
      { type: 'fridge', x: 4.2, y: 3.6, w: 1.4, d: 0.6 },
      // 收银台
      { type: 'counter', x: 0.5, y: 1.2, w: 1.6, d: 0.55 },
      { type: 'register', x: 0.85, y: 1.3 },
      { type: 'counter', x: 0.5, y: 2.15, w: 1.1, d: 0.5, l: '#dce4da', r: '#c6cfc4', t: '#eef4ea' },
      { type: 'plant', x: 6.5, y: 5.4, size: 0.8 }
    ],
    labels: [
      { t: '进门', x: 1.2, y: 5.1, z: 32 },
      { t: '收银台', x: 1.5, y: 2.1, z: 40 },
      { t: '货架', x: 4.3, y: 2.4, z: 44 }
    ]
  },

  /* ---------------- 学校 ---------------- */
  school: {
    title: '樱花学校',
    sub: '教室 · 武道室 · 图书室 · 中庭连廊',
    room: { w: 8.6, d: 7.0, h: 74, floor: '#e9d9c4', wallL: '#eef0e6', wallR: '#f6f4ea' },
    dividers: [
      { axis: 'x', at: 4.35, from: 0.35, to: 5.6, h: 46, face: '#e7ece0', cap: '#ccd4c4', door: { at: 3.9, w: 1.0, z: 38 } }
    ],
    foreground: [{ type: 'plant', x: 3.3, y: 6.5, size: 1.05 }],
    walls: [
      { type: 'windowWall', face: 'left', u0: 0.8, u1: 3.6, z0: 26, z1: 60 },
      { type: 'blackboard', u0: 0.7, u1: 3.1, z0: 26, z1: 58 }
    ],
    props: [
      // 教室
      { type: 'podium', x: 0.7, y: 3.1 },
      { type: 'schoolDesk', x: 0.8, y: 3.9 },
      { type: 'schoolDesk', x: 2.1, y: 3.9 },
      { type: 'schoolDesk', x: 3.4, y: 3.9 },
      { type: 'schoolDesk', x: 0.8, y: 5.4 },
      { type: 'schoolDesk', x: 2.1, y: 5.4 },
      { type: 'schoolDesk', x: 3.4, y: 5.4 },
      // 武道室（塌塌米 + 假人 + 器具架）
      { type: 'matRow', x: 4.9, y: 4.0, w: 3.2, d: 2.6 },
      { type: 'dummy', x: 7.9, y: 4.8 },
      { type: 'gearRack', x: 5.0, y: 3.5, w: 1.8 },
      { type: 'lockers', x: 8.2, y: 0.5, w: 0.4, d: 2.6, h: 46 },
      // 中庭连廊：靠墙的一排小窗 + 盆栽
      { type: 'plant', x: 4.6, y: 3.05, size: 0.8 },
      // 图书室
      { type: 'shelf', x: 4.6, y: 0.35, w: 3.4, d: 0.45, h: 42, rows: 3 },
      { type: 'table', x: 4.7, y: 2.0, w: 2.4, d: 0.9, h: 14 },
      { type: 'chair', x: 4.9, y: 1.6 },
      { type: 'chair', x: 6.3, y: 1.6 }
    ],
    labels: [
      { t: '教室', x: 2.4, y: 4.6, z: 34 },
      { t: '图书室', x: 6.0, y: 1.4, z: 46 },
      { t: '武道室', x: 6.4, y: 5.0, z: 30 }
    ]
  },

  /* ---------------- 健身房 ---------------- */
  gym: {
    title: '花见健身房',
    sub: '力量区 · 有氧区 · 休息角',
    room: { w: 7.6, d: 6.2, h: 70, floor: '#e6dfe8', wallL: '#efe8f2', wallR: '#f7f2f8' },
    dividers: [
      { axis: 'x', at: 3.95, from: 0.35, to: 5.0, h: 42, face: '#e4dcec', cap: '#c9bfd6', door: { at: 3.6, w: 0.95, z: 36 } }
    ],
    foreground: [{ type: 'plant', x: 2.15, y: 5.75, size: 1.0 }],
    walls: [
      { type: 'windowWall', face: 'left', u0: 0.8, u1: 3.4, z0: 24, z1: 58 },
      { type: 'poster', face: 'right', u0: 0.7, u1: 2.4, z0: 36, z1: 56, c: '#7b6a9e', c2: '#c9b8de' }
    ],
    props: [
      // 力量区
      { type: 'matRow', x: 0.5, y: 1.2, w: 2.6, d: 2.4, c: '#ded6e4' },
      { type: 'dumbbellRack', x: 0.5, y: 0.6, w: 1.8 },
      { type: 'gymBench', x: 1.0, y: 2.6, w: 1.5 },
      { type: 'barbell', x: 2.4, y: 3.4, w: 1.6 },
      // 有氧区
      { type: 'treadmill', x: 4.2, y: 0.8, w: 1.1, d: 2.2 },
      { type: 'treadmill', x: 5.8, y: 0.8, w: 1.1, d: 2.2 },
      // 沙袋挂在力量区一角
      { type: 'punchingBag', x: 3.2, y: 1.9 },
      // 休息角
      { type: 'waterStation', x: 4.25, y: 4.55 },
      { type: 'benchLong', x: 5.0, y: 4.75, w: 1.7 },
      { type: 'towelRack', x: 6.4, y: 4.7, w: 0.95 },
      { type: 'plant', x: 6.9, y: 5.3, size: 0.85 }
    ],
    labels: [
      { t: '力量区', x: 1.6, y: 2.2, z: 34 },
      { t: '有氧区', x: 5.5, y: 1.9, z: 40 },
      { t: '休息角', x: 4.8, y: 5.2, z: 28 }
    ]
  },

  /* ---------------- 车站候车厅 ---------------- */
  station: {
    title: '樱花车站',
    sub: '候车厅 · 长椅 · 时刻表 · 售票机',
    room: { w: 7.8, d: 6.0, h: 62, floor: '#e9ded0', wallL: '#f2e8dc', wallR: '#f8f1e7' },
    dividers: [
      { axis: 'x', at: 4.1, from: 0.3, to: 3.4, h: 40, face: '#eee2d2', cap: '#d3c2ab', door: { at: 2.15, w: 1.05, z: 34 } }
    ],
    foreground: [{ type: 'plant', x: 2.4, y: 5.5, size: 1.05 }],
    walls: [
      { type: 'windowWall', face: 'left', u0: 0.8, u1: 3.6, z0: 20, z1: 50 },
      { type: 'poster', face: 'right', u0: 3.4, u1: 4.8, z0: 32, z1: 52, c: '#8f7794', c2: '#d9cbe0' },
      { type: 'poster', face: 'left', u0: 4.35, u1: 5.55, z0: 30, z1: 44, c: '#8fa3cf', c2: '#e2e8f6' }
    ],
    props: [
      { type: 'benchLong', x: 0.8, y: 2.0, w: 2.6, d: 0.6 },
      { type: 'benchLong', x: 0.8, y: 3.2, w: 2.6, d: 0.6 },
      { type: 'ticketMachine', x: 4.6, y: 0.8 },
      { type: 'ticketMachine', x: 5.7, y: 0.8 },
      { type: 'rug', x: 3.4, y: 3.4, w: 2.4, d: 1.6, c: '#ded2c4', c2: '#ece3d8' },
      { type: 'plant', x: 7.0, y: 5.2, size: 0.8 }
    ],
    labels: [
      { t: '长椅', x: 2.0, y: 2.6, z: 34 },
      { t: '售票机', x: 5.2, y: 1.4, z: 44 },
      { t: '候车厅', x: 4.4, y: 4.2, z: 26 }
    ]
  },

  /* ---------------- 公园小亭 ---------------- */
  gazebo: {
    title: '公园小亭',
    sub: '石桌石凳 · 许愿牌 · 石灯',
    room: { w: 6.4, d: 5.6, h: 58, bare: true, floor: '#dfe6d4', wallL: '#e8eedd', wallR: '#f1f5e8' },
    walls: [],
    // 亭子是开放的，不砌隔墙，只在近处垂一枝樱花，把画面前景压住
    foreground: [
      { type: 'plant', x: 1.75, y: 5.35, size: 1.1 },
      { type: 'floorCushion', x: 4.6, y: 4.35, c: '#dfe4cd' }
    ],
    props: [
      { type: 'stoneTable', x: 2.6, y: 2.2 },
      { type: 'stoneStool', x: 1.6, y: 2.6 },
      { type: 'stoneStool', x: 3.6, y: 2.6 },
      { type: 'stoneStool', x: 2.6, y: 3.6 },
      { type: 'wishRack', x: 0.6, y: 0.8, w: 1.8 },
      { type: 'stoneLantern', x: 5.2, y: 1.2 },
      { type: 'stoneLantern', x: 1.0, y: 4.6 },
      { type: 'flowerBed', x: 0.5, y: 1.9, w: 1.4, d: 0.7 },
      { type: 'plant', x: 5.6, y: 4.4, size: 0.9 }
    ],
    labels: [
      { t: '石桌石凳', x: 2.6, y: 2.8, z: 32 },
      { t: '许愿牌', x: 1.4, y: 0.9, z: 44 },
      { t: '石灯', x: 5.2, y: 1.4, z: 42 }
    ]
  }
}

/** 页面 → 场景的映射（书店那页用 home_book） */
export const SCENE_OF = {
  home: 'home_book',
  gamehome: 'home',
  store: 'store',
  school: 'school',
  gym: 'gym',
  station: 'station',
  park: 'gazebo'
}
