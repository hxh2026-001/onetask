export interface Preset {
  id: string;
  name: string;
  description: string;
  text: string;
  lineWidth: number;
  fontSize: number;
  letterSpacing: number;
  lineSpacing: number;
  enableLigatures: boolean;
  enableMultiLang: boolean;
}

export const presets: Preset[] = [
  {
    id: "preset1",
    name: "极端窄栏绕排",
    description: "极窄栏宽测试排版引擎的断行能力",
    text: "中华人民共和国成立于一九四九年十月一日，这是一个具有重大历史意义的日子。从此以后，中国人民站起来了，开始了新的历史篇章。在党的领导下，中国取得了举世瞩目的成就，经济快速发展，人民生活水平不断提高。",
    lineWidth: 120,
    fontSize: 1.2,
    letterSpacing: 2,
    lineSpacing: 180,
    enableLigatures: false,
    enableMultiLang: false,
  },
  {
    id: "preset2",
    name: "连字与合字",
    description: "测试连字替换功能，如 fi、fl、ffi 等",
    text: "The quick brown fox jumps over the lazy dog. Fifty-five fish swam swiftly through the frigid fjord. Coffee and tea are popular beverages throughout the world. Sufficient rainfall is essential for agricultural prosperity.",
    lineWidth: 600,
    fontSize: 1.0,
    letterSpacing: 0,
    lineSpacing: 140,
    enableLigatures: true,
    enableMultiLang: false,
  },
  {
    id: "preset3",
    name: "标点挤压冲突",
    description: "密集标点测试标点挤压算法",
    text: "！！！，，，。。。、、、；；；：：：“”‘’（）【】《》——···——···——！！！，，，。。。、、、；；；：：：",
    lineWidth: 400,
    fontSize: 1.5,
    letterSpacing: 1,
    lineSpacing: 200,
    enableLigatures: false,
    enableMultiLang: false,
  },
  {
    id: "preset4",
    name: "多语言混排",
    description: "中文、日文、韩文、希腊文混合排版",
    text: "中華人民共和国 αβγδεζηθικλμνξοπρστυφχψω あいうえおかきくけこ 가나다라마바사아자차카타파하 漢字文化圏の多言語環境での組版テストです。",
    lineWidth: 700,
    fontSize: 1.0,
    letterSpacing: 0,
    lineSpacing: 160,
    enableLigatures: false,
    enableMultiLang: true,
  },
];

export const typeCaseCharacters = [
  "一", "二", "三", "四", "五", "六", "七", "八", "九", "十",
  "中", "国", "人", "大", "小", "上", "下", "日", "月", "水",
  "火", "土", "金", "木", "口", "手", "足", "目", "耳", "心",
  "a", "b", "c", "d", "e", "f", "g", "h", "i", "j",
  "k", "l", "m", "n", "o", "p", "q", "r", "s", "t",
  "u", "v", "w", "x", "y", "z", "A", "B", "C", "D",
  "E", "F", "G", "H", "I", "J", "K", "L", "M", "N",
  "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X",
  "Y", "Z", "0", "1", "2", "3", "4", "5", "6", "7",
  "8", "9", "，", "。", "！", "？", "、", "；", "：", " ",
];
