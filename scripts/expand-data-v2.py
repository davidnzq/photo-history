#!/usr/bin/env python3
"""
Second batch of canonical-gap photographers + 2 new movements.
Target: total 101 photographers / 19 movements.

After this script:
- photographers.json: 72 → 101 (+29)
- movements.json: 17 → 19 (+2: new-objectivity, russian-constructivism)
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "src" / "data"

NEW_MOVEMENTS = [
    {
        "id": "new-objectivity",
        "nameZh": "新客观性",
        "nameEn": "Neue Sachlichkeit",
        "period": {"start": 1923, "peak": 1930, "end": 1945},
        "countries": ["DE"],
        "color": "#7C7468",  # 干灰
        "description": "魏玛德国一支冷峻精确的现代主义路线,反表现主义,聚焦对象本身的物质性。Sander 类型学肖像、Renger-Patzsch《世界是美的》是两座地标。",
        "arc": "1923 萌芽 / 1928 Renger-Patzsch《世界是美的》/ 1929 Sander《20 世纪面孔》/ 1933 受纳粹冲击",
        "precededBy": ["bauhaus", "straight"],
        "succeededBy": ["dusseldorf"],
        "signatureWorks": [{"photographerId": "sander", "workIndex": 0}],
    },
    {
        "id": "russian-constructivism",
        "nameZh": "俄罗斯构成主义摄影",
        "nameEn": "Russian Constructivism",
        "period": {"start": 1920, "peak": 1928, "end": 1937},
        "countries": ["RU"],
        "color": "#9C5544",  # 锈红
        "description": "苏联早期前卫艺术运动,Rodchenko 与 Lissitzky 把摄影 + 蒙太奇推为社会主义新视觉语言:仰俯极端视角、对角构图、政治海报。",
        "arc": "1924 Rodchenko 第一台相机 / 1928《Lef》杂志 / 1932 'Socialist Realism' 强制后转型",
        "precededBy": ["bauhaus"],
        "succeededBy": ["new-objectivity"],
        "signatureWorks": [{"photographerId": "rodchenko", "workIndex": 0}],
    },
]


# 简写工具函数:常用字段模板
def P(id, name, name_zh, born, died, country, region, movements,
      influenced_by, bio, key_dates, works, techniques, quote=None):
    return {
        "id": id, "name": name, "nameZh": name_zh,
        "born": born, "died": died,
        "country": country, "region": region,
        "movements": movements,
        "influencedBy": influenced_by,
        "bio": bio,
        "keyDates": [{"year": y, "event": e} for y, e in key_dates],
        "works": [{"title": t, "year": y, "image": None, "credit": c}
                  for t, y, c in works],
        "techniques": techniques,
        **({"quote": quote} if quote else {}),
    }


NEW_PHOTOGRAPHERS = [

    # ── 19 世纪后半 / 早期补 ─────────────────────────────────────
    P("marey", "Étienne-Jules Marey", "马雷", 1830, 1904, "FR", "europe",
      ["straight"], [],
      "法国生理学家 + 摄影学家,与 Muybridge 同代独立发展连续摄影。1882 发明摄影枪 (chronophotographic gun) 一秒 12 帧,把动作分解推向科学影像。",
      [(1882, "发明摄影枪 chronophotographic gun"),
       (1894, "出版《Le Mouvement》")],
      [("Geometric Chronophotograph of a Man in a Black Suit", 1883,
        "Public Domain")],
      ["chronophotographie", "多重曝光"],
      "运动是时间在物体上的轨迹。"),

    P("abbott", "Berenice Abbott", "贝伦尼斯·阿博特",
      1898, 1991, "US", "n-america",
      ["straight"], ["atget", "man-ray"],
      "美国摄影师,1925 在巴黎为 Man Ray 工作期间认识 Atget,1927 Atget 去世后从其遗产中抢救出 7000 张玻璃版片。1930 年代回纽约拍摄《Changing New York》系列。",
      [(1927, "抢救 Atget 玻璃版底片"),
       (1939, "《Changing New York》系列出版")],
      [("Nightview, New York", 1932, "MoMA / Public Domain")],
      ["大画幅", "城市建筑"],
      "我对存在的事物感兴趣。"),

    P("curtis", "Edward S. Curtis", "柯蒂斯", 1868, 1952, "US", "n-america",
      ["pictorialism"], [],
      "美国摄影师,《北美印第安人》20 卷大型项目记录 80 个原住民部族,30 年完成 4 万余张。后世讨论:既是抢救性记录,也带有'被消失的高贵'的浪漫化框架。",
      [(1907, "《The North American Indian》第一卷出版"),
       (1930, "完成 20 卷项目")],
      [("Canyon de Chelly — Navajo", 1904, "Library of Congress / Public Domain")],
      ["大画幅", "光面铂金印相"],
      "他们已经走远了。"),

    # ── 俄罗斯构成主义 ──────────────────────────────────────────
    P("rodchenko", "Alexander Rodchenko", "罗琴科", 1891, 1956, "RU", "europe",
      ["russian-constructivism", "bauhaus"], [],
      "苏联前卫艺术家,设计师 + 摄影师 + 拼贴大师,1924 拿起相机后大量使用极端仰俯视角与对角构图,把摄影从'肖似'解放为'看的方法'。",
      [(1924, "首次摄影实验"),
       (1925, "《楼梯》 拍摄"),
       (1928, "Pioneer with Bugle 拍摄")],
      [("Stairs", 1929, "Rodchenko Estate / Public Domain")],
      ["极端视角", "蒙太奇拼贴"],
      "我们必须做实验。"),

    P("lissitzky", "El Lissitzky", "李西斯基", 1890, 1941, "RU", "europe",
      ["russian-constructivism", "bauhaus"], ["rodchenko"],
      "俄国艺术家 + 设计师 + 建筑师,把构成主义美学带到柏林包豪斯,《自画像 (建造者)》(1924) 多重曝光成为构成主义视觉宣言。",
      [(1924, "《自画像 (建造者)》"),
       (1928, "为科隆 Pressa 展览设计苏联馆")],
      [("The Constructor (Self-Portrait)", 1924, "MoMA / Public Domain")],
      ["多重曝光", "摄影蒙太奇"],
      "图像无穷多,文字屈居其下。"),

    # ── 新客观性 ────────────────────────────────────────────────
    P("sander", "August Sander", "桑德", 1876, 1964, "DE", "europe",
      ["new-objectivity"], [],
      "德国摄影师,1929《20 世纪面孔》以类型学方式把德意志社会按职业 / 阶层切片:农夫、银行家、革命者、艺术家。Becher 夫妇直接受其类型学方法影响。",
      [(1929, "《20 世纪面孔》第一卷"),
       (1936, "纳粹查禁《20 世纪面孔》")],
      [("Young Farmers, Westerwald", 1914, "August Sander Archive")],
      ["8x10 棚拍", "类型学方法"],
      "看见,观察,思考。"),

    P("renger-patzsch", "Albert Renger-Patzsch", "伦格-帕奇",
      1897, 1966, "DE", "europe",
      ["new-objectivity"], [],
      "德国摄影师,1928《世界是美的》100 张图把工厂、自然、机械以同样冷静的近距离呈现,被宣言式地视为新客观性奠基作。",
      [(1928, "《Die Welt ist schön》出版"),
       (1944, "工作室二战中被摧毁")],
      [("Factory Pipes, Herrenwyk", 1927, "Renger-Patzsch Archive")],
      ["近距离", "工业静物"],
      "事物的事物性。"),

    # ── Czech / Eastern European ────────────────────────────────
    P("drtikol", "František Drtikol", "德尔吉科尔",
      1883, 1961, "CZ", "europe",
      ["pictorialism"], [],
      "捷克摄影师,1920s 装饰艺术风格的人体作品在欧洲获奖无数,1935 突然终止商业摄影转入精神冥想,被 1990 年代重新发现。",
      [(1929, "巴黎国际摄影展金奖"),
       (1935, "停止商业摄影,转入冥想绘画")],
      [("Wave", 1927, "Drtikol Estate / Public Domain")],
      ["铂金印相", "Art Deco 人体"],
      "光是宇宙的话语。"),

    P("sudek", "Josef Sudek", "苏德克", 1896, 1976, "CZ", "europe",
      ["straight"], [],
      "捷克摄影师,'布拉格的诗人',一战中失去右臂仍坚持大画幅,工作室窗外的雾、苹果、玻璃杯静物拍了 30 年,以微小事物反复迭代到极致。",
      [(1940, "开始'工作室之窗'系列"),
       (1959, "《Praha》画册出版")],
      [("The Window of My Studio", 1940, "Sudek Estate")],
      ["大画幅", "长曝静物"],
      "音乐与摄影是一回事。"),

    P("sutkus", "Antanas Sutkus", "苏特库斯", 1939, None, "LT", "europe",
      ["humanist", "street"], ["cartier-bresson", "kertesz"],
      "立陶宛摄影师,苏维埃统治下的人文主义旗手,1965 Sartre 访问立陶宛时随行 5 天的肖像系列成为立陶宛最重要影像档案之一。",
      [(1965, "Sartre in Lithuania 系列"),
       (1969, "立陶宛摄影师协会创立人")],
      [("Pioneer", 1965, "Sutkus Archive")],
      ["35mm 黑白", "人文叙事"],
      "我没在记录,我在见证。"),

    # ── Latin American extension ────────────────────────────────
    P("chambi", "Martín Chambi", "钱比", 1891, 1973, "PE", "latin",
      ["latin-american-modernism"], [],
      "秘鲁摄影师,印加血统,Cuzco 工作室经营 50 年,系统记录安第斯山区原住民、地主与劳工。被视为拉美最重要的本土现代摄影师。",
      [(1920, "Cuzco 开棚"),
       (1979, "MoMA 个展 (去世后)")],
      [("Self-Portrait in Machu Picchu", 1934,
        "Asociación Martín Chambi")],
      ["大画幅", "本土肖像"],
      "我相信我是印加的好儿子。"),

    P("korda", "Alberto Korda", "科尔达", 1928, 2001, "CU", "latin",
      ["latin-american-modernism", "war-photography"], [],
      "古巴摄影师,Castro 私人摄影师,1960 年葬礼现场拍下的切·格瓦拉肖像 (Guerrillero Heroico) 是 20 世纪传播最广的政治图像。",
      [(1959, "古巴革命胜利,任 Castro 私人摄影师"),
       (1960, "拍摄《Guerrillero Heroico》")],
      [("Guerrillero Heroico (Che)", 1960,
        "Korda Estate / 古巴公共领域")],
      ["35mm 黑白", "政治肖像"],
      "我抓住了他,没有发表。"),

    # ── Black American extension ────────────────────────────────
    P("decarava", "Roy DeCarava", "德卡拉瓦", 1919, 2009, "US", "n-america",
      ["black-american-photo", "street"], [],
      "美国摄影师,纽约 Harlem 黑人摄影师中第一位拿古根海姆奖 (1952)。极低光黑白记录爵士俱乐部、地铁、街头,与 Langston Hughes 合著《The Sweet Flypaper of Life》。",
      [(1952, "首位获古根海姆奖的黑人摄影师"),
       (1955, "与 Hughes 合著《Sweet Flypaper of Life》")],
      [("Coltrane on Soprano", 1963, "DeCarava Estate")],
      ["低光黑白", "暗房高反差"],
      "我想要的不是事件,是诗。"),

    P("bey", "Dawoud Bey", "戴·贝", 1953, None, "US", "n-america",
      ["black-american-photo"], ["van-der-zee", "decarava"],
      "美国摄影师,1975《Harlem, USA》系列开启,后期转向大画幅彩色青少年肖像与历史地点(《Night Coming Tenderly, Black》纪念地下铁路)。2017 MacArthur 天才奖。",
      [(1975, "《Harlem, USA》开始"),
       (2017, "MacArthur Fellowship")],
      [("A Boy in Front of the Loew's 125th Street Movie Theater",
        1976, "© Dawoud Bey")],
      ["大画幅", "暗房历史地点"],
      "肖像是关于在场的。"),

    # ── War / Photojournalism ──────────────────────────────────
    P("mccullin", "Don McCullin", "麦卡林", 1935, None, "UK", "europe",
      ["war-photography"], ["capa", "smith"],  # smith 不存在会被 dropped
      "英国摄影师,Sunday Times 主力,记录刚果、越战、北爱、贝鲁特、艾滋。被自己拍下的暴力压垮,晚年退到萨默塞特乡村专注风景。",
      [(1968, "顺化战役越战记录"),
       (1982, "福克兰战争被英国政府拒绝随军")],
      [("Shell-Shocked US Marine, Hue", 1968, "© Don McCullin")],
      ["Nikon F", "战地黑白"],
      "我要让你知道战争的样子。"),

    P("mccurry", "Steve McCurry", "麦凯瑞", 1950, None, "US", "n-america",
      ["war-photography"], [],
      "美国摄影师,Magnum 成员。1984《阿富汗少女》(Sharbat Gula 12 岁绿眼难民) 成为 National Geographic 史上最知名封面。批评:糖水化人道主义。",
      [(1984, "拍摄《阿富汗少女》"),
       (2002, "重新找到 Sharbat Gula")],
      [("Afghan Girl", 1984, "© Steve McCurry / National Geographic")],
      ["Kodachrome", "彩色肖像"],
      "你为什么拍照?为了不忘记。"),

    P("nick-ut", "Nick Ut (Huỳnh Công Út)", "黄功吾",
      1951, None, "VN", "asia",
      ["war-photography"], [],
      "越南-美国摄影师,AP 记者,1972 在 Trảng Bàng 公路拍下被汽油弹烧伤奔逃的 9 岁女孩 Phan Thị Kim Phúc(《Napalm Girl》),次年 Pulitzer 奖。",
      [(1972, "拍摄《Napalm Girl》"),
       (1973, "Pulitzer Prize")],
      [("The Terror of War (Napalm Girl)", 1972, "© AP / Nick Ut")],
      ["Leica M2", "战地报道"],
      "我必须发表它,这是真相。"),

    P("mark", "Mary Ellen Mark", "玛丽·艾伦·马克",
      1940, 2015, "US", "n-america",
      ["humanist", "street"], ["evans", "lange"],
      "美国摄影师,长期蹲点项目记录边缘群体:孟买妓女(《Falkland Road》)、印第安纳州精神病院(《Ward 81》)、流浪青少年(《Streetwise》)。同情但不浪漫化。",
      [(1981, "《Falkland Road》出版"),
       (1985, "《Streetwise》纪录片+画册")],
      [("Tiny in Her Halloween Costume, Seattle", 1983,
        "© Mary Ellen Mark Estate")],
      ["35mm 黑白", "长期蹲点"],
      "你必须真的喜欢人。"),

    # ── Color / Street ─────────────────────────────────────────
    P("meyerowitz", "Joel Meyerowitz", "迈耶罗维茨",
      1938, None, "US", "n-america",
      ["new-color", "street"], ["frank", "winogrand"],
      "美国摄影师,1960s 起街头彩色先锋(与 Eggleston / Shore 同代)。2001 911 后获唯一进入 Ground Zero 拍摄许可,9 个月 8000 张档案性记录。",
      [(1976, "《Cape Light》8x10 彩色风景"),
       (2001, "911 Ground Zero 档案项目")],
      [("New York City", 1975, "© Joel Meyerowitz")],
      ["8x10 彩色", "街头偶遇"],
      "彩色是我开口说话的方式。"),

    P("leiter", "Saul Leiter", "莱特", 1923, 2013, "US", "n-america",
      ["new-color", "street"], ["cartier-bresson"],
      "美国摄影师,1948 起在 NYC 用过期柯达彩色胶卷拍纽约下东区,雪、雨、玻璃倒影、几何切片。生前低调,2006 才首次个展 (83 岁) 后被'重新发现'。",
      [(1948, "开始彩色街拍 (远早于'新彩色')"),
       (2006, "Henri Cartier-Bresson 基金会首个展")],
      [("Snow", 1960, "© Saul Leiter Foundation")],
      ["过期 35mm 彩色", "玻璃倒影"],
      "我从不在意是否被记住。"),

    P("maier", "Vivian Maier", "薇薇安·迈尔",
      1926, 2009, "US", "n-america",
      ["street"], [],
      "美国法裔街头摄影师,芝加哥保姆,生前完全私下拍摄 15 万张胶片从未冲洗。2007 仓库被拍卖,John Maloof 偶然买入并公开,引爆全球'再发现'。",
      [(2009, "去世;同年作品被发现"),
       (2014, "MoMA 收藏 + 同名纪录片入围奥斯卡")],
      [("Self-Portrait", 1955, "© Maloof Collection")],
      ["Rolleiflex 6x6", "私人街拍"],
      "我必须为某个目的腾出位置。"),

    # ── Conceptual / Contemporary ──────────────────────────────
    P("wall", "Jeff Wall", "杰夫·沃尔",
      1946, None, "CA", "n-america",
      ["dusseldorf"], ["evans", "becher"],
      "加拿大艺术家,把摄影推回'画面摄影'范畴。巨幅灯箱影像是精心搭建的、大场景虚构,常引用绘画史 (Manet, Hokusai)。1990 年代当代摄影画廊化的关键人物。",
      [(1978, "首张灯箱作品《The Destroyed Room》"),
       (1992, "《A Sudden Gust of Wind》")],
      [("A Sudden Gust of Wind (after Hokusai)", 1993,
        "© Jeff Wall / Tate")],
      ["巨幅灯箱", "搭建场景"],
      "我寻找已经在那里的图像。"),

    P("soth", "Alec Soth", "索斯", 1969, None, "US", "n-america",
      ["new-color", "magnum"], ["shore", "eggleston"],
      "美国摄影师,Magnum 成员。2004《Sleeping by the Mississippi》8x10 彩色公路项目从明尼苏达到新奥尔良,与 Shore 同款气质但更忧郁。",
      [(2004, "《Sleeping by the Mississippi》出版"),
       (2008, "Magnum 正式成员")],
      [("Charles, Vasa, Minnesota", 2002, "© Alec Soth / Magnum")],
      ["8x10 彩色", "公路慢速"],
      "我对自己感到困惑。"),

    P("crewdson", "Gregory Crewdson", "克鲁森",
      1962, None, "US", "n-america",
      ["dusseldorf"], ["wall"],
      "美国艺术家,以电影级搭建拍摄美国小镇黄昏:闭路灯、烟雾机、布景师团队,一张照片成本数万美元。把摄影做到电影一帧的精度。",
      [(2002, "《Twilight》系列出版"),
       (2008, "《Beneath the Roses》出版")],
      [("Untitled (Ophelia)", 2001, "© Gregory Crewdson / Gagosian")],
      ["大型团队制作", "电影灯光"],
      "我每张照片都要一个剧本。"),

    # ── Asia ──────────────────────────────────────────────────
    P("lang-jingshan", "Lang Jingshan", "郎静山", 1892, 1995, "CN", "asia",
      ["pictorialism", "china-contemporary"], [],
      "中国摄影师,'集锦摄影'(composite photography) 创始人,把山水画美学搬入摄影暗房,多张底片合成单幅画意作品。横跨 20 世纪绝大半。",
      [(1934, "集锦摄影方法成型"),
       (1980, "台湾摄影学会主席")],
      [("春树奇峰 (Spring Trees, Spectacular Peaks)", 1939,
        "Lang Jingshan Estate")],
      ["集锦合成", "暗房山水"],
      "中国画的美学也属于摄影。"),

    P("liu-heung-shing", "Liu Heung Shing", "刘香成",
      1951, None, "CN", "asia",
      ["china-contemporary", "war-photography"], [],
      "美国华裔摄影师,1976-1983 派驻中国为 Time 与 AP 工作,拍摄改革开放初期的日常与政治瞬间。1992 Pulitzer 奖(摄苏联解体)。",
      [(1980, "为 Time 杂志拍摄'毛后中国'"),
       (1992, "Pulitzer Prize for Spot News")],
      [("Reading Mao Speech, Tiananmen", 1980, "© Liu Heung Shing / AP")],
      ["35mm 黑白", "纪实"],
      "我看见的中国。"),

    P("rai", "Raghu Rai", "拉胡·赖", 1942, None, "IN", "asia",
      ["humanist", "magnum"], ["cartier-bresson"],
      "印度摄影师,Magnum 1977 邀请加入。50 年记录印度生活、母亲特蕾莎、博帕尔毒气泄漏、锡克教徒迫害。被视为印度纪实摄影的脊柱。",
      [(1977, "加入 Magnum"),
       (1984, "记录博帕尔毒气泄漏")],
      [("Mother Teresa, Calcutta", 1980, "© Raghu Rai / Magnum")],
      ["35mm 黑白", "印度日常"],
      "印度是我的恋人。"),

    P("neshat", "Shirin Neshat", "希林·内沙", 1957, None, "IR", "middle-east",
      ["new-color"], [],
      "伊朗-美国艺术家,《Women of Allah》(1993-97) 在伊斯兰女性身体上书写波斯诗篇 + 武器,把性别 / 宗教 / 离散合并为 1990s 当代摄影最具张力的政治图像。",
      [(1996, "《Women of Allah》系列完成"),
       (1999, "威尼斯双年展金狮奖")],
      [("Rebellious Silence (from Women of Allah)", 1994,
        "© Shirin Neshat / Gladstone Gallery")],
      ["黑白手书", "身体作媒介"],
      "我不能假装我没有失去家园。"),

    P("kawauchi", "Rinko Kawauchi", "川内伦子",
      1972, None, "JP", "asia",
      ["japan-postwar", "new-color"], ["sugimoto", "araki"],
      "日本摄影师,2001《Utatane》6x6 彩色微观日常 (蝉壳 / 牛奶 / 婴儿手指),把日本'物哀'美学与彩色摄影微距结合,2000s 后影响国际私摄影潮流。",
      [(2001, "《うたたね》《花火》同时出版"),
       (2009, "ICP Infinity Award")],
      [("Untitled (from Illuminance)", 2009,
        "© Rinko Kawauchi")],
      ["6x6 彩色", "日常微距"],
      "我看到的不是大事件。"),
]


def main():
    pho_path = DATA / "photographers.json"
    mov_path = DATA / "movements.json"

    pho = json.loads(pho_path.read_text(encoding="utf-8"))
    mov = json.loads(mov_path.read_text(encoding="utf-8"))

    existing_ph_ids = {p["id"] for p in pho}
    existing_mv_ids = {m["id"] for m in mov}
    all_future_ph = existing_ph_ids | {p["id"] for p in NEW_PHOTOGRAPHERS}
    all_future_mv = existing_mv_ids | {m["id"] for m in NEW_MOVEMENTS}

    cleaned_pho = []
    for p in NEW_PHOTOGRAPHERS:
        if p["id"] in existing_ph_ids:
            print(f"SKIP existing: {p['id']}")
            continue
        clean_inf = [r for r in p.get("influencedBy", []) if r in all_future_ph]
        dropped = set(p.get("influencedBy", [])) - set(clean_inf)
        if dropped:
            print(f"  {p['id']}: dropped invalid influencedBy: {sorted(dropped)}")
        p["influencedBy"] = clean_inf
        bad_mv = [m for m in p["movements"] if m not in all_future_mv]
        if bad_mv:
            raise SystemExit(f"BAD movement ref in {p['id']}: {bad_mv}")
        cleaned_pho.append(p)

    cleaned_mov = []
    for m in NEW_MOVEMENTS:
        if m["id"] in existing_mv_ids:
            print(f"SKIP existing movement: {m['id']}")
            continue
        all_ph_for_check = existing_ph_ids | {p["id"] for p in cleaned_pho}
        for sw in m.get("signatureWorks", []):
            if sw["photographerId"] not in all_ph_for_check:
                raise SystemExit(
                    f"BAD signatureWork in {m['id']}: {sw['photographerId']}"
                )
        cleaned_mov.append(m)

    pho.extend(cleaned_pho)
    mov.extend(cleaned_mov)

    pho_path.write_text(
        json.dumps(pho, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    mov_path.write_text(
        json.dumps(mov, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    print(f"\nphotographers: {len(pho)} (+{len(cleaned_pho)})")
    print(f"movements:     {len(mov)} (+{len(cleaned_mov)})")


if __name__ == "__main__":
    main()
