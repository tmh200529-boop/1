--[[
原神 · 幽境危战 自动战斗脚本(脚本精灵 / Lua)

流程:
  1. 循环战斗:依次切人 → E → Q → 普攻,所有操作与切人间隔 30ms
  2. 战斗中随时检测“挑战成功”界面,检测到 → 立即停止脚本
  3. 超过 TIMEOUT 秒仍未击败 → 打开暂停菜单 → 重新挑战 → 继续循环

⚠ 使用前必须做的事(否则脚本无法工作):
  A. 修改下方【适配层】:把 tap / getColor / sleepMs / stop 换成脚本精灵里对应的函数
     (我没能核实脚本精灵的 API 名称与参数,这里是常见 Lua 脚本引擎的写法)
  B. 修改【CONFIG】里的坐标和颜色:按你手机分辨率,用脚本精灵的取点/取色工具获取
     可先运行 calibrate() 打印某点颜色辅助取色
⚠ 米哈游用户协议禁止第三方自动化工具,有封号风险,请自行承担。
]]

------------------------------------------------------------
-- 适配层:只需要改这里
------------------------------------------------------------
local function sleepMs(ms)  mSleep(ms) end            -- 毫秒级延时
local function tap(x, y)    tap(x, y) end             -- 单击(若引擎 tap 函数同名,请改名避免递归)
local function getColor(x, y) return getColor(x, y) end -- 返回该点颜色值(整数 0xRRGGBB)
local function stopScript() os.exit() end             -- 结束脚本(例如 lua 引擎的 exit/stop)
local function log(msg) print(msg) end

------------------------------------------------------------
-- 配置:按你的设备修改
------------------------------------------------------------
local CONFIG = {
  DELAY_MS = 30,          -- 操作与切人延迟(按你的要求固定 30ms)
  TIMEOUT  = 150,         -- 单次挑战限时(秒),超过且未击败则重新挑战
  COLOR_TOL = 12,         -- 取色容差(每个 RGB 通道允许偏差)

  -- 队伍切人按钮(右侧头像 1~4)
  SLOTS = { {2200, 300}, {2200, 450}, {2200, 600}, {2200, 750} },

  BTN_ATTACK = {2100, 950},   -- 普攻
  BTN_SKILL  = {1900, 1000},  -- 元素战技 E
  BTN_BURST  = {2000, 800},   -- 元素爆发 Q
  ATTACKS_PER_CHAR = 3,       -- 每个角色上场后普攻次数

  -- 胜利判定:“挑战成功”界面上的几个特征点(坐标 + 颜色),全部匹配才算胜利
  VICTORY_POINTS = {
    {1200, 200, 0xFFFFFF},
    {1200, 900, 0xECE5D8},
  },

  -- 重新挑战流程:暂停 → 重新挑战 → 确认
  BTN_PAUSE   = {80, 60},
  BTN_RETRY   = {400, 700},
  BTN_CONFIRM = {1500, 650},
  LOAD_WAIT_MS = 8000,        -- 重新挑战后的加载等待
}

------------------------------------------------------------
-- 工具函数
------------------------------------------------------------
local D = CONFIG.DELAY_MS

local function press(p)
  tap(p[1], p[2])
  sleepMs(D)
end

local function colorNear(c1, c2, tol)
  local function ch(c, s) return math.floor(c / s) % 256 end
  return math.abs(ch(c1, 65536) - ch(c2, 65536)) <= tol
     and math.abs(ch(c1, 256)   - ch(c2, 256))   <= tol
     and math.abs(c1 % 256      - c2 % 256)      <= tol
end

-- 是否出现“挑战成功”界面(敌人已被击败)
local function victory()
  for _, p in ipairs(CONFIG.VICTORY_POINTS) do
    if not colorNear(getColor(p[1], p[2]), p[3], CONFIG.COLOR_TOL) then
      return false
    end
  end
  return true
end

-- 辅助取色:打印某点颜色,用来填写 VICTORY_POINTS
function calibrate(x, y)
  log(string.format("(%d,%d) = 0x%06X", x, y, getColor(x, y)))
end

------------------------------------------------------------
-- 战斗
------------------------------------------------------------
-- 返回 true 表示检测到胜利
local function fightRound()
  for i = 1, #CONFIG.SLOTS do
    press(CONFIG.SLOTS[i])            -- 切人
    press(CONFIG.BTN_SKILL)           -- E
    press(CONFIG.BTN_BURST)           -- Q
    for _ = 1, CONFIG.ATTACKS_PER_CHAR do
      press(CONFIG.BTN_ATTACK)        -- 普攻
    end
    if victory() then return true end
  end
  return false
end

local function retry()
  log("超时未击败,重新挑战")
  press(CONFIG.BTN_PAUSE)
  sleepMs(500)
  press(CONFIG.BTN_RETRY)
  sleepMs(500)
  press(CONFIG.BTN_CONFIRM)
  sleepMs(CONFIG.LOAD_WAIT_MS)
end

------------------------------------------------------------
-- 主循环
------------------------------------------------------------
local function main()
  local attempt = 1
  while true do
    log("第 " .. attempt .. " 次挑战")
    local startTime = os.time()
    while os.time() - startTime < CONFIG.TIMEOUT do
      if fightRound() then
        log("敌人已被击败,脚本停止")
        stopScript()
        return
      end
    end
    -- 限时到:再确认一次是否已胜利,否则重开
    if victory() then
      log("敌人已被击败,脚本停止")
      stopScript()
      return
    end
    retry()
    attempt = attempt + 1
  end
end

main()
