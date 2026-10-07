#!/usr/bin/env python3
"""原神辅助操作脚本(仅 Windows,需要以管理员身份运行)

功能(热键切换,默认见 config.json):
  F6  自动剧情:按空格推进对话,遇到选项按 F
  F7  自动拾取:连续按 F
  F8  自动战斗循环:按配置依次释放 E / Q / 普攻
  F9  退出

仅在原神窗口处于前台时才会发送按键,避免误操作其他程序。
只使用屏幕截图 + 模拟键鼠,不读写游戏内存、不注入进程。

⚠ 风险提示:米哈游用户协议禁止使用任何第三方自动化工具,
  使用本脚本有被警告/封号的风险,请自行评估,不要用于国际服/他人账号代练。
"""
import json
import sys
import threading
import time
from pathlib import Path

try:
    import ctypes
    import keyboard
    import pydirectinput
except ImportError as e:  # pragma: no cover
    sys.exit(f"缺少依赖: {e}\n请先执行: pip install -r requirements.txt")

pydirectinput.PAUSE = 0
CONFIG = json.loads((Path(__file__).parent / "config.json").read_text(encoding="utf-8"))


def foreground_title() -> str:
    """返回当前前台窗口标题(Windows)。"""
    user32 = ctypes.windll.user32
    hwnd = user32.GetForegroundWindow()
    buf = ctypes.create_unicode_buffer(256)
    user32.GetWindowTextW(hwnd, buf, 256)
    return buf.value


def game_active() -> bool:
    return CONFIG["window_title"] in foreground_title()


def tap(key: str, hold: float = 0.05):
    pydirectinput.keyDown(key)
    time.sleep(hold)
    pydirectinput.keyUp(key)


class Worker(threading.Thread):
    """可开关的后台任务线程。"""

    def __init__(self, name, step):
        super().__init__(daemon=True)
        self.name, self.step = name, step
        self.enabled = threading.Event()

    def toggle(self):
        if self.enabled.is_set():
            self.enabled.clear()
            print(f"[{self.name}] 已关闭")
        else:
            self.enabled.set()
            print(f"[{self.name}] 已开启")

    def run(self):
        while True:
            self.enabled.wait()
            if game_active():
                self.step()
            else:
                time.sleep(0.5)


def dialogue_step():
    tap("space")
    tap("f")
    time.sleep(CONFIG["dialogue"]["interval"])


def pickup_step():
    tap("f")
    time.sleep(CONFIG["pickup"]["interval"])


def combat_step():
    for act in CONFIG["combat"]["sequence"]:
        if "key" in act:
            tap(act["key"], act.get("hold", 0.05))
        elif "click" in act:
            for _ in range(act.get("times", 1)):
                pydirectinput.click(button=act["click"])
                time.sleep(0.05)
        time.sleep(act.get("wait", 0.2))
    time.sleep(CONFIG["combat"]["loop_delay"])


def main():
    hk = CONFIG["hotkeys"]
    workers = {
        "toggle_dialogue": Worker("自动剧情", dialogue_step),
        "toggle_pickup": Worker("自动拾取", pickup_step),
        "toggle_combat": Worker("自动战斗", combat_step),
    }
    for key, w in workers.items():
        w.start()
        keyboard.add_hotkey(hk[key], w.toggle)

    print("脚本已启动(请确保以管理员身份运行,游戏使用窗口/无边框模式)")
    for key, w in workers.items():
        print(f"  {hk[key].upper():>3}  切换 {w.name}")
    print(f"  {hk['quit'].upper():>3}  退出")
    keyboard.wait(hk["quit"])
    print("已退出")


if __name__ == "__main__":
    main()
