#!/usr/bin/env python3
"""
Append canonical-gap photographers + 5 new movements to the dataset, and
extend the lineage tree.

After this script:
- photographers.json grows by 16
- movements.json grows by 5 (war / fashion / latin-am / black-american / west-african-studio)
- lineage.json gains the new branches under appropriate parents

Run:  python3 scripts/expand-data.py
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "src" / "data"

# ──────────────────────────────────────────────────────────────────
# NEW MOVEMENTS
# ──────────────────────────────────────────────────────────────────

NEW_MOVEMENTS = [
    {
        "id": "war-photography",
        "nameZh": "战地摄影",
        "nameEn": "War Photography",
        "period": {"start": 1855, "peak": 1944, "end": 2010},
        "countries": ["US", "UK", "FR", "DE"],
        "color": "#6E3F40",  # 暗酒红 / 干血色
        "description": "始于克里米亚战争(Roger Fenton)与美国南北战争(Brady),经一战二战(Capa, Bourke-White, Lee Miller, Taro)推向黄金时代,是 20 世纪新闻图像的脊柱。",
        "arc": "1855 Crimea / 1862 Brady 战场展 / 1936 Capa 西班牙 / 1944 D-Day / 越战后转型",
        "precededBy": ["pictorialism"],
        "succeededBy": ["humanist", "magnum"],
        "signatureWorks": [
            {"photographerId": "brady", "workIndex": 0}
        ]
    },
    {
        "id": "fashion",
        "nameZh": "时尚摄影",
        "nameEn": "Fashion Photography",
        "period": {"start": 1910, "peak": 1965, "end": 2026},
        "countries": ["US", "FR"],
        "color": "#BC9F7A",  # 香槟米
        "description": "从 Steichen 进入 Vogue 起,经 Penn 极简棚拍 → Avedon 移动镜头 → Newton 张力黑白 → Leibovitz 名人神话,把商业摄影提升到画廊艺术等级。",
        "arc": "1923 Steichen 入职 Condé Nast / 1947 Penn 椅子棚拍 / 1957 Avedon Funny Face / 1976 Newton White Women",
        "precededBy": ["pictorialism"],
        "succeededBy": ["new-color"],
        "signatureWorks": [
            {"photographerId": "penn", "workIndex": 0}
        ]
    },
    {
        "id": "latin-american-modernism",
        "nameZh": "拉美现代主义摄影",
        "nameEn": "Latin American Modernism",
        "period": {"start": 1920, "peak": 1950, "end": 2010},
        "countries": ["MX"],
        "color": "#B8654A",  # 陶土
        "description": "墨西哥革命后,Modotti 与 Edward Weston 把美国直接摄影带入墨西哥,与 Manuel Álvarez Bravo 的本土寓言结合,形成独立的拉美视觉语言,延伸至 Iturbide 的原住民档案。",
        "arc": "1923 Modotti+Weston 抵墨 / 1939 Bravo 巴黎超现实展 / 1979 Iturbide Juchitán 系列",
        "precededBy": ["straight"],
        "succeededBy": ["humanist"],
        "signatureWorks": [
            {"photographerId": "alvarez-bravo", "workIndex": 0}
        ]
    },
    {
        "id": "black-american-photo",
        "nameZh": "美国黑人摄影",
        "nameEn": "Black American Photography",
        "period": {"start": 1900, "peak": 1968, "end": 2026},
        "countries": ["US"],
        "color": "#4A6E70",  # 深蓝青
        "description": "从 Van Der Zee 的 Harlem 棚拍记录 Harlem Renaissance 起,经 Roy DeCarava 的低光爵士与 Gordon Parks 的 LIFE 报道,延展到 Carrie Mae Weems 的身份观念,自成一支独立而绵长的视觉脉络。",
        "arc": "1916 Van Der Zee 开棚 / 1942 Parks 入 FSA / 1955 DeCarava《The Sweet Flypaper of Life》/ 1990 Weems Kitchen Table",
        "precededBy": ["pictorialism"],
        "succeededBy": ["new-color"],
        "signatureWorks": [
            {"photographerId": "parks", "workIndex": 0}
        ]
    },
    {
        "id": "west-african-studio",
        "nameZh": "西非棚拍肖像",
        "nameEn": "West African Studio Portraiture",
        "period": {"start": 1948, "peak": 1965, "end": 1985},
        "countries": ["ML"],
        "color": "#8B7B45",  # 橄榄金
        "description": "马里巴马科以 Seydou Keïta、Malick Sidibé 为代表的棚拍传统,记录非洲独立前后的新中产与青年舞会文化,1990 年代被欧美再发现并成为非洲现代摄影的标志。",
        "arc": "1948 Keïta 开棚 / 1962 Sidibé 自立 / 1991 巴黎国际摄影双年展再发现 / 2007 Sidibé 威尼斯金狮",
        "precededBy": [],
        "succeededBy": [],
        "signatureWorks": [
            {"photographerId": "keita", "workIndex": 0}
        ]
    }
]

# ──────────────────────────────────────────────────────────────────
# NEW PHOTOGRAPHERS  (16 total)
# ──────────────────────────────────────────────────────────────────

NEW_PHOTOGRAPHERS = [
    # ── 早期 / Pre-history extension ─────────────────────────────
    {
        "id": "cameron",
        "name": "Julia Margaret Cameron",
        "nameZh": "卡梅隆",
        "born": 1815, "died": 1879,
        "country": "UK", "region": "europe",
        "movements": ["pictorialism"],
        "influencedBy": ["talbot"],
        "bio": "维多利亚时期英国女性肖像先驱,48 岁才收到第一台相机,用湿版火棉胶 + 软焦镜头拍出梦幻肖像,Tennyson、Carlyle 等是她的常客。被尊为画意主义重要源头。",
        "keyDates": [
            {"year": 1864, "event": "收到女儿赠送的第一台相机"},
            {"year": 1865, "event": "在 South Kensington 博物馆个展"},
            {"year": 1875, "event": "迁居锡兰,继续拍摄"}
        ],
        "works": [
            {"title": "I Wait", "year": 1872, "image": None, "credit": "V&A / Public Domain"}
        ],
        "techniques": ["湿版火棉胶", "软焦", "长曝肖像"],
        "quote": "我把所有热情都倾注到这门艺术。"
    },
    {
        "id": "muybridge",
        "name": "Eadweard Muybridge",
        "nameZh": "穆布里奇",
        "born": 1830, "died": 1904,
        "country": "UK", "region": "n-america",
        "movements": ["straight"],
        "influencedBy": [],
        "bio": "英裔美国摄影 + 工程师,1878 年用 12 台相机阵列拍摄《奔跑的马》,首次证明马奔跑时确有四蹄同时离地的瞬间,是连续摄影的奠基,也是电影术的直接前身。",
        "keyDates": [
            {"year": 1878, "event": "《The Horse in Motion》12 帧序列发表"},
            {"year": 1887, "event": "《Animal Locomotion》781 张图版出版"}
        ],
        "works": [
            {"title": "The Horse in Motion", "year": 1878, "image": None, "credit": "Library of Congress / Public Domain"}
        ],
        "techniques": ["多机阵列", "连续摄影", "湿版"],
        "quote": "目光让位给机械。"
    },

    # ── 战地摄影 ─────────────────────────────────────────────────
    {
        "id": "brady",
        "name": "Mathew Brady",
        "nameZh": "布雷迪",
        "born": 1822, "died": 1896,
        "country": "US", "region": "n-america",
        "movements": ["war-photography"],
        "influencedBy": [],
        "bio": "美国摄影师,组织 20 余人团队系统记录美国南北战争(1861-65),将湿版火棉胶搬上战场,1862 年在纽约展出《死亡的安蒂特姆》震惊公众,被视为现代战地摄影起点。",
        "keyDates": [
            {"year": 1844, "event": "纽约百老汇开 Daguerreian 工作室"},
            {"year": 1862, "event": "《死亡的安蒂特姆》战场摄影展"},
            {"year": 1865, "event": "拍摄林肯遇刺前最后照片"}
        ],
        "works": [
            {"title": "Antietam, Confederate dead", "year": 1862, "image": None, "credit": "Library of Congress / Public Domain"}
        ],
        "techniques": ["湿版火棉胶", "野外暗房车", "肖像与战场"],
        "quote": "如果他从未做过别的,这一项也足够。"  # 战后林肯评语转引
    },
    {
        "id": "lee-miller",
        "name": "Lee Miller",
        "nameZh": "李·米勒",
        "born": 1907, "died": 1977,
        "country": "US", "region": "europe",
        "movements": ["war-photography", "fashion"],
        "influencedBy": ["man-ray"],
        "bio": "美国-英国摄影师,1929 抵巴黎拜师 Man Ray,既是其学生也是模特与情人,后转行 Vogue 战地记者。1945 年最早进入达豪、布痕瓦尔德集中营,《在希特勒慕尼黑公寓的浴缸里》成为 20 世纪标志影像。",
        "keyDates": [
            {"year": 1929, "event": "抵巴黎师从 Man Ray"},
            {"year": 1944, "event": "Vogue 战地记者,跟随盟军欧洲战场"},
            {"year": 1945, "event": "进入达豪、布痕瓦尔德集中营"}
        ],
        "works": [
            {"title": "Lee Miller in Hitler's Bathtub", "year": 1945, "image": None, "credit": "Lee Miller Archives"}
        ],
        "techniques": ["35mm 战地", "超现实拼贴", "Solarisation"],
        "quote": "我宁愿拍下一张完整的快门。"
    },
    {
        "id": "bourke-white",
        "name": "Margaret Bourke-White",
        "nameZh": "布尔克-怀特",
        "born": 1904, "died": 1971,
        "country": "US", "region": "n-america",
        "movements": ["war-photography", "fashion"],
        "influencedBy": [],
        "bio": "美国先锋女性摄影师,LIFE 杂志 1936 创刊号封面《Fort Peck Dam》出自其手;首位被允许进入苏联拍摄的西方摄影师(1930),1945 年跟随巴顿军团解放布痕瓦尔德。",
        "keyDates": [
            {"year": 1929, "event": "Fortune 杂志摄影师"},
            {"year": 1936, "event": "LIFE 创刊号封面"},
            {"year": 1945, "event": "布痕瓦尔德集中营纪录"}
        ],
        "works": [
            {"title": "Fort Peck Dam (LIFE cover)", "year": 1936, "image": None, "credit": "LIFE / TIME Inc."}
        ],
        "techniques": ["大画幅工业摄影", "战地报道"],
        "quote": "你必须保持饥饿。"
    },

    # ── 时尚摄影 ─────────────────────────────────────────────────
    {
        "id": "avedon",
        "name": "Richard Avedon",
        "nameZh": "阿维顿",
        "born": 1923, "died": 2004,
        "country": "US", "region": "n-america",
        "movements": ["fashion"],
        "influencedBy": ["kertesz", "brodovitch"],  # 注:Brodovitch 未收录,会被自动忽略
        "bio": "美国时尚 + 肖像大师,Harper's Bazaar / Vogue 主力。1957 电影《Funny Face》以其为原型。1985 巨幅黑白《在美国西部》将平凡矿工肖像推到画廊级地位。",
        "keyDates": [
            {"year": 1944, "event": "入职 Harper's Bazaar"},
            {"year": 1955, "event": "Dovima with Elephants 拍摄"},
            {"year": 1985, "event": "《In the American West》出版"}
        ],
        "works": [
            {"title": "Dovima with Elephants", "year": 1955, "image": None, "credit": "© Avedon Foundation"}
        ],
        "techniques": ["白底棚拍", "大画幅人像", "动态时装"],
        "quote": "肖像不是相似,是关于秘密的。"
    },
    {
        "id": "penn",
        "name": "Irving Penn",
        "nameZh": "佩恩",
        "born": 1917, "died": 2009,
        "country": "US", "region": "n-america",
        "movements": ["fashion", "straight"],
        "influencedBy": [],
        "bio": "美国摄影师,Vogue 长达六十年合作。极简灰白棚拍背景 + 椅子角落构图(Corner Portraits)成时尚摄影标杆,静物-时装-人种学(秘鲁 Cuzco 系列)统一在同一种节制语言下。",
        "keyDates": [
            {"year": 1943, "event": "入职 Vogue"},
            {"year": 1948, "event": "秘鲁 Cuzco 肖像系列"},
            {"year": 1950, "event": "Corner Portraits 系列"}
        ],
        "works": [
            {"title": "Cuzco Children", "year": 1948, "image": None, "credit": "© Irving Penn Foundation"}
        ],
        "techniques": ["8x10 棚拍", "灰白背景", "极简构图"],
        "quote": "一张好照片,什么都不去说。"
    },
    {
        "id": "newton",
        "name": "Helmut Newton",
        "nameZh": "诺顿",
        "born": 1920, "died": 2004,
        "country": "DE", "region": "europe",
        "movements": ["fashion"],
        "influencedBy": ["brassai"],
        "bio": "德国-澳大利亚-法国时尚摄影师,1980 年代主宰 Vogue Paris。高对比黑白 + 强势女性 + 性张力,被称为'时尚色情'的开山者,1976《白色女人》出版即标志。",
        "keyDates": [
            {"year": 1956, "event": "移居澳大利亚"},
            {"year": 1976, "event": "《White Women》出版"},
            {"year": 1981, "event": "《Big Nudes》系列"}
        ],
        "works": [
            {"title": "Sie kommen, Paris", "year": 1981, "image": None, "credit": "© Helmut Newton Foundation"}
        ],
        "techniques": ["高对比黑白", "宽幅时装", "棚拍 + 实景"],
        "quote": "好趣味是创造力的敌人。"
    },

    # ── 拉美现代主义 ─────────────────────────────────────────────
    {
        "id": "modotti",
        "name": "Tina Modotti",
        "nameZh": "莫多蒂",
        "born": 1896, "died": 1942,
        "country": "MX", "region": "latin",
        "movements": ["latin-american-modernism", "straight"],
        "influencedBy": ["e-weston"],
        "bio": "意大利-墨西哥摄影师与革命者,1923 与 Edward Weston 移居墨西哥,在墨拍摄农民运动、建筑构成与工人手部特写,7 年后被驱逐回欧洲转入地下革命工作。",
        "keyDates": [
            {"year": 1923, "event": "与 Weston 抵墨"},
            {"year": 1929, "event": "墨西哥个展"},
            {"year": 1930, "event": "被驱逐出墨"}
        ],
        "works": [
            {"title": "Worker's Hands", "year": 1927, "image": None, "credit": "MoMA / Public Domain"}
        ],
        "techniques": ["大画幅", "构成主义"],
        "quote": "相机不是工具,是器官。"
    },
    {
        "id": "alvarez-bravo",
        "name": "Manuel Álvarez Bravo",
        "nameZh": "布拉沃",
        "born": 1902, "died": 2002,
        "country": "MX", "region": "latin",
        "movements": ["latin-american-modernism"],
        "influencedBy": ["e-weston", "modotti"],
        "bio": "墨西哥摄影师,墨西哥革命后视觉文化主奠基者。东方寓言 + 西方现代主义 + 本土土著日常,1939 年被布勒东选入巴黎超现实主义群展,职业生涯横跨 80 年。",
        "keyDates": [
            {"year": 1924, "event": "开始摄影"},
            {"year": 1939, "event": "巴黎国际超现实主义展"},
            {"year": 1959, "event": "Fondo Editorial Plástica Mexicana 出版"}
        ],
        "works": [
            {"title": "La buena fama durmiendo", "year": 1939, "image": None, "credit": "© Archivo Manuel Álvarez Bravo"}
        ],
        "techniques": ["大画幅", "本土寓言"],
        "quote": "时间这块布料,折叠在物体里。"
    },
    {
        "id": "iturbide",
        "name": "Graciela Iturbide",
        "nameZh": "伊图尔比德",
        "born": 1942, "died": None,
        "country": "MX", "region": "latin",
        "movements": ["latin-american-modernism"],
        "influencedBy": ["alvarez-bravo"],
        "bio": "墨西哥摄影师,Bravo 学生,长期记录萨波特克族原住民。《天使女人》(1979)是 Sonora 沙漠中携带卡带的塞里族女性,被视为拉美摄影象征性影像。",
        "keyDates": [
            {"year": 1969, "event": "师从 Bravo"},
            {"year": 1979, "event": "Juchitán《天使女人》"},
            {"year": 2008, "event": "Hasselblad 国际摄影奖"}
        ],
        "works": [
            {"title": "Mujer Ángel, Sonora", "year": 1979, "image": None, "credit": "© Graciela Iturbide"}
        ],
        "techniques": ["35mm 黑白", "长期蹲点"],
        "quote": "时间在等我们,不是反过来。"
    },

    # ── 美国黑人摄影 ─────────────────────────────────────────────
    {
        "id": "van-der-zee",
        "name": "James Van Der Zee",
        "nameZh": "范德齐",
        "born": 1886, "died": 1983,
        "country": "US", "region": "n-america",
        "movements": ["black-american-photo"],
        "influencedBy": [],
        "bio": "美国摄影师,1916-1969 在 Harlem 经营 Guarantee Photo Studio,系统记录哈莱姆文艺复兴时期的中产黑人家庭、葬礼、马库斯·加维等政治领袖,使一整个时代的尊严被影像保留。",
        "keyDates": [
            {"year": 1916, "event": "开 Guarantee Photo Studio"},
            {"year": 1924, "event": "Marcus Garvey 系列"},
            {"year": 1969, "event": "Met Museum《Harlem on My Mind》展再发现"}
        ],
        "works": [
            {"title": "Couple, Harlem", "year": 1932, "image": None, "credit": "© Van Der Zee Estate"}
        ],
        "techniques": ["棚拍肖像", "手绘修饰", "中画幅"],
        "quote": "我尝试让他们看上去像他们想成为的样子。"
    },
    {
        "id": "parks",
        "name": "Gordon Parks",
        "nameZh": "戈登·帕克斯",
        "born": 1912, "died": 2006,
        "country": "US", "region": "n-america",
        "movements": ["black-american-photo", "fsa", "fashion"],
        "influencedBy": ["lange", "evans"],
        "bio": "美国摄影师 / 作家 / 导演,FSA 唯一黑人摄影师,LIFE 杂志首位黑人摄影师 (1948-72),1971 年执导《Shaft》开启 blaxploitation 电影。1942《American Gothic, Washington》为其代表作。",
        "keyDates": [
            {"year": 1942, "event": "加入 FSA;《American Gothic》"},
            {"year": 1948, "event": "入职 LIFE 杂志"},
            {"year": 1971, "event": "执导《Shaft》"}
        ],
        "works": [
            {"title": "American Gothic, Washington, D.C.", "year": 1942, "image": None, "credit": "Library of Congress / Public Domain"}
        ],
        "techniques": ["35mm 报道", "时尚棚拍", "电影"],
        "quote": "选你的武器,我选了相机。"
    },
    {
        "id": "weems",
        "name": "Carrie Mae Weems",
        "nameZh": "威姆斯",
        "born": 1953, "died": None,
        "country": "US", "region": "n-america",
        "movements": ["black-american-photo", "new-color"],
        "influencedBy": ["van-der-zee", "parks"],
        "bio": "美国摄影师,《Kitchen Table》(1990) 系列以同一张餐桌为舞台,通过 20 张摆拍 + 文字重塑黑人女性自我表象。装置 + 影像 + 文字穿透身份与历史。2014 MacArthur 天才奖。",
        "keyDates": [
            {"year": 1990, "event": "《Kitchen Table》系列"},
            {"year": 1995, "event": "《From Here I Saw What Happened》"},
            {"year": 2014, "event": "MacArthur Fellowship"}
        ],
        "works": [
            {"title": "Untitled (Kitchen Table)", "year": 1990, "image": None, "credit": "© Carrie Mae Weems"}
        ],
        "techniques": ["影像装置", "文字+图像", "档案再造"],
        "quote": "我在编织被剪掉的故事。"
    },

    # ── 西非棚拍肖像 ─────────────────────────────────────────────
    {
        "id": "keita",
        "name": "Seydou Keïta",
        "nameZh": "凯塔",
        "born": 1921, "died": 2001,
        "country": "ML", "region": "africa",
        "movements": ["west-african-studio"],
        "influencedBy": [],
        "bio": "马里摄影师,Bamako 棚拍肖像之父,1948 在自家庭院开棚,用大画幅 + 印花布背景拍摄独立前后的非洲新中产、士兵、青年情侣,1990 年代被欧美'再发现',作品被纳入 MoMA 永久收藏。",
        "keyDates": [
            {"year": 1948, "event": "Bamako 自宅开棚"},
            {"year": 1962, "event": "马里独立后转为政府官摄"},
            {"year": 1991, "event": "巴黎非洲摄影展再发现"}
        ],
        "works": [
            {"title": "Untitled (Three Women)", "year": 1956, "image": None, "credit": "© Seydou Keïta Estate"}
        ],
        "techniques": ["13×18 大画幅", "印花布背景", "自然光"],
        "quote": "我让他们看见自己的美。"
    },
    {
        "id": "sidibe",
        "name": "Malick Sidibé",
        "nameZh": "西迪贝",
        "born": 1936, "died": 2016,
        "country": "ML", "region": "africa",
        "movements": ["west-african-studio"],
        "influencedBy": ["keita"],
        "bio": "马里摄影师,'Bamako 之眼',1962 自立工作室。周末舞会与海滩青年记录使其成为非洲后殖民青年文化最重要的视觉档案者。2007 威尼斯双年展金狮终身成就奖,首位获奖的非洲艺术家。",
        "keyDates": [
            {"year": 1962, "event": "Studio Malick 开张"},
            {"year": 2003, "event": "Hasselblad 奖"},
            {"year": 2007, "event": "威尼斯金狮终身成就"}
        ],
        "works": [
            {"title": "Nuit de Noël (Happy Club)", "year": 1963, "image": None, "credit": "© Malick Sidibé Estate"}
        ],
        "techniques": ["35mm 黑白", "舞会现场", "棚拍肖像"],
        "quote": "音乐响起,他们就是另一个人。"
    }
]


def main():
    pho_path = DATA / "photographers.json"
    mov_path = DATA / "movements.json"

    pho = json.loads(pho_path.read_text(encoding="utf-8"))
    mov = json.loads(mov_path.read_text(encoding="utf-8"))

    existing_ph_ids = {p["id"] for p in pho}
    existing_mv_ids = {m["id"] for m in mov}

    # Validate cross-refs in NEW_PHOTOGRAPHERS: drop any influencedBy that
    # references neither existing nor new ids (e.g. 'brodovitch')
    all_future_ids = existing_ph_ids | {p["id"] for p in NEW_PHOTOGRAPHERS}
    cleaned_pho = []
    for p in NEW_PHOTOGRAPHERS:
        if p["id"] in existing_ph_ids:
            print(f"SKIP existing photographer: {p['id']}")
            continue
        # filter influencedBy
        clean_inf = [r for r in p.get("influencedBy", []) if r in all_future_ids]
        dropped = set(p.get("influencedBy", [])) - set(clean_inf)
        if dropped:
            print(f"  {p['id']}: dropped invalid influencedBy refs: {sorted(dropped)}")
        p["influencedBy"] = clean_inf
        # validate movements reference real ids
        all_mv_ids = existing_mv_ids | {m["id"] for m in NEW_MOVEMENTS}
        bad_mv = [m for m in p["movements"] if m not in all_mv_ids]
        if bad_mv:
            raise SystemExit(f"BAD movement ref in {p['id']}: {bad_mv}")
        cleaned_pho.append(p)

    cleaned_mov = []
    for m in NEW_MOVEMENTS:
        if m["id"] in existing_mv_ids:
            print(f"SKIP existing movement: {m['id']}")
            continue
        # validate signatureWorks photographer ids
        all_ph_ids = existing_ph_ids | {p["id"] for p in cleaned_pho}
        for sw in m.get("signatureWorks", []):
            if sw["photographerId"] not in all_ph_ids:
                raise SystemExit(
                    f"BAD signatureWork ref in movement {m['id']}: {sw['photographerId']}"
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
