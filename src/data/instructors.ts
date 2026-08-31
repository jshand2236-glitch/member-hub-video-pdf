// 福岡医療者交流会の発起人・運営メンバー3名のプロフィール。
// 参照元: https://fukuoka-iryosya.vercel.app/ (FOUNDERS & ORGANIZERS セクション)
//
// video.instructorName (自由入力の文字列) とここでの name が一致した場合に、
// /videos ページの各講師見出しや /instructors ページで詳細プロフィールを表示する。

export type Instructor = {
  /** /instructors ページのアンカー・URL用の識別子（ローマ字・ハイフン区切り） */
  slug: string;
  /** /admin で動画に設定する instructorName と完全一致させる氏名 */
  name: string;
  /** ローマ字表記 */
  nameReading: string;
  /** 肩書き・所属 */
  title: string;
  /** 保有資格 */
  qualifications: string[];
  /** 専門分野 */
  specialty: string;
  /** 経歴紹介文 */
  bio: string;
  /** 経歴・所属歴の箇条書き */
  career: string[];
  /** FOUNDER（発起人）か ORGANIZER（運営メンバー）か */
  role: "FOUNDER" | "ORGANIZER";
};

export const INSTRUCTORS: Instructor[] = [
  {
    slug: "arata-takuya",
    name: "安良田 卓也",
    nameReading: "ARATA TAKUYA",
    title: "ARATA鍼灸整骨院 院長",
    qualifications: ["柔道整復師", "はり師", "きゅう師"],
    specialty: "病態判断学",
    bio: "岡山県備前市出身。「痛みの原因を見極める力」をテーマに、全国の治療家へ知識と技術を発信。オンラインサロンHCRを主宰し、累計400名以上の若手セラピストが学ぶ場を創出している。",
    career: [
      "関西の大学を卒業後、福岡のスポーツ整形外科に入職",
      "第28回・第29回 日本柔道整復接骨医学会 に登壇",
      "オンラインサロン HCR を創設・代表（病態判断学を学ぶ場）",
      "ARATA鍼灸整骨院 を開業",
    ],
    role: "FOUNDER",
  },
  {
    slug: "aoyagi-tatsuya",
    name: "青柳 達也",
    nameReading: "AOYAGI TATSUYA",
    title: "SCL鍼灸整骨院",
    qualifications: ["柔道整復師", "はり師", "きゅう師"],
    specialty: "身体操作",
    bio: "福岡県朝倉市出身。トップアスリートの現場で研鑽を積んだトレーナー。サッカー日本代表、世界陸上日本人ファイナリスト、バドミントン元世界ランク1位など、国内外の一線級選手をサポートしてきた実績を持つ。",
    career: [
      "福岡医療専門学校 柔道整復師科・鍼灸師科 卒業",
      "百武整形外科スポーツクリニック 等で臨床経験を積む",
      "選手の代理人事務所にてアスリートに帯同",
      "SCL鍼灸整骨院（担当：Jリーガー・プレミアリーグ・ブンデスリーガ 他）",
    ],
    role: "ORGANIZER",
  },
  {
    slug: "miyagi-norihisa",
    name: "宮城 徳久",
    nameReading: "MIYAGI NORIHISA",
    title: "鍼灸整体院サロンMiN 代表",
    qualifications: ["はり師", "きゅう師", "柔道整復師"],
    specialty: "臨床的な鍼灸治療",
    bio: "沖縄県宜野湾市出身。現在は、福岡市西区姪浜で鍼灸整体院サロンMiNを経営。フィジカルコーチ兼メディカルトレーナーとして、プロから育成年代まで幅広いアスリートの現場を支えてきた。睡眠改善をベースとした、鍼灸治療と疲労回復整体を得意とする。",
    career: [
      "鍼灸整体院 サロンMiN（姪浜）代表",
      "一般社団法人 日本眠活眠育協会 理事",
      "福岡医療専門学校 学校関係者評価委員会 所属",
      "大学野球・高校野球、サッカーの全国大会（タウンクラブカップ）でフィジカル／メディカルトレーナーとして帯同",
    ],
    role: "ORGANIZER",
  },
];

/** 動画の instructorName (自由入力・前後空白あり得る) から一致するプロフィールを探す */
export function findInstructor(name: string): Instructor | undefined {
  const trimmed = name.trim();
  return INSTRUCTORS.find((i) => i.name === trimmed);
}
