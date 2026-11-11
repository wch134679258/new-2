// ============================================================
//  樱花小镇 · 金币与体力接口
// ------------------------------------------------------------
//  后端接口（全部需要登录，http 层自动带 Bearer token）：
//    GET  /api/economy/state            小镇状态：余额 / 体力 / 各类倒计时
//    GET  /api/economy/owned            已购书目 id 列表
//    GET  /api/economy/logs?limit=20    金币流水
//    POST /api/economy/work             { score }      便利店打工
//    POST /api/economy/gym/train                        健身房私教课
//    POST /api/economy/gym/drink                        健身房蛋白饮
//    POST /api/economy/sleep                            回家睡觉
//    POST /api/economy/bench                            公园长椅歇脚
//    GET  /api/economy/drinks                           贩卖机货道
//    POST /api/economy/drinks/buy       { key }         贩卖机买饮料
//    POST /api/economy/shop/buy         { articleId }   书店买书
//    POST /api/economy/game             { game, score } 小游戏结算
//
//  所有写接口的返回值都自带最新状态（money / energy / ...），
//  调用方直接把它丢给 useEconomy().sync() 就能刷新 HUD，不必再补一次 GET。
// ============================================================

import { http } from './http'

/** 小镇状态：余额、体力、恢复倒计时、打工冷却、已购数量 */
export function fetchState () {
  return http.get('/economy/state')
}

/** 已购书目 id 列表（书店标记「已入手」） */
export async function fetchOwned () {
  const res = await http.get('/economy/owned')
  return (res && res.list) || []
}

/** 金币流水，最新在前 */
export async function fetchLogs (limit = 20) {
  const res = await http.get('/economy/logs', { limit })
  return (res && res.list) || []
}

/** 便利店打工结算：score 是收银小游戏的命中表现（0~100） */
export function workShift (score) {
  return http.post('/economy/work', { score: Math.round(score || 0) })
}

/** 健身房：私教课（花钱提高体力上限） */
export function gymTrain () {
  return http.post('/economy/gym/train')
}

/** 健身房：蛋白饮（花钱换体力） */
export function gymDrink () {
  return http.post('/economy/gym/drink')
}

/** 在家睡觉：每天一次，体力回满 */
export function sleepAtHome () {
  return http.post('/economy/sleep')
}

/** 公园长椅歇脚：免费恢复少量体力，服务端有冷却 */
export function benchRest () {
  return http.post('/economy/bench')
}

/** 贩卖机货道列表 */
export async function fetchDrinks () {
  const res = await http.get('/economy/drinks')
  return (res && res.list) || []
}

/** 贩卖机买一瓶（key 如 cola / water / energy） */
export function buyDrink (key) {
  return http.post('/economy/drinks/buy', { key })
}

/** 书店买书（价格由服务端决定，这里只传 id） */
export function buyBook (articleId) {
  return http.post('/economy/shop/buy', { articleId })
}

/** 小游戏结算：game = snake / tetris / fish */
export function claimGameReward (game, score) {
  return http.post('/economy/game', { game, score: Math.round(score || 0) })
}
