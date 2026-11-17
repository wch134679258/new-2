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
      { type: 'windowWall', face: 'left', u0: 1.2, u1: 3.4, z0: 24, z1: 56 },
      { type: 'poster', face: 'right', u0: 0.9, u1: 2.0, z0: 26, z1: 44, c: '#f2a8bd', c2: '#a8c6d9' },
      { type: 'poster', face: 'left', u0: 4.4, u1: 5.2, z0: 30, z1: 40, c: '#c9a06a', c2: '#e6d3c4' }
    ],
    props: [
      // 玄关
      { type: 'rug', x: 0.3, y: 4.9, w: 1.5, d: 1.2, c: '#e8d3c0', c2: '#f4e6d8' },
      { type: 'benchLong', x: 0.3, y: 4.5, w: 1.5, d: 0.5 },
      { type: 'plant', x: 1.6, y: 0.6, size: 0.9 },
      // 客厅
      { type: 'rug', x: 1.5, y: 2.0, w: 2.8, d: 2.2, c: '#f7dfe6', c2: '#fdedf1' },
      { type: 'sofa', x: 1.6, y: 1.2, w: 2.3, d: 0.9 },
      { type: 'table', x: 2.1, y: 2.7, w: 1.3, d: 0.7, h: 12, top: '#d9b18e' },
      { type: 'cushion', x: 1.4, y: 3.9 },
      // 卧室
      { type: 'bed', x: 4.9, y: 0.5, w: 2.1, d: 2.9 },
      { type: 'desk', x: 4.9, y: 3.7, w: 1.7, d: 0.75 },
      { type: 'chair', x: 5.5, y: 4.6 },
      { type: 'shelf', x: 6.5, y: 0.4, w: 0.6, d: 2.0, h: 40, rows: 3 },
      { type: 'lamp', x: 0.7, y: 6.0 },
      { type: 'plant', x: 3.9, y: 5.7, size: 0.8 }
    ],
    // 后院：房间前方的一块草地
    extras: [
      { kind: 'ground', x: 0, y: 7.4, w: 4.4, d: 2.4, fill: '#d7e4c8' },
      { type: 'fence', x: 0.1, y: 7.5, w: 4.2 },
      { type: 'flowerBed', x: 0.4, y: 8.2, w: 2.2, d: 0.7 },
      { type: 'swing', x: 3.0, y: 8.6 }
    ],
    labels: [
      { t: '玄关', x: 1.6, y: 6.1, z: 26 },
      { t: '客厅', x: 3.3, y: 3.9, z: 34 },
      { t: '卧室', x: 6.2, y: 3.7, z: 40 },
      { t: '后院', x: 3.2, y: 9.0, z: 26 }
    ]
  },

  /* ---------------- 书店 ---------------- */
  home_book: {
    title: '书店',
    sub: '橱窗 · 主厅 · 阁楼',
    room: { w: 7.4, d: 6.4, h: 72, floor: '#eddcc6', wallL: '#f3e3d4', wallR: '#f8ece0' },
    walls: [
      { type: 'windowWall', face: 'left', u0: 0.6, u1: 3.0, z0: 10, z1: 46 },
      { type: 'poster', face: 'right', u0: 0.8, u1: 2.2, z0: 34, z1: 54, c: '#d4708c', c2: '#7f9fc9' }
    ],
    props: [
      // 橱窗里的展示台
      { type: 'table', x: 0.4, y: 1.0, w: 2.2, d: 0.6, h: 14, top: '#e8d3b8' },
      { type: 'shelf', x: 0.5, y: 1.9, w: 2.1, d: 0.45, h: 30, rows: 2, c: '#d9b48c' },
      // 主厅书架
      { type: 'shelf', x: 3.4, y: 0.4, w: 3.6, d: 0.55, h: 54, rows: 4 },
      { type: 'shelf', x: 3.4, y: 2.2, w: 3.6, d: 0.55, h: 54, rows: 4 },
      { type: 'shelf', x: 3.4, y: 3.5, w: 2.4, d: 0.55, h: 44, rows: 3 },
      // 阅读角
      { type: 'rug', x: 0.4, y: 3.6, w: 2.6, d: 2.0, c: '#e9dcc9', c2: '#f6ecdd' },
      { type: 'table', x: 1.0, y: 4.0, w: 1.2, d: 0.8, h: 12 },
      { type: 'chair', x: 0.4, y: 4.2 },
      { type: 'chair', x: 2.3, y: 4.2 },
      { type: 'lamp', x: 0.5, y: 5.8 },
      { type: 'plant', x: 6.6, y: 5.4, size: 0.9 },
      // 阁楼梯
      { type: 'shelf', x: 6.3, y: 2.4, w: 0.9, d: 0.5, h: 34, rows: 2, c: '#b08a6a' }
    ],
    labels: [
      { t: '橱窗', x: 1.4, y: 1.6, z: 40 },
      { t: '主厅', x: 5.0, y: 2.6, z: 52 },
      { t: '阅读角', x: 1.6, y: 5.2, z: 34 }
    ]
  },

  /* ---------------- 便利店 ---------------- */
  store: {
    title: '便利店',
    sub: '进门 · 主区域 · 收银台',
    room: { w: 7.2, d: 6.2, h: 64, floor: '#eef1e6', wallL: '#e8f0e4', wallR: '#f4f8ee' },
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
      { type: 'counter', x: 0.6, y: 1.4, w: 1.9, d: 0.6 },
      { type: 'register', x: 1.0, y: 1.5 },
      { type: 'counter', x: 0.6, y: 2.4, w: 1.2, d: 0.5, l: '#dce4da', r: '#c6cfc4', t: '#eef4ea' },
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
      // 休息角
      { type: 'waterStation', x: 3.6, y: 4.6 },
      { type: 'benchLong', x: 4.6, y: 4.8, w: 1.8 },
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
    walls: [
      { type: 'windowWall', face: 'left', u0: 0.8, u1: 3.6, z0: 20, z1: 50 },
      { type: 'poster', face: 'right', u0: 3.4, u1: 4.8, z0: 32, z1: 52, c: '#8f7794', c2: '#d9cbe0' }
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
    room: { w: 6.4, d: 5.6, h: 58, floor: '#dfe6d4', wallL: '#e8eedd', wallR: '#f1f5e8' },
    walls: [],
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
